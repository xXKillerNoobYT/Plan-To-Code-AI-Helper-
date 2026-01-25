/**
 * Tests for reportTestFailure MCP Tool
 * Validates test failure logging and investigation task creation
 */

import {
    reportTestFailure,
    ReportTestFailureRequest,
} from '../reportTestFailure';
import { Task, TaskQueue } from '../../../tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../protocol';

describe('reportTestFailure MCP Tool', () => {
    let taskQueue: TaskQueue;
    let testTask: Task;

    beforeEach(() => {
        taskQueue = new TaskQueue();

        testTask = {
            taskId: 'TASK-001',
            title: 'Write component tests',
            description: 'Test task',
            priority: 'high',
            status: 'in-progress',
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        taskQueue.addTask(testTask);
    });

    // ========================================================================
    // Basic Functionality
    // ========================================================================

    describe('Basic Functionality', () => {
        it('should log test failure', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'should render component',
                testFile: 'src/components/Button.test.ts',
                failureDetails: {
                    error: 'Expected true but got false',
                    failedAssertion: 'expect(isRendered).toBe(true)',
                },
                previousStatus: 'passing_before',
                needsInvestigation: true,
                actionNeeded: 'Fix component rendering',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.testName).toBe('should render component');
            expect(result.status).toBe('failure_logged');
        });

        it('should generate test failure ID', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test name',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Test failed',
                },
                previousStatus: 'never_passed',
                needsInvestigation: false,
                actionNeeded: 'Debug',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.testFailureId).toBeDefined();
            expect(result.testFailureId).toContain('FAIL-');
        });

        it('should include dashboard alert', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Failed',
                },
                previousStatus: 'passing_before',
                needsInvestigation: false,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.dashboardAlert).toBeDefined();
            expect(result.dashboardAlert?.type).toBe('critical');
            expect(result.dashboardAlert?.timestamp).toBeDefined();
        });
    });

    // ========================================================================
    // Root Cause Analysis
    // ========================================================================

    describe('Root Cause Analysis', () => {
        it('should detect undefined/null reference errors', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Cannot read property of undefined',
                },
                previousStatus: 'never_passed',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.suspectedRootCauseAnalysis).toBeDefined();
            expect(result.suspectedRootCauseAnalysis?.likeliestCause).toContain('Null/undefined');
            expect(result.suspectedRootCauseAnalysis?.suggestedInvestigation.length).toBeGreaterThan(0);
        });

        it('should detect assertion/logic errors', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Expected true but got false',
                    expectedValue: true,
                    actualValue: false,
                },
                previousStatus: 'passing_before',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.suspectedRootCauseAnalysis?.likeliestCause).toContain('Logic error');
        });

        it('should detect timeout errors', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Timeout waiting for async operation',
                },
                previousStatus: 'never_passed',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.suspectedRootCauseAnalysis?.likeliestCause).toContain('Async');
        });

        it('should detect mock/stub errors', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Mock spy not called',
                },
                previousStatus: 'never_passed',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.suspectedRootCauseAnalysis?.likeliestCause).toContain('Mock');
        });

        it('should detect import/module errors', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Module not found',
                },
                previousStatus: 'never_passed',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.suspectedRootCauseAnalysis?.likeliestCause).toContain('Module');
        });

        it('should include user-provided cause possibilities', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Test failed',
                },
                previousStatus: 'never_passed',
                causePossibility: ['Component not updated', 'Missing dependency'],
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            const causes = result.suspectedRootCauseAnalysis?.suggestedInvestigation || [];
            expect(causes.some(c => c.includes('Component'))).toBe(true);
        });
    });

    // ========================================================================
    // Investigation Task Creation
    // ========================================================================

    describe('Investigation Task Creation', () => {
        it('should create investigation task when needsInvestigation is true', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'component rendering',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Test failed',
                },
                previousStatus: 'passing_before',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.investigationTaskCreated).toBeDefined();
            expect(result.investigationTaskCreated?.title).toContain('Investigate');
            expect(result.investigationTaskCreated?.priority).toBe('critical');
            expect(result.investigationTaskCreated?.blocker).toBe(true);
        });

        it('should not create investigation task when needsInvestigation is false', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Test failed',
                },
                previousStatus: 'never_passed',
                needsInvestigation: false,
                actionNeeded: 'Debug',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.investigationTaskCreated).toBeUndefined();
        });

        it('should add investigation task to queue', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Test failed',
                },
                previousStatus: 'passing_before',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            await reportTestFailure(params, taskQueue);

            // Verify task was added to queue
            const investigationTasks = taskQueue.getAllTasks().filter(t =>
                t.taskId.startsWith('INVESTIGATE-')
            );
            expect(investigationTasks.length).toBeGreaterThan(0);
        });

        it('should link investigation task to original task via dependencies', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Test failed',
                },
                previousStatus: 'passing_before',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            // Verify investigation task depends on original task
            const investigationTask = taskQueue.getAllTasks().find(t =>
                t.taskId === result.investigationTaskCreated?.taskId
            );
            expect(investigationTask?.dependencies).toContain('TASK-001');
        });
    });

    // ========================================================================
    // Previous Status Tracking
    // ========================================================================

    describe('Previous Status Tracking', () => {
        it('should handle previously passing tests', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Regression detected',
                },
                previousStatus: 'passing_before',
                needsInvestigation: true,
                actionNeeded: 'Fix regression',
            };

            const result = await reportTestFailure(params, taskQueue);

            // Should require human attention for regressions
            expect(result.dashboardAlert?.requiresHumanAttention).toBe(true);
        });

        it('should handle never-passed tests', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Feature not implemented',
                },
                previousStatus: 'never_passed',
                needsInvestigation: false,
                actionNeeded: 'Implement feature',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.success).toBe(true);
        });

        it('should handle flaky tests', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Intermittent failure',
                },
                previousStatus: 'flaky',
                needsInvestigation: true,
                actionNeeded: 'Fix flakiness',
            };

            const result = await reportTestFailure(params, taskQueue);

            const causes = result.suspectedRootCauseAnalysis?.suggestedInvestigation || [];
            expect(causes.toString()).toBeTruthy();
        });
    });

    // ========================================================================
    // Blocking Task Detection
    // ========================================================================

    describe('Blocking Task Detection', () => {
        it('should detect if failure blocks other tasks', async () => {
            // Add a task that depends on TASK-001
            taskQueue.addTask({
                taskId: 'TASK-002',
                title: 'Dependent task',
                description: 'Depends on TASK-001',
                priority: 'high',
                status: 'pending',
                dependencies: ['TASK-001'],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Test failed',
                },
                previousStatus: 'passing_before',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.blockingTask).toBeDefined();
            expect(result.blockingTask?.blockingTaskId).toBe('TASK-002');
        });

        it('should flag blocking failures as requiring human attention', async () => {
            // Add dependent task
            taskQueue.addTask({
                taskId: 'TASK-003',
                title: 'Blocked task',
                description: 'Depends on TASK-001',
                priority: 'critical',
                status: 'pending',
                dependencies: ['TASK-001'],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Critical failure',
                },
                previousStatus: 'never_passed',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.dashboardAlert?.requiresHumanAttention).toBe(true);
        });
    });

    // ========================================================================
    // Error Handling
    // ========================================================================

    describe('Error Handling', () => {
        it('should throw error for non-existent task', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'NONEXISTENT',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Test failed',
                },
                previousStatus: 'never_passed',
                needsInvestigation: false,
                actionNeeded: 'Fix',
            };

            await expect(reportTestFailure(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);

            try {
                await reportTestFailure(params, taskQueue);
            } catch (error) {
                expect((error as MCPProtocolError).code).toBe(MCPErrorCode.TASK_NOT_FOUND);
            }
        });

        it('should throw error for missing task ID', async () => {
            const params = {
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Test failed',
                },
                previousStatus: 'never_passed',
                needsInvestigation: false,
                actionNeeded: 'Fix',
            };

            await expect(reportTestFailure(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should throw error for empty error message', async () => {
            const params = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: '', // Empty
                },
                previousStatus: 'never_passed',
                needsInvestigation: false,
                actionNeeded: 'Fix',
            };

            await expect(reportTestFailure(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should throw error for invalid previous status', async () => {
            const params = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Test failed',
                },
                previousStatus: 'invalid_status',
                needsInvestigation: false,
                actionNeeded: 'Fix',
            };

            await expect(reportTestFailure(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });
    });

    // ========================================================================
    // Failure Details Handling
    // ========================================================================

    describe('Failure Details Handling', () => {
        it('should handle failure with expected vs actual values', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Assertion failed',
                    expectedValue: { a: 1 },
                    actualValue: { a: 2 },
                },
                previousStatus: 'never_passed',
                needsInvestigation: true,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.success).toBe(true);
        });

        it('should handle failure with assertion text', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Assertion failed',
                    failedAssertion: 'expect(result).toEqual(expected)',
                },
                previousStatus: 'never_passed',
                needsInvestigation: false,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.success).toBe(true);
        });

        it('should handle minimal failure details', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Failed',
                },
                previousStatus: 'never_passed',
                needsInvestigation: false,
                actionNeeded: 'Debug',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.success).toBe(true);
        });
    });

    // ========================================================================
    // Response Structure
    // ========================================================================

    describe('Response Structure', () => {
        it('should always include required fields', async () => {
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName: 'test',
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Failed',
                },
                previousStatus: 'never_passed',
                needsInvestigation: false,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('testFailureId');
            expect(result).toHaveProperty('testName');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('suspectedRootCauseAnalysis');
            expect(result).toHaveProperty('dashboardAlert');
        });

        it('should preserve test name in response', async () => {
            const testName = 'should render header correctly';
            const params: ReportTestFailureRequest = {
                taskId: 'TASK-001',
                testName,
                testFile: 'test.ts',
                failureDetails: {
                    error: 'Failed',
                },
                previousStatus: 'never_passed',
                needsInvestigation: false,
                actionNeeded: 'Fix',
            };

            const result = await reportTestFailure(params, taskQueue);

            expect(result.testName).toBe(testName);
        });
    });
});

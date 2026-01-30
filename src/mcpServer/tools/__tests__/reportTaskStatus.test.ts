/**
 * 🧪 Comprehensive Tests for reportTaskStatus MCP Tool
 *
 * Tests all status transitions, verification logic, and observation processing
 */

import { reportTaskStatus, ReportTaskStatusRequest, Testing } from '../reportTaskStatus';
import { TaskQueue, Task } from '../../../tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../protocol';

describe('reportTaskStatus - Comprehensive Branch Coverage', () => {
    let taskQueue: TaskQueue;
    let mockTask: Task;

    beforeEach(() => {
        taskQueue = new TaskQueue();

        // Add sample task
        mockTask = {
            taskId: 'TASK-001',
            title: 'Implement feature X',
            description: 'Test task',
            priority: 'high',
            status: 'in-progress',
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        taskQueue.addTask(mockTask);
    });

    describe('Status Transitions', () => {
        it('should mark task as done with successful tests', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing: {
                    testsAdded: true,
                    testsPassed: true,
                    testsFailed: 0,
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.status).toBe('done');
            expect(result.verificationTaskCreated).toBeDefined();
        });

        it('should mark task as failed with test failures', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'failed',
                testing: {
                    testsAdded: true,
                    testsPassed: false,
                    testsFailed: 2,
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.status).toBe('failed');
            expect(result.verificationTaskCreated).toBeUndefined();
        });

        it('should mark task as blocked with reason', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'blocked',
                statusDetails: {
                    blockedReason: 'Waiting for dependency task-002',
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.status).toBe('blocked');
        });

        it('should mark task as partial with progress details', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'partial',
                statusDetails: {
                    progressPercent: 75,
                    partiallyDone: 'Implemented 3 of 4 features',
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.status).toBe('partial');
        });
    });

    describe('Verification Task Creation', () => {
        it('should create verification task only for done status with passed tests', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing: {
                    testsAdded: true,
                    testsPassed: true,
                    testsFailed: 0,
                    accessibilityTestsPassed: true,
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated).toBeDefined();
            expect(result.verificationTaskCreated?.title).toContain('Verify:');
        });

        it('should not create verification task when tests failed', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing: {
                    testsAdded: true,
                    testsPassed: false,
                    testsFailed: 3,
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated).toBeUndefined();
        });

        it('should not create verification task for failed status', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'failed',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated).toBeUndefined();
        });

        it('should set automation level based on priority', async () => {
            // Critical task -> manual verification
            mockTask.priority = 'critical';
            taskQueue.updateTask(mockTask);

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated?.automationLevel).toBe('manual');
        });

        it('should set semi-automated level for high priority', async () => {
            mockTask.priority = 'high';
            taskQueue.updateTask(mockTask);

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated?.automationLevel).toBe('semi-automated');
        });

        it('should set automated level for medium/low priority', async () => {
            mockTask.priority = 'medium';
            taskQueue.updateTask(mockTask);

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated?.automationLevel).toBe('automated');
        });
    });

    describe('Observation Processing', () => {
        it('should mark observations with critical issues as action-required', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: [
                    'Found a bug in the validation logic',
                    'This is an issue with error handling',
                ],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed).toBeDefined();
            expect(result.observationsProcessed?.length).toBe(2);
            expect(result.observationsProcessed?.[0].status).toBe('action-required');
        });

        it('should mark observations with follow-up keywords as follow-up-created', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: [
                    'Need to refactor the database layer',
                    'Should add more unit tests',
                    'TODO: Optimize performance',
                ],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed?.length).toBe(3);
            result.observationsProcessed?.forEach(obs => {
                expect(obs.status).toBe('follow-up-created');
            });
        });

        it('should mark regular observations as noted', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: ['Implementation completed on schedule'],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed?.[0].status).toBe('noted');
        });

        it('should prioritize follow-up over critical issues', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: [
                    'There is a bug but we should refactor this',
                ],
            };

            const result = await reportTaskStatus(params, taskQueue);

            // Follow-up keywords take priority
            expect(result.observationsProcessed?.[0].status).toBe('follow-up-created');
        });
    });

    describe('Follow-Up Task Creation', () => {
        it('should create follow-up tasks with correct dependencies', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                followUpTasks: [
                    {
                        title: 'Add performance tests',
                        why: 'Ensure response time < 100ms',
                        estimatedHours: 2,
                    },
                    {
                        title: 'Update documentation',
                        why: 'Document new API endpoints',
                        estimatedHours: 1,
                    },
                ],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            const allTasks = taskQueue.getAllTasks();
            const followUpTasks = allTasks.filter(t => t.taskId.includes('FOLLOWUP'));
            expect(followUpTasks.length).toBe(2);
        });

        it('should inherit priority from original task', async () => {
            mockTask.priority = 'critical';
            taskQueue.updateTask(mockTask);

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                followUpTasks: [
                    {
                        title: 'Test follow-up',
                        why: 'Testing',
                    },
                ],
            };

            await reportTaskStatus(params, taskQueue);

            const allTasks = taskQueue.getAllTasks();
            const followUpTask = allTasks.find(t => t.taskId.includes('FOLLOWUP'));
            expect(followUpTask?.priority).toBe('high'); // Critical -> high for follow-ups
        });
    });

    describe('Dashboard Statistics', () => {
        it('should calculate correct completion percentages', async () => {
            // Add more tasks
            taskQueue.addTask({
                taskId: 'TASK-002',
                title: 'Task 2',
                description: '',
                priority: 'medium',
                status: 'done',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.dashboardUpdate?.completedCount).toBeGreaterThan(0);
            expect(result.dashboardUpdate?.totalCount).toBeGreaterThan(0);
            expect(result.dashboardUpdate?.percentComplete).toBeGreaterThan(0);
        });

        it('should count blocked tasks correctly', async () => {
            const blockedTask: Task = {
                taskId: 'TASK-BLOCKED',
                title: 'Blocked task',
                description: '',
                priority: 'medium',
                status: 'blocked',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            taskQueue.addTask(blockedTask);

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.dashboardUpdate?.blockedCount).toBe(1);
        });

        it('should identify verification pending tasks', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 },
            };

            const result = await reportTaskStatus(params, taskQueue);

            // Should have at least 1 verification pending task created
            expect(result.dashboardUpdate?.verificationPendingCount).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Error Handling', () => {
        it('should return error for invalid parameters', async () => {
            const params: any = {
                taskId: 'TASK-001',
                status: 'invalid-status', // Invalid status
            };

            await expect(reportTaskStatus(params, taskQueue)).rejects.toThrow(MCPProtocolError);
        });

        it('should return error for task not found', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-NONEXISTENT',
                status: 'done',
            };

            await expect(reportTaskStatus(params, taskQueue)).rejects.toThrow(MCPProtocolError);
        });

        it('should handle empty observations array', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: [],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed).toBeUndefined();
            expect(result.success).toBe(true);
        });

        it('should handle empty follow-up tasks array', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                followUpTasks: [],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
        });
    });

    describe('Idempotent Operations', () => {
        it('should handle repeated done status updates', async () => {
            // Mark as done first
            await reportTaskStatus(
                {
                    taskId: 'TASK-001',
                    status: 'done',
                    testing: { testsAdded: true, testsPassed: true, testsFailed: 0 },
                },
                taskQueue
            );

            // Mark as done again - should not throw error
            const result = await reportTaskStatus(
                {
                    taskId: 'TASK-001',
                    status: 'done',
                    testing: { testsAdded: true, testsPassed: true, testsFailed: 0 },
                },
                taskQueue
            );

            expect(result.success).toBe(true);
        });
    });

    describe('Complex Scenarios', () => {
        it('should handle complete task completion flow', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                implementationNotes: 'Successfully implemented feature X',
                filesModified: ['src/app.ts', 'tests/app.test.ts'],
                testing: {
                    testsAdded: true,
                    testFileCreated: 'tests/app.test.ts',
                    testsPassed: true,
                    testsFailed: 0,
                    testCoveragePercent: 92,
                    accessibilityTestsPassed: true,
                },
                acceptanceCriteriaVerification: {
                    '0': { text: 'Feature works as specified', status: 'passed' },
                    '1': { text: 'No regression issues', status: 'passed' },
                },
                observations: [
                    'Found opportunity to refactor validation',
                    'Performance could be optimized',
                ],
                followUpTasks: [
                    {
                        title: 'Refactor validation logic',
                        why: 'Improve code maintainability',
                        estimatedHours: 3,
                    },
                ],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.verificationTaskCreated).toBeDefined();
            expect(result.observationsProcessed?.length).toBeGreaterThan(0);
            expect(result.dashboardUpdate).toBeDefined();
            expect(result.nextTaskId).toBeDefined();
        });

        it('should find next available task excluding current', async () => {
            // Add a ready task
            taskQueue.addTask({
                taskId: 'TASK-NEXT',
                title: 'Next task',
                description: '',
                priority: 'medium',
                status: 'ready',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            // Should suggest the next ready task
            expect(result.nextTaskPreview).toBeDefined();
            expect(result.nextTaskPreview?.title).toBeDefined();
        });
    });

    describe('Testing Details Coverage', () => {
        it('should include test coverage percentage when provided', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing: {
                    testsAdded: true,
                    testsPassed: true,
                    testsFailed: 0,
                    testCoveragePercent: 95,
                    failedTestNames: [],
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.message).toContain('marked done');
        });

        it('should handle failed test names', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'failed',
                testing: {
                    testsAdded: true,
                    testsPassed: false,
                    testsFailed: 2,
                    failedTestNames: [
                        'should validate email format',
                        'should reject empty strings',
                    ],
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.status).toBe('failed');
        });
    });

    describe('Branch Coverage: Error Handling & Edge Cases', () => {
        it('should throw MCPProtocolError for invalid taskId format', async () => {
            const params: any = {
                taskId: '', // Empty taskId
                status: 'done'
            };

            await expect(reportTaskStatus(params, taskQueue)).rejects.toThrow();
        });

        it('should throw error when task is not found', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'NON-EXISTENT-ID',
                status: 'done'
            };

            await expect(reportTaskStatus(params, taskQueue)).rejects.toThrow('Task NON-EXISTENT-ID not found');
        });

        it('should not create verification task when status is not done', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'blocked',
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated).toBeUndefined();
        });

        it('should not create verification task when tests failed even if status is done', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing: { testsAdded: true, testsPassed: false, testsFailed: 5 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated).toBeUndefined();
        });

        it('should handle observations with no follow-up needed', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: ['Simple observation without keywords'],
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed).toBeDefined();
            expect(result.observationsProcessed![0].status).toBe('noted');
        });

        it('should detect critical issues in observations', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: ['Found a critical error in the code'],
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed![0].status).toBe('action-required');
        });

        it('should detect error mentions in observations', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: ['Encountered an error during runtime'],
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed![0].status).toBe('action-required');
        });

        it('should process multiple observations correctly', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: [
                    'Normal observation',
                    'Critical issue found',
                    'Another normal note'
                ],
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed).toHaveLength(3);
            expect(result.observationsProcessed![0].status).toBe('noted');
            expect(result.observationsProcessed![1].status).toBe('action-required');
            expect(result.observationsProcessed![2].status).toBe('noted');
        });

        it('should handle empty observations array', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: [],
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            // Empty observations array should result in undefined observationsProcessed
            expect(result.observationsProcessed).toBeUndefined();
        });

        it('should create follow-up tasks when provided', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                followUpTasks: [
                    { title: 'Follow-up 1', why: 'Reason 1', estimatedHours: 2 },
                    { title: 'Follow-up 2', why: 'Reason 2', estimatedHours: 3 }
                ],
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
        });

        it('should handle empty follow-up tasks array', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                followUpTasks: [],
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
        });

        it('should handle blocked status with blocking reason', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'blocked',
                statusDetails: {
                    blockedReason: 'Waiting for dependency TASK-002'
                }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.status).toBe('blocked');
            expect(result.success).toBe(true);
        });

        it('should handle partial status with progress percentage', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'partial',
                statusDetails: {
                    progressPercent: 60,
                    partiallyDone: '3 out of 5 features completed'
                }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.status).toBe('partial');
            expect(result.success).toBe(true);
        });

        it('should update dashboard metrics', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.dashboardUpdate).toBeDefined();
            expect(result.dashboardUpdate?.completedCount).toBeGreaterThan(0);
        });

        it('should handle task with no testing information', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done'
                // No testing field
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.verificationTaskCreated).toBeDefined(); // Should still create verification
        });

        it('should handle implementation notes in status details', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                implementationNotes: 'Used React hooks instead of class components',
                filesModified: ['src/App.tsx', 'src/components/Button.tsx'],
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
        });

        it('should handle acceptance criteria verification', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                acceptanceCriteriaVerification: {
                    0: { text: 'Feature implemented', status: 'passed' },
                    1: { text: 'Tests added', status: 'passed' }
                },
                testing: { testsAdded: true, testsPassed: true, testsFailed: 0 }
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
        });
    });
});

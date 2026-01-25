/**
 * Tests for reportTaskStatus MCP Tool
 * Validates task status updates, verification workflows, and dashboard statistics
 */

import {
    reportTaskStatus,
    ReportTaskStatusRequest,
    Testing,
    FollowUpTask,
} from '../reportTaskStatus';
import { Task, TaskQueue } from '../../../tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../protocol';

describe('reportTaskStatus MCP Tool', () => {
    let taskQueue: TaskQueue;
    let testTask: Task;

    beforeEach(() => {
        taskQueue = new TaskQueue();
        
        // Create a test task
        testTask = {
            taskId: 'TASK-001',
            title: 'Test Task',
            description: 'Test task description',
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
        it('should update task status to done', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.taskId).toBe('TASK-001');
            expect(result.status).toBe('done');
            
            // Verify task was updated in queue
            const updatedTask = taskQueue.getAllTasks().find(t => t.taskId === 'TASK-001');
            expect(updatedTask?.status).toBe('done');
        });

        it('should update task status to blocked', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'blocked',
                statusDetails: {
                    blockedReason: 'Waiting for API access',
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.status).toBe('blocked');
            
            const updatedTask = taskQueue.getAllTasks().find(t => t.taskId === 'TASK-001');
            expect(updatedTask?.status).toBe('blocked');
        });

        it('should update task status to failed', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'failed',
                statusDetails: {
                    failureReason: 'Tests failed',
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.status).toBe('failed');
            // Failed tasks remain in-progress for retry
            const updatedTask = taskQueue.getAllTasks().find(t => t.taskId === 'TASK-001');
            expect(updatedTask?.status).toBe('in-progress');
        });

        it('should update task status to partial', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'partial',
                statusDetails: {
                    progressPercent: 75,
                    partiallyDone: 'Backend complete, frontend in progress',
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.status).toBe('partial');
        });

        it('should include implementation notes', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                implementationNotes: 'Used React hooks for state management',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
        });

        it('should include files modified', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                filesModified: ['src/App.tsx', 'src/utils/helper.ts'],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
        });
    });

    // ========================================================================
    // Error Handling
    // ========================================================================

    describe('Error Handling', () => {
        it('should throw error for non-existent task', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-999',
                status: 'done',
            };

            await expect(reportTaskStatus(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);

            try {
                await reportTaskStatus(params, taskQueue);
            } catch (error) {
                expect((error as MCPProtocolError).code).toBe(MCPErrorCode.TASK_NOT_FOUND);
            }
        });

        it('should throw error for invalid status', async () => {
            const params = {
                taskId: 'TASK-001',
                status: 'invalid-status',
            };

            await expect(reportTaskStatus(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should throw error when marking already-done task as done', async () => {
            // Mark task as done first
            taskQueue.updateTaskStatus('TASK-001', 'done');

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            await expect(reportTaskStatus(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);

            try {
                await reportTaskStatus(params, taskQueue);
            } catch (error) {
                expect((error as MCPProtocolError).code).toBe(MCPErrorCode.TASK_ALREADY_IN_PROGRESS);
            }
        });

        it('should throw error for missing taskId', async () => {
            const params = {
                status: 'done',
            };

            await expect(reportTaskStatus(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should throw error for invalid progress percent', async () => {
            const params = {
                taskId: 'TASK-001',
                status: 'partial',
                statusDetails: {
                    progressPercent: 150, // Invalid: > 100
                },
            };

            await expect(reportTaskStatus(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });
    });

    // ========================================================================
    // Verification Task Creation
    // ========================================================================

    describe('Verification Task Creation', () => {
        it('should create verification task for completed task', async () => {
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

            expect(result.verificationTaskCreated).toBeDefined();
            expect(result.verificationTaskCreated?.taskId).toBe('VERIFY-TASK-001');
            expect(result.verificationTaskCreated?.title).toContain('Verify:');
            expect(result.verificationTaskCreated?.automationLevel).toBeTruthy();
            
            // Verify task was added to queue
            const verifyTask = taskQueue.getAllTasks().find(t => t.taskId === 'VERIFY-TASK-001');
            expect(verifyTask).toBeDefined();
            expect(verifyTask?.dependencies).toContain('TASK-001');
        });

        it('should NOT create verification task for failed status', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'failed',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated).toBeUndefined();
        });

        it('should NOT create verification task when tests failed', async () => {
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

        it('should use manual verification for critical priority tasks', async () => {
            testTask.priority = 'critical';

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated?.automationLevel).toBe('manual');
        });

        it('should use semi-automated verification for high priority tasks', async () => {
            testTask.priority = 'high';

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated?.automationLevel).toBe('semi-automated');
        });

        it('should use automated verification for medium/low priority tasks', async () => {
            testTask.priority = 'medium';

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.verificationTaskCreated?.automationLevel).toBe('automated');
        });
    });

    // ========================================================================
    // Testing Results
    // ========================================================================

    describe('Testing Results', () => {
        it('should accept valid testing results', async () => {
            const testing: Testing = {
                testsAdded: true,
                testFileCreated: 'src/test/myTest.test.ts',
                testsPassed: true,
                testsFailed: 0,
                testCoveragePercent: 95,
                accessibilityTestsPassed: true,
            };

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                testing,
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
        });

        it('should accept testing with failed tests', async () => {
            const testing: Testing = {
                testsAdded: true,
                testsPassed: false,
                testsFailed: 3,
                failedTestNames: ['test1', 'test2', 'test3'],
            };

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'failed',
                testing,
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.status).toBe('failed');
        });
    });

    // ========================================================================
    // Acceptance Criteria Verification
    // ========================================================================

    describe('Acceptance Criteria Verification', () => {
        it('should accept acceptance criteria verification', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                acceptanceCriteriaVerification: {
                    '0': { text: 'Criterion 1 met', status: 'passed' },
                    '1': { text: 'Criterion 2 met', status: 'passed' },
                    '2': { text: 'Criterion 3 not applicable', status: 'not-applicable' },
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
        });

        it('should handle mixed acceptance criteria results', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'partial',
                acceptanceCriteriaVerification: {
                    '0': { text: 'Criterion 1', status: 'passed' },
                    '1': { text: 'Criterion 2', status: 'failed' },
                },
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
        });
    });

    // ========================================================================
    // Observations Processing
    // ========================================================================

    describe('Observations Processing', () => {
        it('should process observations', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: [
                    'Found a better approach using hooks',
                    'Performance could be improved',
                ],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed).toBeDefined();
            expect(result.observationsProcessed?.length).toBe(2);
            expect(result.observationsProcessed?.[0].observation).toBe('Found a better approach using hooks');
        });

        it('should mark observations with bugs as action-required', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: ['Found a bug in the logging system'],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed?.[0].status).toBe('action-required');
            expect(result.observationsProcessed?.[0].suggestedFollowUp).toBeTruthy();
        });

        it('should mark observations with "need" as follow-up-created', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: ['Need to add error handling'],
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.observationsProcessed?.[0].status).toBe('follow-up-created');
        });

        it('should assign unique observation IDs', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                observations: ['Obs 1', 'Obs 2', 'Obs 3'],
            };

            const result = await reportTaskStatus(params, taskQueue);

            const ids = result.observationsProcessed?.map(o => o.observationId) || [];
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(3);
        });
    });

    // ========================================================================
    // Follow-Up Tasks
    // ========================================================================

    describe('Follow-Up Tasks', () => {
        it('should create follow-up tasks', async () => {
            const followUpTasks: FollowUpTask[] = [
                {
                    title: 'Add error handling',
                    why: 'Missing error cases',
                    estimatedHours: 2,
                },
                {
                    title: 'Write documentation',
                    why: 'API docs needed',
                    estimatedHours: 1,
                },
            ];

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                followUpTasks,
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.success).toBe(true);
            
            // Verify follow-up tasks were created
            const followUp1 = taskQueue.getAllTasks().find(t => t.taskId === 'TASK-001-FOLLOWUP-1');
            const followUp2 = taskQueue.getAllTasks().find(t => t.taskId === 'TASK-001-FOLLOWUP-2');
            
            expect(followUp1).toBeDefined();
            expect(followUp1?.title).toBe('Add error handling');
            expect(followUp1?.dependencies).toContain('TASK-001');
            
            expect(followUp2).toBeDefined();
            expect(followUp2?.title).toBe('Write documentation');
        });

        it('should set follow-up priority based on original task', async () => {
            testTask.priority = 'critical';

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
                followUpTasks: [{
                    title: 'Follow-up task',
                    why: 'Additional work needed',
                }],
            };

            await reportTaskStatus(params, taskQueue);

            const followUp = taskQueue.getAllTasks().find(t => t.taskId === 'TASK-001-FOLLOWUP-1');
            expect(followUp?.priority).toBe('high'); // Critical → high for follow-ups
        });
    });

    // ========================================================================
    // Dashboard Update
    // ========================================================================

    describe('Dashboard Update', () => {
        it('should return accurate dashboard statistics', async () => {
            // Add more tasks
            taskQueue.addTask({
                taskId: 'TASK-002',
                title: 'Task 2',
                description: 'Test',
                priority: 'medium',
                status: 'done',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            taskQueue.addTask({
                taskId: 'TASK-003',
                title: 'Task 3',
                description: 'Test',
                priority: 'low',
                status: 'blocked',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.dashboardUpdate).toBeDefined();
            expect(result.dashboardUpdate?.totalCount).toBeGreaterThan(0);
            expect(result.dashboardUpdate?.completedCount).toBeGreaterThan(0);
            expect(result.dashboardUpdate?.percentComplete).toBeGreaterThanOrEqual(0);
            expect(result.dashboardUpdate?.percentComplete).toBeLessThanOrEqual(100);
        });

        it('should count verification pending tasks', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.dashboardUpdate?.verificationPendingCount).toBeDefined();
        });

        it('should calculate correct percentage', async () => {
            // Create 10 tasks, mark 5 as done
            for (let i = 2; i <= 10; i++) {
                const status: Task['status'] = i <= 5 ? 'done' : 'pending';
                taskQueue.addTask({
                    taskId: `TASK-${String(i).padStart(3, '0')}`,
                    title: `Task ${i}`,
                    description: 'Test',
                    priority: 'medium',
                    status,
                    dependencies: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            // Mark TASK-001 as done (now 5 out of 10)
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            // Percentage should be around 45-50% (5 done + verification tasks)
            expect(result.dashboardUpdate?.percentComplete).toBeGreaterThan(30);
        });
    });

    // ========================================================================
    // Next Task Preview
    // ========================================================================

    describe('Next Task Preview', () => {
        it('should return next available task', async () => {
            taskQueue.addTask({
                taskId: 'TASK-002',
                title: 'Next Task',
                description: 'Test',
                priority: 'high',
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

            expect(result.nextTaskId).toBe('TASK-002');
            expect(result.nextTaskPreview).toBeDefined();
            expect(result.nextTaskPreview?.title).toBe('Next Task');
            expect(result.nextTaskPreview?.priority).toBe('high');
        });

        it('should return null when no next task available', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            // Only verification task will be in queue, no regular tasks
            expect(result.nextTaskId).toBeUndefined();
            expect(result.nextTaskPreview).toBeUndefined();
        });

        it('should exclude verification tasks from next task preview', async () => {
            taskQueue.addTask({
                taskId: 'VERIFY-TASK-001',
                title: 'Verify: Something',
                description: 'Test',
                priority: 'high',
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            // Should not return verification task
            expect(result.nextTaskId).not.toBe('VERIFY-TASK-001');
        });
    });

    // ========================================================================
    // Success Message
    // ========================================================================

    describe('Success Message', () => {
        it('should include status in message', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            expect(result.message).toContain('done');
        });

        it('should include queue statistics in message', async () => {
            taskQueue.addTask({
                taskId: 'TASK-002',
                title: 'Task 2',
                description: 'Test',
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

            expect(result.message).toMatch(/\d+ ready tasks/);
            expect(result.message).toMatch(/\d+ blocked/);
        });

        it('should mention verification task creation', async () => {
            const params: ReportTaskStatusRequest = {
                taskId: 'TASK-001',
                status: 'done',
            };

            const result = await reportTaskStatus(params, taskQueue);

            if (result.verificationTaskCreated) {
                expect(result.message).toContain('verification task created');
            }
        });
    });
});

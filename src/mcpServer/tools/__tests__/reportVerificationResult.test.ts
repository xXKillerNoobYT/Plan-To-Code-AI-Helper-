/**
 * Tests for reportVerificationResult MCP Tool
 * Validates verification result reporting and task status updates
 */

import { reportVerificationResult, ReportVerificationResultRequest } from '../reportVerificationResult';
import { Task, TaskQueue } from '../../../tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../protocol';

describe('reportVerificationResult MCP Tool', () => {
    let taskQueue: TaskQueue;
    let originalTask: Task;
    let verificationTask: Task;

    beforeEach(() => {
        taskQueue = new TaskQueue();

        originalTask = {
            taskId: 'TASK-001',
            title: 'Original Task',
            description: 'Test',
            priority: 'high',
            status: 'done',
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        verificationTask = {
            taskId: 'VERIFY-TASK-001',
            title: 'Verify Task',
            description: 'Verification',
            priority: 'high',
            status: 'in-progress',
            dependencies: ['TASK-001'],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        taskQueue.addTask(originalTask);
        taskQueue.addTask(verificationTask);
    });

    describe('Basic Functionality', () => {
        it('should report passed verification', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'passed',
                verification: {
                    checklist: [
                        { item: 'Functionality works', status: 'passed' },
                        { item: 'Tests pass', status: 'passed' },
                    ],
                    summary: 'All checks passed',
                },
                originalTaskStatus: 'done',
            };

            const result = await reportVerificationResult(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.verificationStatus).toBe('passed');
        });

        it('should update verification task status', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'passed',
                verification: {
                    checklist: [{ item: 'Test', status: 'passed' }],
                    summary: 'Done',
                },
                originalTaskStatus: 'done',
            };

            await reportVerificationResult(params, taskQueue);

            const task = taskQueue.getAllTasks().find(t => t.taskId === 'VERIFY-TASK-001');
            expect(task?.status).toBe('done');
        });
    });

    describe('Failed Verifications', () => {
        it('should report failed verification', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'failed',
                verification: {
                    checklist: [
                        { item: 'Feature works', status: 'failed' },
                    ],
                    failedItems: [
                        { item: 'Feature works', issue: 'Bug found', why: 'Logic error' },
                    ],
                    summary: 'Verification failed',
                },
                originalTaskStatus: 'needs_rework',
            };

            const result = await reportVerificationResult(params, taskQueue);

            expect(result.verificationStatus).toBe('failed');
            expect(result.issuesFound).toBeDefined();
            expect(result.issuesFound?.length).toBeGreaterThan(0);
        });

        it('should create follow-up tasks for failures', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'failed',
                verification: {
                    checklist: [{ item: 'Check', status: 'failed' }],
                    failedItems: [
                        { item: 'UI broken', issue: 'Layout issue', why: 'CSS problem' },
                    ],
                    summary: 'Failed',
                },
                originalTaskStatus: 'needs_rework',
            };

            const result = await reportVerificationResult(params, taskQueue);

            expect(result.followUpTasksCreated).toBeDefined();
            expect(result.followUpTasksCreated?.length).toBe(1);
        });

        it('should add follow-up tasks to queue', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'failed',
                verification: {
                    checklist: [{ item: 'Test', status: 'failed' }],
                    failedItems: [
                        { item: 'Fix needed', issue: 'Issue', why: 'Because' },
                    ],
                    summary: 'Failed',
                },
                originalTaskStatus: 'needs_rework',
            };

            await reportVerificationResult(params, taskQueue);

            const followUpTasks = taskQueue.getAllTasks().filter(t =>
                t.taskId.startsWith('FOLLOWUP-')
            );
            expect(followUpTasks.length).toBeGreaterThan(0);
        });
    });

    describe('Partial Verification', () => {
        it('should handle partial verification', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'partial',
                verification: {
                    checklist: [
                        { item: 'Feature 1', status: 'passed' },
                        { item: 'Feature 2', status: 'failed' },
                    ],
                    failedItems: [
                        { item: 'Feature 2', issue: 'Incomplete', why: 'Not fully implemented' },
                    ],
                    summary: 'Partially complete',
                },
                originalTaskStatus: 'done_but_incomplete',
            };

            const result = await reportVerificationResult(params, taskQueue);

            expect(result.verificationStatus).toBe('partial');
            expect(result.originalTaskStatus).toBe('done_but_incomplete');
        });
    });

    describe('Blocker Clearance', () => {
        it('should detect cleared blockers on passed verification', async () => {
            // Add task that depends on TASK-001
            taskQueue.addTask({
                taskId: 'TASK-002',
                title: 'Dependent Task',
                description: 'Depends on TASK-001',
                priority: 'medium',
                status: 'pending',
                dependencies: ['TASK-001'],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'passed',
                verification: {
                    checklist: [{ item: 'All good', status: 'passed' }],
                    summary: 'Passed',
                },
                originalTaskStatus: 'done',
            };

            const result = await reportVerificationResult(params, taskQueue);

            expect(result.blockerCleared).toBe(true);
        });

        it('should not clear blockers on failed verification', async () => {
            taskQueue.addTask({
                taskId: 'TASK-003',
                title: 'Blocked Task',
                description: 'Test',
                priority: 'medium',
                status: 'pending',
                dependencies: ['TASK-001'],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'failed',
                verification: {
                    checklist: [{ item: 'Check', status: 'failed' }],
                    summary: 'Failed',
                },
                originalTaskStatus: 'needs_rework',
            };

            const result = await reportVerificationResult(params, taskQueue);

            expect(result.blockerCleared).toBe(false);
        });
    });

    describe('Dashboard Updates', () => {
        it('should include dashboard update for failures', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'failed',
                verification: {
                    checklist: [{ item: 'Test', status: 'failed' }],
                    failedItems: [
                        { item: 'Test', issue: 'Failed', why: 'Bug' },
                    ],
                    summary: 'Failed',
                },
                originalTaskStatus: 'needs_rework',
            };

            const result = await reportVerificationResult(params, taskQueue);

            expect(result.dashboardUpdate).toBeDefined();
            expect(result.dashboardUpdate?.issuesCount).toBeGreaterThan(0);
        });

        it('should not include dashboard update for clean passes', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'passed',
                verification: {
                    checklist: [{ item: 'All good', status: 'passed' }],
                    summary: 'Passed',
                },
                originalTaskStatus: 'done',
            };

            const result = await reportVerificationResult(params, taskQueue);

            expect(result.dashboardUpdate).toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        it('should throw error for non-existent verification task', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'NONEXISTENT',
                originalTaskId: 'TASK-001',
                verificationStatus: 'passed',
                verification: {
                    checklist: [{ item: 'Test', status: 'passed' }],
                    summary: 'Passed',
                },
                originalTaskStatus: 'done',
            };

            await expect(reportVerificationResult(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should throw error for non-existent original task', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'NONEXISTENT',
                verificationStatus: 'passed',
                verification: {
                    checklist: [{ item: 'Test', status: 'passed' }],
                    summary: 'Passed',
                },
                originalTaskStatus: 'done',
            };

            await expect(reportVerificationResult(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should throw error for invalid verification status', async () => {
            const params = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'invalid-status',
                verification: {
                    checklist: [{ item: 'Test', status: 'passed' }],
                    summary: 'Test',
                },
                originalTaskStatus: 'done',
            };

            await expect(reportVerificationResult(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should handle empty checklist as 0/0 passed', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'passed',
                verification: {
                    checklist: [],
                    summary: 'No checks required',
                },
                originalTaskStatus: 'done',
            };

            const result = await reportVerificationResult(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.message).toContain('0/0');
        });
    });

    describe('Message Generation', () => {
        it('should include check counts in message', async () => {
            const params: ReportVerificationResultRequest = {
                verificationTaskId: 'VERIFY-TASK-001',
                originalTaskId: 'TASK-001',
                verificationStatus: 'passed',
                verification: {
                    checklist: [
                        { item: 'Check 1', status: 'passed' },
                        { item: 'Check 2', status: 'passed' },
                        { item: 'Check 3', status: 'passed' },
                    ],
                    summary: 'All passed',
                },
                originalTaskStatus: 'done',
            };

            const result = await reportVerificationResult(params, taskQueue);

            expect(result.message).toContain('3/3');
        });
    });
});

// ./reportVerificationResult.web.spec.ts
import { reportVerificationResult } from '../../src/mcpServer/tools/reportVerificationResult';
import { TaskQueue } from '../../src/tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../src/mcpServer/protocol';

jest.mock('../../src/tasks/queue');
// Do NOT mock zod - we need the real Zod validation library

/** @aiContributed-2026-01-28 */
describe('reportVerificationResult', () => {
    let taskQueue: jest.Mocked<TaskQueue>;

    beforeEach(() => {
        taskQueue = new TaskQueue() as jest.Mocked<TaskQueue>;
        taskQueue.getAllTasks.mockReturnValue([]);
        taskQueue.addTask.mockImplementation(() => { });
        taskQueue.updateTaskStatus.mockImplementation(() => { });
    });

    /** @aiContributed-2026-01-28 */
    it('should throw an error if parameters are invalid', async () => {
        const invalidParams = { invalid: 'data' };

        await expect(reportVerificationResult(invalidParams as any, taskQueue)).rejects.toThrow(MCPProtocolError);
        // Type assertion for enum comparison
        const errorPromise = reportVerificationResult(invalidParams as any, taskQueue);
        await expect(errorPromise).rejects.toThrow();
    });

    /** @aiContributed-2026-01-28 */
    it('should throw an error if verification task is not found', async () => {
        const params = {
            verificationTaskId: 'nonexistent-task',
            originalTaskId: 'original-task',
            verificationStatus: 'passed',
            verification: { checklist: [], summary: 'summary' },
            originalTaskStatus: 'done',
        };

        await expect(reportVerificationResult(params, taskQueue)).rejects.toThrow(MCPProtocolError);
        // Type assertion for error code comparison
        const errorPromise2 = reportVerificationResult(params, taskQueue);
        await expect(errorPromise2).rejects.toThrow();
    });

    /** @aiContributed-2026-01-28 */
    it('should return a successful response for valid input', async () => {
        const params = {
            verificationTaskId: 'verification-task',
            originalTaskId: 'original-task',
            verificationStatus: 'passed',
            verification: {
                checklist: [{ item: 'Check 1', status: 'passed' }],
                summary: 'All checks passed',
            },
            originalTaskStatus: 'done',
        };

        taskQueue.getAllTasks.mockReturnValue([
            { taskId: 'verification-task', dependencies: [], status: 'pending' } as any,
            { taskId: 'original-task', dependencies: [], status: 'pending' } as any,
        ]);

        const response = await reportVerificationResult(params, taskQueue);

        expect(response.success).toBe(true);
        expect(response.verificationTaskId).toBe('verification-task');
        expect(response.verificationStatus).toBe('passed');
        expect(response.originalTaskStatus).toBe('done');
        expect(response.blockerCleared).toBe(false);
        expect(taskQueue.updateTaskStatus).toHaveBeenCalledWith('verification-task', 'done');
        expect(taskQueue.updateTaskStatus).toHaveBeenCalledWith('original-task', 'done');
    });

    /** @aiContributed-2026-01-28 */
    it('should create follow-up tasks for failed verifications', async () => {
        const params = {
            verificationTaskId: 'verification-task',
            originalTaskId: 'original-task',
            verificationStatus: 'failed',
            verification: {
                checklist: [{ item: 'Check 1', status: 'failed' }],
                failedItems: [{ item: 'Check 1', issue: 'Issue 1', why: 'Reason 1' }],
                summary: 'Verification failed',
            },
            originalTaskStatus: 'needs_rework',
        };

        taskQueue.getAllTasks.mockReturnValue([
            { taskId: 'verification-task', dependencies: [], status: 'pending' } as any,
            { taskId: 'original-task', dependencies: [], status: 'pending' } as any,
        ]);

        const response = await reportVerificationResult(params, taskQueue);

        expect(response.success).toBe(true);
        expect(response.followUpTasksCreated).toHaveLength(1);
        expect(response.followUpTasksCreated![0].title).toBe('Fix: Check 1');
        expect(taskQueue.addTask).toHaveBeenCalled();
    });
});
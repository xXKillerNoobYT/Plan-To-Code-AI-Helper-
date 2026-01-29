// ./getNextTask.web.spec.ts
import { getNextTask } from '../../src/mcpServer/tools/getNextTask';
import { TaskQueue } from '../../src/tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../src/mcpServer/protocol';

jest.mock('../../src/tasks/queue', () => {
    return {
        ...jest.requireActual('../../src/tasks/queue'),
        TaskQueue: jest.fn().mockImplementation(() => ({
            getAllTasks: jest.fn(),
        })),
    };
});

/** @aiContributed-2026-01-28 */
describe('getNextTask', () => {
    let taskQueue: any; // Use any to allow mock methods

    beforeEach(() => {
        taskQueue = new TaskQueue();
    });

    /** @aiContributed-2026-01-28 */
    it('should return the highest priority task with detailed prompt and context', async () => {
        const tasks = [
            { taskId: '1', title: 'Task 1', description: 'First task', priority: 'medium', status: 'ready', createdAt: new Date('2023-01-01'), updatedAt: new Date(), dependencies: [], githubIssueNumber: 1 },
            { taskId: '2', title: 'Task 2', description: 'Complex second task', priority: 'high', status: 'ready', createdAt: new Date('2023-01-02'), updatedAt: new Date(), dependencies: [], githubIssueNumber: 2 },
            { taskId: '3', title: 'Task 3', description: 'Simple third task', priority: 'low', status: 'ready', createdAt: new Date('2023-01-03'), updatedAt: new Date(), dependencies: [], githubIssueNumber: 3 },
        ];
        taskQueue.getAllTasks.mockReturnValue(tasks);

        const params = { filter: 'ready', includeDetailedPrompt: true, includeContext: true };
        const response = await getNextTask(params, taskQueue);

        expect(response.success).toBe(true);
        expect(response.task?.taskId).toBe('2');
        expect(response.task?.superDetailedPrompt).toBeDefined();
        expect(response.task?.planReference).toBeDefined();
        expect(response.queueLength).toBe(3);
        expect(response.nextTasksPreview).toHaveLength(2);
    });

    /** @aiContributed-2026-01-28 */
    it('should filter tasks by status and priority', async () => {
        const tasks = [
            { taskId: '1', title: 'Task 1', description: 'First task', priority: 'medium', status: 'done', createdAt: new Date('2023-01-01'), updatedAt: new Date(), dependencies: [], githubIssueNumber: 1 },
            { taskId: '2', title: 'Task 2', description: 'Second task', priority: 'high', status: 'ready', createdAt: new Date('2023-01-02'), updatedAt: new Date(), dependencies: [], githubIssueNumber: 2 },
            { taskId: '3', title: 'Task 3', description: 'Third task', priority: 'low', status: 'blocked', createdAt: new Date('2023-01-03'), updatedAt: new Date(), dependencies: [], githubIssueNumber: 3 },
        ];
        taskQueue.getAllTasks.mockReturnValue(tasks);

        const params = { filter: 'ready', priority: 'high' };
        const response = await getNextTask(params, taskQueue);

        expect(response.success).toBe(true);
        expect(response.task?.taskId).toBe('2');
        expect(response.queueLength).toBe(1);
    });

    /** @aiContributed-2026-01-28 */
    it('should return null if no tasks match the filters', async () => {
        const tasks = [
            { taskId: '1', title: 'Task 1', description: 'First task', priority: 'medium', status: 'done', createdAt: new Date('2023-01-01'), updatedAt: new Date(), dependencies: [], githubIssueNumber: 1 },
            { taskId: '2', title: 'Task 2', description: 'Second task', priority: 'high', status: 'blocked', createdAt: new Date('2023-01-02'), updatedAt: new Date(), dependencies: [], githubIssueNumber: 2 },
        ];
        taskQueue.getAllTasks.mockReturnValue(tasks);

        const params = { filter: 'ready' };
        const response = await getNextTask(params, taskQueue);

        expect(response.success).toBe(true);
        expect(response.task).toBeNull();
        expect(response.queueLength).toBe(0);
    });

    /** @aiContributed-2026-01-28 */
    it('should throw an error for invalid parameters', async () => {
        const params = { invalidKey: 'invalidValue' };

        await expect(getNextTask(params, taskQueue)).rejects.toThrow(MCPProtocolError);
        await expect(getNextTask(params, taskQueue)).rejects.toThrow(expect.objectContaining({
            code: MCPErrorCode.INVALID_PARAMS
        }));
    });
});
// ./reportTaskStatus.web.spec.ts
import { reportTaskStatus } from '../../src/mcpServer/tools/reportTaskStatus';
import { TaskQueue } from '../../src/tasks/queue';
import { Task } from '../../src/tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../src/mcpServer/protocol';

jest.mock('../../src/tasks/queue');

/** @aiContributed-2026-01-28 */
describe('reportTaskStatus', () => {
    let taskQueue: jest.Mocked<TaskQueue>;

    beforeEach(() => {
        taskQueue = new TaskQueue() as jest.Mocked<TaskQueue>;
        taskQueue.getAllTasks.mockReturnValue([]);
        taskQueue.getStats.mockReturnValue({
            total: 0,
            pending: 0,
            inProgress: 0,
            done: 0,
            blocked: 0,
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should throw an error if taskId is not found', async () => {
        const params = { taskId: 'non-existent', status: 'done' };

        await expect(reportTaskStatus(params, taskQueue)).rejects.toThrow(MCPProtocolError);
        await expect(reportTaskStatus(params, taskQueue)).rejects.toThrow(expect.objectContaining({
            code: MCPErrorCode.TASK_NOT_FOUND
        }));
    });

    /** @aiContributed-2026-01-28 */
    it('should update task status and return success response', async () => {
        const task: Task = {
            taskId: 'task-1',
            status: 'pending',
            title: 'Test Task',
            description: 'Test description',
            priority: 'medium',
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        taskQueue.getAllTasks.mockReturnValue([task]);

        const params = { taskId: 'task-1', status: 'done' };

        const response = await reportTaskStatus(params, taskQueue);

        expect(taskQueue.updateTaskStatus).toHaveBeenCalledWith('task-1', 'done');
        expect(response.success).toBe(true);
        expect(response.status).toBe('done');
    });

    /** @aiContributed-2026-01-28 */
    it('should create a verification task for completed tasks with tests passed', async () => {
        const task: Task = {
            taskId: 'task-2',
            status: 'pending',
            title: 'Critical Task',
            description: 'Critical task description',
            priority: 'critical',
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        taskQueue.getAllTasks.mockReturnValue([task]);

        const params = {
            taskId: 'task-2',
            status: 'done',
            testing: { testsPassed: true, testsFailed: 0 },
        };

        const response = await reportTaskStatus(params, taskQueue);

        expect(response.verificationTaskCreated).toBeDefined();
        expect(response.verificationTaskCreated?.taskId).toContain('VERIFY-task-2');
    });

    /** @aiContributed-2026-01-28 */
    it('should process observations and return processed observations', async () => {
        const task: Task = {
            taskId: 'task-3',
            status: 'pending',
            title: 'Observation Task',
            description: 'Observation task description',
            priority: 'medium',
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        taskQueue.getAllTasks.mockReturnValue([task]);

        const params = {
            taskId: 'task-3',
            status: 'done',
            observations: ['Critical bug found', 'Need to refactor code'],
        };

        const response = await reportTaskStatus(params, taskQueue);

        expect(response.observationsProcessed).toHaveLength(2);
        expect(response.observationsProcessed?.[0].status).toBe('action-required');
        expect(response.observationsProcessed?.[1].status).toBe('follow-up-created');
    });

    /** @aiContributed-2026-01-28 */
    it('should calculate and return dashboard statistics', async () => {
        const task: Task = {
            taskId: 'task-4',
            status: 'done',
            title: 'Dashboard Task',
            description: 'Dashboard task description',
            priority: 'low',
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        taskQueue.getAllTasks.mockReturnValue([task]);
        taskQueue.getStats.mockReturnValue({
            total: 1,
            pending: 0,
            inProgress: 0,
            done: 1,
            blocked: 0,
        });

        const params = { taskId: 'task-4', status: 'done' };

        const response = await reportTaskStatus(params, taskQueue);

        expect(response.dashboardUpdate).toBeDefined();
        expect(response.dashboardUpdate?.completedCount).toBe(1);
        expect(response.dashboardUpdate?.totalCount).toBe(1);
        expect(response.dashboardUpdate?.percentComplete).toBe(100);
    });
});
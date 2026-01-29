// ./reportObservation.web.spec.ts
import { reportObservation } from '../../src/mcpServer/tools/reportObservation';
import { TaskQueue } from '../../src/tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../src/mcpServer/protocol';

jest.mock('../../src/tasks/queue', () => {
  return {
    ...jest.requireActual('../../src/tasks/queue'),
    TaskQueue: jest.fn().mockImplementation(() => ({
      getAllTasks: jest.fn(),
      addTask: jest.fn(),
    })),
  };
});

/** @aiContributed-2026-01-28 */
describe('reportObservation', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
  });

  /** @aiContributed-2026-01-28 */
  it('should throw an error if parameters are invalid', async () => {
    const invalidParams = { invalidKey: 'invalidValue' };

    await expect(reportObservation(invalidParams, taskQueue)).rejects.toThrow(MCPProtocolError);
  });

  /** @aiContributed-2026-01-28 */
  it('should throw an error if the task is not found', async () => {
    taskQueue.getAllTasks = jest.fn().mockReturnValue([]);

    const validParams = {
      taskId: 'nonexistent-task',
      observation: 'Test observation',
      type: 'issue',
      severity: 'medium',
    };

    await expect(reportObservation(validParams, taskQueue)).rejects.toThrow(MCPProtocolError);
  });

  /** @aiContributed-2026-01-28 */
  it('should log an observation successfully', async () => {
    taskQueue.getAllTasks = jest.fn().mockReturnValue([{ taskId: 'task-1' }]);

    const validParams = {
      taskId: 'task-1',
      observation: 'Test observation',
      type: 'issue',
      severity: 'medium',
    };

    const response = await reportObservation(validParams, taskQueue);

    expect(response.success).toBe(true);
    expect(response.status).toBe('logged');
    expect(response.observation).toBe(validParams.observation);
  });

  /** @aiContributed-2026-01-28 */
  it('should create a new task if requested', async () => {
    taskQueue.getAllTasks = jest.fn().mockReturnValue([{ taskId: 'task-1' }]);
    taskQueue.addTask = jest.fn();

    const validParams = {
      taskId: 'task-1',
      observation: 'Test observation',
      type: 'issue',
      severity: 'high',
      createNewTask: true,
      newTaskDetails: {
        title: 'New Task',
        priority: 'critical',
        estimatedHours: 5,
      },
    };

    const response = await reportObservation(validParams, taskQueue);

    expect(response.success).toBe(true);
    expect(response.status).toBe('task-created');
    expect(response.newTaskCreated).toBeDefined();
    expect(taskQueue.addTask).toHaveBeenCalled();
  });

  /** @aiContributed-2026-01-28 */
  it('should generate a dashboard alert for critical severity', async () => {
    taskQueue.getAllTasks = jest.fn().mockReturnValue([{ taskId: 'task-1' }]);

    const validParams = {
      taskId: 'task-1',
      observation: 'Critical issue',
      type: 'issue',
      severity: 'critical',
    };

    const response = await reportObservation(validParams, taskQueue);

    expect(response.success).toBe(true);
    expect(response.dashboardAlert).toBeDefined();
    expect(response.dashboardAlert?.message).toContain('Critical issue');
  });
});
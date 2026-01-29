// ./reportTestFailure.web.spec.ts
import { reportTestFailure } from '../../src/mcpServer/tools/reportTestFailure';
import { TaskQueue } from '../../src/tasks/queue';
import { Task } from '../../src/tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../src/mcpServer/protocol';

jest.mock('../../src/tasks/queue', () => {
  return {
    ...jest.requireActual('../../src/tasks/queue'),
    TaskQueue: jest.fn().mockImplementation(() => ({
      addTask: jest.fn(),
      getAllTasks: jest.fn(),
      updateTaskStatus: jest.fn(),
    })),
  };
});

/** @aiContributed-2026-01-28 */
describe('reportTestFailure', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
  });

  /** @aiContributed-2026-01-28 */
  it('should throw an error if parameters are invalid', async () => {
    const invalidParams = { invalidKey: 'value' };

    await expect(reportTestFailure(invalidParams, taskQueue)).rejects.toThrow(MCPProtocolError);
  });

  /** @aiContributed-2026-01-28 */
  it('should throw an error if the task is not found', async () => {
    jest.spyOn(taskQueue, 'getAllTasks').mockReturnValue([]);

    const params = {
      taskId: 'nonexistent-task',
      testName: 'Test Name',
      testFile: 'testFile.js',
      failureDetails: { error: 'Some error' },
      previousStatus: 'passing_before',
      needsInvestigation: false,
      actionNeeded: 'Fix the issue',
    };

    await expect(reportTestFailure(params, taskQueue)).rejects.toThrow(MCPProtocolError);
  });

  /** @aiContributed-2026-01-28 */
  it('should create an investigation task if needed', async () => {
    const mockTask: Task = { taskId: 'task-1', status: 'pending', title: 'Task 1', description: 'Test', priority: 'medium', dependencies: [], createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(taskQueue, 'getAllTasks').mockReturnValue([mockTask]);
    jest.spyOn(taskQueue, 'addTask').mockImplementation();

    const params = {
      taskId: 'task-1',
      testName: 'Test Name',
      testFile: 'testFile.js',
      failureDetails: { error: 'Some error' },
      previousStatus: 'passing_before',
      needsInvestigation: true,
      actionNeeded: 'Fix the issue',
    };

    const response = await reportTestFailure(params, taskQueue);

    expect(response.investigationTaskCreated).toBeDefined();
    expect(taskQueue.addTask).toHaveBeenCalled();
  });

  /** @aiContributed-2026-01-28 */
  it('should return a response with suspected root cause analysis', async () => {
    const mockTask: Task = { taskId: 'task-1', status: 'pending', title: 'Task 1', description: 'Test', priority: 'medium', dependencies: [], createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(taskQueue, 'getAllTasks').mockReturnValue([mockTask]);

    const params = {
      taskId: 'task-1',
      testName: 'Test Name',
      testFile: 'testFile.js',
      failureDetails: { error: 'undefined reference' },
      previousStatus: 'passing_before',
      needsInvestigation: false,
      actionNeeded: 'Fix the issue',
    };

    const response = await reportTestFailure(params, taskQueue);

    expect(response.suspectedRootCauseAnalysis).toBeDefined();
    expect(response.suspectedRootCauseAnalysis?.likeliestCause).toBe(
      'Null/undefined reference in component or test setup'
    );
  });

  /** @aiContributed-2026-01-28 */
  it('should include a blocking task if the failure blocks other tasks', async () => {
    const mockTask: Task = { taskId: 'task-1', status: 'pending', title: 'Task 1', description: 'Test', priority: 'medium', dependencies: [], createdAt: new Date(), updatedAt: new Date() };
    const blockedTask: Task = { taskId: 'task-2', status: 'pending', title: 'Task 2', description: 'Test', priority: 'medium', dependencies: ['task-1'], createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(taskQueue, 'getAllTasks').mockReturnValue([mockTask, blockedTask]);

    const params = {
      taskId: 'task-1',
      testName: 'Test Name',
      testFile: 'testFile.js',
      failureDetails: { error: 'Some error' },
      previousStatus: 'passing_before',
      needsInvestigation: false,
      actionNeeded: 'Fix the issue',
    };

    const response = await reportTestFailure(params, taskQueue);

    expect(response.blockingTask).toBeDefined();
    expect(response.blockingTask?.blockingTaskId).toBe('task-2');
  });
});
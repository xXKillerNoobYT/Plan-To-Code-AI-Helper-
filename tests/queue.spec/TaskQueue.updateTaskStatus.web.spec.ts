// ./queue.web.spec.ts
import { TaskQueue, Task } from '../../src/tasks/queue';

/** @aiContributed-2026-01-28 */
describe('TaskQueue - updateTaskStatus', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
  });

  /** @aiContributed-2026-01-28 */
  it('should update the status and updatedAt of an existing task', () => {
    const mockTask: Task = { taskId: '1', status: 'pending', updatedAt: new Date('2023-01-01T00:00:00Z'), title: 'Test Task', description: 'Test', priority: 'medium', dependencies: [], createdAt: new Date('2023-01-01T00:00:00Z') };
    const beforeUpdate = new Date();

    taskQueue.addTask(mockTask);
    taskQueue.updateTaskStatus(mockTask.taskId, 'done');

    const updatedTask = taskQueue.getAllTasks().find((task) => task.taskId === mockTask.taskId);
    expect(updatedTask).toBeDefined();
    expect(updatedTask?.status).toBe('done');
    expect(updatedTask?.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
  });

  /** @aiContributed-2026-01-28 */
  it('should not update anything if the task does not exist', () => {
    const initialTasks = taskQueue.getAllTasks();
    taskQueue.updateTaskStatus('non-existent-id', 'done');
    const finalTasks = taskQueue.getAllTasks();

    expect(finalTasks).toEqual(initialTasks);
  });
});
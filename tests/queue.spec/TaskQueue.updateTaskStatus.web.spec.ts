// ./queue.web.spec.ts
import { TaskQueue, Task } from '../../src/tasks/queue.ts';

/** @aiContributed-2026-01-28 */
describe('TaskQueue - updateTaskStatus', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
  });

  /** @aiContributed-2026-01-28 */
  it('should update the status and updatedAt of an existing task', () => {
    const mockTask: Task = { id: '1', status: 'pending', updatedAt: new Date('2023-01-01T00:00:00Z') };
    jest.spyOn(global, 'Date').mockImplementation(() => new Date('2023-10-01T12:00:00Z') as any);

    taskQueue.addTask(mockTask);
    taskQueue.updateTaskStatus('1', 'done');

    const updatedTask = taskQueue.getAllTasks().find((task) => task.id === '1');
    expect(updatedTask).toBeDefined();
    expect(updatedTask?.status).toBe('done');
    expect(updatedTask?.updatedAt).toEqual(new Date('2023-10-01T12:00:00Z'));

    jest.restoreAllMocks();
  });

  /** @aiContributed-2026-01-28 */
  it('should not update anything if the task does not exist', () => {
    const initialTasks = taskQueue.getAllTasks();
    taskQueue.updateTaskStatus('non-existent-id', 'done');
    const finalTasks = taskQueue.getAllTasks();

    expect(finalTasks).toEqual(initialTasks);
  });
});
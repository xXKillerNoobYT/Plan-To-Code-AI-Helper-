// ./dependencies.web.spec.ts
import { DependencyManager } from '../../src/tasks/dependencies.ts';

/** @aiContributed-2026-01-28 */
describe('DependencyManager.areDependenciesMet', () => {
  let dependencyManager: DependencyManager;

  beforeEach(() => {
    dependencyManager = new DependencyManager();
  });

  /** @aiContributed-2026-01-28 */
    it('should return true if the task has no dependencies', () => {
    const task = {
      taskId: '1',
      title: 'Task 1',
      description: 'Description 1',
      priority: 'high',
      status: 'in-progress',
      dependencies: [],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };
    const allTasks = [task];

    const result = dependencyManager.areDependenciesMet(task, allTasks);

    expect(result).toBe(true);
  });

  /** @aiContributed-2026-01-28 */
    it('should return false if any dependency task is not done', () => {
    const task = {
      taskId: '1',
      title: 'Task 1',
      description: 'Description 1',
      priority: 'high',
      status: 'in-progress',
      dependencies: ['2'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };
    const allTasks = [
      task,
      {
        taskId: '2',
        title: 'Task 2',
        description: 'Description 2',
        priority: 'medium',
        status: 'in-progress',
        dependencies: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
    ];

    const result = dependencyManager.areDependenciesMet(task, allTasks);

    expect(result).toBe(false);
  });

  /** @aiContributed-2026-01-28 */
    it('should return true if all dependency tasks are done', () => {
    const task = {
      taskId: '1',
      title: 'Task 1',
      description: 'Description 1',
      priority: 'high',
      status: 'in-progress',
      dependencies: ['2'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };
    const allTasks = [
      task,
      {
        taskId: '2',
        title: 'Task 2',
        description: 'Description 2',
        priority: 'medium',
        status: 'done',
        dependencies: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
    ];

    const result = dependencyManager.areDependenciesMet(task, allTasks);

    expect(result).toBe(true);
  });

  /** @aiContributed-2026-01-28 */
    it('should return false if a dependency task does not exist', () => {
    const task = {
      taskId: '1',
      title: 'Task 1',
      description: 'Description 1',
      priority: 'high',
      status: 'in-progress',
      dependencies: ['2'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };
    const allTasks = [task];

    const result = dependencyManager.areDependenciesMet(task, allTasks);

    expect(result).toBe(false);
  });
});
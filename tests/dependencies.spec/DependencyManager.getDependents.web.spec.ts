// ./dependencies.web.spec.ts
import { DependencyManager } from '../../src/tasks/dependencies';
import { Task } from '../../src/tasks/queue';

/** @aiContributed-2026-01-28 */
describe('DependencyManager - getDependents', () => {
    let dependencyManager: DependencyManager;

    beforeEach(() => {
        dependencyManager = new DependencyManager();
    });

    /** @aiContributed-2026-01-28 */
    it('should return an empty array when no tasks depend on the given taskId', () => {
        const allTasks: Task[] = [
            { taskId: '1', title: 'Task 1', description: '', priority: 'high', status: 'pending', dependencies: [], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
            { taskId: '2', title: 'Task 2', description: '', priority: 'low', status: 'done', dependencies: ['1'], createdAt: new Date('2023-01-02'), updatedAt: new Date('2023-01-02') },
        ];

        const result = dependencyManager.getDependents('3', allTasks);

        expect(result).toEqual([]);
    });

    /** @aiContributed-2026-01-28 */
    it('should return tasks that depend on the given taskId', () => {
        const task1: Task = { taskId: '1', title: 'Task 1', description: '', priority: 'high', status: 'pending', dependencies: ['2'], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') };
        const task2: Task = { taskId: '2', title: 'Task 2', description: '', priority: 'low', status: 'done', dependencies: [], createdAt: new Date('2023-01-02'), updatedAt: new Date('2023-01-02') };
        const task3: Task = { taskId: '3', title: 'Task 3', description: '', priority: 'medium', status: 'in-progress', dependencies: ['2'], createdAt: new Date('2023-01-03'), updatedAt: new Date('2023-01-03') };
        const allTasks: Task[] = [task1, task2, task3];

        const result = dependencyManager.getDependents('2', allTasks);

        expect(result).toEqual([task1, task3]);
    });

    /** @aiContributed-2026-01-28 */
    it('should handle tasks with no dependencies', () => {
        const allTasks: Task[] = [
            { taskId: '1', title: 'Task 1', description: '', priority: 'high', status: 'pending', dependencies: [], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
            { taskId: '2', title: 'Task 2', description: '', priority: 'low', status: 'done', dependencies: [], createdAt: new Date('2023-01-02'), updatedAt: new Date('2023-01-02') },
        ];

        const result = dependencyManager.getDependents('1', allTasks);

        expect(result).toEqual([]);
    });
});
// ./dependencies.web.spec.ts
import { DependencyManager } from '../../src/tasks/dependencies';
import { Task } from '../../src/tasks/queue';

/** @aiContributed-2026-01-28 */
describe('DependencyManager - hasCircularDependency', () => {
    let dependencyManager: DependencyManager;

    beforeEach(() => {
        dependencyManager = new DependencyManager();
    });

    /** @aiContributed-2026-01-28 */
    it('should return false when there are no circular dependencies', () => {
        const tasks: Task[] = [
            { taskId: '1', title: 'Task 1', description: '', priority: 'high', status: 'pending', dependencies: [], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
            { taskId: '2', title: 'Task 2', description: '', priority: 'medium', status: 'pending', dependencies: ['1'], createdAt: new Date('2023-01-02'), updatedAt: new Date('2023-01-02') },
        ];
        const result = dependencyManager.hasCircularDependency(tasks[1], tasks);
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-28 */
    it('should return true when there is a circular dependency', () => {
        const tasks: Task[] = [
            { taskId: '1', title: 'Task 1', description: '', priority: 'high', status: 'pending', dependencies: ['2'], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
            { taskId: '2', title: 'Task 2', description: '', priority: 'medium', status: 'pending', dependencies: ['1'], createdAt: new Date('2023-01-02'), updatedAt: new Date('2023-01-02') },
        ];
        const result = dependencyManager.hasCircularDependency(tasks[0], tasks);
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-28 */
    it('should return false for a task with no dependencies', () => {
        const tasks: Task[] = [
            { taskId: '1', title: 'Task 1', description: '', priority: 'high', status: 'pending', dependencies: [], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
        ];
        const result = dependencyManager.hasCircularDependency(tasks[0], tasks);
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-28 */
    it('should handle complex dependency graphs without circular dependencies', () => {
        const tasks: Task[] = [
            { taskId: '1', title: 'Task 1', description: '', priority: 'high', status: 'pending', dependencies: [], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
            { taskId: '2', title: 'Task 2', description: '', priority: 'medium', status: 'pending', dependencies: ['1'], createdAt: new Date('2023-01-02'), updatedAt: new Date('2023-01-02') },
            { taskId: '3', title: 'Task 3', description: '', priority: 'low', status: 'pending', dependencies: ['2'], createdAt: new Date('2023-01-03'), updatedAt: new Date('2023-01-03') },
        ];
        const result = dependencyManager.hasCircularDependency(tasks[2], tasks);
        expect(result).toBe(false);
    });
});
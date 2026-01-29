// ./dependencies.web.spec.ts
import { DependencyManager } from '../../src/tasks/dependencies.ts';

/** @aiContributed-2026-01-28 */
describe('DependencyManager - getDependents', () => {
    let dependencyManager: DependencyManager;

    beforeEach(() => {
        dependencyManager = new DependencyManager();
    });

    /** @aiContributed-2026-01-28 */
    it('should return an empty array when no tasks depend on the given taskId', () => {
        const allTasks = [
            { taskId: '1', title: 'Task 1', description: '', priority: 'High', status: 'Open', dependencies: [], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
            { taskId: '2', title: 'Task 2', description: '', priority: 'Low', status: 'Closed', dependencies: ['3'], createdAt: new Date('2023-01-02'), updatedAt: new Date('2023-01-02') },
        ];

        const result = dependencyManager.getDependents('3', allTasks);

        expect(result).toEqual([]);
    });

    /** @aiContributed-2026-01-28 */
    it('should return tasks that depend on the given taskId', () => {
        const allTasks = [
            { taskId: '1', title: 'Task 1', description: '', priority: 'High', status: 'Open', dependencies: ['2'], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
            { taskId: '2', title: 'Task 2', description: '', priority: 'Low', status: 'Closed', dependencies: [], createdAt: new Date('2023-01-02'), updatedAt: new Date('2023-01-02') },
            { taskId: '3', title: 'Task 3', description: '', priority: 'Medium', status: 'In Progress', dependencies: ['2'], createdAt: new Date('2023-01-03'), updatedAt: new Date('2023-01-03') },
        ];

        const result = dependencyManager.getDependents('2', allTasks);

        expect(result).toEqual([
            { taskId: '1', title: 'Task 1', description: '', priority: 'High', status: 'Open', dependencies: ['2'], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
            { taskId: '3', title: 'Task 3', description: '', priority: 'Medium', status: 'In Progress', dependencies: ['2'], createdAt: new Date('2023-01-03'), updatedAt: new Date('2023-01-03') },
        ]);
    });

    /** @aiContributed-2026-01-28 */
    it('should handle tasks with no dependencies', () => {
        const allTasks = [
            { taskId: '1', title: 'Task 1', description: '', priority: 'High', status: 'Open', dependencies: [], createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-01-01') },
            { taskId: '2', title: 'Task 2', description: '', priority: 'Low', status: 'Closed', dependencies: [], createdAt: new Date('2023-01-02'), updatedAt: new Date('2023-01-02') },
        ];

        const result = dependencyManager.getDependents('1', allTasks);

        expect(result).toEqual([]);
    });
});
/**
 * Task Dependency Manager
 * Handles task dependencies and execution order
 */

import { Task } from './queue';

export class DependencyManager {
    /**
     * Check if a task's dependencies are met
     */
    areDependenciesMet(task: Task, allTasks: Task[]): boolean {
        if (task.dependencies.length === 0) {
            return true;
        }

        // Check if all dependency tasks are done
        for (const depId of task.dependencies) {
            const depTask = allTasks.find(t => t.taskId === depId);

            if (!depTask || depTask.status !== 'done') {
                return false;
            }
        }

        return true;
    }

    /**
     * Get all tasks that depend on a given task
     */
    getDependents(taskId: string, allTasks: Task[]): Task[] {
        return allTasks.filter(t => t.dependencies.includes(taskId));
    }

    /**
     * Detect circular dependencies
     */
    hasCircularDependency(task: Task, allTasks: Task[]): boolean {
        const visited = new Set<string>();

        return this.detectCycle(task.taskId, allTasks, visited, new Set());
    }

    /**
     * Helper method for cycle detection using DFS
     */
    private detectCycle(
        taskId: string,
        allTasks: Task[],
        visited: Set<string>,
        recursionStack: Set<string>
    ): boolean {
        visited.add(taskId);
        recursionStack.add(taskId);

        const task = allTasks.find(t => t.taskId === taskId);
        if (!task) {
            return false;
        }

        for (const depId of task.dependencies) {
            if (!visited.has(depId)) {
                if (this.detectCycle(depId, allTasks, visited, recursionStack)) {
                    return true;
                }
            } else if (recursionStack.has(depId)) {
                return true; // Cycle detected
            }
        }

        recursionStack.delete(taskId);
        return false;
    }
}

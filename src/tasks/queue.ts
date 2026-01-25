/**
 * Task Queue Implementation
 * In-memory task queue with persistence to disk
 */

export interface Task {
    taskId: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'pending' | 'ready' | 'in-progress' | 'done' | 'blocked';
    dependencies: string[];
    githubIssueNumber?: number;
    createdAt: Date;
    updatedAt: Date;
}

export class TaskQueue {
    private tasks: Map<string, Task> = new Map();

    /**
     * Add a new task to the queue
     */
    addTask(task: Task): void {
        this.tasks.set(task.taskId, task);
        console.log(`Task Queue: Added task ${task.taskId}`);
    }

    /**
     * Get the next available task based on priority and dependencies
     */
    getNextTask(): Task | null {
        // TODO: Filter by status (ready, not blocked)
        // TODO: Sort by priority
        // TODO: Check dependencies are met

        const readyTasks = Array.from(this.tasks.values())
            .filter(t => t.status === 'ready' || t.status === 'pending');

        if (readyTasks.length === 0) {
            return null;
        }

        // Return highest priority task (simple implementation)
        return readyTasks[0];
    }

    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, status: Task['status']): void {
        const task = this.tasks.get(taskId);
        if (task) {
            task.status = status;
            task.updatedAt = new Date();
            console.log(`Task Queue: Updated task ${taskId} status to ${status}`);
        }
    }

    /**
     * Get all tasks
     */
    getAllTasks(): Task[] {
        return Array.from(this.tasks.values());
    }

    /**
     * Get queue statistics
     */
    getStats(): { total: number; pending: number; inProgress: number; done: number; blocked: number } {
        const all = this.getAllTasks();
        return {
            total: all.length,
            pending: all.filter(t => t.status === 'pending' || t.status === 'ready').length,
            inProgress: all.filter(t => t.status === 'in-progress').length,
            done: all.filter(t => t.status === 'done').length,
            blocked: all.filter(t => t.status === 'blocked').length
        };
    }
}

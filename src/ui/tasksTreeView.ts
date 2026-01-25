/**
 * Tasks Tree View (Frontend)
 * Displays the task queue in a tree structure in the sidebar
 */

import * as vscode from 'vscode';
import { Task } from '../tasks/queue';

export class TasksTreeDataProvider implements vscode.TreeDataProvider<TaskTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined | null | void> = new vscode.EventEmitter<TaskTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private tasks: Task[]) { }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Update tasks data
     */
    updateTasks(tasks: Task[]): void {
        this.tasks = tasks;
        this.refresh();
    }

    /**
     * Get tree item for display
     */
    getTreeItem(element: TaskTreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children of an element
     */
    getChildren(element?: TaskTreeItem): Thenable<TaskTreeItem[]> {
        if (!element) {
            // Root level - show task categories
            return Promise.resolve([
                new TaskTreeItem('🔴 Critical', vscode.TreeItemCollapsibleState.Expanded, 'critical'),
                new TaskTreeItem('🟠 High', vscode.TreeItemCollapsibleState.Expanded, 'high'),
                new TaskTreeItem('🟡 Medium', vscode.TreeItemCollapsibleState.Collapsed, 'medium'),
                new TaskTreeItem('🟢 Low', vscode.TreeItemCollapsibleState.Collapsed, 'low')
            ]);
        } else {
            // Show tasks for priority level
            const tasksForPriority = this.tasks
                .filter(t => t.priority === element.priority)
                .map(t => new TaskTreeItem(
                    `${this.getStatusIcon(t.status)} ${t.title}`,
                    vscode.TreeItemCollapsibleState.None,
                    t.priority,
                    t
                ));

            return Promise.resolve(tasksForPriority);
        }
    }

    /**
     * Get icon for task status
     */
    private getStatusIcon(status: Task['status']): string {
        switch (status) {
            case 'pending': return '⏳';
            case 'ready': return '✅';
            case 'in-progress': return '🔄';
            case 'done': return '✔️';
            case 'blocked': return '🚫';
            default: return '📋';
        }
    }
}

export class TaskTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly priority?: Task['priority'],
        public readonly task?: Task
    ) {
        super(label, collapsibleState);

        if (task) {
            this.tooltip = task.description;
            this.description = `#${task.taskId}`;
        }
    }
}

/**
 * Register and create the Tasks Tree View
 */
export function registerTasksTreeView(context: vscode.ExtensionContext, tasks: Task[]): void {
    const treeDataProvider = new TasksTreeDataProvider(tasks);

    const treeView = vscode.window.createTreeView('coe-tasks', {
        treeDataProvider
    });

    context.subscriptions.push(treeView);

    // TODO: Add click handlers for tasks
    // TODO: Add context menu actions (edit, delete, mark done)
}

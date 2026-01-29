/**
 * Completed Tasks Tree View (History)
 * Displays completed tasks history from the database in a collapsible tree
 */

import * as vscode from 'vscode';
import { TicketDatabase } from '../db/ticketsDb';

/**
 * Completed task data structure (from completed_tasks table)
 */
interface CompletedTask {
    task_id: string;
    original_ticket_id?: string;
    title: string;
    status: string;
    priority: number;
    completed_at: string;
    duration_minutes?: number;
    outcome?: string;
    created_at: string;
}

/**
 * Tree data provider for completed tasks history
 */
export class CompletedTasksTreeProvider implements vscode.TreeDataProvider<CompletedTaskTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CompletedTaskTreeItem | undefined | null | void> =
        new vscode.EventEmitter<CompletedTaskTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CompletedTaskTreeItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    private ticketDb: TicketDatabase;
    private retentionHours: number = 168; // Default 7 days

    constructor(ticketDb: TicketDatabase) {
        this.ticketDb = ticketDb;
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Update retention settings (from config)
     */
    updateRetention(maxAgeHours: number): void {
        this.retentionHours = maxAgeHours;
        this.refresh();
    }

    /**
     * Get tree item for display
     */
    getTreeItem(element: CompletedTaskTreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get children of an element
     */
    async getChildren(element?: CompletedTaskTreeItem): Promise<CompletedTaskTreeItem[]> {
        if (element) {
            // No nested children (flat list)
            return [];
        }

        try {
            // Fetch completed tasks from database
            const filters: any = {};

            // Apply retention filter if configured (convert hours to days)
            if (this.retentionHours > 0) {
                filters.minDaysAgo = Math.ceil(this.retentionHours / 24);
            }

            const completedTasks = await this.ticketDb.getAllCompleted(filters);

            if (completedTasks.length === 0) {
                // Show placeholder when no history
                return [
                    new CompletedTaskTreeItem(
                        'No completed tasks yet',
                        vscode.TreeItemCollapsibleState.None,
                        null,
                        true // isPlaceholder
                    )
                ];
            }

            // Map tasks to tree items
            return completedTasks.map(task => {
                const timeAgo = this.getTimeAgo(task.completed_at);
                const icon = this.getStatusIcon(task.status);
                const label = `${icon} ${task.title}`;

                return new CompletedTaskTreeItem(
                    label,
                    vscode.TreeItemCollapsibleState.None,
                    task,
                    false,
                    timeAgo
                );
            });

        } catch (error) {

            // Show error placeholder
            return [
                new CompletedTaskTreeItem(
                    '⚠️ Error loading history',
                    vscode.TreeItemCollapsibleState.None,
                    null,
                    true
                )
            ];
        }
    }

    /**
     * Get icon for task status
     */
    private getStatusIcon(status: string): string {
        switch (status) {
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'archived': return '📦';
            default: return '✔️';
        }
    }

    /**
     * Get human-readable time ago from ISO string
     */
    private getTimeAgo(isoString: string): string {
        const now = new Date().getTime();
        const then = new Date(isoString).getTime();
        const diffMs = now - then;

        const minutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 7) {
            return `${days}d ago`;
        } else {
            const weeks = Math.floor(days / 7);
            return `${weeks}w ago`;
        }
    }
}

/**
 * Tree item for completed task
 */
export class CompletedTaskTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly task: CompletedTask | null,
        public readonly isPlaceholder: boolean = false,
        public readonly timeAgo?: string
    ) {
        super(label, collapsibleState);

        if (task && !isPlaceholder) {
            // Add description (time ago) - set first
            if (timeAgo) {
                this.description = timeAgo;
            }

            // Add tooltip with task details
            this.tooltip = new vscode.MarkdownString();
            this.tooltip.appendMarkdown(`**${task.title}**\n\n`);
            this.tooltip.appendMarkdown(`**Status:** ${task.status}\n\n`);
            this.tooltip.appendMarkdown(`**Completed:** ${timeAgo || new Date(task.completed_at).toLocaleString()}\n\n`);

            if (task.duration_minutes) {
                this.tooltip.appendMarkdown(`**Duration:** ${task.duration_minutes} minutes\n\n`);
            }

            if (task.outcome) {
                this.tooltip.appendMarkdown(`**Outcome:** ${task.outcome}\n\n`);
            }

            // Add context value for commands
            this.contextValue = 'completedTask';
        } else if (isPlaceholder) {
            this.contextValue = 'placeholder';
            this.iconPath = new vscode.ThemeIcon('info');
        }
    }
}



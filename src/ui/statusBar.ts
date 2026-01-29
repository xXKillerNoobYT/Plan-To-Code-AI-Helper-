/**
 * Status Bar Integration (Frontend)
 * Shows task count and sync status in the VS Code status bar
 */

import * as vscode from 'vscode';

export class StatusBarManager {
    private taskCountItem: vscode.StatusBarItem;
    private syncStatusItem: vscode.StatusBarItem;

    constructor() {
        // Task count status bar item
        this.taskCountItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.taskCountItem.command = 'coe.showTasks';

        // Sync status bar item
        this.syncStatusItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            99
        );
        this.syncStatusItem.command = 'coe.syncNow';
    }

    /**
     * Show status bar items
     */
    show(): void {
        this.taskCountItem.show();
        this.syncStatusItem.show();
    }

    /**
     * Hide status bar items
     */
    hide(): void {
        this.taskCountItem.hide();
        this.syncStatusItem.hide();
    }

    /**
     * Update task count display
     */
    updateTaskCount(pending: number, total: number): void {
        this.taskCountItem.text = `$(checklist) ${pending}/${total} tasks`;
        this.taskCountItem.tooltip = `${pending} pending tasks out of ${total} total`;
    }

    /**
     * Update sync status
     */
    updateSyncStatus(status: 'idle' | 'syncing' | 'error', lastSync?: Date): void {
        switch (status) {
            case 'idle':
                this.syncStatusItem.text = '$(sync) Synced';
                this.syncStatusItem.tooltip = lastSync
                    ? `Last sync: ${lastSync.toLocaleTimeString()}`
                    : 'Not synced yet';
                break;
            case 'syncing':
                this.syncStatusItem.text = '$(sync~spin) Syncing...';
                this.syncStatusItem.tooltip = 'Syncing with GitHub...';
                break;
            case 'error':
                this.syncStatusItem.text = '$(error) Sync Error';
                this.syncStatusItem.tooltip = 'GitHub sync failed. Click to retry.';
                break;
        }
    }

    /**
     * Dispose status bar items
     */
    dispose(): void {
        this.taskCountItem.dispose();
        this.syncStatusItem.dispose();
    }
}



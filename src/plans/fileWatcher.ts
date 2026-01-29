/**
 * File Watcher
 * Monitors plan files for changes and triggers updates
 */

import * as vscode from 'vscode';

export class FileWatcher {
    private watcher: vscode.FileSystemWatcher | null = null;
    private changeHandlers: ((uri: vscode.Uri) => void)[] = [];

    /**
     * Start watching plan files
     */
    startWatching(pattern: string = '**/Plans/**/*.json'): void {
        this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

        this.watcher.onDidChange(uri => {
            this.notifyHandlers(uri);
        });

        this.watcher.onDidCreate(uri => {
            this.notifyHandlers(uri);
        });

        this.watcher.onDidDelete(uri => {
            this.notifyHandlers(uri);
        });

    }

    /**
     * Stop watching files
     */
    stopWatching(): void {
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = null;
        }
    }

    /**
     * Register a change handler
     */
    onFileChange(handler: (uri: vscode.Uri) => void): void {
        this.changeHandlers.push(handler);
    }

    /**
     * Notify all registered handlers
     */
    private notifyHandlers(uri: vscode.Uri): void {
        for (const handler of this.changeHandlers) {
            try {
                handler(uri);
            } catch (error) {
            }
        }
    }

    /**
     * Dispose the watcher
     */
    dispose(): void {
        this.stopWatching();
    }
}



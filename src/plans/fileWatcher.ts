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
            console.log(`File Watcher: File changed - ${uri.fsPath}`);
            this.notifyHandlers(uri);
        });

        this.watcher.onDidCreate(uri => {
            console.log(`File Watcher: File created - ${uri.fsPath}`);
            this.notifyHandlers(uri);
        });

        this.watcher.onDidDelete(uri => {
            console.log(`File Watcher: File deleted - ${uri.fsPath}`);
            this.notifyHandlers(uri);
        });

        console.log('File Watcher: Started watching plan files');
    }

    /**
     * Stop watching files
     */
    stopWatching(): void {
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = null;
        }
        console.log('File Watcher: Stopped watching');
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
                console.error('File Watcher: Error in change handler', error);
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

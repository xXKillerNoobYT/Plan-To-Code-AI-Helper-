/**
 * Plans File Watcher
 * 
 * Monitors the Plans/ folder for changes and triggers PRD auto-regeneration.
 * Implements debouncing to prevent rapid re-generation on multi-file edits.
 * 
 * @module plansWatcher
 */

import * as vscode from 'vscode';
import { PRDGenerator } from './prdGenerator';

/**
 * ⏱️  File Watcher with Debouncing
 */
export class PlansFileWatcher {
    private static watcher: vscode.FileSystemWatcher | null = null;
    private static debounceTimer: NodeJS.Timeout | null = null;
    private static readonly DEBOUNCE_MS = 5000;  // 5 seconds
    private static isRegenerating = false;

    /**
     * 👀 Start watching Plans/ folder
     * 
     * Debounces file changes and triggers PRD regeneration.
     * Ignores changes to PRD.md and PRD.json (prevent loops).
     * 
     * @param context - VS Code extension context
     * @param autoRegenerate - Enable auto-regeneration (default: true)
     * @param outputChannel - Output channel for logging
     */
    static startWatching(
        context: vscode.ExtensionContext,
        autoRegenerate: boolean = true,
        outputChannel?: vscode.OutputChannel
    ): void {
        if (!autoRegenerate) {
            outputChannel?.appendLine('ℹ️  Auto-regeneration disabled (coe.autoRegenerate = false)');
            return;
        }

        try {
            // Create watcher for Plans/ folder
            this.watcher = vscode.workspace.createFileSystemWatcher('**/Plans/**/*.md');

            // Watch for changes
            this.watcher.onDidChange((uri) => {
                this.handleChange('change', uri, outputChannel);
            }, null, context.subscriptions);

            this.watcher.onDidCreate((uri) => {
                this.handleChange('create', uri, outputChannel);
            }, null, context.subscriptions);

            this.watcher.onDidDelete((uri) => {
                this.handleChange('delete', uri, outputChannel);
            }, null, context.subscriptions);

            context.subscriptions.push(this.watcher);
            outputChannel?.appendLine('👀 Plans/ folder watcher started (auto-regenerate enabled)');
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            outputChannel?.appendLine(`⚠️  Failed to start Plans watcher: ${errMsg}`);
        }
    }

    /**
     * 🔄 Stop watching Plans/ folder
     */
    static stopWatching(): void {
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = null;
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }

    /**
     * 📝 Handle file change event
     * Debounces rapid changes and skips PRD file changes
     * 
     * @param changeType - Type of change (change, create, delete)
     * @param uri - File URI that changed
     * @param outputChannel - Output channel for logging
     */
    private static handleChange(
        changeType: 'change' | 'create' | 'delete',
        uri: vscode.Uri,
        outputChannel?: vscode.OutputChannel
    ): void {
        const fileName = uri.fsPath.split(/[\\/]/).pop() || '';

        // Ignore changes to PRD files (prevent loops)
        if (fileName.startsWith('PRD') && (fileName.endsWith('.md') || fileName.endsWith('.json'))) {
            return;
        }

        // Ignore backup files and ipynb
        if (fileName.endsWith('.backup') || fileName.endsWith('.ipynb')) {
            return;
        }

        outputChannel?.appendLine(`🔄 Plans/ change detected: ${changeType} ${fileName}`);

        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set new timer
        this.debounceTimer = setTimeout(() => {
            this.triggerRegeneration(outputChannel);
        }, this.DEBOUNCE_MS);
    }

    /**
     * 🚀 Trigger PRD regeneration
     * Calls PRDGenerator with status updates
     * 
     * @param outputChannel - Output channel for logging
     */
    private static async triggerRegeneration(outputChannel?: vscode.OutputChannel): Promise<void> {
        if (this.isRegenerating) {
            outputChannel?.appendLine('⏳ PRD regeneration already in progress...');
            return;
        }

        this.isRegenerating = true;

        try {
            outputChannel?.appendLine('');
            outputChannel?.appendLine('═══════════════════════════════════════════════════════════');
            outputChannel?.appendLine('🔄 Auto-Regenerating PRD from Plans/...');
            outputChannel?.appendLine('═══════════════════════════════════════════════════════════');

            const result = await PRDGenerator.generate(
                { tokenLimit: 4000, retryOnFailure: true },
                (status) => {
                    outputChannel?.appendLine(status);
                },
                outputChannel || undefined
            );

            if (result.success) {
                outputChannel?.appendLine('');
                outputChannel?.appendLine(`✅ PRD auto-regenerated successfully!`);
                if (result.mdPath) {
                    outputChannel?.appendLine(`📄 PRD.md: ${result.mdPath}`);
                }
                if (result.jsonPath) {
                    outputChannel?.appendLine(`📄 PRD.json: ${result.jsonPath}`);
                }
                if (result.duration) {
                    outputChannel?.appendLine(`⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
                }
                if (result.warning) {
                    outputChannel?.appendLine(`⚠️  ${result.warning}`);
                }

                // Show popup notification for auto-regeneration
                const openButton = 'Open PRD.md';
                vscode.window.showInformationMessage(
                    '✅ PRD auto-regenerated from Plans/ changes',
                    openButton
                ).then(selection => {
                    if (selection === openButton && result.mdUri) {
                        vscode.commands.executeCommand('vscode.open', result.mdUri);
                    }
                });
            } else {
                outputChannel?.appendLine(`❌ Auto-regeneration failed: ${result.message}`);
            }

            outputChannel?.appendLine('═══════════════════════════════════════════════════════════');
            outputChannel?.appendLine('');
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            outputChannel?.appendLine(`❌ Error during auto-regeneration: ${errMsg}`);
        } finally {
            this.isRegenerating = false;
        }
    }

    /**
     * 📊 Get watcher status
     * 
     * @returns Object with watcher status
     */
    static getStatus(): {
        isWatching: boolean;
        isRegenerating: boolean;
        debouncePending: boolean;
    } {
        return {
            isWatching: this.watcher !== null,
            isRegenerating: this.isRegenerating,
            debouncePending: this.debounceTimer !== null,
        };
    }
}

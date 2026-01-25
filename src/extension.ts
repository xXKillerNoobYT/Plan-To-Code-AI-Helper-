/**
 * Copilot Orchestration Extension (COE) - Main Entry Point
 * 
 * This file is the "brain" of the extension. It activates when VS Code starts
 * and sets up all the features like the MCP server, task management, and UI.
 */

import * as vscode from 'vscode';

/**
 * This function runs when the extension starts up.
 * Think of it as the "power on" button for COE.
 * 
 * @param context - VS Code provides this to help manage the extension's lifecycle
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 COE Activated');

    // Show a friendly message to the user
    vscode.window.showInformationMessage('Copilot Orchestration Extension is now active!');

    // Register the activation command
    // This creates a command that users can run from the Command Palette (Ctrl+Shift+P)
    const activateCommand = vscode.commands.registerCommand('coe.activate', () => {
        vscode.window.showInformationMessage('COE: Orchestration system ready!');
        console.log('COE: Manual activation triggered');
    });

    // Tell VS Code to clean up this command when the extension stops
    context.subscriptions.push(activateCommand);

    // TODO: Initialize MCP Server (backend - handles task coordination)
    // TODO: Initialize GitHub Integration (backend - syncs with GitHub Issues)
    // TODO: Initialize Task Queue (backend - manages work items)
    // TODO: Initialize UI Components (frontend - tree views, panels)

    console.log('COE: Extension setup complete');
}

/**
 * This function runs when the extension shuts down.
 * Think of it as the "power off" button - it cleans up resources.
 */
export function deactivate() {
    console.log('COE: Extension deactivated');
    // TODO: Shutdown MCP Server gracefully
    // TODO: Save any pending state
}

/**
 * MCP Server Integration Example
 * 
 * This file shows how to initialize the MCP server and register tools.
 * This would typically be called from extension.ts on activation.
 * 
 * Usage:
 * ```typescript
 * import { initializeMCPServer } from './mcpServer/integration';
 * 
 * export async function activate(context: vscode.ExtensionContext) {
 *     const mcpServer = await initializeMCPServer(context);
 *     // Server is now running and ready to handle requests
 * }
 * ```
 */

import * as vscode from 'vscode';
import { MCPServer } from './server';
import { getNextTask } from './tools/getNextTask';
import { getErrors } from './tools/getErrors';
import { reportTaskStatus } from './tools/reportTaskStatus';
import { askQuestion } from './tools/askQuestion';
import { reportTestFailure } from './tools/reportTestFailure';
import { reportObservation } from './tools/reportObservation';
import { reportVerificationResult } from './tools/reportVerificationResult';
import { TaskQueue } from '../tasks/queue';

/**
 * Initialize MCP Server with all tools registered
 */
export async function initializeMCPServer(
    context: vscode.ExtensionContext
): Promise<MCPServer> {
    // Create output channel for logging
    const logChannel = vscode.window.createOutputChannel('COE MCP Server');
    context.subscriptions.push(logChannel);

    // Initialize MCP server
    const server = new MCPServer({
        name: 'coe-orchestration',
        version: '1.0.0',
        enableLogging: true,
        logChannel,
    });

    // Initialize task queue (would typically be a singleton or from context)
    const taskQueue = new TaskQueue();

    // Register getNextTask tool
    server.registerTool('getNextTask', async (params) => {
        return await getNextTask(params, taskQueue);
    });

    // Register getErrors tool
    server.registerTool('getErrors', async (params) => {
        return await getErrors(params);
    });

    // Register reportTaskStatus tool
    server.registerTool('reportTaskStatus', async (params) => {
        return await reportTaskStatus(params, taskQueue);
    });

    // Register askQuestion tool
    server.registerTool('askQuestion', async (params) => {
        return await askQuestion(params);
    });

    // Register reportTestFailure tool
    server.registerTool('reportTestFailure', async (params) => {
        return await reportTestFailure(params, taskQueue);
    });

    // Register reportObservation tool
    server.registerTool('reportObservation', async (params) => {
        return await reportObservation(params, taskQueue);
    });

    // Register reportVerificationResult tool
    server.registerTool('reportVerificationResult', async (params) => {
        return await reportVerificationResult(params, taskQueue);
    });

    // All P1 MCP tools registered! 🎉

    // Start the server
    await server.start();

    logChannel.appendLine('MCP Server initialized successfully');
    logChannel.appendLine(`Registered tools: ${server.getRegisteredTools().join(', ')}`);

    // Add server to disposables for cleanup on deactivation
    context.subscriptions.push({
        dispose: async () => {
            await server.stop();
        },
    });

    return server;
}

/**
 * Example: Process a raw JSON-RPC message
 * This shows how an agent would communicate with the server
 */
export async function exampleUsage(): Promise<void> {
    const server = new MCPServer({
        name: 'example',
        version: '1.0.0',
        enableLogging: true,
    });

    const taskQueue = new TaskQueue();

    // Register tool
    server.registerTool('getNextTask', async (params) => {
        return await getNextTask(params, taskQueue);
    });

    server.registerTool('getErrors', async (params) => {
        return await getErrors(params);
    });

    await server.start();

    // Example request (from AI agent)
    const requestMessage = JSON.stringify({
        jsonrpc: '2.0',
        method: 'getNextTask',
        params: {
            filter: 'ready',
            priority: 'high',
        },
        id: 1,
    });

    // Process request
    const responseMessage = await server.processMessage(requestMessage);


    // Parse response
    const response = JSON.parse(responseMessage.trim());
    if (response.result) {
        // eslint-disable-next-line no-empty
    }

    await server.stop();
}



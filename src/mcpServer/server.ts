/**
 * MCP Server Implementation
 * Handles Model Context Protocol communication with AI agents
 * 
 * This is the "waiter" service that:
 * - Receives task requests from AI agents via JSON-RPC 2.0
 * - Routes requests to appropriate tool handlers
 * - Returns task data from the queue
 * - Reports task completion and status updates
 * - Handles Q&A for context
 * 
 * Architecture:
 * - Uses JSON-RPC 2.0 protocol for communication
 * - Routes tool calls to registered handlers
 * - Manages server lifecycle (start/stop/error handling)
 * 
 * References:
 * - Plans/COE-Master-Plan/05-MCP-API-Reference.md (Tool specifications)
 * - Plans/COE-Master-Plan/01-Architecture-Document.md (System design)
 */

import * as vscode from 'vscode';
import {
    MCPRequest,
    MCPResponse,
    MCPErrorCode,
    MCPProtocolError,
    validateRequest,
    createSuccessResponse,
    createErrorResponse,
    errorToResponse,
    parseStdioMessage,
    formatStdioResponse,
} from './protocol';

/**
 * Type for MCP tool handler functions
 */
export type MCPToolHandler = (params: Record<string, unknown>) => Promise<unknown>;

/**
 * Server configuration options
 */
export interface MCPServerConfig {
    name: string;
    version: string;
    enableLogging?: boolean;
    logChannel?: vscode.OutputChannel;
}

/**
 * MCP Server - Main orchestration server for AI agent communication
 */
export class MCPServer {
    private isRunning: boolean = false;
    private toolHandlers: Map<string, MCPToolHandler> = new Map();
    private config: MCPServerConfig;
    private logChannel?: vscode.OutputChannel;

    constructor(config: MCPServerConfig) {
        this.config = config;
        this.logChannel = config.logChannel;

        this.log(`MCP Server initialized: ${config.name} v${config.version}`);
    }

    // ========================================================================
    // Server Lifecycle Management
    // ========================================================================

    /**
     * Start the MCP server and register default tools
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            this.log('Server already running, ignoring start request', 'warn');
            return;
        }

        this.log('MCP Server: Starting...');
        this.isRunning = true;

        // Server is now ready to accept tool registrations
        // Note: Tools are registered externally via registerTool()

        this.log(`MCP Server: Started successfully (${this.toolHandlers.size} tools registered)`);
    }

    /**
     * Stop the MCP server gracefully
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            this.log('Server not running, ignoring stop request', 'warn');
            return;
        }

        this.log('MCP Server: Stopping...');
        this.isRunning = false;

        // Clear tool handlers
        const toolCount = this.toolHandlers.size;
        this.toolHandlers.clear();

        this.log(`MCP Server: Stopped (cleared ${toolCount} tool handlers)`);
    }

    /**
     * Restart the server
     */
    async restart(): Promise<void> {
        this.log('MCP Server: Restarting...');
        await this.stop();
        await this.start();
        this.log('MCP Server: Restart complete');
    }

    /**
     * Check if server is running
     */
    isServerRunning(): boolean {
        return this.isRunning;
    }

    // ========================================================================
    // Tool Registration
    // ========================================================================

    /**
     * Register a new MCP tool handler
     * @param method - Tool method name (e.g., 'getNextTask')
     * @param handler - Async function to handle tool calls
     */
    registerTool(method: string, handler: MCPToolHandler): void {
        if (this.toolHandlers.has(method)) {
            this.log(`Warning: Overwriting existing handler for method '${method}'`, 'warn');
        }

        this.toolHandlers.set(method, handler);
        this.log(`Registered tool: ${method}`);
    }

    /**
     * Unregister a tool handler
     */
    unregisterTool(method: string): boolean {
        const result = this.toolHandlers.delete(method);
        if (result) {
            this.log(`Unregistered tool: ${method}`);
        }
        return result;
    }

    /**
     * Get list of registered tool methods
     */
    getRegisteredTools(): string[] {
        return Array.from(this.toolHandlers.keys());
    }

    // ========================================================================
    // Request Handling
    // ========================================================================

    /**
     * Handle an incoming MCP request
     * @param request - Validated MCP request
     * @returns MCP response
     */
    async handleRequest(request: MCPRequest): Promise<MCPResponse> {
        this.log(`Handling request: ${request.method} (id: ${request.id})`);

        if (!this.isRunning) {
            return createErrorResponse(
                MCPErrorCode.TASK_QUEUE_UNAVAILABLE,
                'MCP Server is not running',
                request.id
            );
        }

        // Check if tool handler exists
        const handler = this.toolHandlers.get(request.method);
        if (!handler) {
            this.log(`Method not found: ${request.method}`, 'error');
            return createErrorResponse(
                MCPErrorCode.METHOD_NOT_FOUND,
                `Method '${request.method}' not found`,
                request.id,
                { availableMethods: this.getRegisteredTools() }
            );
        }

        // Execute tool handler
        try {
            const params = request.params || {};
            const result = await handler(params);

            this.log(`Request ${request.id} completed successfully`);
            return createSuccessResponse(result, request.id);
        } catch (error) {
            this.log(`Request ${request.id} failed: ${error}`, 'error');

            if (error instanceof MCPProtocolError) {
                return errorToResponse(error, request.id);
            }

            // Wrap unknown errors
            return createErrorResponse(
                MCPErrorCode.INTERNAL_ERROR,
                error instanceof Error ? error.message : 'Unknown error occurred',
                request.id,
                { originalError: String(error) }
            );
        }
    }

    /**
     * Process a raw JSON-RPC message (from stdio or other transport)
     * @param rawMessage - Raw JSON string
     * @returns Formatted JSON-RPC response string
     */
    async processMessage(rawMessage: string): Promise<string> {
        try {
            // Parse and validate request
            const request = parseStdioMessage(rawMessage);

            // Handle request
            const response = await this.handleRequest(request);

            // Format response for stdio
            return formatStdioResponse(response);
        } catch (error) {
            // Handle parse errors (invalid JSON-RPC format)
            if (error instanceof MCPProtocolError) {
                const errorResponse = createErrorResponse(
                    error.code,
                    error.message,
                    'unknown', // No request ID available for parse errors
                    error.data
                );
                return formatStdioResponse(errorResponse);
            }

            // Unexpected error
            const errorResponse = createErrorResponse(
                MCPErrorCode.INTERNAL_ERROR,
                'Failed to process message',
                'unknown'
            );
            return formatStdioResponse(errorResponse);
        }
    }

    // ========================================================================
    // Logging
    // ========================================================================

    /**
     * Internal logging function
     */
    private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        if (!this.config.enableLogging && level !== 'error') {
            return;
        }

        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [MCP Server] ${message}`;

        if (this.logChannel) {
            this.logChannel.appendLine(logMessage);
        } else {
            // eslint-disable-next-line no-empty
        }
    }

    // ========================================================================
    // Server Diagnostics
    // ========================================================================

    /**
     * Get server diagnostic information
     */
    getDiagnostics(): {
        isRunning: boolean;
        toolsRegistered: number;
        tools: string[];
        config: MCPServerConfig;
    } {
        return {
            isRunning: this.isRunning,
            toolsRegistered: this.toolHandlers.size,
            tools: this.getRegisteredTools(),
            config: {
                name: this.config.name,
                version: this.config.version,
                enableLogging: this.config.enableLogging,
            },
        };
    }
}



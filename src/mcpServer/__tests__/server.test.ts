/**
 * MCP Server Tests
 * Integration tests for server lifecycle and request routing
 */

import { MCPServer, MCPServerConfig, MCPToolHandler } from '../server';
import { MCPErrorCode } from '../protocol';

describe('MCP Server', () => {
    let server: MCPServer;
    const config: MCPServerConfig = {
        name: 'test-server',
        version: '1.0.0',
        enableLogging: false,
    };

    beforeEach(() => {
        server = new MCPServer(config);
    });

    afterEach(async () => {
        if (server.isServerRunning()) {
            await server.stop();
        }
    });

    describe('Server Lifecycle', () => {
        it('should start server successfully', async () => {
            expect(server.isServerRunning()).toBe(false);

            await server.start();

            expect(server.isServerRunning()).toBe(true);
        });

        it('should stop server successfully', async () => {
            await server.start();
            expect(server.isServerRunning()).toBe(true);

            await server.stop();

            expect(server.isServerRunning()).toBe(false);
        });

        it('should handle multiple start calls gracefully', async () => {
            await server.start();
            await server.start(); // Should not throw

            expect(server.isServerRunning()).toBe(true);
        });

        it('should handle multiple stop calls gracefully', async () => {
            await server.start();
            await server.stop();
            await server.stop(); // Should not throw

            expect(server.isServerRunning()).toBe(false);
        });

        it('should restart server', async () => {
            await server.start();
            const mockHandler: MCPToolHandler = async () => ({ success: true });
            server.registerTool('test', mockHandler);

            await server.restart();

            expect(server.isServerRunning()).toBe(true);
            // Tools should be cleared on restart
            expect(server.getRegisteredTools().length).toBe(0);
        });
    });

    describe('Tool Registration', () => {
        it('should register a tool handler', () => {
            const mockHandler: MCPToolHandler = async (params) => {
                return { result: 'test' };
            };

            server.registerTool('testMethod', mockHandler);

            const tools = server.getRegisteredTools();
            expect(tools).toContain('testMethod');
            expect(tools.length).toBe(1);
        });

        it('should register multiple tools', () => {
            const handler1: MCPToolHandler = async () => ({ result: 1 });
            const handler2: MCPToolHandler = async () => ({ result: 2 });

            server.registerTool('tool1', handler1);
            server.registerTool('tool2', handler2);

            const tools = server.getRegisteredTools();
            expect(tools).toContain('tool1');
            expect(tools).toContain('tool2');
            expect(tools.length).toBe(2);
        });

        it('should unregister a tool', () => {
            const mockHandler: MCPToolHandler = async () => ({ result: 'test' });
            server.registerTool('testMethod', mockHandler);

            const result = server.unregisterTool('testMethod');

            expect(result).toBe(true);
            expect(server.getRegisteredTools()).not.toContain('testMethod');
        });

        it('should return false when unregistering non-existent tool', () => {
            const result = server.unregisterTool('nonExistent');

            expect(result).toBe(false);
        });

        it('should overwrite existing handler when registering same method', () => {
            const handler1: MCPToolHandler = async () => ({ value: 1 });
            const handler2: MCPToolHandler = async () => ({ value: 2 });

            server.registerTool('test', handler1);
            server.registerTool('test', handler2);

            expect(server.getRegisteredTools().length).toBe(1);
        });
    });

    describe('Request Handling', () => {
        beforeEach(async () => {
            await server.start();
        });

        it('should handle valid request and call tool handler', async () => {
            const mockHandler: MCPToolHandler = async (params) => {
                return { success: true, data: params };
            };
            server.registerTool('getNextTask', mockHandler);

            const request = {
                jsonrpc: '2.0' as const,
                method: 'getNextTask',
                params: { filter: 'ready' },
                id: 1,
            };

            const response = await server.handleRequest(request);

            expect(response.jsonrpc).toBe('2.0');
            expect(response.id).toBe(1);
            expect(response.result).toEqual({
                success: true,
                data: { filter: 'ready' },
            });
            expect(response.error).toBeUndefined();
        });

        it('should return error for non-existent method', async () => {
            const request = {
                jsonrpc: '2.0' as const,
                method: 'unknownMethod',
                id: 1,
            };

            const response = await server.handleRequest(request);

            expect(response.error?.code).toBe(MCPErrorCode.METHOD_NOT_FOUND);
            expect(response.error?.message).toContain('unknownMethod');
            expect(response.error?.data).toHaveProperty('availableMethods');
        });

        it('should handle request without params', async () => {
            const mockHandler: MCPToolHandler = async (params) => {
                expect(params).toEqual({});
                return { success: true };
            };
            server.registerTool('test', mockHandler);

            const request = {
                jsonrpc: '2.0' as const,
                method: 'test',
                id: 1,
            };

            const response = await server.handleRequest(request);

            expect(response.result).toEqual({ success: true });
        });

        it('should handle handler errors gracefully', async () => {
            const mockHandler: MCPToolHandler = async () => {
                throw new Error('Handler failed');
            };
            server.registerTool('failingTool', mockHandler);

            const request = {
                jsonrpc: '2.0' as const,
                method: 'failingTool',
                id: 1,
            };

            const response = await server.handleRequest(request);

            expect(response.error?.code).toBe(MCPErrorCode.INTERNAL_ERROR);
            expect(response.error?.message).toBe('Handler failed');
        });

        it('should return error when server is not running', async () => {
            await server.stop();

            const request = {
                jsonrpc: '2.0' as const,
                method: 'test',
                id: 1,
            };

            const response = await server.handleRequest(request);

            expect(response.error?.code).toBe(MCPErrorCode.TASK_QUEUE_UNAVAILABLE);
            expect(response.error?.message).toContain('not running');
        });

        it('should handle async tool handlers', async () => {
            const mockHandler: MCPToolHandler = async (params) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return { delayed: true };
            };
            server.registerTool('asyncTool', mockHandler);

            const request = {
                jsonrpc: '2.0' as const,
                method: 'asyncTool',
                id: 1,
            };

            const response = await server.handleRequest(request);

            expect(response.result).toEqual({ delayed: true });
        });
    });

    describe('Message Processing', () => {
        beforeEach(async () => {
            await server.start();
        });

        it('should process valid stdio message', async () => {
            const mockHandler: MCPToolHandler = async () => {
                return { success: true };
            };
            server.registerTool('test', mockHandler);

            const rawMessage = JSON.stringify({
                jsonrpc: '2.0',
                method: 'test',
                id: 1,
            });

            const responseStr = await server.processMessage(rawMessage);

            expect(responseStr.endsWith('\n')).toBe(true);
            const response = JSON.parse(responseStr.trim());
            expect(response.result).toEqual({ success: true });
        });

        it('should handle invalid JSON in message', async () => {
            const invalidJson = '{ invalid json }';

            const responseStr = await server.processMessage(invalidJson);

            const response = JSON.parse(responseStr.trim());
            expect(response.error?.code).toBe(MCPErrorCode.PARSE_ERROR);
        });

        it('should handle invalid JSON-RPC structure', async () => {
            const invalidRequest = JSON.stringify({
                jsonrpc: '1.0', // Wrong version
                method: 'test',
            });

            const responseStr = await server.processMessage(invalidRequest);

            const response = JSON.parse(responseStr.trim());
            expect(response.error?.code).toBe(MCPErrorCode.INVALID_REQUEST);
        });
    });

    describe('Server Diagnostics', () => {
        it('should return accurate diagnostics', async () => {
            const mockHandler: MCPToolHandler = async () => ({ success: true });
            server.registerTool('tool1', mockHandler);
            server.registerTool('tool2', mockHandler);
            await server.start();

            const diagnostics = server.getDiagnostics();

            expect(diagnostics.isRunning).toBe(true);
            expect(diagnostics.toolsRegistered).toBe(2);
            expect(diagnostics.tools).toEqual(['tool1', 'tool2']);
            expect(diagnostics.config.name).toBe('test-server');
            expect(diagnostics.config.version).toBe('1.0.0');
        });

        it('should show not running in diagnostics when stopped', () => {
            const diagnostics = server.getDiagnostics();

            expect(diagnostics.isRunning).toBe(false);
            expect(diagnostics.toolsRegistered).toBe(0);
        });
    });
});

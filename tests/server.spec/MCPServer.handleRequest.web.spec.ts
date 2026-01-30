// ./server.web.spec.ts
import { MCPServer } from '../../src/mcpServer/server.ts';
import { createErrorResponse, createSuccessResponse, MCPErrorCode, MCPProtocolError, errorToResponse } from '../../src/mcpServer/protocol';

/** @aiContributed-2026-01-29 */
describe('MCPServer.handleRequest', () => {
    let server: MCPServer;
    let mockHandler: jest.Mock;

    beforeEach(() => {
        server = new MCPServer({
            name: 'test-mcp-server',
            version: '1.0.0',
            enableLogging: false,
        });
        mockHandler = jest.fn();
        server['isRunning'] = true; // Access private property for testing
        server['toolHandlers'] = new Map();
    });

    /** @aiContributed-2026-01-29 */
    it('should return error response if server is not running', async () => {
        server['isRunning'] = false;
        const request = { jsonrpc: '2.0' as const, id: 1, method: 'testMethod', params: {} };

        const response = await server.handleRequest(request);

        expect(response).toEqual(
            createErrorResponse(
                MCPErrorCode.TASK_QUEUE_UNAVAILABLE,
                'MCP Server is not running',
                request.id
            )
        );
    });

    /** @aiContributed-2026-01-29 */
    it('should return error response if method is not found', async () => {
        const request = { jsonrpc: '2.0' as const, id: 1, method: 'unknownMethod', params: {} };

        const response = await server.handleRequest(request);

        expect(response).toEqual(
            createErrorResponse(
                MCPErrorCode.METHOD_NOT_FOUND,
                `Method '${request.method}' not found`,
                request.id,
                { availableMethods: [] }
            )
        );
    });

    /** @aiContributed-2026-01-29 */
    it('should execute the handler and return success response', async () => {
        const request = { jsonrpc: '2.0' as const, id: 1, method: 'testMethod', params: { key: 'value' } };
        const handlerResult = { success: true };
        mockHandler.mockResolvedValue(handlerResult);
        server['toolHandlers'].set('testMethod', mockHandler);

        const response = await server.handleRequest(request);

        expect(mockHandler).toHaveBeenCalledWith(request.params);
        expect(response).toEqual(createSuccessResponse(handlerResult, request.id));
    });

    /** @aiContributed-2026-01-29 */
    it('should return error response for MCPProtocolError', async () => {
        const request = { jsonrpc: '2.0' as const, id: 1, method: 'testMethod', params: {} };
        const protocolError = new MCPProtocolError(MCPErrorCode.INVALID_PARAMS, 'Invalid parameters');
        mockHandler.mockRejectedValue(protocolError);
        server['toolHandlers'].set('testMethod', mockHandler);

        const response = await server.handleRequest(request);

        expect(response).toEqual(errorToResponse(protocolError, request.id));
    });

    /** @aiContributed-2026-01-29 */
    it('should return error response for unknown errors', async () => {
        const request = { jsonrpc: '2.0' as const, id: 1, method: 'testMethod', params: {} };
        const unknownError = new Error('Unknown error');
        mockHandler.mockRejectedValue(unknownError);
        server['toolHandlers'].set('testMethod', mockHandler);

        const response = await server.handleRequest(request);

        expect(response).toEqual(
            createErrorResponse(
                MCPErrorCode.INTERNAL_ERROR,
                unknownError.message,
                request.id,
                { originalError: String(unknownError) }
            )
        );
    });
});
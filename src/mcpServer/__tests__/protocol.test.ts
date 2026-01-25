/**
 * MCP Protocol Tests
 * Validates JSON-RPC 2.0 protocol implementation
 */

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
} from '../protocol';

describe('MCP Protocol', () => {
    describe('validateRequest', () => {
        it('should validate a valid JSON-RPC 2.0 request', () => {
            const validRequest = {
                jsonrpc: '2.0',
                method: 'getNextTask',
                params: { filter: 'ready' },
                id: 1,
            };

            const result = validateRequest(validRequest);

            expect(result).toEqual(validRequest);
            expect(result.jsonrpc).toBe('2.0');
            expect(result.method).toBe('getNextTask');
        });

        it('should validate request with string id', () => {
            const validRequest = {
                jsonrpc: '2.0',
                method: 'askQuestion',
                id: 'req-123',
            };

            const result = validateRequest(validRequest);
            expect(result.id).toBe('req-123');
        });

        it('should accept request without params', () => {
            const validRequest = {
                jsonrpc: '2.0',
                method: 'getNextTask',
                id: 1,
            };

            const result = validateRequest(validRequest);
            expect(result.params).toBeUndefined();
        });

        it('should throw MCPProtocolError for invalid jsonrpc version', () => {
            const invalidRequest = {
                jsonrpc: '1.0', // Wrong version
                method: 'test',
                id: 1,
            };

            expect(() => validateRequest(invalidRequest))
                .toThrow(MCPProtocolError);
        });

        it('should throw MCPProtocolError for missing method', () => {
            const invalidRequest = {
                jsonrpc: '2.0',
                id: 1,
            };

            expect(() => validateRequest(invalidRequest))
                .toThrow(MCPProtocolError);
        });

        it('should throw MCPProtocolError for missing id', () => {
            const invalidRequest = {
                jsonrpc: '2.0',
                method: 'test',
            };

            expect(() => validateRequest(invalidRequest))
                .toThrow(MCPProtocolError);
        });

        it('should include Zod error details in thrown error', () => {
            const invalidRequest = {
                jsonrpc: '2.0',
                method: '',  // Empty method
                id: 1,
            };

            try {
                validateRequest(invalidRequest);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(MCPProtocolError);
                const mcpError = error as MCPProtocolError;
                expect(mcpError.code).toBe(MCPErrorCode.INVALID_REQUEST);
                expect(mcpError.data).toHaveProperty('zodErrors');
            }
        });
    });

    describe('createSuccessResponse', () => {
        it('should create valid success response with result', () => {
            const result = { task: { id: '123', title: 'Test Task' } };
            const response = createSuccessResponse(result, 1);

            expect(response).toEqual({
                jsonrpc: '2.0',
                result,
                id: 1,
            });
        });

        it('should create success response with string id', () => {
            const response = createSuccessResponse({ success: true }, 'abc-123');

            expect(response.id).toBe('abc-123');
            expect(response.jsonrpc).toBe('2.0');
        });

        it('should handle null result', () => {
            const response = createSuccessResponse(null, 1);

            expect(response.result).toBeNull();
        });
    });

    describe('createErrorResponse', () => {
        it('should create valid error response', () => {
            const response = createErrorResponse(
                MCPErrorCode.METHOD_NOT_FOUND,
                'Method not found',
                1
            );

            expect(response).toEqual({
                jsonrpc: '2.0',
                error: {
                    code: -32601,
                    message: 'Method not found',
                },
                id: 1,
            });
        });

        it('should include optional error data', () => {
            const errorData = { details: 'Invalid filter value' };
            const response = createErrorResponse(
                MCPErrorCode.INVALID_FILTER,
                'Invalid filter',
                1,
                errorData
            );

            expect(response.error?.data).toEqual(errorData);
        });

        it('should handle custom MCP error codes', () => {
            const response = createErrorResponse(
                MCPErrorCode.TASK_NOT_FOUND,
                'Task TASK-001 not found',
                'req-456'
            );

            expect(response.error?.code).toBe(404);
        });
    });

    describe('errorToResponse', () => {
        it('should convert MCPProtocolError to error response', () => {
            const error = new MCPProtocolError(
                MCPErrorCode.INVALID_PARAMS,
                'Invalid parameters',
                { field: 'priority' }
            );

            const response = errorToResponse(error, 1);

            expect(response.error).toEqual({
                code: -32602,
                message: 'Invalid parameters',
                data: { field: 'priority' },
            });
        });

        it('should convert generic Error to internal error response', () => {
            const error = new Error('Unexpected error');

            const response = errorToResponse(error, 1);

            expect(response.error?.code).toBe(MCPErrorCode.INTERNAL_ERROR);
            expect(response.error?.message).toBe('Unexpected error');
        });

        it('should handle errors without message', () => {
            const error = new Error();

            const response = errorToResponse(error, 1);

            expect(response.error?.message).toBe('Internal server error');
        });
    });

    describe('parseStdioMessage', () => {
        it('should parse valid newline-delimited JSON', () => {
            const rawMessage = JSON.stringify({
                jsonrpc: '2.0',
                method: 'getNextTask',
                params: { filter: 'ready' },
                id: 1,
            });

            const request = parseStdioMessage(rawMessage);

            expect(request.method).toBe('getNextTask');
            expect(request.params).toEqual({ filter: 'ready' });
        });

        it('should throw PARSE_ERROR for invalid JSON', () => {
            const invalidJson = '{"jsonrpc": "2.0", invalid json}';

            expect(() => parseStdioMessage(invalidJson))
                .toThrow(MCPProtocolError);

            try {
                parseStdioMessage(invalidJson);
            } catch (error) {
                expect((error as MCPProtocolError).code).toBe(MCPErrorCode.PARSE_ERROR);
            }
        });

        it('should validate parsed JSON structure', () => {
            const invalidRequest = JSON.stringify({
                jsonrpc: '1.0',
                method: 'test',
            });

            expect(() => parseStdioMessage(invalidRequest))
                .toThrow(MCPProtocolError);
        });
    });

    describe('formatStdioResponse', () => {
        it('should format response with newline terminator', () => {
            const response: MCPResponse = {
                jsonrpc: '2.0',
                result: { success: true },
                id: 1,
            };

            const formatted = formatStdioResponse(response);

            expect(formatted).toBe(JSON.stringify(response) + '\n');
            expect(formatted.endsWith('\n')).toBe(true);
        });

        it('should format error response correctly', () => {
            const response: MCPResponse = {
                jsonrpc: '2.0',
                error: {
                    code: -32601,
                    message: 'Method not found',
                },
                id: 1,
            };

            const formatted = formatStdioResponse(response);
            const parsed = JSON.parse(formatted.trim());

            expect(parsed.error.code).toBe(-32601);
        });
    });

    describe('MCPProtocolError', () => {
        it('should create error with code, message, and data', () => {
            const error = new MCPProtocolError(
                MCPErrorCode.TASK_NOT_FOUND,
                'Task not found',
                { taskId: 'TASK-001' }
            );

            expect(error.code).toBe(404);
            expect(error.message).toBe('Task not found');
            expect(error.data).toEqual({ taskId: 'TASK-001' });
            expect(error.name).toBe('MCPProtocolError');
        });

        it('should be instance of Error', () => {
            const error = new MCPProtocolError(
                MCPErrorCode.INTERNAL_ERROR,
                'Test error'
            );

            expect(error).toBeInstanceOf(Error);
        });
    });
});

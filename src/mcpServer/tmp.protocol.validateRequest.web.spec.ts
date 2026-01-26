// ./protocol.validateRequest.gptgen.web.spec.ts
import { validateRequest, MCPProtocolError, MCPErrorCode, MCPRequestSchema } from './protocol';
import { z } from 'zod';

describe('validateRequest', () => {
    it('should validate and return a valid MCPRequest', () => {
        const validRequest = {
            jsonrpc: '2.0',
            method: 'testMethod',
            params: { key: 'value' },
            id: 1,
        };

        const result = validateRequest(validRequest);

        expect(result).toEqual(validRequest);
    });

    it('should throw MCPProtocolError for invalid request', () => {
        const invalidRequest = {
            jsonrpc: '2.0',
            method: '',
            id: 1,
        };

        try {
            validateRequest(invalidRequest);
        } catch (error) {
            if (error instanceof MCPProtocolError) {
                expect(error.code).toBe(MCPErrorCode.INVALID_REQUEST);
                expect(error.message).toContain('Invalid JSON-RPC request');
            } else {
                throw error;
            }
        }
    });

});
// ./protocol.web.spec.ts
import { createErrorResponse, MCPErrorCode } from '../../src/mcpServer/protocol';

/** @aiContributed-2026-01-28 */
describe('createErrorResponse', () => {
    /** @aiContributed-2026-01-28 */
    it('should create a valid error response with all fields', () => {
        const code = MCPErrorCode.INVALID_REQUEST;
        const message = 'Invalid request';
        const id = '123';
        const data = { details: 'Missing required fields' };

        const response = createErrorResponse(code, message, id, data);

        expect(response).toEqual({
            jsonrpc: '2.0',
            error: { code, message, data },
            id,
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should create a valid error response without optional data', () => {
        const code = MCPErrorCode.METHOD_NOT_FOUND;
        const message = 'Method not found';
        const id = 456;

        const response = createErrorResponse(code, message, id);

        expect(response).toEqual({
            jsonrpc: '2.0',
            error: { code, message },
            id,
        });
    });
});
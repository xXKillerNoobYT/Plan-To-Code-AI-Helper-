// ./protocol.web.spec.ts
import { errorToResponse, MCPProtocolError, MCPErrorCode } from '../../src/mcpServer/protocol';

/** @aiContributed-2026-01-28 */
describe('errorToResponse', () => {
    /** @aiContributed-2026-01-28 */
    it('should convert MCPProtocolError to an error response', () => {
        const error = new MCPProtocolError(MCPErrorCode.INVALID_REQUEST, 'Invalid request', { detail: 'Missing method' });
        const id = 1;

        const response = errorToResponse(error, id);

        expect(response).toEqual({
            jsonrpc: '2.0',
            error: {
                code: MCPErrorCode.INVALID_REQUEST,
                message: 'Invalid request',
                data: { detail: 'Missing method' },
            },
            id,
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should convert a generic Error to an internal error response', () => {
        const error = new Error('Something went wrong');
        const id = 'abc';

        const response = errorToResponse(error, id);

        expect(response).toEqual({
            jsonrpc: '2.0',
            error: {
                code: MCPErrorCode.INTERNAL_ERROR,
                message: 'Something went wrong',
                data: undefined,
            },
            id,
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should handle an Error with an empty message', () => {
        const error = new Error('');
        const id = 42;

        const response = errorToResponse(error, id);

        expect(response).toEqual({
            jsonrpc: '2.0',
            error: {
                code: MCPErrorCode.INTERNAL_ERROR,
                message: 'Internal server error',
                data: undefined,
            },
            id,
        });
    });
});
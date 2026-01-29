// ./protocol.web.spec.ts
import { createSuccessResponse } from '../../src/mcpServer/protocol';
import { describe, it, expect } from '@jest/globals';

/** @aiContributed-2026-01-28 */
describe('createSuccessResponse', () => {
    /** @aiContributed-2026-01-28 */
    it('should create a valid JSON-RPC 2.0 success response', () => {
        const result = { key: 'value' };
        const id = 1;

        const response = createSuccessResponse(result, id);

        expect(response).toEqual({
            jsonrpc: '2.0',
            result,
            id,
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should handle string IDs correctly', () => {
        const result = 'success';
        const id = 'abc123';

        const response = createSuccessResponse(result, id);

        expect(response).toEqual({
            jsonrpc: '2.0',
            result,
            id,
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should handle undefined result', () => {
        const result = undefined;
        const id = 42;

        const response = createSuccessResponse(result, id);

        expect(response).toEqual({
            jsonrpc: '2.0',
            result,
            id,
        });
    });
});
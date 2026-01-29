// ./protocol.web.spec.ts
import { formatStdioResponse } from '../../src/mcpServer/protocol';
import { MCPResponse } from '../../src/mcpServer/protocol';

/** @aiContributed-2026-01-28 */
describe('formatStdioResponse', () => {
    /** @aiContributed-2026-01-28 */
    it('should format a valid MCPResponse object as a newline-delimited JSON string', () => {
        const response: MCPResponse = {
            jsonrpc: '2.0',
            result: { success: true },
            id: 1,
        };

        const formattedResponse = formatStdioResponse(response);

        expect(formattedResponse).toBe(JSON.stringify(response) + '\n');
    });

    /** @aiContributed-2026-01-28 */
    it('should handle an MCPResponse object with an error field correctly', () => {
        const response: MCPResponse = {
            jsonrpc: '2.0',
            error: {
                code: -32601,
                message: 'Method not found',
            },
            id: 'abc123',
        };

        const formattedResponse = formatStdioResponse(response);

        expect(formattedResponse).toBe(JSON.stringify(response) + '\n');
    });

    /** @aiContributed-2026-01-28 */
    it('should handle an MCPResponse object with optional fields omitted', () => {
        const response: MCPResponse = {
            jsonrpc: '2.0',
            id: 42,
        };

        const formattedResponse = formatStdioResponse(response);

        expect(formattedResponse).toBe(JSON.stringify(response) + '\n');
    });
});
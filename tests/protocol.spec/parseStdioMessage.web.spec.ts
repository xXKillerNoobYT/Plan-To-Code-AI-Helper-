// ./protocol.web.spec.ts
import { parseStdioMessage } from '../../src/mcpServer/protocol';
import { MCPProtocolError, MCPErrorCode } from '../../src/mcpServer/protocol';

/** @aiContributed-2026-01-28 */
describe('parseStdioMessage', () => {
    /** @aiContributed-2026-01-28 */
    it('should parse a valid JSON-RPC 2.0 request', () => {
        const rawMessage = JSON.stringify({
            jsonrpc: '2.0',
            method: 'testMethod',
            params: { key: 'value' },
            id: 1,
        });

        const result = parseStdioMessage(rawMessage);

        expect(result).toEqual({
            jsonrpc: '2.0',
            method: 'testMethod',
            params: { key: 'value' },
            id: 1,
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should throw MCPProtocolError for invalid JSON', () => {
        const rawMessage = '{ invalid json }';

        expect(() => parseStdioMessage(rawMessage)).toThrowError(
            new MCPProtocolError(MCPErrorCode.PARSE_ERROR, 'Invalid JSON in request')
        );
    });

    /** @aiContributed-2026-01-28 */
    it('should throw MCPProtocolError for invalid JSON-RPC request structure', () => {
        const rawMessage = JSON.stringify({
            jsonrpc: '2.0',
            method: '',
            id: 1,
        });

        expect(() => parseStdioMessage(rawMessage)).toThrowError(MCPProtocolError);
    });
});
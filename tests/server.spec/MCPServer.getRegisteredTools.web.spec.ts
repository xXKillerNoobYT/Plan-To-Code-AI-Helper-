// ./server.web.spec.ts
import { MCPServer } from '../../src/mcpServer/server.ts';

/** @aiContributed-2026-01-29 */
describe('MCPServer - getRegisteredTools', () => {
    let server: MCPServer;

    beforeEach(() => {
        server = new MCPServer({
            name: 'test-mcp-server',
            version: '1.0.0',
            enableLogging: false,
        });
    });

    /** @aiContributed-2026-01-29 */
    it('should return an empty array when no tools are registered', () => {
        const tools = server.getRegisteredTools();
        expect(tools).toEqual([]);
    });

    /** @aiContributed-2026-01-29 */
    it('should return an array of registered tool names', () => {
        server.registerTool('tool1', jest.fn());
        server.registerTool('tool2', jest.fn());

        const tools = server.getRegisteredTools();
        expect(tools).toEqual(['tool1', 'tool2']);
    });

    /** @aiContributed-2026-01-29 */
    it('should not include unregistered tools in the returned array', () => {
        server.registerTool('tool1', jest.fn());
        server.registerTool('tool2', jest.fn());
        server.unregisterTool('tool1');

        const tools = server.getRegisteredTools();
        expect(tools).toEqual(['tool2']);
    });
});
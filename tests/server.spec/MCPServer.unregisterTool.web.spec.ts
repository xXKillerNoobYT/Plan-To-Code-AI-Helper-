// ./server.web.spec.ts
import { MCPServer } from '../../src/mcpServer/server.ts';

/** @aiContributed-2026-01-29 */
describe('MCPServer.unregisterTool', () => {
    let server: MCPServer;

    beforeEach(() => {
        server = new MCPServer({
            name: 'test-mcp-server',
            version: '1.0.0',
            enableLogging: false,
        });
    });

    /** @aiContributed-2026-01-29 */
    it('should unregister a tool and return true if the tool exists', () => {
        const method = 'testMethod';
        const handler = jest.fn();
        server.registerTool(method, handler);

        const result = (server as any).unregisterTool(method);

        expect(result).toBe(true);
        expect(server.getRegisteredTools()).not.toContain(method);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false if the tool does not exist', () => {
        const result = (server as any).unregisterTool('nonExistentMethod');

        expect(result).toBe(false);
    });
});
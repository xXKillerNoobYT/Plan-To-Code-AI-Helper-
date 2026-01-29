// ./server.web.spec.ts
import { MCPServer } from '../../src/mcpServer/server';

/** @aiContributed-2026-01-28 */
describe('MCPServer - getDiagnostics', () => {
    let server: MCPServer;
    const mockConfig = {
        name: 'TestServer',
        version: '1.0.0',
        enableLogging: true,
    };

    beforeEach(() => {
        server = new MCPServer(mockConfig);
    });

    /** @aiContributed-2026-01-28 */
    it('should return correct diagnostics when the server is not running and no tools are registered', () => {
        const diagnostics = server.getDiagnostics();

        expect(diagnostics).toEqual({
            isRunning: false,
            toolsRegistered: 0,
            tools: [],
            config: {
                name: 'TestServer',
                version: '1.0.0',
                enableLogging: true,
            },
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should return correct diagnostics when the server is running and tools are registered', () => {
        server['isRunning'] = true; // Accessing private property for testing
        server.registerTool('tool1', jest.fn());
        server.registerTool('tool2', jest.fn());

        const diagnostics = server.getDiagnostics();

        expect(diagnostics).toEqual({
            isRunning: true,
            toolsRegistered: 2,
            tools: ['tool1', 'tool2'],
            config: {
                name: 'TestServer',
                version: '1.0.0',
                enableLogging: true,
            },
        });
    });
});
// ./integration.initializeMCPServer.gptgen.web.spec.ts
import * as vscode from 'vscode';
import { initializeMCPServer } from '../../src/mcpServer/integration';
import { MCPServer } from '../../src/mcpServer/server';

jest.mock('../../src/mcpServer/server');
jest.mock('vscode', () => ({
    ...jest.requireActual('vscode'),
    window: {
        createOutputChannel: jest.fn(() => ({
            appendLine: jest.fn(),
        })),
    },
}));

/** @aiContributed-2026-01-28 */
describe('initializeMCPServer', () => {
    let context: vscode.ExtensionContext;

    beforeEach(() => {
        context = {
            subscriptions: [],
        } as unknown as vscode.ExtensionContext;
    });

    /** @aiContributed-2026-01-28 */
    it('should initialize the MCP server and register tools', async () => {
        const mockStart = jest.fn();
        const mockRegisterTool = jest.fn();
        const mockGetRegisteredTools = jest.fn(() => ['getNextTask', 'reportTaskStatus']);
        const mockStop = jest.fn();

        (MCPServer as jest.Mock).mockImplementation(() => ({
            start: mockStart,
            registerTool: mockRegisterTool,
            getRegisteredTools: mockGetRegisteredTools,
            stop: mockStop,
        }));

        const server = await initializeMCPServer(context);

        expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('COE MCP Server');
        expect(mockRegisterTool).toHaveBeenCalledTimes(6);
        expect(mockRegisterTool).toHaveBeenCalledWith('getNextTask', expect.any(Function));
        expect(mockRegisterTool).toHaveBeenCalledWith('reportTaskStatus', expect.any(Function));
        expect(mockRegisterTool).toHaveBeenCalledWith('askQuestion', expect.any(Function));
        expect(mockRegisterTool).toHaveBeenCalledWith('reportTestFailure', expect.any(Function));
        expect(mockRegisterTool).toHaveBeenCalledWith('reportObservation', expect.any(Function));
        expect(mockRegisterTool).toHaveBeenCalledWith('reportVerificationResult', expect.any(Function));
        expect(mockStart).toHaveBeenCalled();
        expect(mockGetRegisteredTools).toHaveBeenCalled();
        expect(context.subscriptions).toHaveLength(2);
        expect(server).toEqual(expect.objectContaining({ start: expect.any(Function) })); // Corrected assertion
    });

    /** @aiContributed-2026-01-28 */
    it('should add server stop to context subscriptions', async () => {
        const mockStop = jest.fn();
        (MCPServer as jest.Mock).mockImplementation(() => ({
            start: jest.fn(),
            registerTool: jest.fn(),
            getRegisteredTools: jest.fn(() => []),
            stop: mockStop,
        }));

        await initializeMCPServer(context);

        const disposable = context.subscriptions.find((sub) => typeof sub.dispose === 'function');
        expect(disposable).toBeDefined();

        await disposable?.dispose();
        expect(mockStop).toHaveBeenCalled();
    });
});
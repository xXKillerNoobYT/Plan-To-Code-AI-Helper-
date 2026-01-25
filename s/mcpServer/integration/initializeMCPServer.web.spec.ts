// ./integration.initializeMCPServer.gptgen.web.spec.ts
import { initializeMCPServer } from '../../../src/mcpServer/integration';
import * as vscode from 'vscode';
import { MCPServer } from '../../../src/mcpServer/server';
import { TaskQueue } from '../../../src/tasks/queue';

jest.mock('vscode', () => ({
  window: {
    createOutputChannel: jest.fn(),
  },
}), { virtual: true });

jest.mock('../../../src/mcpServer/server', () => {
  return {
    ...jest.requireActual('../../../src/mcpServer/server'),
    MCPServer: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      registerTool: jest.fn(),
      getRegisteredTools: jest.fn(() => ['getNextTask', 'reportTaskStatus', 'askQuestion', 'reportTestFailure', 'reportObservation', 'reportVerificationResult']),
    })),
  };
});

jest.mock('../../../src/tasks/queue', () => {
  return {
    ...jest.requireActual('../../../src/tasks/queue'),
    TaskQueue: jest.fn().mockImplementation(() => ({})),
  };
});

/** @aiContributed-2026-01-24 */
describe('initializeMCPServer', () => {
  let context: vscode.ExtensionContext;

  beforeEach(() => {
    context = {
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;
    jest.clearAllMocks();
  });

  /** @aiContributed-2026-01-24 */
  it('should initialize MCPServer and register tools', async () => {
    const logChannelMock = {
      appendLine: jest.fn(),
      logLevel: 'info',
      onDidChangeLogLevel: jest.fn(),
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    jest.spyOn(vscode.window, 'createOutputChannel').mockReturnValue(logChannelMock as unknown as vscode.LogOutputChannel);

    const server = await initializeMCPServer(context);

    expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('COE MCP Server');
    expect(context.subscriptions).toContain(logChannelMock);
    expect(MCPServer).toHaveBeenCalledWith({
      name: 'coe-orchestration',
      version: '1.0.0',
      enableLogging: true,
      logChannel: logChannelMock,
    });
    expect(TaskQueue).toHaveBeenCalledTimes(1);
    expect(server.registerTool).toHaveBeenCalledTimes(6);
    expect(server.registerTool).toHaveBeenCalledWith('getNextTask', expect.any(Function));
    expect(server.registerTool).toHaveBeenCalledWith('reportTaskStatus', expect.any(Function));
    expect(server.registerTool).toHaveBeenCalledWith('askQuestion', expect.any(Function));
    expect(server.registerTool).toHaveBeenCalledWith('reportTestFailure', expect.any(Function));
    expect(server.registerTool).toHaveBeenCalledWith('reportObservation', expect.any(Function));
    expect(server.registerTool).toHaveBeenCalledWith('reportVerificationResult', expect.any(Function));
    expect(server.start).toHaveBeenCalledTimes(1);
    expect(logChannelMock.appendLine).toHaveBeenCalledWith('MCP Server initialized successfully');
    expect(logChannelMock.appendLine).toHaveBeenCalledWith('Registered tools: getNextTask, reportTaskStatus, askQuestion, reportTestFailure, reportObservation, reportVerificationResult');
    expect(context.subscriptions).toContainEqual(expect.objectContaining({ dispose: expect.any(Function) }));
  });

  /** @aiContributed-2026-01-24 */
  it('should stop the server on dispose', async () => {
    const logChannelMock = {
      appendLine: jest.fn(),
      logLevel: 'info',
      onDidChangeLogLevel: jest.fn(),
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    jest.spyOn(vscode.window, 'createOutputChannel').mockReturnValue(logChannelMock as unknown as vscode.LogOutputChannel);

    const server = await initializeMCPServer(context);

    const disposeFn = context.subscriptions.find((sub) => typeof sub.dispose === 'function');
    expect(disposeFn).toBeDefined();

    await disposeFn?.dispose();
    expect(server.stop).toHaveBeenCalledTimes(1);
  });
});
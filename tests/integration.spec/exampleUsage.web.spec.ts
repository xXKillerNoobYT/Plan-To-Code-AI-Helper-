// ./integration.web.spec.ts
import { exampleUsage } from '../../src/mcpServer/integration';
import { MCPServer } from '../../src/mcpServer/server';
import { getNextTask } from '../../src/mcpServer/tools/getNextTask';
import { getErrors } from '../../src/mcpServer/tools/getErrors';

jest.mock('../../src/mcpServer/server', () => {
  const originalModule = jest.requireActual('../../src/mcpServer/server');
  return {
    ...originalModule,
    MCPServer: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      registerTool: jest.fn(),
      processMessage: jest.fn(),
    })),
  };
});

jest.mock('../../src/mcpServer/tools/getNextTask', () => ({
  ...jest.requireActual('../../src/mcpServer/tools/getNextTask'),
  getNextTask: jest.fn(),
}));

jest.mock('../../src/mcpServer/tools/getErrors', () => ({
  ...jest.requireActual('../../src/mcpServer/tools/getErrors'),
  getErrors: jest.fn(),
}));

/** @aiContributed-2026-01-29 */
describe('exampleUsage', () => {
  /** @aiContributed-2026-01-29 */
  it('should initialize MCPServer, register tools, process a request, and stop the server', async () => {
    const mockStart = jest.fn();
    const mockStop = jest.fn();
    const mockRegisterTool = jest.fn();
    const mockProcessMessage = jest.fn().mockResolvedValue(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        result: { task: 'exampleTask' },
      })
    );

    (MCPServer as jest.Mock).mockImplementation(() => ({
      start: mockStart,
      stop: mockStop,
      registerTool: mockRegisterTool,
      processMessage: mockProcessMessage,
    }));

    const mockGetNextTask = jest.fn().mockResolvedValue({ task: 'exampleTask' });
    (getNextTask as jest.Mock).mockImplementation(mockGetNextTask);

    const mockGetErrors = jest.fn().mockResolvedValue({ errors: [] });
    (getErrors as jest.Mock).mockImplementation(mockGetErrors);

    await exampleUsage();

    expect(MCPServer).toHaveBeenCalledWith({
      name: 'example',
      version: '1.0.0',
      enableLogging: true,
    });
    expect(mockRegisterTool).toHaveBeenCalledWith(
      'getNextTask',
      expect.any(Function)
    );
    expect(mockRegisterTool).toHaveBeenCalledWith(
      'getErrors',
      expect.any(Function)
    );
    expect(mockStart).toHaveBeenCalled();
    expect(mockProcessMessage).toHaveBeenCalledWith(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'getNextTask',
        params: {
          filter: 'ready',
          priority: 'high',
        },
        id: 1,
      })
    );
    expect(mockStop).toHaveBeenCalled();
  });
});
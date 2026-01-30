// ./server.web.spec.ts
import { MCPServer } from '../../src/mcpServer/server.ts';
import { parseStdioMessage, formatStdioResponse, createErrorResponse, MCPErrorCode } from '../../src/mcpServer/protocol';

jest.mock('../../src/mcpServer/protocol', () => ({
    ...jest.requireActual('../../src/mcpServer/protocol'),
    parseStdioMessage: jest.fn(),
  formatStdioResponse: jest.fn(),
  createErrorResponse: jest.fn(),
}));

/** @aiContributed-2026-01-29 */
describe('MCPServer - processMessage', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({
      name: 'test-mcp-server',
      version: '1.0.0',
      enableLogging: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /** @aiContributed-2026-01-29 */
    it('should process a valid message and return a formatted response', async () => {
    const rawMessage = '{"jsonrpc":"2.0","id":1,"method":"testMethod"}';
    const parsedRequest = { jsonrpc: '2.0' as const, id: 1, method: 'testMethod' };
    const response = { jsonrpc: '2.0' as const, id: 1, result: 'success' };
    const formattedResponse = 'formatted-response';

    (parseStdioMessage as jest.Mock).mockReturnValue(parsedRequest);
    jest.spyOn(server, 'handleRequest').mockResolvedValue(response);
    (formatStdioResponse as jest.Mock).mockReturnValue(formattedResponse);

    const result = await server.processMessage(rawMessage);

    expect(parseStdioMessage).toHaveBeenCalledWith(rawMessage);
    expect(server.handleRequest).toHaveBeenCalledWith(parsedRequest);
    expect(formatStdioResponse).toHaveBeenCalledWith(response);
    expect(result).toBe(formattedResponse);
  });

  /** @aiContributed-2026-01-29 */
    it('should handle MCPProtocolError and return an error response', async () => {
    const rawMessage = 'invalid-message';
    const error = new Error('Parse error');
    const errorResponse = { jsonrpc: '2.0', id: 'unknown', error: { code: -32700, message: 'Parse error' } };
    const formattedErrorResponse = 'formatted-error-response';

    (parseStdioMessage as jest.Mock).mockImplementation(() => {
      throw error;
    });
    (createErrorResponse as jest.Mock).mockReturnValue(errorResponse);
    (formatStdioResponse as jest.Mock).mockReturnValue(formattedErrorResponse);

    const result = await server.processMessage(rawMessage);

    expect(parseStdioMessage).toHaveBeenCalledWith(rawMessage);
    expect(createErrorResponse).toHaveBeenCalledWith(MCPErrorCode.INTERNAL_ERROR, 'Failed to process message', 'unknown');
    expect(formatStdioResponse).toHaveBeenCalledWith(errorResponse);
    expect(result).toBe(formattedErrorResponse);
  });

  /** @aiContributed-2026-01-29 */
    it('should handle unexpected errors and return an internal error response', async () => {
    const rawMessage = 'invalid-message';
    const error = new Error('Unexpected error');
    const errorResponse = { jsonrpc: '2.0', id: 'unknown', error: { code: -32603, message: 'Failed to process message' } };
    const formattedErrorResponse = 'formatted-error-response';

    (parseStdioMessage as jest.Mock).mockImplementation(() => {
      throw error;
    });
    (createErrorResponse as jest.Mock).mockReturnValue(errorResponse);
    (formatStdioResponse as jest.Mock).mockReturnValue(formattedErrorResponse);

    const result = await server.processMessage(rawMessage);

    expect(parseStdioMessage).toHaveBeenCalledWith(rawMessage);
    expect(createErrorResponse).toHaveBeenCalledWith(MCPErrorCode.INTERNAL_ERROR, 'Failed to process message', 'unknown');
    expect(formatStdioResponse).toHaveBeenCalledWith(errorResponse);
    expect(result).toBe(formattedErrorResponse);
  });
});
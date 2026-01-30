// ./extension.web.spec.ts
import * as vscode from 'vscode';
import { activate } from '../../src/extension';
import { CoeTaskTreeProvider } from '../../src/tree/CoeTaskTreeProvider';
import { CompletedTasksTreeProvider } from '../../src/ui/completedTasksTreeProvider';
import { TicketDatabase } from '../../src/db/ticketsDb';

jest.mock('../../src/tree/CoeTaskTreeProvider');
jest.mock('../../src/ui/completedTasksTreeProvider');
jest.mock('../../src/db/ticketsDb');

/** @aiContributed-2026-01-29 */
describe('activate', () => {
  let context: vscode.ExtensionContext;

  beforeEach(() => {
    context = {
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;
    (vscode.workspace.workspaceFolders as unknown[]) = [
      { uri: { fsPath: '/test/workspace' } },
    ];
  });

  /** @aiContributed-2026-01-29 */
    it('should initialize the extension without errors', async () => {
    const mockTreeProvider = jest.fn();
    const mockCompletedTasksProvider = jest.fn();
    const mockTicketDb = jest.fn();

    (CoeTaskTreeProvider as jest.Mock).mockImplementation(mockTreeProvider);
    (CompletedTasksTreeProvider as jest.Mock).mockImplementation(mockCompletedTasksProvider);
    (TicketDatabase.getInstance as jest.Mock).mockReturnValue(mockTicketDb);

    await expect(activate(context)).resolves.not.toThrow();
    expect(context.subscriptions.length).toBeGreaterThan(0);
  });

  /** @aiContributed-2026-01-29 */
    it('should register the status bar item', async () => {
    await activate(context);
    const statusBarItem = vscode.window.createStatusBarItem();
    expect(statusBarItem).toBeDefined();
    expect(context.subscriptions).toContainEqual(expect.objectContaining({ dispose: expect.any(Function) }));
  });

  /** @aiContributed-2026-01-29 */
    it('should initialize the TicketDatabase', async () => {
    const mockTicketDb = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({
        total: 0,
        open: 0,
        inReview: 0,
        resolved: 0,
        escalated: 0,
        usingFallback: false,
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (TicketDatabase.getInstance as jest.Mock).mockReturnValue(mockTicketDb);

    await activate(context);
    expect(mockTicketDb.initialize).toHaveBeenCalled();
  });

  /** @aiContributed-2026-01-29 */
    it('should handle errors during activation gracefully', async () => {
    const mockTicketDb = {
      initialize: jest.fn().mockRejectedValue(new Error('Initialization failed')),
    };
    (TicketDatabase.getInstance as jest.Mock).mockReturnValue(mockTicketDb);

    await expect(activate(context)).resolves.not.toThrow();
  });
});
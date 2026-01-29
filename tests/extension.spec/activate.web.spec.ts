// ./extension.web.spec.ts
import * as vscode from 'vscode';
import { activate } from '../../src/extension';
import { CoeTaskTreeProvider } from '../../src/tree/CoeTaskTreeProvider';
import { CompletedTasksTreeProvider } from '../../src/ui/completedTasksTreeProvider';
import { TicketDatabase } from '../../src/db/ticketsDb';

jest.mock('../../src/tree/CoeTaskTreeProvider');
jest.mock('../../src/ui/completedTasksTreeProvider');
jest.mock('../../src/db/ticketsDb');

/** @aiContributed-2026-01-28 */
describe('activate', () => {
  let context: vscode.ExtensionContext;

  beforeEach(() => {
    context = {
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;
  });

  /** @aiContributed-2026-01-28 */
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
});
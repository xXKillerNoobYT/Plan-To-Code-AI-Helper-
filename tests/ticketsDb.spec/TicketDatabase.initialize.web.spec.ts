// ./ticketsDb.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';
import fs from 'fs';
import path from 'path';

jest.mock('fs');
jest.mock('path');
jest.mock('sqlite3', () => ({
  Database: jest.fn(() => ({
    run: jest.fn(),
    get: jest.fn(),
    close: jest.fn(),
  })),
}));

/** @aiContributed-2026-01-29 */
describe('TicketDatabase.initialize', () => {
  let ticketDb: TicketDatabase;

  beforeEach(() => {
    TicketDatabase.resetInstance();
    ticketDb = TicketDatabase.getInstance();
  });

  /** @aiContributed-2026-01-29 */
    it('should initialize the database and create necessary directories', async () => {
    const workspaceRoot = '/test/workspace';
    const customConfig = { dbPath: 'test.db', autoMigrate: true, skipPlaceholder: false };

    const mockExistsSync = jest.spyOn(fs, 'existsSync');
    const mockMkdirSync = jest.spyOn(fs, 'mkdirSync');
    const mockInitializeSqlite = jest.spyOn(ticketDb as any, 'initializeSqlite').mockResolvedValue(undefined);
    const mockRunMigrations = jest.spyOn(ticketDb as any, 'runMigrations').mockResolvedValue(undefined);
    const mockCleanupOldCompletedTasks = jest.spyOn(ticketDb as any, 'cleanupOldCompletedTasks').mockResolvedValue(undefined);
    const mockCreatePlaceholderTicket = jest.spyOn(ticketDb as any, 'createPlaceholderTicket').mockResolvedValue(undefined);

    mockExistsSync.mockImplementation((filePath) => {
      if (filePath === path.join(workspaceRoot, '.coe')) return false;
      if (filePath === path.join(workspaceRoot, customConfig.dbPath)) return false;
      return true;
    });

    await ticketDb.initialize(workspaceRoot, customConfig);

    expect(mockExistsSync).toHaveBeenCalledWith(path.join(workspaceRoot, '.coe'));
    expect(mockMkdirSync).toHaveBeenCalledWith(path.join(workspaceRoot, '.coe'), { recursive: true });
    expect(mockInitializeSqlite).toHaveBeenCalledWith(path.join(workspaceRoot, customConfig.dbPath));
    expect(mockRunMigrations).toHaveBeenCalled();
    expect(mockCleanupOldCompletedTasks).toHaveBeenCalled();
    expect(mockCreatePlaceholderTicket).toHaveBeenCalled();
  });

  /** @aiContributed-2026-01-29 */
    it('should handle existing database without creating placeholder ticket', async () => {
    const workspaceRoot = '/test/workspace';
    const customConfig = { dbPath: 'test.db', autoMigrate: true, skipPlaceholder: true };

    const mockInitializeSqlite = jest.spyOn(ticketDb as any, 'initializeSqlite').mockResolvedValue(undefined);
    const mockRunMigrations = jest.spyOn(ticketDb as any, 'runMigrations').mockResolvedValue(undefined);
    const mockCleanupOldCompletedTasks = jest.spyOn(ticketDb as any, 'cleanupOldCompletedTasks').mockResolvedValue(undefined);
    const mockCreatePlaceholderTicket = jest.spyOn(ticketDb as any, 'createPlaceholderTicket').mockResolvedValue(undefined);

    await ticketDb.initialize(workspaceRoot, customConfig);

    expect(mockInitializeSqlite).toHaveBeenCalledWith(path.join(workspaceRoot, customConfig.dbPath));
    expect(mockRunMigrations).toHaveBeenCalled();
    expect(mockCleanupOldCompletedTasks).toHaveBeenCalled();
    expect(mockCreatePlaceholderTicket).not.toHaveBeenCalled();
  });

  /** @aiContributed-2026-01-29 */
    it('should fallback to in-memory store on error', async () => {
    const workspaceRoot = '/test/workspace';
    const customConfig = { dbPath: 'test.db', autoMigrate: true, skipPlaceholder: false };

    const mockInitializeSqlite = jest.spyOn(ticketDb as any, 'initializeSqlite').mockRejectedValue(new Error('Initialization failed'));

    await ticketDb.initialize(workspaceRoot, customConfig);

    expect(ticketDb['useFallback']).toBe(true);
    expect(ticketDb['initialized']).toBe(true);
  });
});
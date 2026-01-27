// ./ticketsDb.TicketDatabase.initializeSqlite.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';
import sqlite3 from 'sqlite3';

jest.mock('sqlite3', () => {
    const mockDatabase = jest.fn();
    return {
        ...jest.requireActual('sqlite3'),
        Database: mockDatabase,
    };
});

/** @aiContributed-2026-01-26 */
describe('TicketDatabase - initializeSqlite', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /** @aiContributed-2026-01-26 */
    it('should set useFallback to true and resolve when SQLite connection fails', async () => {
        const mockDbConstructor = sqlite3.Database as unknown as jest.Mock;
        mockDbConstructor.mockImplementationOnce((_: string, callback: (err: Error | null) => void) => {
            callback(new Error('Connection error'));
        });

        const dbPath = '/invalid/path/to/db.sqlite';
        await (ticketDb as unknown as { initializeSqlite: (path: string) => Promise<void> }).initializeSqlite(dbPath);

        expect(mockDbConstructor).toHaveBeenCalledWith(dbPath, expect.any(Function));
        expect((ticketDb as unknown as { useFallback: boolean }).useFallback).toBe(true);
    });

    /** @aiContributed-2026-01-26 */
    it('should connect to SQLite successfully and not set useFallback', async () => {
        const mockDbConstructor = sqlite3.Database as unknown as jest.Mock;
        mockDbConstructor.mockImplementationOnce((_: string, callback: (err: Error | null) => void) => {
            callback(null);
        });

        const dbPath = '/valid/path/to/db.sqlite';
        await (ticketDb as unknown as { initializeSqlite: (path: string) => Promise<void> }).initializeSqlite(dbPath);

        expect(mockDbConstructor).toHaveBeenCalledWith(dbPath, expect.any(Function));
        expect((ticketDb as unknown as { useFallback: boolean }).useFallback).toBe(false);
    });

    /** @aiContributed-2026-01-26 */
    it('should handle exceptions during SQLite initialization and set useFallback to true', async () => {
        const mockDbConstructor = sqlite3.Database as unknown as jest.Mock;
        mockDbConstructor.mockImplementationOnce(() => {
            throw new Error('Initialization error');
        });

        const dbPath = '/exception/path/to/db.sqlite';
        await (ticketDb as unknown as { initializeSqlite: (path: string) => Promise<void> }).initializeSqlite(dbPath);

        expect(mockDbConstructor).toHaveBeenCalledWith(dbPath, expect.any(Function));
        expect((ticketDb as unknown as { useFallback: boolean }).useFallback).toBe(true);
    });
});
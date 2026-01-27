// ./ticketsDb.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';
import { Database } from 'sqlite3';

jest.mock('sqlite3', () => {
    const mockRun = jest.fn((sql, callback) => {
        if (sql.includes('CREATE TABLE')) {
            callback(null); // Simulate successful migration
        } else {
            callback(new Error('SQL Error')); // Simulate SQL error
        }
    });

    return {
        ...jest.requireActual('sqlite3'),
        Database: jest.fn(() => ({
            run: mockRun,
        })),
    };
});

/** @aiContributed-2026-01-26 */
describe('TicketDatabase - runMigrations', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /** @aiContributed-2026-01-26 */
    it('should log a warning and skip migrations if no database connection exists', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        (ticketDb as unknown as { db: Database | null }).db = null;

        await (ticketDb as unknown as { runMigrations: () => Promise<void> }).runMigrations();

        expect(consoleWarnSpy).toHaveBeenCalledWith('No database connection, skipping migrations');
        consoleWarnSpy.mockRestore();
    });

    /** @aiContributed-2026-01-26 */
    it('should complete migrations successfully when database connection exists', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        (ticketDb as unknown as { db: Database }).db = new Database(':memory:');

        await (ticketDb as unknown as { runMigrations: () => Promise<void> }).runMigrations();

        expect(consoleLogSpy).toHaveBeenCalledWith('Migrations completed successfully');
        consoleLogSpy.mockRestore();
    });

    /** @aiContributed-2026-01-26 */
    it('should handle migration failure and set useFallback to true', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (ticketDb as unknown as { db: Database }).db = new Database(':memory:');
        const mockRun = jest.fn((sql, callback) => callback(new Error('Migration failed')));
        (ticketDb as unknown as { db: { run: typeof mockRun } }).db.run = mockRun;

        await (ticketDb as unknown as { runMigrations: () => Promise<void>; useFallback: boolean }).runMigrations();

        expect(consoleErrorSpy).toHaveBeenCalledWith('Migration failed:', expect.any(Error));
        expect((ticketDb as unknown as { useFallback: boolean }).useFallback).toBe(true);
        consoleErrorSpy.mockRestore();
    });
});
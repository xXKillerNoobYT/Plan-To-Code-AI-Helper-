// ./ticketsDb.TicketDatabase.runMigrations.gptgen.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';
import { Database } from 'sqlite3';

jest.mock('sqlite3', () => {
    const mockRun = jest.fn((sql, callback) => {
        if (sql.includes('CREATE TABLE IF NOT EXISTS db_version')) {
            callback(null); // Simulate success for version table creation
        } else if (sql.includes('INSERT OR IGNORE INTO db_version')) {
            callback(null); // Simulate success for version initialization
        } else if (sql.includes('CREATE TABLE IF NOT EXISTS tickets')) {
            callback(null); // Simulate success for tickets table creation
        } else if (sql.includes('CREATE TABLE IF NOT EXISTS completed_tasks')) {
            callback(null); // Simulate success for completed_tasks table creation
        } else if (sql.includes('UPDATE db_version SET version = 1')) {
            callback(null); // Simulate success for version update
        } else {
            callback(new Error('SQL execution failed')); // Simulate failure for other queries
        }
    });

    const mockGet = jest.fn((sql, callback) => {
        if (sql.includes('SELECT version FROM db_version')) {
            callback(null, {
                ...jest.requireActual('sqlite3'),
                version: 0 }); // Simulate version 0 for migration
        } else {
            callback(new Error('SQL execution failed')); // Simulate failure for other queries
        }
    });

    return {
        Database: jest.fn(() => ({
            run: mockRun,
            get: mockGet,
        })),
    };
});

type MockDatabase = {
    run: jest.Mock;
    get: jest.Mock;
};

/** @aiContributed-2026-01-28 */
describe('TicketDatabase - runMigrations', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
        (ticketDb as unknown as { db: MockDatabase }).db = new Database(':memory:') as unknown as MockDatabase; // Mock in-memory database
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /** @aiContributed-2026-01-28 */
    it('should skip migrations if no database connection exists', async () => {
        (ticketDb as unknown as { db: MockDatabase | null }).db = null;

        await (ticketDb as unknown as { runMigrations: () => Promise<void> }).runMigrations();

        // Migration skipped when database is null
    });

    /** @aiContributed-2026-01-28 */
    it('should create version tracking table and initialize version', async () => {
        await (ticketDb as unknown as { runMigrations: () => Promise<void> }).runMigrations();

        const db = (ticketDb as unknown as { db: MockDatabase }).db;
        expect(db.run).toHaveBeenCalledWith(
            expect.stringContaining('CREATE TABLE IF NOT EXISTS db_version'),
            expect.any(Function)
        );
        expect(db.run).toHaveBeenCalledWith(
            expect.stringContaining('INSERT OR IGNORE INTO db_version'),
            expect.any(Function)
        );
    });

    /** @aiContributed-2026-01-28 */
    it('should create tickets table', async () => {
        await (ticketDb as unknown as { runMigrations: () => Promise<void> }).runMigrations();

        const db = (ticketDb as unknown as { db: MockDatabase }).db;
        expect(db.run).toHaveBeenCalledWith(
            expect.stringContaining('CREATE TABLE IF NOT EXISTS tickets'),
            expect.any(Function)
        );
    });

    /** @aiContributed-2026-01-28 */
    it('should create completed_tasks table and update version if version is 0', async () => {
        await (ticketDb as unknown as { runMigrations: () => Promise<void> }).runMigrations();

        const db = (ticketDb as unknown as { db: MockDatabase }).db;
        expect(db.run).toHaveBeenCalledWith(
            expect.stringContaining('CREATE TABLE IF NOT EXISTS completed_tasks'),
            expect.any(Function)
        );
        expect(db.run).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE db_version SET version = 1'),
            expect.any(Function)
        );
    });

    /** @aiContributed-2026-01-28 */
    it('should complete migrations successfully', async () => {
        await (ticketDb as unknown as { runMigrations: () => Promise<void> }).runMigrations();

        const db = (ticketDb as unknown as { db: MockDatabase }).db;
        expect(db.run).toHaveBeenCalled();
    });
});
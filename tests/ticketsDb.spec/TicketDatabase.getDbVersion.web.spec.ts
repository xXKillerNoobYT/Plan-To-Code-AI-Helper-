// ./ticketsDb.TicketDatabase.getDbVersion.gptgen.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';
import { Database } from 'sqlite3';

jest.mock('sqlite3', () => {
    const mockDatabase = {
        ...jest.requireActual('sqlite3'),
        get: jest.fn(),
    };
    return {
        Database: jest.fn(() => mockDatabase),
    };
});

/** @aiContributed-2026-01-28 */
describe('TicketDatabase - getDbVersion', () => {
    let ticketDb: TicketDatabase;
    let mockDb: jest.Mocked<Database>;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance() as TicketDatabase;
        mockDb = new Database(':memory:') as jest.Mocked<Database>;
        (ticketDb as unknown as { db: jest.Mocked<Database> }).db = mockDb;
    });

    /** @aiContributed-2026-01-28 */
    it('should return version 0 if the database has no version table', (done) => {
        mockDb.get.mockImplementation((query: string, callback: (err: Error | null, row: unknown) => void) => {
            callback(new Error('Table not found'), null);
            return mockDb;
        });

        (ticketDb as unknown as { getDbVersion: (callback: (err: Error | null, version?: number) => void) => void }).getDbVersion((err: Error | null, version?: number) => {
            expect(err).toBeNull();
            expect(version).toBe(0);
            done();
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should return the version from the database if it exists', (done) => {
        mockDb.get.mockImplementation((query: string, callback: (err: Error | null, row: { version: number }) => void) => {
            callback(null, { version: 2 });
            return mockDb;
        });

        (ticketDb as unknown as { getDbVersion: (callback: (err: Error | null, version?: number) => void) => void }).getDbVersion((err: Error | null, version?: number) => {
            expect(err).toBeNull();
            expect(version).toBe(2);
            done();
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should return an error if there is no database connection', (done) => {
        (ticketDb as unknown as { db: null }).db = null;

        (ticketDb as unknown as { getDbVersion: (callback: (err: Error | null, version?: number) => void) => void }).getDbVersion((err: Error | null, version?: number) => {
            expect(err).toBeInstanceOf(Error);
            expect(err?.message).toBe('No database connection');
            expect(version).toBeUndefined();
            done();
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should return version 0 if the row is undefined', (done) => {
        mockDb.get.mockImplementation((query: string, callback: (err: Error | null, row: unknown) => void) => {
            callback(null, undefined);
            return mockDb;
        });

        (ticketDb as unknown as { getDbVersion: (callback: (err: Error | null, version?: number) => void) => void }).getDbVersion((err: Error | null, version?: number) => {
            expect(err).toBeNull();
            expect(version).toBe(0);
            done();
        });
    });
});
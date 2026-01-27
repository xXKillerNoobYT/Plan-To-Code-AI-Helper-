// ./ticketsDb.TicketDatabase.closeAsync.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';
import { Database } from 'sqlite3';

jest.mock('sqlite3', () => {
    const mockDatabase = {
        ...jest.requireActual('sqlite3'),
        close: jest.fn((callback?: (err: Error | null) => void) => {
            if (callback) callback(null);
        }),
    };
    return { Database: jest.fn(() => mockDatabase) };
});

/** @aiContributed-2026-01-26 */
describe('TicketDatabase - closeAsync', () => {
    let ticketDb: TicketDatabase;
    let mockDb: jest.Mocked<Database>;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance() as TicketDatabase;
        mockDb = new Database(':memory:') as jest.Mocked<Database>;
        (ticketDb as unknown as { db: jest.Mocked<Database> }).db = mockDb;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /** @aiContributed-2026-01-26 */
    it('should resolve when db is null', async () => {
        (ticketDb as unknown as { db: jest.Mocked<Database> | null }).db = null;
        await expect(ticketDb.closeAsync()).resolves.toBeUndefined();
    });

    /** @aiContributed-2026-01-26 */
    it('should resolve when db.close succeeds', async () => {
        mockDb.close.mockImplementationOnce((callback?: (err: Error | null) => void) => {
            if (callback) callback(null);
        });
        await expect(ticketDb.closeAsync()).resolves.toBeUndefined();
        expect(mockDb.close).toHaveBeenCalledTimes(1);
    });

    /** @aiContributed-2026-01-26 */
    it('should reject when db.close fails', async () => {
        const error = new Error('Close failed');
        mockDb.close.mockImplementationOnce((callback?: (err: Error | null) => void) => {
            if (callback) callback(error);
        });
        await expect(ticketDb.closeAsync()).rejects.toThrow('Close failed');
        expect(mockDb.close).toHaveBeenCalledTimes(1);
    });
});
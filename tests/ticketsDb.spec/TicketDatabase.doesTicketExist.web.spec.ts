// ./ticketsDb.TicketDatabase.doesTicketExist.gptgen.web.spec.ts
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

/** @aiContributed-2026-01-29 */
describe('TicketDatabase - doesTicketExist', () => {
    let ticketDb: TicketDatabase;
    let mockDb: jest.Mocked<Database>;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
        mockDb = new Database(':memory:') as jest.Mocked<Database>;
        (ticketDb as unknown as { db: jest.Mocked<Database> }).db = mockDb;
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /** @aiContributed-2026-01-29 */
    it('should return true if the ticket exists in the database', async () => {
        mockDb.get.mockImplementation((sql: string, params: unknown[], callback: (err: Error | null, row: unknown) => void) => {
            callback(null, { exists: 1 });
            return mockDb;
        });

        const result = await ticketDb.doesTicketExist('ticket123');
        expect(result).toBe(true);
        expect(mockDb.get).toHaveBeenCalledWith(
            'SELECT 1 FROM tickets WHERE ticket_id = ? LIMIT 1',
            ['ticket123'],
            expect.any(Function)
        );
    });

    /** @aiContributed-2026-01-29 */
    it('should return false if the ticket does not exist in the database', async () => {
        mockDb.get.mockImplementation((sql: string, params: unknown[], callback: (err: Error | null, row: unknown) => void) => {
            callback(null, null);
            return mockDb;
        });

        const result = await ticketDb.doesTicketExist('ticket123');
        expect(result).toBe(false);
        expect(mockDb.get).toHaveBeenCalledWith(
            'SELECT 1 FROM tickets WHERE ticket_id = ? LIMIT 1',
            ['ticket123'],
            expect.any(Function)
        );
    });

    /** @aiContributed-2026-01-29 */
    it('should return false if there is a database error', async () => {
        mockDb.get.mockImplementation((sql: string, params: unknown[], callback: (err: Error | null, row: unknown) => void) => {
            callback(new Error('Database error'), null);
            return mockDb;
        });

        const result = await ticketDb.doesTicketExist('ticket123');
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false if the database is not initialized', async () => {
        (ticketDb as unknown as { db: null }).db = null;

        const result = await ticketDb.doesTicketExist('ticket123');
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-29 */
    it('should return true if the ticket exists in the fallback store when useFallback is true', async () => {
        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
        (ticketDb as unknown as { fallbackStore: Map<string, unknown> }).fallbackStore = new Map([['ticket123', {}]]);

        const result = await ticketDb.doesTicketExist('ticket123');
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false if the ticket does not exist in the fallback store when useFallback is true', async () => {
        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
        (ticketDb as unknown as { fallbackStore: Map<string, unknown> }).fallbackStore = new Map();

        const result = await ticketDb.doesTicketExist('ticket123');
        expect(result).toBe(false);
    });
});
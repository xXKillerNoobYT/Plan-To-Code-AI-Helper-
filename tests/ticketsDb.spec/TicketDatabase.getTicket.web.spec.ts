// ./ticketsDb.TicketDatabase.getTicket.gptgen.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-29 */
describe('TicketDatabase - getTicket', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** @aiContributed-2026-01-29 */
    it('should return a ticket from the fallback store if useFallback is true', async () => {
        const mockTicket = {
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            title: 'Test Ticket',
            description: 'This is a test ticket',
            thread: [],
            created_at: new Date('2023-01-01T00:00:00Z'),
            updated_at: new Date('2023-01-01T00:00:00Z'),
        };

        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
        (ticketDb as unknown as { fallbackStore: Map<string, typeof mockTicket> }).fallbackStore = new Map([['123', mockTicket]]);

        const result = await ticketDb.getTicket('123');
        expect(result).toEqual(mockTicket);
    });

    /** @aiContributed-2026-01-29 */
    it('should return null if the ticket is not found in the fallback store when useFallback is true', async () => {
        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
        (ticketDb as unknown as { fallbackStore: Map<string, unknown> }).fallbackStore = new Map();

        const result = await ticketDb.getTicket('123');
        expect(result).toBeNull();
    });

    /** @aiContributed-2026-01-29 */
    it('should return a ticket from the database if useFallback is false and the ticket exists', async () => {
        const mockRow = {
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            title: 'Test Ticket',
            description: 'This is a test ticket',
            thread: '[]',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
        };

        const mockDb = {
            get: jest.fn((sql: string, params: unknown[], callback: (err: Error | null, row: unknown) => void) => {
                callback(null, mockRow);
            }),
        };

        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: typeof mockDb }).db = mockDb;
        jest.spyOn(ticketDb as unknown as { rowToTicket: () => unknown }, 'rowToTicket').mockReturnValue({
            ...mockRow,
            thread: [],
            created_at: new Date(mockRow.created_at),
            updated_at: new Date(mockRow.updated_at),
        });

        const result = await ticketDb.getTicket('123');
        expect(result).toEqual({
            ...mockRow,
            thread: [],
            created_at: new Date(mockRow.created_at),
            updated_at: new Date(mockRow.updated_at),
        });
        expect(mockDb.get).toHaveBeenCalledWith(
            'SELECT * FROM tickets WHERE ticket_id = ?',
            ['123'],
            expect.any(Function)
        );
    });

    /** @aiContributed-2026-01-29 */
    it('should return null if the ticket does not exist in the database', async () => {
        const mockDb = {
            get: jest.fn((sql: string, params: unknown[], callback: (err: Error | null, row: unknown) => void) => {
                callback(null, null);
            }),
        };

        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: typeof mockDb }).db = mockDb;

        const result = await ticketDb.getTicket('123');
        expect(result).toBeNull();
        expect(mockDb.get).toHaveBeenCalledWith(
            'SELECT * FROM tickets WHERE ticket_id = ?',
            ['123'],
            expect.any(Function)
        );
    });

    /** @aiContributed-2026-01-29 */
    it('should return a ticket from the fallback store if the database query fails', async () => {
        const mockTicket = {
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            title: 'Test Ticket',
            description: 'This is a test ticket',
            thread: [],
            created_at: new Date('2023-01-01T00:00:00Z'),
            updated_at: new Date('2023-01-01T00:00:00Z'),
        };

        const mockDb = {
            get: jest.fn((sql: string, params: unknown[], callback: (err: Error | null, row: unknown) => void) => {
                callback(new Error('Database error'), null);
            }),
        };

        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: typeof mockDb }).db = mockDb;
        (ticketDb as unknown as { fallbackStore: Map<string, typeof mockTicket> }).fallbackStore = new Map([['123', mockTicket]]);

        const result = await ticketDb.getTicket('123');
        expect(result).toEqual(mockTicket);
        expect(mockDb.get).toHaveBeenCalledWith(
            'SELECT * FROM tickets WHERE ticket_id = ?',
            ['123'],
            expect.any(Function)
        );
    });

    /** @aiContributed-2026-01-29 */
    it('should reject with an error if the database is not initialized', async () => {
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: null }).db = null;

        await expect(ticketDb.getTicket('123')).rejects.toThrow('Database not initialized');
    });
});
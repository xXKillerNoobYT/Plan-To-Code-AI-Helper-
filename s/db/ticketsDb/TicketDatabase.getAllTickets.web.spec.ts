// ./ticketsDb.TicketDatabase.getAllTickets.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-26 */
describe('TicketDatabase - getAllTickets', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(async () => {
        await ticketDb.close();
    });

    /** @aiContributed-2026-01-26 */
    it('should return all tickets from fallback store when useFallback is true', async () => {
        const mockTickets = [
            { ticket_id: '1', status: 'open', priority: 1, created_at: new Date(), updated_at: new Date() },
            { ticket_id: '2', status: 'resolved', priority: 2, created_at: new Date(), updated_at: new Date() },
        ];
        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
        (ticketDb as unknown as { fallbackStore: Map<string, typeof mockTickets[0]> }).fallbackStore = new Map(
            mockTickets.map(ticket => [ticket.ticket_id, ticket])
        );

        const result = await ticketDb.getAllTickets();

        expect(result).toEqual(mockTickets);
    });

    /** @aiContributed-2026-01-26 */
    it('should filter tickets by status when useFallback is true', async () => {
        const mockTickets = [
            { ticket_id: '1', status: 'open', priority: 1, created_at: new Date(), updated_at: new Date() },
            { ticket_id: '2', status: 'resolved', priority: 2, created_at: new Date(), updated_at: new Date() },
        ];
        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
        (ticketDb as unknown as { fallbackStore: Map<string, typeof mockTickets[0]> }).fallbackStore = new Map(
            mockTickets.map(ticket => [ticket.ticket_id, ticket])
        );

        const result = await ticketDb.getAllTickets('open');

        expect(result).toEqual([mockTickets[0]]);
    });

    /** @aiContributed-2026-01-26 */
    it('should return tickets from SQLite database when useFallback is false', async () => {
        const mockRows = [
            { ticket_id: '1', status: 'open', priority: 1, created_at: new Date(), updated_at: new Date() },
            { ticket_id: '2', status: 'resolved', priority: 2, created_at: new Date(), updated_at: new Date() },
        ];
        const mockDb = {
            all: jest.fn((sql: string, params: unknown[], callback: (err: Error | null, rows: typeof mockRows) => void) => {
                callback(null, mockRows);
            }),
        };
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: typeof mockDb }).db = mockDb;
        jest.spyOn(ticketDb as unknown as { rowToTicket: (row: typeof mockRows[0]) => typeof mockRows[0] }, 'rowToTicket').mockImplementation(row => row);

        const result = await ticketDb.getAllTickets();

        expect(mockDb.all).toHaveBeenCalledWith(
            'SELECT * FROM tickets ORDER BY priority ASC, created_at DESC',
            [],
            expect.any(Function)
        );
        expect(result).toEqual(mockRows);
    });

    /** @aiContributed-2026-01-26 */
    it('should filter tickets by status from SQLite database when useFallback is false', async () => {
        const mockRows = [
            { ticket_id: '1', status: 'open', priority: 1, created_at: new Date(), updated_at: new Date() },
        ];
        const mockDb = {
            all: jest.fn((sql: string, params: unknown[], callback: (err: Error | null, rows: typeof mockRows) => void) => {
                callback(null, mockRows);
            }),
        };
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: typeof mockDb }).db = mockDb;
        jest.spyOn(ticketDb as unknown as { rowToTicket: (row: typeof mockRows[0]) => typeof mockRows[0] }, 'rowToTicket').mockImplementation(row => row);

        const result = await ticketDb.getAllTickets('open');

        expect(mockDb.all).toHaveBeenCalledWith(
            'SELECT * FROM tickets WHERE status = ? ORDER BY priority ASC, created_at DESC',
            ['open'],
            expect.any(Function)
        );
        expect(result).toEqual(mockRows);
    });

    /** @aiContributed-2026-01-26 */
    it('should return fallback tickets if SQLite query fails', async () => {
        const mockFallbackTickets = [
            { ticket_id: '1', status: 'open', priority: 1, created_at: new Date(), updated_at: new Date() },
        ];
        const mockDb = {
            all: jest.fn((sql: string, params: unknown[], callback: (err: Error | null, rows: typeof mockFallbackTickets | null) => void) => {
                callback(new Error('Database error'), null);
            }),
        };
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: typeof mockDb }).db = mockDb;
        (ticketDb as unknown as { fallbackStore: Map<string, typeof mockFallbackTickets[0]> }).fallbackStore = new Map(
            mockFallbackTickets.map(ticket => [ticket.ticket_id, ticket])
        );

        const result = await ticketDb.getAllTickets();

        expect(mockDb.all).toHaveBeenCalled();
        expect(result).toEqual(mockFallbackTickets);
    });
});
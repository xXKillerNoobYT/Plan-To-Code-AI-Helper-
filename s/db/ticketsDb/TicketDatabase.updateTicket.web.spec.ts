// ./ticketsDb.TicketDatabase.updateTicket.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';
import { jest } from '@jest/globals';
import { Database } from 'sqlite3';

jest.mock('sqlite3', () => {
    const mockRun = jest.fn((sql: string, values: unknown[], callback: (err: Error | null) => void) => callback(null));
    return {
        Database: jest.fn(() => ({
            run: mockRun,
        })),
    };
});

/** @aiContributed-2026-01-26 */
describe('TicketDatabase - updateTicket', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /** @aiContributed-2026-01-26 */
    it('should return null if the ticket does not exist', async () => {
        jest.spyOn(ticketDb as unknown as { getTicket: jest.Mock }, 'getTicket').mockResolvedValue(null);

        const result = await ticketDb.updateTicket({ ticket_id: 'nonexistent' });

        expect(result).toBeNull();
    });

    /** @aiContributed-2026-01-26 */
    it('should update the ticket in fallback store if useFallback is true', async () => {
        jest.spyOn(ticketDb as unknown as { getTicket: jest.Mock }, 'getTicket').mockResolvedValue({
            ticket_id: '123',
            status: 'open',
            assignee: 'user1',
            resolution: null,
            updated_at: new Date(),
        });
        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
        const fallbackStoreSetSpy = jest.spyOn((ticketDb as unknown as { fallbackStore: { set: jest.Mock } }).fallbackStore, 'set');

        const result = await ticketDb.updateTicket({
            ticket_id: '123',
            status: 'in_review',
            assignee: 'user2',
            resolution: 'Resolved',
        });

        expect(fallbackStoreSetSpy).toHaveBeenCalledWith('123', expect.objectContaining({
            ticket_id: '123',
            status: 'in_review',
            assignee: 'user2',
            resolution: 'Resolved',
        }));
        expect(result).toEqual(expect.objectContaining({
            ticket_id: '123',
            status: 'in_review',
            assignee: 'user2',
            resolution: 'Resolved',
        }));
    });

    /** @aiContributed-2026-01-26 */
    it('should update the ticket in the database if useFallback is false', async () => {
        jest.spyOn(ticketDb as unknown as { getTicket: jest.Mock }, 'getTicket').mockResolvedValue({
            ticket_id: '123',
            status: 'open',
            assignee: 'user1',
            resolution: null,
            updated_at: new Date(),
        });
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: Database }).db = new Database(':memory:');

        const result = await ticketDb.updateTicket({
            ticket_id: '123',
            status: 'resolved',
            assignee: 'user3',
            resolution: 'Done',
        });

        expect(result).toEqual(expect.objectContaining({
            ticket_id: '123',
            status: 'resolved',
            assignee: 'user3',
            resolution: 'Done',
        }));
    });

    /** @aiContributed-2026-01-26 */
    it('should update fallback store if database update fails', async () => {
        jest.spyOn(ticketDb as unknown as { getTicket: jest.Mock }, 'getTicket').mockResolvedValue({
            ticket_id: '123',
            status: 'open',
            assignee: 'user1',
            resolution: null,
            updated_at: new Date(),
        });
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: { run: jest.Mock } }).db = {
            run: jest.fn((sql: string, values: unknown[], callback: (err: Error | null) => void) => callback(new Error('DB error'))),
        } as unknown as Database;
        const fallbackStoreSetSpy = jest.spyOn((ticketDb as unknown as { fallbackStore: { set: jest.Mock } }).fallbackStore, 'set');

        const result = await ticketDb.updateTicket({
            ticket_id: '123',
            status: 'rejected',
            assignee: 'user4',
            resolution: 'Failed',
        });

        expect(fallbackStoreSetSpy).toHaveBeenCalledWith('123', expect.objectContaining({
            ticket_id: '123',
            status: 'rejected',
            assignee: 'user4',
            resolution: 'Failed',
        }));
        expect(result).toEqual(expect.objectContaining({
            ticket_id: '123',
            status: 'rejected',
            assignee: 'user4',
            resolution: 'Failed',
        }));
    });
});
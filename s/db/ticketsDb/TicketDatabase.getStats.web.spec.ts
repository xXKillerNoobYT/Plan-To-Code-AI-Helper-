// ./ticketsDb.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-26 */
describe('TicketDatabase - getStats', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** @aiContributed-2026-01-26 */
    it('should return correct stats when tickets have various statuses', async () => {
        const mockTickets = [
            { status: 'open' },
            { status: 'in_review' },
            { status: 'resolved' },
            { status: 'escalated' },
            { status: 'open' },
        ];

        jest.spyOn(ticketDb, 'getAllTickets' as keyof TicketDatabase).mockResolvedValue(mockTickets);
        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;

        const stats = await ticketDb.getStats();

        expect(stats).toEqual({
            total: 5,
            open: 2,
            inReview: 1,
            resolved: 1,
            escalated: 1,
            usingFallback: true,
        });
    });

    /** @aiContributed-2026-01-26 */
    it('should return zero stats when no tickets are available', async () => {
        jest.spyOn(ticketDb, 'getAllTickets' as keyof TicketDatabase).mockResolvedValue([]);
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;

        const stats = await ticketDb.getStats();

        expect(stats).toEqual({
            total: 0,
            open: 0,
            inReview: 0,
            resolved: 0,
            escalated: 0,
            usingFallback: false,
        });
    });
});
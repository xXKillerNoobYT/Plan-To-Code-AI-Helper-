// ./ticketsDb.web.spec.ts

import { TicketDatabase } from '../../src/db/ticketsDb';

/** @aiContributed-2026-01-29 */
describe('TicketDatabase - generateTicketId', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        TicketDatabase.resetInstance();
    });

    /** @aiContributed-2026-01-29 */
    it('should generate a ticket ID with the correct format', () => {
        jest.useFakeTimers().setSystemTime(new Date('2023-01-01T00:00:00Z').getTime());
        const ticketId = (ticketDb as unknown as { generateTicketId: () => string }).generateTicketId();
        expect(ticketId).toMatch(/^TK-\d{6}\d{3}$/);
        jest.useRealTimers();
    });

    /** @aiContributed-2026-01-29 */
    it('should include the last 6 digits of the current timestamp in the ticket ID', () => {
        jest.useFakeTimers().setSystemTime(new Date('2023-01-01T00:00:00Z').getTime());
        const ticketId = (ticketDb as unknown as { generateTicketId: () => string }).generateTicketId();
        const timestampPart = Date.now().toString().slice(-6);
        expect(ticketId).toContain(timestampPart);
        jest.useRealTimers();
    });

    /** @aiContributed-2026-01-29 */
    it('should include a 3-digit random number in the ticket ID', () => {
        jest.spyOn(global.Math, 'random').mockReturnValue(0.123);
        const ticketId = (ticketDb as unknown as { generateTicketId: () => string }).generateTicketId();
        expect(ticketId).toMatch(/123$/);
        jest.spyOn(global.Math, 'random').mockRestore();
    });
});
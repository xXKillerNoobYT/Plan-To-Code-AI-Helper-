// ./ticketsDb.TicketDatabase.generateTicketId.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';

/** @aiContributed-2026-01-26 */
describe('TicketDatabase - generateTicketId', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    /** @aiContributed-2026-01-26 */
    it('should generate a ticket ID with the correct format', () => {
        jest.spyOn(Date, 'now').mockReturnValue(1698765432000); // Mock timestamp
        const randomSpy = jest.spyOn(global.Math, 'random').mockReturnValue(0.456); // Mock random value

        const ticketId = (ticketDb as unknown as { generateTicketId: () => string }).generateTicketId();

        expect(ticketId).toMatch(/^TK-\d{9}$/); // Matches format TK-<6-digit-timestamp><3-digit-random>
        expect(ticketId).toBe('TK-432000456'); // Expected output based on mocked values

        randomSpy.mockRestore();
    });

    /** @aiContributed-2026-01-26 */
    it('should generate unique ticket IDs for different random values', () => {
        jest.spyOn(Date, 'now').mockReturnValue(1698765432000); // Mock timestamp
        const randomSpy = jest.spyOn(global.Math, 'random')
            .mockReturnValueOnce(0.123)
            .mockReturnValueOnce(0.789);

        const ticketId1 = (ticketDb as unknown as { generateTicketId: () => string }).generateTicketId();
        const ticketId2 = (ticketDb as unknown as { generateTicketId: () => string }).generateTicketId();

        expect(ticketId1).not.toBe(ticketId2);
        expect(ticketId1).toBe('TK-432000123');
        expect(ticketId2).toBe('TK-432000789');

        randomSpy.mockRestore();
    });
});
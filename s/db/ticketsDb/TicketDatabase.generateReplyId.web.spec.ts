// ./ticketsDb.TicketDatabase.generateReplyId.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';

/** @aiContributed-2026-01-26 */
describe('TicketDatabase - generateReplyId', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance() as TicketDatabase;
    });

    /** @aiContributed-2026-01-26 */
    it('should generate a reply ID with the correct format', () => {
        jest.useFakeTimers().setSystemTime(new Date('2023-01-01T00:00:00Z').getTime());
        jest.spyOn(global.Math, 'random').mockReturnValue(0.123);

        const replyId = ticketDb.generateReplyId();

        expect(replyId).toMatch(/^RPL-\d{6}\d{3}$/);
        expect(replyId).toBe('RPL-200000123');

        jest.useRealTimers();
        jest.spyOn(global.Math, 'random').mockRestore();
    });

    /** @aiContributed-2026-01-26 */
    it('should generate unique reply IDs for different timestamps', () => {
        jest.useFakeTimers().setSystemTime(new Date('2023-01-01T00:00:01Z').getTime());
        jest.spyOn(global.Math, 'random').mockReturnValue(0.456);

        const replyId1 = ticketDb.generateReplyId();

        jest.setSystemTime(new Date('2023-01-01T00:00:02Z').getTime());
        jest.spyOn(global.Math, 'random').mockReturnValue(0.789);

        const replyId2 = ticketDb.generateReplyId();

        expect(replyId1).not.toBe(replyId2);

        jest.useRealTimers();
        jest.spyOn(global.Math, 'random').mockRestore();
    });
});
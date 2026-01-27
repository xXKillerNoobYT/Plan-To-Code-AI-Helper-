// ./ticketsDb.TicketDatabase.getInstance.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';

/** @aiContributed-2026-01-26 */
describe('TicketDatabase.getInstance', () => {
    beforeEach(() => {
        // Reset the instance before each test
        (TicketDatabase as unknown as { resetInstance: () => void }).resetInstance();
    });

    /** @aiContributed-2026-01-26 */
    it('should return the same instance when called multiple times', () => {
        const instance1 = TicketDatabase.getInstance();
        const instance2 = TicketDatabase.getInstance();

        expect(instance1).toBe(instance2);
    });

    /** @aiContributed-2026-01-26 */
    it('should create a new instance if none exists', () => {
        const instance = TicketDatabase.getInstance();

        expect(instance).toBeInstanceOf(TicketDatabase);
    });
});
// ./ticketsDb.TicketDatabase.resetInstance.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';

/** @aiContributed-2026-01-26 */
describe('TicketDatabase.resetInstance', () => {
    /** @aiContributed-2026-01-26 */
    it('should reset the instance to null', () => {
        // Arrange
        const instanceBeforeReset = TicketDatabase.getInstance();

        // Act
        TicketDatabase.resetInstance();

        // Assert
        const instanceAfterReset = (TicketDatabase as unknown as { instance: null }).instance;
        expect(instanceBeforeReset).not.toBeNull();
        expect(instanceAfterReset).toBeNull();
    });
});
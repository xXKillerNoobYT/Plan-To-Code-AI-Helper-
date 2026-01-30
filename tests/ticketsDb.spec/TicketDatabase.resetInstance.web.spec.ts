// ./ticketsDb.web.spec.ts

import { TicketDatabase } from '../../src/db/ticketsDb';

/** @aiContributed-2026-01-29 */
describe('TicketDatabase.resetInstance', () => {
    /** @aiContributed-2026-01-29 */
    it('should set the instance to null', () => {
        // Arrange
        TicketDatabase.getInstance(); // Ensure instance is created

        // Act
        TicketDatabase.resetInstance();

        // Assert
        const instanceAfter: TicketDatabase | null = (TicketDatabase as unknown as { instance: TicketDatabase | null }).instance;
        expect(instanceAfter).toBeNull();
    });
});
// ./ticketsDb.TicketDatabase.close.gptgen.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-28 */
describe('TicketDatabase.close', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** @aiContributed-2026-01-28 */
    it('should close the database connection successfully', async () => {
        const closeAsyncMock = jest.spyOn(ticketDb as unknown as { closeAsync: () => Promise<void> }, 'closeAsync').mockResolvedValueOnce(undefined);

        (ticketDb as unknown as { db: object | null }).db = {}; // Simulate an open database connection

        await ticketDb.close();

        expect(closeAsyncMock).toHaveBeenCalledTimes(1);
        expect((ticketDb as unknown as { db: object | null }).db).toBeNull();
        expect((ticketDb as unknown as { useFallback: boolean }).useFallback).toBe(true);
    });

    /** @aiContributed-2026-01-28 */
    it('should retry closing the database connection on EBUSY error and succeed', async () => {
        const closeAsyncMock = jest
            .spyOn(ticketDb as unknown as { closeAsync: () => Promise<void> }, 'closeAsync')
            .mockRejectedValueOnce(new Error('EBUSY: file is locked'))
            .mockResolvedValueOnce(undefined);

        (ticketDb as unknown as { db: object | null }).db = {}; // Simulate an open database connection

        await ticketDb.close();

        expect(closeAsyncMock).toHaveBeenCalledTimes(2);
        expect((ticketDb as unknown as { db: object | null }).db).toBeNull();
        expect((ticketDb as unknown as { useFallback: boolean }).useFallback).toBe(true);
    });

    /** @aiContributed-2026-01-28 */
    it('should switch to fallback after max retries on persistent error', async () => {
        const closeAsyncMock = jest
            .spyOn(ticketDb as unknown as { closeAsync: () => Promise<void> }, 'closeAsync')
            .mockRejectedValue(new Error('Persistent error'));

        (ticketDb as unknown as { db: object | null }).db = {}; // Simulate an open database connection

        await ticketDb.close();

        expect(closeAsyncMock).toHaveBeenCalledTimes(3);
        expect((ticketDb as unknown as { db: object | null }).db).toBeNull();
        expect((ticketDb as unknown as { useFallback: boolean }).useFallback).toBe(true);
    });

    /** @aiContributed-2026-01-28 */
    it('should do nothing if the database is already closed', async () => {
        const closeAsyncMock = jest.spyOn(ticketDb as unknown as { closeAsync: () => Promise<void> }, 'closeAsync');
        const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

        (ticketDb as unknown as { db: object | null }).db = null; // Simulate a closed database connection

        await ticketDb.close();

        expect(closeAsyncMock).not.toHaveBeenCalled();
        expect(consoleLogMock).not.toHaveBeenCalled();
    });
});
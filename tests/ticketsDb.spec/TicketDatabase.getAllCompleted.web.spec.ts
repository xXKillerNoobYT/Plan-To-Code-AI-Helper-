// ./ticketsDb.TicketDatabase.getAllCompleted.gptgen.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-28 */
describe('TicketDatabase - getAllCompleted', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** @aiContributed-2026-01-28 */
    it('should return tasks from fallback store when useFallback is true', async () => {
        const mockTasks = [
            { id: '1', status: 'completed', completed_at: '2023-01-01T00:00:00.000Z' },
            { id: '2', status: 'failed', completed_at: '2023-01-02T00:00:00.000Z' },
        ];
        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
        (ticketDb as unknown as { fallbackCompletedTasks: Map<string, typeof mockTasks[0]> }).fallbackCompletedTasks = new Map(
            mockTasks.map(task => [task.id, task])
        );

        const result = await ticketDb.getAllCompleted({ status: 'completed' });

        expect(result).toEqual([mockTasks[0]]);
    });

    /** @aiContributed-2026-01-28 */
    it('should filter tasks by minDaysAgo when useFallback is true', async () => {
        const mockDate = new Date('2023-01-10T00:00:00.000Z');
        jest.useFakeTimers().setSystemTime(mockDate);

        const mockTasks = [
            { id: '1', status: 'completed', completed_at: '2023-01-01T00:00:00.000Z' },
            { id: '2', status: 'completed', completed_at: '2023-01-08T00:00:00.000Z' },
        ];
        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
        (ticketDb as unknown as { fallbackCompletedTasks: Map<string, typeof mockTasks[0]> }).fallbackCompletedTasks = new Map(
            mockTasks.map(task => [task.id, task])
        );

        const result = await ticketDb.getAllCompleted({ minDaysAgo: 5 });

        expect(result).toEqual([mockTasks[1]]);
    });

    /** @aiContributed-2026-01-28 */
    it('should query the database when useFallback is false', async () => {
        const mockRows = [
            { id: '1', status: 'completed', completed_at: '2023-01-01T00:00:00.000Z' },
            { id: '2', status: 'archived', completed_at: '2023-01-02T00:00:00.000Z' },
        ];
        const mockDb = {
            all: jest.fn((query: string, params: unknown[], callback: (err: Error | null, rows: typeof mockRows | null) => void) =>
                callback(null, mockRows)
            ),
        };
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: typeof mockDb }).db = mockDb;

        const result = await ticketDb.getAllCompleted({ status: 'archived' });

        expect(mockDb.all).toHaveBeenCalledWith(
            expect.stringContaining('WHERE status = ?'),
            ['archived'],
            expect.any(Function)
        );
        expect(result).toEqual(mockRows);
    });

    /** @aiContributed-2026-01-28 */
    it('should reject with an error if the database query fails', async () => {
        const mockDb = {
            all: jest.fn((query: string, params: unknown[], callback: (err: Error | null, rows: null) => void) =>
                callback(new Error('Query failed'), null)
            ),
        };
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
        (ticketDb as unknown as { db: typeof mockDb }).db = mockDb;

        await expect(ticketDb.getAllCompleted()).rejects.toThrow('Query failed');
    });
});
// ./ticketsDb.TicketDatabase.archiveTask.gptgen.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-28 */
describe('TicketDatabase.archiveTask', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** @aiContributed-2026-01-28 */
    it('should throw an error if taskId or title is missing', async () => {
        await expect(ticketDb.archiveTask('', 'Test Title', 'completed')).rejects.toThrow('archiveTask: taskId and title are required');
        await expect(ticketDb.archiveTask('taskId', '', 'completed')).rejects.toThrow('archiveTask: taskId and title are required');
    });

    /** @aiContributed-2026-01-28 */
    it('should store task in fallback memory if useFallback is true', async () => {
        const mockDate = '2023-01-01T00:00:00.000Z';
        jest.useFakeTimers().setSystemTime(new Date(mockDate));

        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
        await ticketDb.archiveTask('taskId1', 'Test Task', 'completed', 'ticketId1', 120);

        const fallbackTasks = (ticketDb as unknown as { fallbackCompletedTasks: Map<string, Record<string, unknown>> }).fallbackCompletedTasks;
        expect(fallbackTasks).toBeDefined();
        expect(fallbackTasks.get('taskId1')).toEqual({
            task_id: 'taskId1',
            original_ticket_id: 'ticketId1',
            title: 'Test Task',
            status: 'completed',
            priority: 2,
            completed_at: mockDate,
            duration_minutes: 120,
            outcome: undefined,
            created_at: mockDate,
        });

        jest.useRealTimers();
    });

    /** @aiContributed-2026-01-28 */
    it('should insert task into the database if useFallback is false', async () => {
        const mockRun = jest.fn((query: string, params: unknown[], callback: (err: Error | null) => void) => callback(null));
        (ticketDb as unknown as { db: { run: typeof mockRun } }).db = { run: mockRun };
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;

        const mockDate = '2023-01-01T00:00:00.000Z';
        jest.useFakeTimers().setSystemTime(new Date(mockDate));

        await expect(ticketDb.archiveTask('taskId2', 'Database Task', 'archived', 'ticketId2', 60)).resolves.not.toThrow();

        expect(mockRun).toHaveBeenCalledWith(
            `INSERT INTO completed_tasks (task_id, original_ticket_id, title, status, priority, completed_at, duration_minutes, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['taskId2', 'ticketId2', 'Database Task', 'archived', 2, mockDate, 60, mockDate],
            expect.any(Function)
        );

        jest.useRealTimers();
    });

    /** @aiContributed-2026-01-28 */
    it('should reject if the database is not initialized', async () => {
        (ticketDb as unknown as { db: null }).db = null;
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;

        await expect(ticketDb.archiveTask('taskId3', 'Uninitialized DB Task', 'failed')).rejects.toThrow('Database not initialized');
    });
});
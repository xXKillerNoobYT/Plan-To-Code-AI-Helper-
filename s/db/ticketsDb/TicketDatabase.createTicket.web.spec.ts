// ./ticketsDb.TicketDatabase.createTicket.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-26 */
describe('TicketDatabase - createTicket', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** @aiContributed-2026-01-26 */
    it('should create a ticket and store it in the fallback store when useFallback is true', async () => {
        const mockGenerateTicketId = jest.spyOn(ticketDb as unknown as { generateTicketId: () => string }, 'generateTicketId').mockReturnValue('mock-ticket-id');
        const mockDate = new Date('2023-01-01T00:00:00Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

        (ticketDb as unknown as { useFallback: boolean }).useFallback = true;

        const params = {
            type: 'ai_to_human' as const,
            priority: 1 as const,
            creator: 'user1',
            assignee: 'user2',
            title: 'Test Ticket',
            description: 'This is a test ticket description.',
        };

        const result = await ticketDb.createTicket(params);

        expect(result).toEqual({
            ticket_id: 'mock-ticket-id',
            type: 'ai_to_human',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            task_id: undefined,
            title: 'Test Ticket',
            description: 'This is a test ticket description.',
            thread: [],
            created_at: mockDate,
            updated_at: mockDate,
        });

        expect((ticketDb as unknown as { fallbackStore: Map<string, unknown> }).fallbackStore.get('mock-ticket-id')).toEqual(result);
        expect(mockGenerateTicketId).toHaveBeenCalled();
    });

    /** @aiContributed-2026-01-26 */
    it('should create a ticket and store it in SQLite when useFallback is false', async () => {
        const mockGenerateTicketId = jest.spyOn(ticketDb as unknown as { generateTicketId: () => string }, 'generateTicketId').mockReturnValue('mock-ticket-id');
        const mockDate = new Date('2023-01-01T00:00:00Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

        const mockDbRun = jest.fn((sql, values, callback: (err: Error | null) => void) => callback(null));
        (ticketDb as unknown as { db: { run: typeof mockDbRun } }).db = { run: mockDbRun };
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;

        const params = {
            type: 'human_to_ai' as const,
            priority: 2 as const,
            creator: 'user3',
            assignee: 'user4',
            title: 'Feature Ticket',
            description: 'This is a feature ticket description.',
        };

        const result = await ticketDb.createTicket(params);

        expect(result).toEqual({
            ticket_id: 'mock-ticket-id',
            type: 'human_to_ai',
            status: 'open',
            priority: 2,
            creator: 'user3',
            assignee: 'user4',
            task_id: undefined,
            title: 'Feature Ticket',
            description: 'This is a feature ticket description.',
            thread: [],
            created_at: mockDate,
            updated_at: mockDate,
        });

        expect(mockDbRun).toHaveBeenCalledWith(
            expect.any(String),
            [
                'mock-ticket-id',
                'human_to_ai',
                'open',
                2,
                'user3',
                'user4',
                null,
                'Feature Ticket',
                'This is a feature ticket description.',
                JSON.stringify([]),
                mockDate.toISOString(),
                mockDate.toISOString(),
            ],
            expect.any(Function)
        );
        expect(mockGenerateTicketId).toHaveBeenCalled();
    });

    /** @aiContributed-2026-01-26 */
    it('should fallback to in-memory store if SQLite insertion fails', async () => {
        const mockGenerateTicketId = jest.spyOn(ticketDb as unknown as { generateTicketId: () => string }, 'generateTicketId').mockReturnValue('mock-ticket-id');
        const mockDate = new Date('2023-01-01T00:00:00Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

        const mockDbRun = jest.fn((sql, values, callback: (err: Error | null) => void) => callback(new Error('SQLite error')));
        (ticketDb as unknown as { db: { run: typeof mockDbRun } }).db = { run: mockDbRun };
        (ticketDb as unknown as { useFallback: boolean }).useFallback = false;

        const params = {
            type: 'ai_to_human' as const,
            priority: 3 as const,
            creator: 'user5',
            assignee: 'user6',
            title: 'Task Ticket',
            description: 'This is a task ticket description.',
        };

        const result = await ticketDb.createTicket(params);

        expect(result).toEqual({
            ticket_id: 'mock-ticket-id',
            type: 'ai_to_human',
            status: 'open',
            priority: 3,
            creator: 'user5',
            assignee: 'user6',
            task_id: undefined,
            title: 'Task Ticket',
            description: 'This is a task ticket description.',
            thread: [],
            created_at: mockDate,
            updated_at: mockDate,
        });

        expect((ticketDb as unknown as { fallbackStore: Map<string, unknown> }).fallbackStore.get('mock-ticket-id')).toEqual(result);
        expect(mockDbRun).toHaveBeenCalled();
        expect(mockGenerateTicketId).toHaveBeenCalled();
    });
});
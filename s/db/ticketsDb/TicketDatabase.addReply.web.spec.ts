import { TicketDatabase } from '../../../src/db/ticketsDb';
import { AddReplyParams, Ticket } from '../../../src/types/ticket';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-26 */
describe('TicketDatabase - addReply', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        TicketDatabase.resetInstance();
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** @aiContributed-2026-01-26 */
    it('should add a reply to an existing ticket and update the updated_at field', async () => {
        const mockTicket: Ticket = {
            ticket_id: '123',
            type: 'ai_to_human',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            title: 'Sample Ticket',
            description: 'This is a sample ticket',
            thread: [],
            created_at: new Date('2023-01-01T00:00:00Z'),
            updated_at: new Date('2023-01-01T00:00:00Z'),
        };

        const mockReplyParams: AddReplyParams = {
            ticket_id: '123',
            author: 'user3',
            content: 'This is a reply',
        };

        const mockGetTicket = jest
            .spyOn(ticketDb as unknown as { getTicket: (id: string) => Promise<Ticket | null> }, 'getTicket')
            .mockResolvedValue(mockTicket);

        const mockGenerateReplyId = jest
            .spyOn(ticketDb as unknown as { generateReplyId: () => string }, 'generateReplyId')
            .mockReturnValue('reply-456');

        const mockDate = new Date('2023-01-02T00:00:00Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

        // Mock the database to avoid "Database not initialized" error
        (ticketDb as unknown as { db: { run: (sql: string, values: unknown[], callback: (err: Error | null) => void) => void } }).db = {
            run: jest.fn((sql, values, callback: (err: Error | null) => void) => callback(null)),
        };

        const updatedTicket = await ticketDb.addReply(mockReplyParams);

        expect(mockGetTicket).toHaveBeenCalledWith('123');
        expect(mockGenerateReplyId).toHaveBeenCalled();
        expect(updatedTicket).not.toBeNull();
        expect(updatedTicket?.thread.length).toBe(1);
        expect(updatedTicket?.thread[0]).toEqual({
            reply_id: 'reply-456',
            author: 'user3',
            content: 'This is a reply',
            clarity_score: undefined,
            created_at: mockDate,
        });
        expect(updatedTicket?.updated_at).toEqual(mockDate);
    });

    /** @aiContributed-2026-01-26 */
    it('should return null if the ticket does not exist', async () => {
        const mockReplyParams: AddReplyParams = {
            ticket_id: 'non-existent-id',
            author: 'user3',
            content: 'This is a reply',
        };

        jest.spyOn(ticketDb as unknown as { getTicket: (id: string) => Promise<Ticket | null> }, 'getTicket').mockResolvedValue(null);

        const result = await ticketDb.addReply(mockReplyParams);

        expect(result).toBeNull();
    });
});
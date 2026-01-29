// ./ticketsDb.TicketDatabase.rowToTicket.gptgen.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';

/** @aiContributed-2026-01-28 */
describe('TicketDatabase.rowToTicket', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        TicketDatabase.resetInstance();
    });

    /** @aiContributed-2026-01-28 */
    it('should correctly convert a database row to a Ticket object', () => {
        const row = {
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            task_id: 'task123',
            title: 'Sample Ticket',
            description: 'This is a sample ticket',
            thread: JSON.stringify([
                {
                    reply_id: 'reply1',
                    author: 'user1',
                    content: 'Initial reply',
                    clarity_score: 5,
                    created_at: '2023-01-01T00:00:00Z',
                },
            ]),
            resolution: 'Resolved',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
        };

        const result = ticketDb['rowToTicket'](row);

        expect(result).toEqual({
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            task_id: 'task123',
            title: 'Sample Ticket',
            description: 'This is a sample ticket',
            thread: [
                {
                    reply_id: 'reply1',
                    author: 'user1',
                    content: 'Initial reply',
                    clarity_score: 5,
                    created_at: '2023-01-01T00:00:00Z',
                },
            ],
            resolution: 'Resolved',
            created_at: new Date('2023-01-01T00:00:00Z'),
            updated_at: new Date('2023-01-02T00:00:00Z'),
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should handle invalid thread JSON gracefully', () => {
        const row = {
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            task_id: null,
            title: 'Sample Ticket',
            description: 'This is a sample ticket',
            thread: 'invalid-json',
            resolution: null,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
        };

        const result = ticketDb['rowToTicket'](row);

        expect(result).toEqual({
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            task_id: undefined,
            title: 'Sample Ticket',
            description: 'This is a sample ticket',
            thread: [],
            resolution: undefined,
            created_at: new Date('2023-01-01T00:00:00Z'),
            updated_at: new Date('2023-01-02T00:00:00Z'),
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should handle missing optional fields correctly', () => {
        const row = {
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            title: 'Sample Ticket',
            description: 'This is a sample ticket',
            thread: '[]',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
        };

        const result = ticketDb['rowToTicket'](row);

        expect(result).toEqual({
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            task_id: undefined,
            title: 'Sample Ticket',
            description: 'This is a sample ticket',
            thread: [],
            resolution: undefined,
            created_at: new Date('2023-01-01T00:00:00Z'),
            updated_at: new Date('2023-01-02T00:00:00Z'),
        });
    });
});
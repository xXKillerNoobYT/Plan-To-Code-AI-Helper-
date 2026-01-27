// ./ticketsDb.TicketDatabase.rowToTicket.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';
import { TicketRow } from '../../../src/types'; // Removed unused 'Ticket' import

/** @aiContributed-2026-01-26 */
describe('TicketDatabase.rowToTicket', () => {
    let ticketDb: TicketDatabase;

    beforeEach(() => {
        ticketDb = TicketDatabase.getInstance();
    });

    afterEach(() => {
        TicketDatabase.resetInstance();
    });

    /** @aiContributed-2026-01-26 */
    it('should correctly convert a database row to a Ticket object', () => {
        const row: TicketRow = {
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            task_id: 'task_456',
            title: 'Sample Ticket',
            description: 'This is a sample ticket.',
            thread: JSON.stringify([
                {
                    reply_id: 'reply_1',
                    author: 'user1',
                    content: 'Initial reply',
                    clarity_score: 5,
                    created_at: '2023-01-01T00:00:00.000Z',
                },
            ]),
            resolution: 'Resolved',
            created_at: '2023-01-01T00:00:00.000Z',
            updated_at: '2023-01-02T00:00:00.000Z',
        };

        const result = ticketDb.rowToTicket(row);

        expect(result).toEqual({
            ticket_id: '123',
            type: 'bug',
            status: 'open',
            priority: 1,
            creator: 'user1',
            assignee: 'user2',
            task_id: 'task_456',
            title: 'Sample Ticket',
            description: 'This is a sample ticket.',
            thread: [
                {
                    reply_id: 'reply_1',
                    author: 'user1',
                    content: 'Initial reply',
                    clarity_score: 5,
                    created_at: '2023-01-01T00:00:00.000Z',
                },
            ],
            resolution: 'Resolved',
            created_at: new Date('2023-01-01T00:00:00.000Z'),
            updated_at: new Date('2023-01-02T00:00:00.000Z'),
        });
    });

    /** @aiContributed-2026-01-26 */
    it('should handle invalid thread JSON gracefully', () => {
        const row: TicketRow = {
            ticket_id: '124',
            type: 'feature',
            status: 'inReview',
            priority: 2,
            creator: 'user3',
            assignee: 'user4',
            task_id: null,
            title: 'Another Ticket',
            description: 'This is another ticket.',
            thread: 'invalid_json',
            resolution: null,
            created_at: '2023-01-03T00:00:00.000Z',
            updated_at: '2023-01-04T00:00:00.000Z',
        };

        const result = ticketDb.rowToTicket(row);

        expect(result).toEqual({
            ticket_id: '124',
            type: 'feature',
            status: 'inReview',
            priority: 2,
            creator: 'user3',
            assignee: 'user4',
            task_id: undefined,
            title: 'Another Ticket',
            description: 'This is another ticket.',
            thread: [],
            resolution: undefined,
            created_at: new Date('2023-01-03T00:00:00.000Z'),
            updated_at: new Date('2023-01-04T00:00:00.000Z'),
        });
    });

    /** @aiContributed-2026-01-26 */
    it('should handle missing optional fields correctly', () => {
        const row: TicketRow = {
            ticket_id: '125',
            type: 'task',
            status: 'resolved',
            priority: 3,
            creator: 'user5',
            assignee: 'user6',
            title: 'Ticket without optional fields',
            description: 'This ticket has no optional fields.',
            thread: '[]',
            created_at: '2023-01-05T00:00:00.000Z',
            updated_at: '2023-01-06T00:00:00.000Z',
        };

        const result = ticketDb.rowToTicket(row);

        expect(result).toEqual({
            ticket_id: '125',
            type: 'task',
            status: 'resolved',
            priority: 3,
            creator: 'user5',
            assignee: 'user6',
            task_id: undefined,
            title: 'Ticket without optional fields',
            description: 'This ticket has no optional fields.',
            thread: [],
            resolution: undefined,
            created_at: new Date('2023-01-05T00:00:00.000Z'),
            updated_at: new Date('2023-01-06T00:00:00.000Z'),
        });
    });
});
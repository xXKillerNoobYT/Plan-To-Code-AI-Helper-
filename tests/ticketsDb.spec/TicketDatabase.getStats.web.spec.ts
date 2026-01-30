// ./ticketsDb.TicketDatabase.getStats.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';
import { jest } from '@jest/globals';
import { Ticket } from '../../src/types/ticket';

jest.mock('sqlite3', () => ({
  Database: jest.fn(() => ({
    run: jest.fn(),
    get: jest.fn(),
    close: jest.fn(),
  })),
}));

/** @aiContributed-2026-01-29 */
describe('TicketDatabase.getStats', () => {
  let ticketDb: TicketDatabase;

  beforeEach(() => {
    TicketDatabase.resetInstance();
    ticketDb = TicketDatabase.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** @aiContributed-2026-01-29 */
  it('should return correct stats when tickets have various statuses', async () => {
    const baseTicket: Ticket = {
      ticket_id: 'ticket-1',
      type: 'ai_to_human',
      status: 'open',
      priority: 1,
      creator: 'tester',
      assignee: 'agent',
      title: 'Test Ticket',
      description: 'Test description',
      thread: [],
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    };

    const mockTickets: Ticket[] = [
      { ...baseTicket, ticket_id: 'ticket-1', status: 'open' },
      { ...baseTicket, ticket_id: 'ticket-2', status: 'in_review' },
      { ...baseTicket, ticket_id: 'ticket-3', status: 'resolved' },
      { ...baseTicket, ticket_id: 'ticket-4', status: 'escalated' },
      { ...baseTicket, ticket_id: 'ticket-5', status: 'open' },
    ];

    const getAllTicketsSpy = jest.spyOn(ticketDb, 'getAllTickets') as jest.MockedFunction<
      typeof ticketDb.getAllTickets
    >;
    getAllTicketsSpy.mockResolvedValue(mockTickets);
    (ticketDb as unknown as { useFallback: boolean }).useFallback = true;

    const stats = await ticketDb.getStats();

    expect(stats).toEqual({
      total: 5,
      open: 2,
      inReview: 1,
      resolved: 1,
      escalated: 1,
      usingFallback: true,
    });
  });

  /** @aiContributed-2026-01-29 */
  it('should return zero stats when no tickets are available', async () => {
    const getAllTicketsSpy = jest.spyOn(ticketDb, 'getAllTickets') as jest.MockedFunction<
      typeof ticketDb.getAllTickets
    >;
    getAllTicketsSpy.mockResolvedValue([]);
    (ticketDb as unknown as { useFallback: boolean }).useFallback = false;

    const stats = await ticketDb.getStats();

    expect(stats).toEqual({
      total: 0,
      open: 0,
      inReview: 0,
      resolved: 0,
      escalated: 0,
      usingFallback: false,
    });
  });
});

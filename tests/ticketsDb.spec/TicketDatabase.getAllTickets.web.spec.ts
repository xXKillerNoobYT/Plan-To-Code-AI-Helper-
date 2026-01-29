// ./ticketsDb.TicketDatabase.getAllTickets.gptgen.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-28 */
describe('TicketDatabase.getAllTickets', () => {
  let ticketDb: TicketDatabase;

  beforeEach(() => {
    TicketDatabase.resetInstance();
    ticketDb = TicketDatabase.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** @aiContributed-2026-01-28 */
    it('should return tickets from fallbackStore when useFallback is true', async () => {
    const mockTickets = [
      { ticket_id: '1', status: 'open', priority: 1, created_at: new Date('2023-01-01T00:00:00Z'), updated_at: new Date('2023-01-01T00:00:00Z') },
      { ticket_id: '2', status: 'resolved', priority: 2, created_at: new Date('2023-01-02T00:00:00Z'), updated_at: new Date('2023-01-02T00:00:00Z') },
    ];
    (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
    (ticketDb as unknown as { fallbackStore: Map<string, typeof mockTickets[0]> }).fallbackStore = new Map(
      mockTickets.map(ticket => [ticket.ticket_id, ticket])
    );

    const result = await ticketDb.getAllTickets('open');

    expect(result).toEqual([mockTickets[0]]);
  });

  /** @aiContributed-2026-01-28 */
    it('should query the database when useFallback is false', async () => {
    const mockRows = [
      { ticket_id: '1', status: 'open', priority: 1, created_at: new Date('2023-01-01T00:00:00Z'), updated_at: new Date('2023-01-01T00:00:00Z') },
      { ticket_id: '2', status: 'resolved', priority: 2, created_at: new Date('2023-01-02T00:00:00Z'), updated_at: new Date('2023-01-02T00:00:00Z') },
    ];
    const mockDb = {
      all: jest.fn((sql: string, params: unknown[], callback: (err: Error | null, rows: typeof mockRows | null) => void) => {
        callback(null, mockRows);
      }),
    };
    (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
    (ticketDb as unknown as { db: typeof mockDb }).db = mockDb;
    jest.spyOn(ticketDb as unknown as { rowToTicket: (row: typeof mockRows[0]) => typeof mockRows[0] }, 'rowToTicket').mockImplementation(row => row);

    const result = await ticketDb.getAllTickets();

    expect(mockDb.all).toHaveBeenCalledWith(
      'SELECT * FROM tickets ORDER BY priority ASC, created_at DESC',
      [],
      expect.any(Function)
    );
    expect(result).toEqual(mockRows);
  });

  /** @aiContributed-2026-01-28 */
    it('should return fallbackStore tickets if database query fails', async () => {
    const mockTickets = [
      { ticket_id: '1', status: 'open', priority: 1, created_at: new Date('2023-01-01T00:00:00Z'), updated_at: new Date('2023-01-01T00:00:00Z') },
    ];
    const mockDb = {
      all: jest.fn((sql: string, params: unknown[], callback: (err: Error | null, rows: null) => void) => {
        callback(new Error('Database error'), null);
      }),
    };
    (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
    (ticketDb as unknown as { db: typeof mockDb }).db = mockDb;
    (ticketDb as unknown as { fallbackStore: Map<string, typeof mockTickets[0]> }).fallbackStore = new Map(
      mockTickets.map(ticket => [ticket.ticket_id, ticket])
    );

    const result = await ticketDb.getAllTickets();

    expect(result).toEqual(mockTickets);
  });

  /** @aiContributed-2026-01-28 */
    it('should reject with an error if the database is not initialized', async () => {
    (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
    (ticketDb as unknown as { db: null }).db = null;

    await expect(ticketDb.getAllTickets()).rejects.toThrow('Database not initialized');
  });
});
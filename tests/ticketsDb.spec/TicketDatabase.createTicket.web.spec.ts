// ./ticketsDb.TicketDatabase.createTicket.gptgen.web.spec.ts
import { TicketDatabase } from '../../src/db/ticketsDb';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-28 */
describe('TicketDatabase - createTicket', () => {
  let ticketDb: TicketDatabase;

  beforeEach(() => {
    TicketDatabase.resetInstance();
    ticketDb = TicketDatabase.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  /** @aiContributed-2026-01-28 */
  it('should create a ticket and store it in fallback when useFallback is true', async () => {
    const mockGenerateTicketId = jest.spyOn(ticketDb as unknown as { generateTicketId: () => string }, 'generateTicketId').mockReturnValue('mock-ticket-id');
    const mockDate = new Date('2023-01-01T00:00:00Z');
    jest.useFakeTimers().setSystemTime(mockDate);

    (ticketDb as unknown as { useFallback: boolean }).useFallback = true;

    const params = {
      type: 'ai_to_human' as const,
      priority: 1 as const,
      creator: 'creator1',
      assignee: 'assignee1',
      title: 'Test Ticket',
      description: 'This is a test ticket description.',
    };

    const result = await ticketDb.createTicket(params);

    expect(result).toEqual({
      ticket_id: 'mock-ticket-id',
      type: 'ai_to_human',
      status: 'open',
      priority: 1,
      creator: 'creator1',
      assignee: 'assignee1',
      task_id: undefined,
      title: 'Test Ticket',
      description: 'This is a test ticket description.',
      thread: [],
      created_at: mockDate,
      updated_at: mockDate,
    });

    expect((ticketDb as unknown as { fallbackStore: Map<string, unknown> }).fallbackStore.get('mock-ticket-id')).toEqual(result);
    expect(mockGenerateTicketId).toHaveBeenCalledTimes(1);
  });

  /** @aiContributed-2026-01-28 */
  it('should create a ticket and store it in SQLite when useFallback is false', async () => {
    const mockGenerateTicketId = jest.spyOn(ticketDb as unknown as { generateTicketId: () => string }, 'generateTicketId').mockReturnValue('mock-ticket-id');
    const mockDate = new Date('2023-01-01T00:00:00Z');
    jest.useFakeTimers().setSystemTime(mockDate);

    const mockDbRun = jest.fn((sql: string, values: unknown[], callback: (err: Error | null) => void) => callback(null));
    (ticketDb as unknown as { db: { run: typeof mockDbRun } }).db = { run: mockDbRun };
    (ticketDb as unknown as { useFallback: boolean }).useFallback = false;

    const params = {
      type: 'human_to_ai' as const,
      priority: 2 as const,
      creator: 'creator2',
      assignee: 'assignee2',
      title: 'Feature Ticket',
      description: 'This is a feature ticket description.',
    };

    const result = await ticketDb.createTicket(params);

    expect(result).toEqual({
      ticket_id: 'mock-ticket-id',
      type: 'human_to_ai',
      status: 'open',
      priority: 2,
      creator: 'creator2',
      assignee: 'assignee2',
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
        'creator2',
        'assignee2',
        null,
        'Feature Ticket',
        'This is a feature ticket description.',
        '[]',
        mockDate.toISOString(),
        mockDate.toISOString(),
      ],
      expect.any(Function)
    );
    expect(mockGenerateTicketId).toHaveBeenCalledTimes(1);
  });

  /** @aiContributed-2026-01-28 */
  it('should fallback to in-memory storage if SQLite insertion fails', async () => {
    const mockGenerateTicketId = jest.spyOn(ticketDb as unknown as { generateTicketId: () => string }, 'generateTicketId').mockReturnValue('mock-ticket-id');
    const mockDate = new Date('2023-01-01T00:00:00Z');
    jest.useFakeTimers().setSystemTime(mockDate);

    const mockDbRun = jest.fn((sql: string, values: unknown[], callback: (err: Error | null) => void) =>
      callback(new Error('SQLite error'))
    );
    (ticketDb as unknown as { db: { run: typeof mockDbRun } }).db = { run: mockDbRun };
    (ticketDb as unknown as { useFallback: boolean }).useFallback = false;

    const params = {
      type: 'ai_to_human' as const,
      priority: 3 as const,
      creator: 'creator3',
      assignee: 'assignee3',
      title: 'Task Ticket',
      description: 'This is a task ticket description.',
    };

    const result = await ticketDb.createTicket(params);

    expect(result).toEqual({
      ticket_id: 'mock-ticket-id',
      type: 'ai_to_human',
      status: 'open',
      priority: 3,
      creator: 'creator3',
      assignee: 'assignee3',
      task_id: undefined,
      title: 'Task Ticket',
      description: 'This is a task ticket description.',
      thread: [],
      created_at: mockDate,
      updated_at: mockDate,
    });

    expect((ticketDb as unknown as { fallbackStore: Map<string, unknown> }).fallbackStore.get('mock-ticket-id')).toEqual(result);
    expect(mockDbRun).toHaveBeenCalledTimes(1);
    expect(mockGenerateTicketId).toHaveBeenCalledTimes(1);
  });
});
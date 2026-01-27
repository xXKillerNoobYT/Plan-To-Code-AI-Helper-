// ./ticketsDb.TicketDatabase.getTicket.gptgen.web.spec.ts
import { TicketDatabase } from '../../../src/db/ticketsDb';
import { Database } from 'sqlite3';

jest.mock('sqlite3', () => {
  const mockDatabase = {
    ...jest.requireActual('sqlite3'),
    get: jest.fn(),
  };
  return { Database: jest.fn(() => mockDatabase) };
});

type FallbackTicket = {
  ticket_id: string;
  type: string;
  status: string;
  priority: number;
  creator: string;
  assignee: string;
  title: string;
  description: string;
  thread: unknown[]; // Updated from `any[]` to `unknown[]` to address the eslint warning
  created_at: Date;
  updated_at: Date;
};

describe('TicketDatabase.getTicket', () => {
  let ticketDb: TicketDatabase;
  let mockDb: jest.Mocked<Database>;

  beforeEach(async () => {
    TicketDatabase.resetInstance();
    ticketDb = TicketDatabase.getInstance();
    mockDb = new Database(':memory:') as jest.Mocked<Database>;
    (ticketDb as unknown as { db: jest.Mocked<Database> }).db = mockDb;
    (ticketDb as unknown as { useFallback: boolean }).useFallback = false;
    (ticketDb as unknown as { fallbackStore: Map<string, FallbackTicket> }).fallbackStore = new Map();
  });

  it('should return a ticket when found in the database', async () => {
    const mockRow = {
      ticket_id: '123',
      type: 'bug',
      status: 'open',
      priority: 1,
      creator: 'user1',
      assignee: 'user2',
      title: 'Sample Ticket',
      description: 'This is a sample ticket',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-02'),
    };

    mockDb.get.mockImplementation((sql: string, params: unknown[], callback: (err: Error | null, row: unknown) => void) => {
      callback(null, mockRow);
      return mockDb;
    });

    const result = await ticketDb.getTicket('123');
    expect(result).toEqual({
      ticket_id: '123',
      type: 'bug',
      status: 'open',
      priority: 1,
      creator: 'user1',
      assignee: 'user2',
      title: 'Sample Ticket',
      description: 'This is a sample ticket',
      thread: [],
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-02'),
    });
  });

  it('should return null when the ticket is not found in the database', async () => {
    mockDb.get.mockImplementation((sql: string, params: unknown[], callback: (err: Error | null, row: unknown) => void) => {
      callback(null, null);
      return mockDb;
    });

    const result = await ticketDb.getTicket('123');
    expect(result).toBeNull();
  });

  it('should return a ticket from the fallback store when useFallback is true', async () => {
    (ticketDb as unknown as { useFallback: boolean }).useFallback = true;
    const fallbackTicket: FallbackTicket = {
      ticket_id: '123',
      type: 'bug',
      status: 'open',
      priority: 1,
      creator: 'user1',
      assignee: 'user2',
      title: 'Fallback Ticket',
      description: 'This is a fallback ticket',
      thread: [],
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-02'),
    };
    (ticketDb as unknown as { fallbackStore: Map<string, FallbackTicket> }).fallbackStore.set('123', fallbackTicket);

    const result = await ticketDb.getTicket('123');
    expect(result).toEqual(fallbackTicket);
  });

  it('should return null when the fallback store does not have the ticket and useFallback is true', async () => {
    (ticketDb as unknown as { useFallback: boolean }).useFallback = true;

    const result = await ticketDb.getTicket('123');
    expect(result).toBeNull();
  });

  it('should handle database errors and try the fallback store', async () => {
    mockDb.get.mockImplementation((sql: string, params: unknown[], callback: (err: Error | null, row: unknown) => void) => {
      callback(new Error('Database error'), null);
      return mockDb;
    });

    const fallbackTicket: FallbackTicket = {
      ticket_id: '123',
      type: 'bug',
      status: 'open',
      priority: 1,
      creator: 'user1',
      assignee: 'user2',
      title: 'Fallback Ticket',
      description: 'This is a fallback ticket',
      thread: [],
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-02'),
    };
    (ticketDb as unknown as { fallbackStore: Map<string, FallbackTicket> }).fallbackStore.set('123', fallbackTicket);

    const result = await ticketDb.getTicket('123');
    expect(result).toEqual(fallbackTicket);
  });
});
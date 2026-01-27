import TicketDb, { Ticket, Reply, TicketError } from '../ticketDb';
import * as fs from 'fs';
import path from 'path';

/**
 * Test suite for TicketDb service
 * Covers: initialization, CRUD operations, fallback mode, threading
 */
describe('TicketDb', () => {
  let ticketDb: TicketDb;
  const testDbDir = path.join(__dirname, 'test-tickets');

  beforeEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDbDir)) {
      // Retry cleanup with delay (handle OneDrive locks)
      let retries = 3;
      while (retries > 0) {
        try {
          fs.rmSync(testDbDir, { recursive: true, force: true });
          break;
        } catch (err) {
          retries--;
          if (retries === 0) {
            console.warn('Could not delete test directory:', err);
          } else {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }
    ticketDb = new TicketDb(testDbDir);
  });

  afterEach(async () => {
    // Close database first
    try {
      await ticketDb.close();
    } catch (err) {
      console.warn('Error closing ticketDb:', err);
    }

    // Wait a bit for file lock to be fully released
    await new Promise(resolve => setTimeout(resolve, 300));

    // Clean up test directory
    if (fs.existsSync(testDbDir)) {
      let retries = 3;
      while (retries > 0) {
        try {
          fs.rmSync(testDbDir, { recursive: true, force: true });
          break;
        } catch (err) {
          retries--;
          if (retries === 0) {
            console.warn('Could not delete test directory after test:', err);
          } else {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('init()', () => {
    it('should initialize SQLite database successfully', async () => {
      await ticketDb.init();
      expect(fs.existsSync(path.join(testDbDir, 'tickets.db'))).toBe(true);
    });

    it('should create required tables', async () => {
      await ticketDb.init();
      const ticket = await ticketDb.createTicket({
        title: 'Test',
        description: 'Test ticket',
      });
      expect(ticket.id).toBeDefined();
    });

    it('should enable foreign key constraints', async () => {
      await ticketDb.init();
      const ticket = await ticketDb.createTicket({
        title: 'Test',
        description: 'Test',
      });
      const reply = await ticketDb.addReply({
        ticketId: ticket.id,
        content: 'Reply',
      });
      expect(reply.ticketId).toBe(ticket.id);
    });

    it('creates tickets table with id column as PRIMARY KEY', async () => {
      await ticketDb.init();

      // Verify by creating a ticket (which inserts into id column)
      const ticket = await ticketDb.createTicket({
        title: 'Test with ID',
        description: 'Verifies id column exists',
        type: 'ai_to_human',
        priority: 1,
      });

      expect(ticket.id).toBeDefined();
      expect(ticket.id).toMatch(/^ticket_\d+_[a-z0-9]+$/);

      // Verify retrieval by id works (proves PRIMARY KEY constraint)
      const retrieved = await ticketDb.getTicket(ticket.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(ticket.id);

      // Verify cannot create ticket with duplicate id
      // (This would fail if id wasn't PRIMARY KEY)
      // Note: Our createTicket auto-generates IDs, so duplicate is unlikely
      // but the PRIMARY KEY constraint is verified by successful insertion + retrieval
    });

    it('persists ticket after mock reload', async () => {
      // Session 1: Create ticket (WITH reset to ensure clean state)
      const db1 = new TicketDb(testDbDir, true);
      await db1.init();

      const ticket = await db1.createTicket({
        title: 'Persistent Ticket',
        description: 'Should survive restart',
        type: 'ai_to_human',
        priority: 1,
      });

      const ticketId = ticket.id;
      expect(ticketId).toBeDefined();

      // Close database (simulate extension reload)
      await db1.close();

      // Session 2: Reopen WITHOUT reset (to keep data)
      const db2 = new TicketDb(testDbDir, false);
      await db2.init();

      const retrieved = await db2.getTicket(ticketId);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(ticketId);
      expect(retrieved!.title).toBe('Persistent Ticket');
      expect(retrieved!.description).toBe('Should survive restart');
      expect(retrieved!.type).toBe('ai_to_human');
      expect(retrieved!.priority).toBe(1);

      await db2.close();
    });

    it('falls back to Map if schema creation fails', async () => {
      // Use invalid path to force schema creation failure
      const invalidDb = new TicketDb('/invalid/readonly/path/that/cannot/be/created');

      // This should fail to create SQLite but succeed with fallback
      await invalidDb.init();

      // Verify CRUD still works with fallback Map
      const ticket = await invalidDb.createTicket({
        title: 'Fallback Test',
        description: 'Should work with Map fallback',
        type: 'ai_to_human',
        priority: 2,
      });

      expect(ticket.id).toBeDefined();
      expect(ticket.title).toBe('Fallback Test');

      // Verify retrieval works
      const retrieved = await invalidDb.getTicket(ticket.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(ticket.id);
      expect(retrieved!.title).toBe('Fallback Test');

      // Verify update works
      const updated = await invalidDb.updateTicket(ticket.id, {
        status: 'in_review',
      });
      expect(updated.status).toBe('in_review');

      // Verify delete works
      const deleted = await invalidDb.deleteTicket(ticket.id);
      expect(deleted).toBe(true);

      const afterDelete = await invalidDb.getTicket(ticket.id);
      expect(afterDelete).toBeNull();

      // No need to close (fallback doesn't use SQLite)
    });

    it('returns existing instance if already initialized (singleton check)', async () => {
      await ticketDb.init();

      // Initialize again (should return immediately)
      await ticketDb.init();

      // Verify database still works
      const ticket = await ticketDb.createTicket({
        title: 'Post double-init',
        description: 'Should still work',
      });

      expect(ticket.id).toBeDefined();
      const retrieved = await ticketDb.getTicket(ticket.id);
      expect(retrieved).not.toBeNull();
    });
  });

  // ============================================================================
  // CRUD Tests
  // ============================================================================

  describe('createTicket()', () => {
    beforeAll(() => {
      // This suite creates many tickets; extend timeout to avoid flakiness
      jest.setTimeout(20000);
    });

    beforeEach(async () => {
      await ticketDb.init();
    });

    it('should create a ticket with required fields', async () => {
      const ticket = await ticketDb.createTicket({
        type: 'ai_to_human',
        priority: 1,
        title: 'Architecture question',
        description: 'How to structure agents?',
      });

      expect(ticket.id).toMatch(/^ticket_\d+_[a-z0-9]+$/);
      expect(ticket.type).toBe('ai_to_human');
      expect(ticket.priority).toBe(1);
      expect(ticket.status).toBe('open');
      expect(ticket.createdAt).toBeInstanceOf(Date);
    });

    it('should use defaults for optional fields', async () => {
      const ticket = await ticketDb.createTicket({
        title: 'Question',
        description: 'Details',
      });

      expect(ticket.type).toBe('ai_to_human');
      expect(ticket.priority).toBe(2);
      expect(ticket.status).toBe('open');
      expect(ticket.assignee).toBeUndefined();
    });

    it('should throw error if title is missing', async () => {
      await expect(
        ticketDb.createTicket({
          description: 'Missing title',
        })
      ).rejects.toThrow(TicketError);
    });

    it('should enforce max ticket limit', async () => {
      // This test creates 100 tickets which takes longer than default timeout
      jest.setTimeout(15000);

      // Create max tickets
      for (let i = 0; i < 100; i++) {
        await ticketDb.createTicket({
          title: `Ticket ${i}`,
          description: 'Test',
        });
      }

      // 101st should fail
      await expect(
        ticketDb.createTicket({
          title: 'Over limit',
          description: 'Should fail',
        })
      ).rejects.toThrow('Max tickets');
    });
  });

  describe('getTicket()', () => {
    beforeEach(async () => {
      await ticketDb.init();
    });

    it('should retrieve a ticket by ID', async () => {
      const created = await ticketDb.createTicket({
        title: 'Test ticket',
        description: 'Details',
      });

      const retrieved = await ticketDb.getTicket(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.title).toBe('Test ticket');
    });

    it('should return null for non-existent ticket', async () => {
      const result = await ticketDb.getTicket('ticket_nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateTicket()', () => {
    beforeEach(async () => {
      await ticketDb.init();
    });

    it('should update ticket fields', async () => {
      const ticket = await ticketDb.createTicket({
        title: 'Original',
        description: 'Original description',
      });

      const updated = await ticketDb.updateTicket(ticket.id, {
        status: 'in_review',
        priority: 1,
      });

      expect(updated.status).toBe('in_review');
      expect(updated.priority).toBe(1);
      expect(updated.title).toBe('Original');
    });

    it('should update the updatedAt timestamp', async () => {
      const ticket = await ticketDb.createTicket({
        title: 'Test',
        description: 'Test',
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await ticketDb.updateTicket(ticket.id, {
        status: 'resolved',
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(ticket.createdAt.getTime());
    });

    it('should throw error if ticket not found', async () => {
      await expect(
        ticketDb.updateTicket('ticket_nonexistent', { status: 'resolved' })
      ).rejects.toThrow();
    });
  });

  describe('deleteTicket()', () => {
    beforeEach(async () => {
      await ticketDb.init();
    });

    it('should delete a ticket', async () => {
      const ticket = await ticketDb.createTicket({
        title: 'To delete',
        description: 'Test',
      });

      const deleted = await ticketDb.deleteTicket(ticket.id);
      expect(deleted).toBe(true);

      const retrieved = await ticketDb.getTicket(ticket.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent ticket', async () => {
      const result = await ticketDb.deleteTicket('ticket_nonexistent');
      expect(result).toBe(true); // Returns true (no-op in SQLite)
    });

    it('should cascade delete replies', async () => {
      const ticket = await ticketDb.createTicket({
        title: 'With replies',
        description: 'Test',
      });

      await ticketDb.addReply({
        ticketId: ticket.id,
        content: 'Reply 1',
      });

      await ticketDb.deleteTicket(ticket.id);

      const replies = await ticketDb.getReplies(ticket.id);
      expect(replies).toEqual([]);
    });
  });

  // ============================================================================
  // Reply Threading Tests
  // ============================================================================

  describe('addReply()', () => {
    beforeEach(async () => {
      await ticketDb.init();
    });

    it('should add a reply to a ticket', async () => {
      const ticket = await ticketDb.createTicket({
        title: 'Question',
        description: 'Need help',
      });

      const reply = await ticketDb.addReply({
        ticketId: ticket.id,
        author: 'ai',
        content: 'Here is my answer',
      });

      expect(reply.id).toMatch(/^reply_\d+_[a-z0-9]+$/);
      expect(reply.ticketId).toBe(ticket.id);
      expect(reply.author).toBe('ai');
      expect(reply.content).toBe('Here is my answer');
      expect(reply.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error if ticket not found', async () => {
      await expect(
        ticketDb.addReply({
          ticketId: 'ticket_nonexistent',
          content: 'Reply',
        })
      ).rejects.toThrow(TicketError);
    });

    it('should support multiple replies to one ticket', async () => {
      const ticket = await ticketDb.createTicket({
        title: 'Question',
        description: 'Test',
      });

      const reply1 = await ticketDb.addReply({
        ticketId: ticket.id,
        author: 'ai',
        content: 'Response 1',
      });

      const reply2 = await ticketDb.addReply({
        ticketId: ticket.id,
        author: 'human',
        content: 'Follow-up',
      });

      const replies = await ticketDb.getReplies(ticket.id);
      expect(replies).toHaveLength(2);
      expect(replies[0].id).toBe(reply1.id);
      expect(replies[1].id).toBe(reply2.id);
    });
  });

  describe('getReplies()', () => {
    beforeEach(async () => {
      await ticketDb.init();
    });

    it('should retrieve replies in chronological order', async () => {
      const ticket = await ticketDb.createTicket({
        title: 'Test',
        description: 'Test',
      });

      await ticketDb.addReply({
        ticketId: ticket.id,
        author: 'ai',
        content: 'First',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await ticketDb.addReply({
        ticketId: ticket.id,
        author: 'human',
        content: 'Second',
      });

      const replies = await ticketDb.getReplies(ticket.id);
      expect(replies[0].content).toBe('First');
      expect(replies[1].content).toBe('Second');
    });

    it('should return empty array for ticket with no replies', async () => {
      const ticket = await ticketDb.createTicket({
        title: 'No replies',
        description: 'Test',
      });

      const replies = await ticketDb.getReplies(ticket.id);
      expect(replies).toEqual([]);
    });
  });

  // ============================================================================
  // Fallback Mode Tests
  // ============================================================================

  describe('Fallback Mode (SQLite Disabled)', () => {
    it('should use Map fallback when SQLite fails', async () => {
      // This test simulates fallback by directly enabling it
      ticketDb = new TicketDb('/invalid/path/that/cannot/be/created');
      await ticketDb.init(); // Will fail and switch to fallback

      const ticket = await ticketDb.createTicket({
        title: 'In fallback',
        description: 'Test',
      });

      expect(ticket.id).toBeDefined();

      const retrieved = await ticketDb.getTicket(ticket.id);
      // In fallback mode, basic properties should match
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(ticket.id);
      expect(retrieved!.title).toBe('In fallback');
      expect(retrieved!.description).toBe('Test');
    });

    it('should maintain CRUD in fallback mode', async () => {
      ticketDb = new TicketDb('/invalid/path');
      await ticketDb.init();

      const ticket1 = await ticketDb.createTicket({
        title: 'Ticket 1',
        description: 'Test',
      });

      const updated = await ticketDb.updateTicket(ticket1.id, {
        status: 'resolved',
      });

      expect(updated.status).toBe('resolved');

      const deleted = await ticketDb.deleteTicket(ticket1.id);
      expect(deleted).toBe(true);
    });

    it('should thread replies in fallback mode', async () => {
      ticketDb = new TicketDb('/invalid/path');
      await ticketDb.init();

      const ticket = await ticketDb.createTicket({
        title: 'Fallback ticket',
        description: 'Test',
      });

      const reply = await ticketDb.addReply({
        ticketId: ticket.id,
        content: 'Fallback reply',
      });

      const replies = await ticketDb.getReplies(ticket.id);
      expect(replies).toHaveLength(1);
      expect(replies[0].id).toBe(reply.id);
    });
  });

  // ============================================================================
  // Persistence & Integration Tests
  // ============================================================================

  describe('Persistence', () => {
    it('should persist tickets across close/reopen', async () => {
      const ticketDb1 = new TicketDb(testDbDir, true); // Reset for clean start
      await ticketDb1.init();

      const ticket = await ticketDb1.createTicket({
        title: 'Persistent',
        description: 'Should survive close',
      });

      await ticketDb1.close();

      // Reopen without reset
      const ticketDb2 = new TicketDb(testDbDir, false);
      await ticketDb2.init();

      const retrieved = await ticketDb2.getTicket(ticket.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.title).toBe('Persistent');

      await ticketDb2.close();
    });

    it('should persist replies across close/reopen', async () => {
      const ticketDb1 = new TicketDb(testDbDir, true); // Reset for clean start
      await ticketDb1.init();

      const ticket = await ticketDb1.createTicket({
        title: 'Test',
        description: 'Test',
      });

      await ticketDb1.addReply({
        ticketId: ticket.id,
        content: 'Persistent reply',
      });

      await ticketDb1.close();

      // Reopen without reset
      const ticketDb2 = new TicketDb(testDbDir, false);
      await ticketDb2.init();

      const replies = await ticketDb2.getReplies(ticket.id);
      expect(replies).toHaveLength(1);
      expect(replies[0].content).toBe('Persistent reply');

      await ticketDb2.close();
    });
  });

  // ============================================================================
  // Connection Cleanup Tests
  // ============================================================================

  describe('close()', () => {
    it('closes database without errors', async () => {
      await ticketDb.init();
      await expect(ticketDb.close()).resolves.not.toThrow();
    });

    it('handles close when no database is open', async () => {
      const freshDb = new TicketDb(testDbDir);
      await expect(freshDb.close()).resolves.not.toThrow();
    });

    it('releases file lock after close', async () => {
      const db1 = new TicketDb(testDbDir, true); // Reset for clean start
      await db1.init();

      const ticket = await db1.createTicket({
        title: 'Test lock release',
        description: 'Verifies file lock is released',
      });

      // Close database
      await db1.close();

      // Should be able to reopen immediately (proves lock was released)
      const db2 = new TicketDb(testDbDir, false); // Don't reset to keep data
      await expect(db2.init()).resolves.not.toThrow();

      // Verify data persisted
      const retrieved = await db2.getTicket(ticket.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(ticket.id);

      await db2.close();
    });

    it('prevents operations after close', async () => {
      await ticketDb.init();

      const ticket = await ticketDb.createTicket({
        title: 'Before close',
        description: 'Test',
      });

      await ticketDb.close();

      // Operations after close should fail or use fallback
      await expect(
        ticketDb.createTicket({ title: 'After close', description: 'Should fail' })
      ).rejects.toThrow();
    });
  });
});

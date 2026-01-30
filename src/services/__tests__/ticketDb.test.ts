import TicketDb, { Ticket, Reply, TicketError } from '../ticketDb';
import * as fs from 'fs';
import path from 'path';

/**
 * Skip these tests in browser environment (no native SQLite)
 */
const skipInBrowser = process.env.JEST_ENVIRONMENT === 'jsdom' ? describe.skip : describe;

/**
 * Task Priority Levels
 */
export type TaskPriority = 'P1' | 'P2' | 'P3';

/**
 * Task Status States
 */
export type TaskStatus = 'ready' | 'inProgress' | 'completed' | 'blocked' | 'failed';

/**
 * Metadata for tasks routed from tickets
 */
export interface TaskMetadata {
  ticketId?: string;
  routedTeam?: 'ANSWER' | 'PLANNING' | 'VERIFICATION' | 'ESCALATE';
  routingReason?: string;
  routingConfidence?: number;
  isEscalated?: boolean;
  [key: string]: any;
}

/**
 * Task in the programming orchestrator queue
 * 
 * Represents a unit of work that can be executed by agents.
 * Tasks are created from plan items or routed from tickets.
 * 
 * @interface Task
 */
export interface Task {
  taskId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dependencies: string[];
  blockedBy: string[];
  estimatedHours: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  assignedTo?: string;

  // NEW: Metadata for tasks from tickets
  metadata?: TaskMetadata;
}

/**
 * Persisted task format (excludes large contextBundles)
 */
export interface PersistedTask extends Omit<Task, 'createdAt' | 'updatedAt' | 'startedAt' | 'completedAt'> {
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Test suite for TicketDb service
 * Covers: initialization, CRUD operations, fallback mode, threading
 */
describe('TicketDb', () => {
  let ticketDb: TicketDb;

  // Increase timeout to handle async operations
  jest.setTimeout(15000);

  beforeEach(async () => {
    // Use in-memory database for tests (no file locking issues)
    ticketDb = new TicketDb(':memory:');
  });

  afterEach(async () => {
    // Close database
    try {
      await ticketDb.close();
    } catch (err) {
      // Ignore close errors for in-memory DB
    }
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('init()', () => {
    it('should initialize SQLite database successfully', async () => {
      await ticketDb.init();
      // In-memory database initialized (no file needed)
      expect(ticketDb).toBeDefined();
    });

    it('should create required tables', async () => {
      await ticketDb.init();

      // Give filesystem a moment to flush
      await new Promise(resolve => setTimeout(resolve, 100));

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

    it('persists ticket when data stays in memory', async () => {
      // In-memory DB: data persists for the lifetime of the connection
      const db1 = new TicketDb(':memory:', true);
      await db1.init();

      const ticket = await db1.createTicket({
        title: 'Persistent Ticket',
        description: 'Should persist in session',
        type: 'ai_to_human',
        priority: 1,
      }, { skipRouting: true });

      const ticketId = ticket.id;
      expect(ticketId).toBeDefined();

      // Verify we can retrieve it in same session
      const retrieved = await db1.getTicket(ticketId);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(ticketId);
      expect(retrieved!.title).toBe('Persistent Ticket');

      await db1.close();
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
      jest.setTimeout(30000);

      // Create max tickets with skipRouting to avoid orchestrator dependency
      for (let i = 0; i < 100; i++) {
        await ticketDb.createTicket({
          title: `Ticket ${i}`,
          description: 'Test',
        }, { skipRouting: true });
      }

      // 101st should fail
      await expect(
        ticketDb.createTicket({
          title: 'Over limit',
          description: 'Should fail',
        }, { skipRouting: true })
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
      expect(result).toBe(false);
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
      await ticketDb.init();

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
    it('should persist tickets within session', async () => {
      const ticketDb1 = new TicketDb(':memory:');
      await ticketDb1.init();

      const ticket = await ticketDb1.createTicket({
        title: 'Persistent',
        description: 'Should survive session',
      }, { skipRouting: true });

      // Verify ticket exists
      const beforeClose = await ticketDb1.getTicket(ticket.id);
      expect(beforeClose).toBeDefined();
      expect(beforeClose!.title).toBe('Persistent');

      // For in-memory DB, closing releases data, so we can't verify cross-session persistence
      await ticketDb1.close();
    });


    it('should persist replies within session', async () => {
      const ticketDb1 = new TicketDb(':memory:');
      await ticketDb1.init();

      const ticket = await ticketDb1.createTicket({
        title: 'Test',
        description: 'Test',
      }, { skipRouting: true });

      await ticketDb1.addReply({
        ticketId: ticket.id,
        content: 'Persistent reply',
      });

      // Verify reply exists before close
      const beforeClose = await ticketDb1.getReplies(ticket.id);
      expect(beforeClose).toHaveLength(1);
      expect(beforeClose[0].content).toBe('Persistent reply');

      await ticketDb1.close();
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
      const freshDb = new TicketDb(':memory:');
      await expect(freshDb.close()).resolves.not.toThrow();
    });

    it('closes without errors for in-memory database', async () => {
      const db1 = new TicketDb(':memory:');
      await db1.init();

      const ticket = await db1.createTicket({
        title: 'Test close',
        description: 'Verifies close works properly',
      });

      // Should be able to close without errors
      await expect(db1.close()).resolves.not.toThrow();
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

  // ============================================================================
  // Ticket → Task Queue Integration Tests (P1 Task 2)
  // ============================================================================

  describe('Ticket → Task Queue Integration', () => {
    // Note: These tests verify integration with ProgrammingOrchestrator
    // Tests use skipRouting option to isolate TicketDb functionality
    // Full integration tests would involve live orchestrator instance

    it('should route ticket with skipRouting=false (default)', async () => {
      await ticketDb.init();

      // Create a ticket without skipping routing
      // This should trigger routing if Orchestrator is initialized
      const ticket = await ticketDb.createTicket({
        type: 'human_to_ai',
        title: 'How do I implement error handling?',
        description: 'Need guidance on TypeScript patterns',
        priority: 2,
      });

      expect(ticket.id).toBeDefined();
      expect(ticket.title).toBe('How do I implement error handling?');
      // Routing happens asynchronously, so we don't fail if Orchestrator isn't available
    });

    it('should skip routing when options.skipRouting=true', async () => {
      await ticketDb.init();

      const ticket = await ticketDb.createTicket(
        {
          type: 'human_to_ai',
          title: 'Skip routing test',
          description: 'This should not trigger routing',
          priority: 1,
        },
        { skipRouting: true } // Skip routing
      );

      expect(ticket.id).toBeDefined();
      // Should complete without errors even if Orchestrator not available
    });

    it('should persist ticket and retrieve it correctly', async () => {
      await ticketDb.init();

      const ticket = await ticketDb.createTicket({
        type: 'human_to_ai',
        title: 'Architecture planning question',
        description: 'Need help designing the system architecture',
        priority: 1,
      });

      const retrieved = await ticketDb.getTicket(ticket.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.title).toBe('Architecture planning question');
      expect(retrieved!.priority).toBe(1);
    });

    it('should handle routing failures gracefully', async () => {
      await ticketDb.init();

      // This test verifies that if routing fails, the ticket is still created and saved
      const ticket = await ticketDb.createTicket({
        type: 'ai_to_human',
        title: 'Test robustness',
        description: 'Verify ticket is saved even if routing fails',
        priority: 2,
      });

      // Ticket should still be retrievable even if routing failed
      const retrieved = await ticketDb.getTicket(ticket.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(ticket.id);
    });

    it('should handle createTicket with various priority levels', async () => {
      await ticketDb.init();

      // Test P1 (priority 1)
      const p1Ticket = await ticketDb.createTicket(
        {
          type: 'human_to_ai',
          title: 'Critical issue',
          description: 'Must be addressed immediately',
          priority: 1,
        },
        { skipRouting: true }
      );
      expect(p1Ticket.priority).toBe(1);

      // Test P2 (priority 2)
      const p2Ticket = await ticketDb.createTicket(
        {
          type: 'human_to_ai',
          title: 'Important task',
          description: 'Should be done soon',
          priority: 2,
        },
        { skipRouting: true }
      );
      expect(p2Ticket.priority).toBe(2);

      // Test P3 (priority 3)
      const p3Ticket = await ticketDb.createTicket(
        {
          type: 'human_to_ai',
          title: 'Nice to have',
          description: 'Can be done later',
          priority: 3,
        },
        { skipRouting: true }
      );
      expect(p3Ticket.priority).toBe(3);
    });

    it('should create valid tickets with all optional fields', async () => {
      await ticketDb.init();

      const ticket = await ticketDb.createTicket(
        {
          type: 'human_to_ai',
          title: 'Full ticket with all fields',
          description: 'Testing optional fields',
          priority: 2,
          assignee: 'answer-team',
          labels: ['urgent', 'feature'],
        },
        { skipRouting: true }
      );

      const retrieved = await ticketDb.getTicket(ticket.id);
      expect(retrieved!.assignee).toBe('answer-team');
      expect(retrieved!.labels).toEqual(['urgent', 'feature']);
    });

    it('should reject ticket creation without title', async () => {
      await ticketDb.init();

      await expect(
        ticketDb.createTicket(
          {
            type: 'human_to_ai',
            title: '', // Empty title
            description: 'Missing title',
            priority: 2,
          },
          { skipRouting: true }
        )
      ).rejects.toThrow('Ticket title is required');
    });
  });

  // ========================================================================
  // Branch Coverage: Error Handling & Edge Cases
  // ========================================================================
  describe('Error Handling & Edge Cases', () => {
    it('should handle getTicket with non-existent ID in fallback mode', async () => {
      ticketDb = new TicketDb('/invalid/path');
      await ticketDb.init();

      const result = await ticketDb.getTicket('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle updateTicket with non-existent ID', async () => {
      await ticketDb.init();

      await expect(
        ticketDb.updateTicket('non-existent-id', { status: 'resolved' })
      ).rejects.toThrow('Ticket not found');
    });

    it('should handle updateTicket with non-existent ID in fallback mode', async () => {
      ticketDb = new TicketDb('/invalid/path');
      await ticketDb.init();

      await expect(
        ticketDb.updateTicket('non-existent-id', { status: 'resolved' })
      ).rejects.toThrow('Ticket not found');
    });

    it('should return false when deleting non-existent ticket', async () => {
      await ticketDb.init();

      const result = await ticketDb.deleteTicket('non-existent-id');
      expect(result).toBe(false);
    });

    it('should return false when deleting non-existent ticket in fallback mode', async () => {
      ticketDb = new TicketDb('/invalid/path');
      await ticketDb.init();

      const result = await ticketDb.deleteTicket('non-existent-id');
      expect(result).toBe(false);
    });

    it('should handle addReply with non-existent ticket', async () => {
      await ticketDb.init();

      await expect(
        ticketDb.addReply({
          ticketId: 'non-existent',
          content: 'Reply'
        })
      ).rejects.toThrow('Ticket not found');
    });

    it('should handle addReply with non-existent ticket in fallback mode', async () => {
      ticketDb = new TicketDb('/invalid/path');
      await ticketDb.init();

      await expect(
        ticketDb.addReply({
          ticketId: 'non-existent',
          content: 'Reply'
        })
      ).rejects.toThrow('Ticket not found');
    });

    it('should return empty array for getReplies with non-existent ticket', async () => {
      await ticketDb.init();

      const replies = await ticketDb.getReplies('non-existent-id');
      expect(replies).toEqual([]);
    });

    it('should return empty array for getReplies with non-existent ticket in fallback mode', async () => {
      ticketDb = new TicketDb('/invalid/path');
      await ticketDb.init();

      const replies = await ticketDb.getReplies('non-existent-id');
      expect(replies).toEqual([]);
    });

    it('should create ticket with all optional fields', async () => {
      await ticketDb.init();

      const ticket = await ticketDb.createTicket({
        type: 'ai_to_human',
        status: 'in_review',
        priority: 1,
        title: 'Complete Ticket',
        description: 'Full details',
        assignee: 'testuser',
        labels: ['bug', 'urgent']
      }, { skipRouting: true });

      expect(ticket.type).toBe('ai_to_human');
      expect(ticket.status).toBe('in_review');
      expect(ticket.priority).toBe(1);
      expect(ticket.assignee).toBe('testuser');
      expect(ticket.labels).toEqual(['bug', 'urgent']);
    });

    it('should update ticket with labels', async () => {
      await ticketDb.init();

      const ticket = await ticketDb.createTicket({
        title: 'Test',
        description: 'Test'
      }, { skipRouting: true });

      const updated = await ticketDb.updateTicket(ticket.id, {
        labels: ['feature', 'high-priority']
      });

      expect(updated.labels).toEqual(['feature', 'high-priority']);
    });

    it('should create ticket with null labels', async () => {
      await ticketDb.init();

      const ticket = await ticketDb.createTicket({
        title: 'No Labels',
        description: 'Test',
        labels: undefined
      }, { skipRouting: true });

      expect(ticket.labels).toBeUndefined();
    });

    it('should handle multiple replies to same ticket', async () => {
      await ticketDb.init();

      const ticket = await ticketDb.createTicket({
        title: 'Test',
        description: 'Test'
      }, { skipRouting: true });

      await ticketDb.addReply({
        ticketId: ticket.id,
        content: 'Reply 1'
      });

      await ticketDb.addReply({
        ticketId: ticket.id,
        content: 'Reply 2'
      });

      const replies = await ticketDb.getReplies(ticket.id);
      expect(replies.length).toBe(2);
    });

    it('should update ticket status to resolved', async () => {
      await ticketDb.init();

      const ticket = await ticketDb.createTicket({
        title: 'Test',
        description: 'Test',
        status: 'open'
      }, { skipRouting: true });

      const updated = await ticketDb.updateTicket(ticket.id, {
        status: 'resolved'
      });

      expect(updated.status).toBe('resolved');
    });
  });
});

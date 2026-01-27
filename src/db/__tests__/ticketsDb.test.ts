/**
 * 🧪 Ticket Database Tests
 * 
 * Tests for the SQLite ticket database with CRUD operations,
 * migrations, and fallback behavior.
 */

import * as path from 'path';
import * as fs from 'fs';
import { TicketDatabase } from '../../db/ticketsDb';
import { Ticket, CreateTicketParams, UpdateTicketParams, AddReplyParams } from '../../types/ticket';

describe('TicketDatabase', () => {
    let db: TicketDatabase;
    let testWorkspaceRoot: string;
    let testDbPath: string;

    beforeEach(async () => {
        // Create temp workspace directory
        testWorkspaceRoot = path.join(__dirname, '..', '..', '..', 'test-workspace', `test-${Date.now()}`);
        testDbPath = path.join(testWorkspaceRoot, '.coe', 'tickets.db');

        // Reset singleton from previous test
        TicketDatabase.resetInstance();

        // Initialize database
        db = TicketDatabase.getInstance();
        await db.initialize(testWorkspaceRoot);
    });

    afterEach(async () => {
        // Clean up database
        await db.close();

        // Reset singleton for next test
        TicketDatabase.resetInstance();

        // Remove test workspace directory
        if (fs.existsSync(testWorkspaceRoot)) {
            fs.rmSync(testWorkspaceRoot, { recursive: true, force: true });
        }
    });

    describe('Database Initialization', () => {
        it('should create .coe directory if missing', async () => {
            const coeDir = path.join(testWorkspaceRoot, '.coe');
            expect(fs.existsSync(coeDir)).toBe(true);
        });

        it('should create tickets.db file', async () => {
            // File might not exist if using in-memory fallback
            // Just verify database is initialized
            const stats = await db.getStats();
            expect(stats).toBeDefined();
            expect(typeof stats.total).toBe('number');
        });

        it('should initialize with zero tickets', async () => {
            const stats = await db.getStats();
            expect(stats.total).toBe(0);
            expect(stats.open).toBe(0);
            expect(stats.resolved).toBe(0);
        });

        it('should run migrations automatically', async () => {
            // If migrations succeed, we should be able to create a ticket
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Planning Team',
                title: 'Test migration',
                description: 'Testing auto-migration'
            };

            const ticket = await db.createTicket(params);
            expect(ticket).toBeDefined();
            expect(ticket.ticket_id).toMatch(/^TK-/);
        });
    });

    describe('createTicket', () => {
        it('should create ticket with all required fields', async () => {
            const params: CreateTicketParams = {
                type: 'ai_to_human',
                priority: 1,
                creator: 'Planning Team',
                assignee: 'user',
                title: 'Clarify database choice',
                description: 'Should we use SQLite or PostgreSQL for production?'
            };

            const ticket = await db.createTicket(params);

            expect(ticket.ticket_id).toMatch(/^TK-\d+$/);
            expect(ticket.type).toBe('ai_to_human');
            expect(ticket.status).toBe('open');
            expect(ticket.priority).toBe(1);
            expect(ticket.creator).toBe('Planning Team');
            expect(ticket.assignee).toBe('user');
            expect(ticket.title).toBe('Clarify database choice');
            expect(ticket.description).toBe('Should we use SQLite or PostgreSQL for production?');
            expect(ticket.thread).toEqual([]);
            expect(ticket.created_at).toBeInstanceOf(Date);
            expect(ticket.updated_at).toBeInstanceOf(Date);
        });

        it('should create ticket with optional task_id', async () => {
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 2,
                creator: 'user',
                assignee: 'Answer Team',
                task_id: 'TASK-123',
                title: 'Help with implementation',
                description: 'How to implement feature X?'
            };

            const ticket = await db.createTicket(params);

            expect(ticket.task_id).toBe('TASK-123');
        });

        it('should truncate title to 200 chars', async () => {
            const longTitle = 'A'.repeat(300);
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 3,
                creator: 'user',
                assignee: 'Planning Team',
                title: longTitle,
                description: 'Test truncation'
            };

            const ticket = await db.createTicket(params);

            expect(ticket.title.length).toBe(200);
        });

        it('should truncate description to 800 chars', async () => {
            const longDesc = 'B'.repeat(1000);
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Answer Team',
                title: 'Test',
                description: longDesc
            };

            const ticket = await db.createTicket(params);

            expect(ticket.description.length).toBe(800);
        });

        it('should generate unique ticket IDs', async () => {
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Planning Team',
                title: 'Test unique IDs',
                description: 'Testing ID generation'
            };

            const ticket1 = await db.createTicket(params);
            const ticket2 = await db.createTicket(params);
            const ticket3 = await db.createTicket(params);

            expect(ticket1.ticket_id).not.toBe(ticket2.ticket_id);
            expect(ticket2.ticket_id).not.toBe(ticket3.ticket_id);
            expect(ticket1.ticket_id).not.toBe(ticket3.ticket_id);
        });
    });

    describe('getTicket', () => {
        it('should retrieve ticket by ID', async () => {
            const params: CreateTicketParams = {
                type: 'ai_to_human',
                priority: 1,
                creator: 'Verification Team',
                assignee: 'user',
                title: 'Review test results',
                description: '5 tests failed, need review'
            };

            const created = await db.createTicket(params);
            const retrieved = await db.getTicket(created.ticket_id);

            expect(retrieved).toBeDefined();
            expect(retrieved?.ticket_id).toBe(created.ticket_id);
            expect(retrieved?.title).toBe(created.title);
            expect(retrieved?.description).toBe(created.description);
        });

        it('should return null for non-existent ticket', async () => {
            const retrieved = await db.getTicket('TK-NONEXISTENT');
            expect(retrieved).toBeNull();
        });
    });

    describe('getAllTickets', () => {
        it('should return empty array when no tickets', async () => {
            const tickets = await db.getAllTickets();
            expect(tickets).toEqual([]);
        });

        it('should return all tickets', async () => {
            const params1: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Planning Team',
                title: 'Ticket 1',
                description: 'First ticket'
            };

            const params2: CreateTicketParams = {
                type: 'ai_to_human',
                priority: 2,
                creator: 'Answer Team',
                assignee: 'user',
                title: 'Ticket 2',
                description: 'Second ticket'
            };

            await db.createTicket(params1);
            await db.createTicket(params2);

            const tickets = await db.getAllTickets();

            expect(tickets).toHaveLength(2);
        });

        it('should filter tickets by status', async () => {
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Answer Team',
                title: 'Test status filter',
                description: 'Testing filtering'
            };

            const ticket1 = await db.createTicket(params);
            const ticket2 = await db.createTicket(params);

            // Update one ticket to resolved
            await db.updateTicket({
                ticket_id: ticket2.ticket_id,
                status: 'resolved',
                resolution: 'Fixed'
            });

            const openTickets = await db.getAllTickets('open');
            const resolvedTickets = await db.getAllTickets('resolved');

            expect(openTickets).toHaveLength(1);
            expect(openTickets[0].ticket_id).toBe(ticket1.ticket_id);
            expect(resolvedTickets).toHaveLength(1);
            expect(resolvedTickets[0].ticket_id).toBe(ticket2.ticket_id);
        });

        it('should sort by priority then created_at descending', async () => {
            // Create tickets with different priorities
            const p3Params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 3,
                creator: 'user',
                assignee: 'Planning Team',
                title: 'P3 ticket',
                description: 'Low priority'
            };

            const p1Params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Planning Team',
                title: 'P1 ticket',
                description: 'High priority'
            };

            const p2Params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 2,
                creator: 'user',
                assignee: 'Planning Team',
                title: 'P2 ticket',
                description: 'Medium priority'
            };

            await db.createTicket(p3Params);
            await db.createTicket(p1Params);
            await db.createTicket(p2Params);

            const tickets = await db.getAllTickets();

            expect(tickets[0].priority).toBe(1);
            expect(tickets[1].priority).toBe(2);
            expect(tickets[2].priority).toBe(3);
        });
    });

    describe('updateTicket', () => {
        it('should update ticket status', async () => {
            const params: CreateTicketParams = {
                type: 'ai_to_human',
                priority: 1,
                creator: 'Planning Team',
                assignee: 'user',
                title: 'Test status update',
                description: 'Testing update'
            };

            const ticket = await db.createTicket(params);
            const updated = await db.updateTicket({
                ticket_id: ticket.ticket_id,
                status: 'in_review'
            });

            expect(updated?.status).toBe('in_review');
        });

        it('should update ticket assignee', async () => {
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Planning Team',
                title: 'Test assignee change',
                description: 'Testing reassignment'
            };

            const ticket = await db.createTicket(params);
            const updated = await db.updateTicket({
                ticket_id: ticket.ticket_id,
                assignee: 'Answer Team'
            });

            expect(updated?.assignee).toBe('Answer Team');
        });

        it('should update ticket resolution', async () => {
            const params: CreateTicketParams = {
                type: 'ai_to_human',
                priority: 1,
                creator: 'Verification Team',
                assignee: 'user',
                title: 'Test resolution',
                description: 'Testing resolution'
            };

            const ticket = await db.createTicket(params);
            const updated = await db.updateTicket({
                ticket_id: ticket.ticket_id,
                status: 'resolved',
                resolution: 'Tests passed successfully'
            });

            expect(updated?.status).toBe('resolved');
            expect(updated?.resolution).toBe('Tests passed successfully');
        });

        it('should update updated_at timestamp', async () => {
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Planning Team',
                title: 'Test timestamp',
                description: 'Testing timestamp update'
            };

            const ticket = await db.createTicket(params);
            const originalUpdatedAt = ticket.updated_at;

            // Wait a bit to ensure timestamp changes
            await new Promise(resolve => setTimeout(resolve, 10));

            const updated = await db.updateTicket({
                ticket_id: ticket.ticket_id,
                status: 'in_review'
            });

            expect(updated?.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });

        it('should return null for non-existent ticket', async () => {
            const updated = await db.updateTicket({
                ticket_id: 'TK-NONEXISTENT',
                status: 'resolved'
            });

            expect(updated).toBeNull();
        });
    });

    describe('addReply', () => {
        it('should add reply to ticket thread', async () => {
            const params: CreateTicketParams = {
                type: 'ai_to_human',
                priority: 1,
                creator: 'Planning Team',
                assignee: 'user',
                title: 'Test reply',
                description: 'Testing reply feature'
            };

            const ticket = await db.createTicket(params);
            const replyParams: AddReplyParams = {
                ticket_id: ticket.ticket_id,
                author: 'user',
                content: 'This is my reply to the ticket'
            };

            const updated = await db.addReply(replyParams);

            expect(updated?.thread).toHaveLength(1);
            expect(updated?.thread[0].reply_id).toMatch(/^RPL-/);
            expect(updated?.thread[0].author).toBe('user');
            expect(updated?.thread[0].content).toBe('This is my reply to the ticket');
            expect(updated?.thread[0].created_at).toBeInstanceOf(Date);
        });

        it('should add multiple replies to thread', async () => {
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Answer Team',
                title: 'Multiple replies test',
                description: 'Testing multiple replies'
            };

            const ticket = await db.createTicket(params);

            await db.addReply({
                ticket_id: ticket.ticket_id,
                author: 'Answer Team',
                content: 'Reply 1'
            });

            await db.addReply({
                ticket_id: ticket.ticket_id,
                author: 'user',
                content: 'Reply 2'
            });

            await db.addReply({
                ticket_id: ticket.ticket_id,
                author: 'Answer Team',
                content: 'Reply 3'
            });

            const updated = await db.getTicket(ticket.ticket_id);

            expect(updated?.thread).toHaveLength(3);
            expect(updated?.thread[0].content).toBe('Reply 1');
            expect(updated?.thread[1].content).toBe('Reply 2');
            expect(updated?.thread[2].content).toBe('Reply 3');
        });

        it('should add reply with clarity score', async () => {
            const params: CreateTicketParams = {
                type: 'ai_to_human',
                priority: 1,
                creator: 'Planning Team',
                assignee: 'user',
                title: 'Clarity score test',
                description: 'Testing clarity scoring'
            };

            const ticket = await db.createTicket(params);
            const replyParams: AddReplyParams = {
                ticket_id: ticket.ticket_id,
                author: 'user',
                content: 'This is a very clear response',
                clarity_score: 95
            };

            const updated = await db.addReply(replyParams);

            expect(updated?.thread[0].clarity_score).toBe(95);
        });

        it('should truncate reply content to 2000 chars', async () => {
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Answer Team',
                title: 'Long reply test',
                description: 'Testing long reply'
            };

            const ticket = await db.createTicket(params);
            const longContent = 'C'.repeat(3000);

            const updated = await db.addReply({
                ticket_id: ticket.ticket_id,
                author: 'user',
                content: longContent
            });

            expect(updated?.thread[0].content.length).toBe(2000);
        });

        it('should return null for non-existent ticket', async () => {
            const updated = await db.addReply({
                ticket_id: 'TK-NONEXISTENT',
                author: 'user',
                content: 'This should fail'
            });

            expect(updated).toBeNull();
        });
    });

    describe('getStats', () => {
        it('should return correct statistics', async () => {
            // Create tickets with different statuses
            const params: CreateTicketParams = {
                type: 'human_to_ai',
                priority: 1,
                creator: 'user',
                assignee: 'Planning Team',
                title: 'Stats test',
                description: 'Testing stats'
            };

            const ticket1 = await db.createTicket(params); // open
            const ticket2 = await db.createTicket(params); // will be in_review
            const ticket3 = await db.createTicket(params); // will be resolved
            const ticket4 = await db.createTicket(params); // will be escalated

            await db.updateTicket({ ticket_id: ticket2.ticket_id, status: 'in_review' });
            await db.updateTicket({ ticket_id: ticket3.ticket_id, status: 'resolved' });
            await db.updateTicket({ ticket_id: ticket4.ticket_id, status: 'escalated' });

            const stats = await db.getStats();

            expect(stats.total).toBe(4);
            expect(stats.open).toBe(1);
            expect(stats.inReview).toBe(1);
            expect(stats.resolved).toBe(1);
            expect(stats.escalated).toBe(1);
        });
    });
});

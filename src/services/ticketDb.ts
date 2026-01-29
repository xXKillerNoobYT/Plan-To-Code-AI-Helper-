import sqlite3 from 'sqlite3';
import path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { BossRouter } from './bossRouter';
import { TaskPriority, TaskStatus } from '../orchestrator/programmingOrchestrator';

// ============================================================================
// 🎫 Types & Interfaces
// ============================================================================

/**
 * Ticket represents an agent-human communication request
 */
export interface Ticket {
    id: string;
    type: 'ai_to_human' | 'human_to_ai';
    status: 'open' | 'in_review' | 'resolved' | 'rejected' | 'escalated';
    priority: 1 | 2 | 3;
    title: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    assignee?: string;
    labels?: string[];
}

/**
 * Reply represents a response thread on a ticket
 */
export interface Reply {
    id: string;
    ticketId: string;
    author: 'ai' | 'human';
    content: string;
    createdAt: Date;
}

/**
 * TicketError is thrown when ticket operations fail
 */
export class TicketError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TicketError';
    }
}

// ============================================================================
// 🗄️ TicketDb Service Class
// ============================================================================

/**
 * 🎫 TicketDb - Persistent ticket storage service
 *
 * Manages tickets and replies using SQLite with in-memory fallback.
 * If SQLite initialization fails, transparently falls back to Map-based storage.
 *
 * @class TicketDb
 * @example
 * const ticketDb = new TicketDb('.coe');
 * await ticketDb.init();
 * const ticket = await ticketDb.createTicket({
 *   type: 'ai_to_human',
 *   priority: 1,
 *   title: 'Architecture question',
 *   description: 'How should we structure agents?'
 * });
 */
/**
 * Retry configuration for handling OneDrive file locks
 */
interface RetryConfig {
    maxAttempts: number;
    delayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    delayMs: 500
};

export class TicketDb {
    private db: sqlite3.Database | null = null;
    private fallbackTickets: Map<string, Ticket> = new Map();
    private fallbackReplies: Map<string, Reply[]> = new Map();
    private useFallback = false;
    private isInitialized = false;
    private dbPath: string;
    private readonly maxTickets = 100;
    private readonly schemaVersion = 1;
    private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

    // DEV_RESET_DB: Drop and recreate tables on init (set false in production)
    // TODO: Remove after dev, use config instead
    private readonly DEV_RESET_DB: boolean;

    constructor(dbDir: string = '.coe', resetOnInit: boolean = true) {
        this.dbPath = path.join(dbDir, 'tickets.db');
        this.DEV_RESET_DB = resetOnInit;
    }

    /**
     * Initialize the ticket database with schema
     *
     * Creates tables if they don't exist. On failure, switches to in-memory fallback.
     * Checks schema version for future migration compatibility.
     * In dev mode (DEV_RESET_DB=true), drops and recreates tables for clean state.
     *
     * @async
     * @returns {Promise<void>}
     * @throws {TicketError} If permanent initialization failure (rare, fallback used)
     *
     * @example
     * await ticketDb.init();
     */
    async init(): Promise<void> {
        // Singleton check: return if already initialized
        if (this.isInitialized && this.db) {
            logger.info('[TicketDb] Already initialized, skipping');
            return;
        }

        try {
            const dbDir = path.dirname(this.dbPath);

            // Ensure directory exists
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
                logger.info(`[TicketDb] Created directory: ${dbDir}`);
            }

            logger.info(`[TicketDb] Opening database: ${this.dbPath}`);

            // Initialize SQLite connection
            this.db = await new Promise<sqlite3.Database>((resolve, reject) => {
                const db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        logger.error(`[TicketDb] SQLite connection failed: ${err.message}`, { err });
                        reject(err);
                    } else {
                        logger.info('[TicketDb] Database connection established');
                        resolve(db);
                    }
                });
            });

            if (!this.db) {
                throw new Error('Database connection failed');
            }

            // Create schema using serialize() for deterministic ordering
            await this.createSchema();

            logger.info('[TicketDb] Schema ready');
            logger.info('🎫 TicketDb initialized with SQLite backend');

            this.isInitialized = true;
            this.useFallback = false;

        } catch (error) {
            logger.error(`[TicketDb] Initialization error, falling back to Map: ${error}`, { error });
            logger.error(`[TicketDb] Stack trace: ${error instanceof Error ? error.stack : 'N/A'}`);
            this.useFallback = true;
            this.db = null;
            this.isInitialized = false;
        }
    }

    /**
     * 🏗️ Create or recreate database schema
     * 
     * In dev mode (DEV_RESET_DB=true): Drops existing tables first
     * Creates tickets, replies, and meta tables with proper PRIMARY KEY constraints
     * Uses db.serialize() to ensure operations execute in order
     * 
     * @private
     * @returns {Promise<void>}
     * @throws {Error} If schema creation fails
     */
    private async createSchema(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not open');
        }

        return new Promise((resolve, reject) => {
            this.db!.serialize(() => {
                logger.info('[TicketDb] Creating tables...');

                // DEV MODE: Drop tables if flag is set (fresh start for schema changes)
                if (this.DEV_RESET_DB) {
                    logger.warn('[TicketDb] DEV_RESET_DB=true, dropping existing tables');

                    this.db!.run('DROP TABLE IF EXISTS replies', (err) => {
                        if (err) {
                            logger.error('[TicketDb] Error dropping replies table:', err);
                        } else {
                            logger.info('[TicketDb] Dropped replies table');
                        }
                    });

                    this.db!.run('DROP TABLE IF EXISTS tickets', (err) => {
                        if (err) {
                            logger.error('[TicketDb] Error dropping tickets table:', err);
                        } else {
                            logger.info('[TicketDb] Dropped tickets table');
                        }
                    });

                    this.db!.run('DROP TABLE IF EXISTS meta', (err) => {
                        if (err) {
                            logger.error('[TicketDb] Error dropping meta table:', err);
                        } else {
                            logger.info('[TicketDb] Dropped meta table');
                        }
                    });
                }

                // Enable foreign keys
                this.db!.run('PRAGMA foreign_keys = ON', (err) => {
                    if (err) {
                        logger.error('[TicketDb] Error enabling foreign keys:', err);
                    } else {
                        logger.info('[TicketDb] Foreign keys enabled');
                    }
                });

                // Create tickets table
                const createTicketsTable = `
                    CREATE TABLE IF NOT EXISTS tickets (
                        id TEXT PRIMARY KEY,
                        type TEXT NOT NULL CHECK(type IN ('ai_to_human', 'human_to_ai')),
                        status TEXT NOT NULL CHECK(status IN ('open', 'in_review', 'resolved', 'rejected', 'escalated')),
                        priority INTEGER NOT NULL CHECK(priority IN (1, 2, 3)),
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        assignee TEXT,
                        labels TEXT
                    )
                `;

                this.db!.run(createTicketsTable, (err) => {
                    if (err) {
                        logger.error('[TicketDb] Error creating tickets table:', err);
                        logger.error('[TicketDb] SQL:', createTicketsTable);
                        reject(err);
                        return;
                    }
                    logger.info('[TicketDb] ✅ tickets table ready');
                });

                // Create replies table
                const createRepliesTable = `
                    CREATE TABLE IF NOT EXISTS replies (
                        id TEXT PRIMARY KEY,
                        ticket_id TEXT NOT NULL,
                        author TEXT NOT NULL CHECK(author IN ('ai', 'human')),
                        content TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
                    )
                `;

                this.db!.run(createRepliesTable, (err) => {
                    if (err) {
                        logger.error('[TicketDb] Error creating replies table:', err);
                        logger.error('[TicketDb] SQL:', createRepliesTable);
                        reject(err);
                        return;
                    }
                    logger.info('[TicketDb] ✅ replies table ready');
                });

                // Create meta table
                const createMetaTable = `
                    CREATE TABLE IF NOT EXISTS meta (
                        key TEXT PRIMARY KEY,
                        value TEXT
                    )
                `;

                this.db!.run(createMetaTable, (err) => {
                    if (err) {
                        logger.error('[TicketDb] Error creating meta table:', err);
                        logger.error('[TicketDb] SQL:', createMetaTable);
                        reject(err);
                        return;
                    }
                    logger.info('[TicketDb] ✅ meta table ready');
                });

                // Set schema version
                this.db!.run(
                    "INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', ?)",
                    [this.schemaVersion.toString()],
                    (err) => {
                        if (err) {
                            logger.error('[TicketDb] Error setting schema version:', err);
                            reject(err);
                            return;
                        }
                        logger.info('[TicketDb] Schema version set');
                        resolve();
                    }
                );
            });
        });
    }

    /**
     * Create a new ticket
     *
     * Generates unique ID and timestamps, validates required fields.
     * Enforces max ticket limit to prevent bloat.
     * Automatically routes ticket to appropriate agent team and adds task to queue.
     *
     * @param {Partial<Ticket>} ticket - Ticket data (type, priority, title, description)
     * @param {Object} options - Optional configuration
     * @param {boolean} options.skipRouting - Skip automatic routing (default: false)
     * @returns {Promise<Ticket>} Created ticket with ID and timestamps
     * @throws {TicketError} If limit exceeded or required fields missing
     *
     * @example
     * const ticket = await ticketDb.createTicket({
     *   type: 'ai_to_human',
     *   priority: 1,
     *   title: 'Agent coordination question',
     *   description: 'How to implement task routing?'
     * });
     */
    async createTicket(ticket: Partial<Ticket>, options?: { skipRouting?: boolean }): Promise<Ticket> {
        const id = `ticket_${Date.now()}_${randomUUID().substring(0, 8)}`;
        const now = new Date();

        const fullTicket: Ticket = {
            id,
            type: ticket.type || 'ai_to_human',
            status: ticket.status || 'open',
            priority: ticket.priority || 2,
            title: ticket.title || '',
            description: ticket.description || '',
            createdAt: now,
            updatedAt: now,
            assignee: ticket.assignee,
            labels: ticket.labels,
        };

        // Validate
        if (!fullTicket.title) {
            throw new TicketError('Ticket title is required');
        }

        try {
            if (this.useFallback) {
                if (this.fallbackTickets.size >= this.maxTickets) {
                    throw new TicketError(`Max tickets (${this.maxTickets}) reached`);
                }
                this.fallbackTickets.set(id, fullTicket);

                // Route and enqueue even in fallback mode (unless skipped)
                if (!options?.skipRouting) {
                    try {
                        await this.routeAndEnqueueTicket(fullTicket);
                    } catch (error) {
                        logger.warn(`Failed to route ticket in fallback mode: ${error}`);
                    }
                }

                return fullTicket;
            }

            // Check count
            const countResult = await this.getAsync('SELECT COUNT(*) as count FROM tickets');
            if (countResult && countResult.count >= this.maxTickets) {
                throw new TicketError(`Max tickets (${this.maxTickets}) reached`);
            }

            const labels = fullTicket.labels ? JSON.stringify(fullTicket.labels) : null;

            await this.runWithRetry(() => this.runAsync(
                `INSERT INTO tickets (id, type, status, priority, title, description, assignee, labels)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    fullTicket.id,
                    fullTicket.type,
                    fullTicket.status,
                    fullTicket.priority,
                    fullTicket.title,
                    fullTicket.description,
                    fullTicket.assignee || null,
                    labels,
                ]
            ));

            // Route and enqueue ticket to task queue (unless explicitly skipped)
            if (!options?.skipRouting) {
                try {
                    await this.routeAndEnqueueTicket(fullTicket);
                } catch (error) {
                    // Log error but don't throw - ticket is already saved
                    logger.error(`Failed to route/enqueue ticket ${fullTicket.id}: ${error}`);
                }
            }

            return fullTicket;
        } catch (error) {
            if (error instanceof TicketError) throw error;
            logger.error(`🎫 Failed to create ticket: ${error}`, { error });
            throw new TicketError(`Create ticket failed: ${error}`);
        }
    }

    /**
     * 🎯 Route ticket to agent team and add task to orchestrator queue
     * 
     * Private method called automatically by createTicket().
     * Routes ticket using BossRouter, then creates a task in the orchestrator queue.
     * Includes error handling to avoid losing tickets if routing fails.
     * 
     * @private
     * @param {Ticket} ticket - The ticket to route
     * @returns {Promise<void>}
     */
    private async routeAndEnqueueTicket(ticket: Ticket): Promise<void> {
        try {
            // Get singleton instances
            const router = BossRouter.getInstance();

            // Dynamically import to avoid circular dependency
            // getOrchestrator() is exported from extension.ts
            let orchestrator;
            try {
                const extensionModule = await import('../extension');
                orchestrator = extensionModule.getOrchestrator();
            } catch (error) {
                logger.warn('Orchestrator not available yet, skipping task enqueue');
                return;
            }

            if (!orchestrator) {
                logger.info('Orchestrator not initialized, skipping routing');
                return;
            }

            // Convert TicketDb.Ticket to format expected by BossRouter
            // BossRouter expects: ticket_id, type, priority, title, description
            const ticketForRouter = {
                ticket_id: ticket.id,
                type: ticket.type,
                priority: ticket.priority,
                title: ticket.title,
                description: ticket.description,
                status: ticket.status,
                creator: ticket.assignee || 'system',
                assignee: ticket.assignee || 'unassigned',
                thread: [],
                created_at: ticket.createdAt,
                updated_at: ticket.updatedAt,
            };

            // Route ticket to determine agent team
            let routedTeam: string;
            try {
                routedTeam = router.routeTicket(ticketForRouter as any);
                logger.info(`🎯 Ticket ${ticket.id} routed to ${routedTeam}`);
            } catch (error) {
                logger.warn(`Failed to route ticket ${ticket.id}, escalating: ${error}`);
                routedTeam = 'escalate';
            }

            // Check if task already exists for this ticket (duplicate prevention)
            const taskExists = await orchestrator.hasTaskForTicket(ticket.id);
            if (taskExists) {
                logger.info(`⏭️ Task already exists for ticket ${ticket.id}, skipping enqueue`);
                return;
            }

            // Create task object with metadata linking to ticket
            const taskId = `task-${ticket.id}`;
            const task = {
                taskId,
                title: ticket.title,
                description: ticket.description,
                // Map ticket priority (1,2,3) to task priority (P1, P2, P3)
                priority: ticket.priority === 1 ? TaskPriority.P1 :
                    ticket.priority === 2 ? TaskPriority.P2 :
                        TaskPriority.P3,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: [
                    `Address ticket: ${ticket.title}`,
                    'Provide complete and accurate response',
                    'Assign to appropriate team for follow-up'
                ],
                relatedFiles: [],
                fromPlanningTeam: true, // Tickets treated as planning items from user
                createdAt: new Date(),
                assignedTo: routedTeam,
                // Store ticket metadata for reference
                metadata: {
                    ticketId: ticket.id,
                    routedTeam: routedTeam,
                    isFromTicket: true,
                }
            };

            // Add task to orchestrator queue
            orchestrator.addTask(task);
            logger.info(`✅ Ticket ${ticket.id} routed to ${routedTeam} → queued as task ${taskId}`);

        } catch (error) {
            // Non-critical error - ticket is already saved
            // Don't re-throw, just log
            logger.error(`Failed to route/enqueue ticket: ${error}`);
        }
    }

    /**
     * Get a ticket by ID
     *
     * @param {string} id - Ticket ID
     * @returns {Promise<Ticket | null>} Ticket or null if not found
     *
     * @example
     * const ticket = await ticketDb.getTicket('ticket_123_xyz');
     */
    async getTicket(id: string): Promise<Ticket | null> {
        try {
            if (this.useFallback) {
                return this.fallbackTickets.get(id) || null;
            }

            const row = await this.getAsync('SELECT * FROM tickets WHERE id = ?', [id]);
            return row ? this.rowToTicket(row) : null;
        } catch (error) {
            logger.error(`🎫 Failed to get ticket ${id}: ${error}`, { error });
            throw new TicketError(`Get ticket failed: ${error}`);
        }
    }

    /**
     * Update a ticket
     *
     * Merges updates with existing ticket, updates timestamp.
     *
     * @param {string} id - Ticket ID
     * @param {Partial<Ticket>} updates - Fields to update (status, priority, etc.)
     * @returns {Promise<Ticket>} Updated ticket
     * @throws {TicketError} If ticket not found
     *
     * @example
     * const updated = await ticketDb.updateTicket('ticket_123_xyz', {
     *   status: 'resolved',
     *   priority: 1
     * });
     */
    async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
        try {
            const existing = await this.getTicket(id);
            if (!existing) {
                throw new TicketError(`Ticket not found: ${id}`);
            }

            const updated: Ticket = { ...existing, ...updates, id, updatedAt: new Date() };

            if (this.useFallback) {
                this.fallbackTickets.set(id, updated);
                return updated;
            }

            const labels = updated.labels ? JSON.stringify(updated.labels) : null;

            await this.runWithRetry(() => this.runAsync(
                `UPDATE tickets SET type=?, status=?, priority=?, title=?, description=?, assignee=?, labels=?, updated_at=CURRENT_TIMESTAMP
         WHERE id = ?`,
                [
                    updated.type,
                    updated.status,
                    updated.priority,
                    updated.title,
                    updated.description,
                    updated.assignee || null,
                    labels,
                    id,
                ]
            ));

            return updated;
        } catch (error) {
            if (error instanceof TicketError) throw error;
            logger.error(`🎫 Failed to update ticket ${id}: ${error}`, { error });
            throw new TicketError(`Update ticket failed: ${error}`);
        }
    }

    /**
     * Delete a ticket and its replies
     *
     * @param {string} id - Ticket ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     *
     * @example
     * const deleted = await ticketDb.deleteTicket('ticket_123_xyz');
     */
    async deleteTicket(id: string): Promise<boolean> {
        try {
            if (this.useFallback) {
                const existed = this.fallbackTickets.has(id);
                this.fallbackTickets.delete(id);
                this.fallbackReplies.delete(id);
                return existed;
            }

            await this.runWithRetry(() => this.runAsync('DELETE FROM tickets WHERE id = ?', [id]));
            return true;
        } catch (error) {
            logger.error(`🎫 Failed to delete ticket ${id}: ${error}`, { error });
            throw new TicketError(`Delete ticket failed: ${error}`);
        }
    }

    /**
     * Add a reply to a ticket
     *
     * Creates threaded conversation on a ticket.
     *
     * @param {Partial<Reply>} reply - Reply data (ticketId, author, content)
     * @returns {Promise<Reply>} Created reply with ID and timestamp
     * @throws {TicketError} If ticket not found
     *
     * @example
     * const reply = await ticketDb.addReply({
     *   ticketId: 'ticket_123_xyz',
     *   author: 'ai',
     *   content: 'Here is my answer based on the codebase...'
     * });
     */
    async addReply(reply: Partial<Reply>): Promise<Reply> {
        const id = `reply_${Date.now()}_${randomUUID().substring(0, 8)}`;

        const fullReply: Reply = {
            id,
            ticketId: reply.ticketId || '',
            author: reply.author || 'ai',
            content: reply.content || '',
            createdAt: new Date(),
        };

        try {
            // Verify ticket exists
            const ticket = await this.getTicket(fullReply.ticketId);
            if (!ticket) {
                throw new TicketError(`Ticket not found: ${fullReply.ticketId}`);
            }

            if (this.useFallback) {
                if (!this.fallbackReplies.has(fullReply.ticketId)) {
                    this.fallbackReplies.set(fullReply.ticketId, []);
                }
                this.fallbackReplies.get(fullReply.ticketId)!.push(fullReply);
                return fullReply;
            }

            await this.runWithRetry(() => this.runAsync(
                `INSERT INTO replies (id, ticket_id, author, content)
         VALUES (?, ?, ?, ?)`,
                [fullReply.id, fullReply.ticketId, fullReply.author, fullReply.content]
            ));

            return fullReply;
        } catch (error) {
            if (error instanceof TicketError) throw error;
            logger.error(`🎫 Failed to add reply: ${error}`, { error });
            throw new TicketError(`Add reply failed: ${error}`);
        }
    }

    /**
     * Get all replies for a ticket
     *
     * @param {string} ticketId - Ticket ID
     * @returns {Promise<Reply[]>} Array of replies ordered by creation date
     *
     * @example
     * const replies = await ticketDb.getReplies('ticket_123_xyz');
     * // Process replies: replies.forEach(r => { handleReply(r.content); });
     */

    async getReplies(ticketId: string): Promise<Reply[]> {
        try {
            if (this.useFallback) {
                return this.fallbackReplies.get(ticketId) || [];
            }

            const rows = await this.allAsync(
                `SELECT * FROM replies WHERE ticket_id = ? ORDER BY created_at ASC`,
                [ticketId]
            );

            return rows.map(row => this.rowToReply(row));
        } catch (error) {
            logger.error(`🎫 Failed to get replies for ${ticketId}: ${error}`, { error });
            throw new TicketError(`Get replies failed: ${error}`);
        }
    }

    /**
     * 🗑️ Close database connection and release resources
     * 
     * Safely closes SQLite connection with retry logic and nulls the handle
     * to ensure file lock is released (important for OneDrive/Windows).
     * 
     * @async
     * @returns {Promise<void>}
     */
    async close(): Promise<void> {
        if (!this.db) {
            logger.info('[TicketDb] No database to close');
            return;
        }

        logger.info(`[TicketDb] Closing database at ${new Date().toISOString()}`);

        try {
            await new Promise<void>((resolve, reject) => {
                this.db!.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            logger.info(`[TicketDb] ✅ Database closed successfully at ${new Date().toISOString()}`);
        } catch (error) {
            logger.error('[TicketDb] Error closing database:', error);
            logger.error('[TicketDb] Stack trace:', error instanceof Error ? error.stack : 'N/A');

            // Retry once after delay (OneDrive workaround)
            logger.warn('[TicketDb] Retrying close after 1000ms delay...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                await new Promise<void>((resolve, reject) => {
                    this.db!.close((err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                logger.info('[TicketDb] ✅ Database closed successfully on retry');
            } catch (retryError) {
                logger.error('[TicketDb] Failed to close database on retry:', retryError);
                throw retryError;
            }
        } finally {
            // Always null the handle to release reference
            this.db = null;
            this.isInitialized = false;
            logger.info('[TicketDb] Database handle nulled and initialization flag reset');
        }
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Run operation with retry logic for EBUSY errors
     * 
     * Retries operations that fail with EBUSY/locked errors (common on OneDrive).
     * After max retries, switches to fallback mode.
     * 
     * @param operation - Async operation to retry
     * @param attemptNum - Current attempt number (internal)
     * @returns Promise resolving to operation result
     */
    private async runWithRetry<T>(
        operation: () => Promise<T>,
        attemptNum: number = 1
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            const isEBUSY = errMsg.includes('EBUSY') || errMsg.includes('locked');

            if (isEBUSY && attemptNum < this.retryConfig.maxAttempts) {
                logger.warn(
                    `⚠️  DB operation failed (attempt ${attemptNum}/${this.retryConfig.maxAttempts}): ${errMsg} - retrying...`
                );
                await new Promise(resolve => setTimeout(resolve, this.retryConfig.delayMs));
                return this.runWithRetry(operation, attemptNum + 1);
            }

            // Max retries exceeded or non-EBUSY error
            if (isEBUSY) {
                logger.error(
                    `❌ DB operation failed after ${this.retryConfig.maxAttempts} attempts - switching to fallback`
                );
                this.useFallback = true;
            }
            throw error;
        }
    }

    private async runAsync(sql: string, params: any[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    private async getAsync(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    private async allAsync(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    private rowToTicket(row: any): Ticket {
        return {
            id: row.id,
            type: row.type,
            status: row.status,
            priority: row.priority,
            title: row.title,
            description: row.description,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            assignee: row.assignee,
            labels: row.labels ? JSON.parse(row.labels) : undefined,
        };
    }

    private rowToReply(row: any): Reply {
        return {
            id: row.id,
            ticketId: row.ticket_id,
            author: row.author,
            content: row.content,
            createdAt: new Date(row.created_at),
        };
    }
}

export default TicketDb;



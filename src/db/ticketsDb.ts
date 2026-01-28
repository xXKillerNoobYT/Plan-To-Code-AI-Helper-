/**
 * 🗄️ Ticket Database Manager
 * 
 * SQLite database for persistent ticket storage with automatic migrations.
 * Falls back to in-memory Map storage if SQLite fails.
 * 
 * Features:
 * - Auto-create .coe/tickets.db on first run
 * - CRUD operations: create, get, update, addReply
 * - JSON thread storage (array of replies)
 * - Auto-migration with "CREATE TABLE IF NOT EXISTS"
 * - Fallback to in-memory storage on DB errors
 */

import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import {
    Ticket,
    TicketReply,
    CreateTicketParams,
    UpdateTicketParams,
    AddReplyParams
} from '../types/ticket';

/**
 * Database configuration
 */
interface TicketDbConfig {
    dbPath: string;         // Path to SQLite database file
    autoMigrate: boolean;   // Auto-run migrations on init
    skipPlaceholder?: boolean; // Skip creating placeholder ticket (for testing)
}

/**
 * Default database configuration
 */
const DEFAULT_CONFIG: TicketDbConfig = {
    dbPath: '.coe/tickets.db',
    autoMigrate: true
};

/**
 * TicketDatabase - Manages ticket persistence with SQLite
 * 
 * Usage:
 * ```typescript
 * const db = TicketDatabase.getInstance();
 * await db.initialize(workspaceRoot);
 * const ticket = await db.createTicket({ ... });
 * ```
 */
export class TicketDatabase {
    private static instance: TicketDatabase | null = null;
    private db: sqlite3.Database | null = null;
    private fallbackStore: Map<string, Ticket> = new Map();
    private useFallback: boolean = false;
    private config: TicketDbConfig = DEFAULT_CONFIG;
    private initialized: boolean = false;

    private constructor() { }

    /**
     * Get singleton instance
     */
    static getInstance(): TicketDatabase {
        if (!TicketDatabase.instance) {
            TicketDatabase.instance = new TicketDatabase();
        }
        return TicketDatabase.instance;
    }

    /**
     * Reset singleton instance (for testing only)
     */
    static resetInstance(): void {
        TicketDatabase.instance = null;
    }

    /**
     * Initialize database with workspace root
     * - Creates .coe directory if missing
     * - Creates tickets.db file if missing
     * - Runs migrations (CREATE TABLE IF NOT EXISTS)
     * - Falls back to in-memory Map on errors
     * - Strategy B/C: Adds placeholder task on NEW database, leaves existing DB empty
     * 
     * @param workspaceRoot - Path to workspace root (VS Code workspace folder)
     * @param customConfig - Optional custom configuration
     */
    async initialize(workspaceRoot: string, customConfig?: Partial<TicketDbConfig>): Promise<void> {
        if (this.initialized) {
            console.log('TicketDatabase already initialized');
            return;
        }

        try {
            // Merge custom config with defaults
            this.config = { ...DEFAULT_CONFIG, ...customConfig };

            // Build absolute DB path
            const coeDir = path.join(workspaceRoot, '.coe');
            const dbPath = path.join(workspaceRoot, this.config.dbPath);

            // **B/C Strategy**: Check if database is NEW or EXISTING
            const isNewDatabase = !fs.existsSync(dbPath);

            // Create .coe directory if missing
            if (!fs.existsSync(coeDir)) {
                fs.mkdirSync(coeDir, { recursive: true });
                console.log(`Created .coe directory: ${coeDir}`);
            }

            // Initialize SQLite database
            await this.initializeSqlite(dbPath);

            // Run migrations
            if (this.config.autoMigrate && !this.useFallback) {
                await this.runMigrations();
            }

            // **P1.3**: Cleanup old completed tasks (retention policy)
            if (!this.useFallback) {
                await this.cleanupOldCompletedTasks();
            }

            // **Strategy B**: If NEW database, add placeholder task (unless skipPlaceholder is set)
            if (isNewDatabase && !this.useFallback && !this.config.skipPlaceholder) {
                await this.createPlaceholderTicket();
                console.log('ℹ️ Created placeholder ticket for new database');
            }
            // **Strategy C**: If EXISTING database, do nothing (leave empty or as-is)

            this.initialized = true;
            console.log(`TicketDatabase initialized at: ${dbPath} (fallback: ${this.useFallback}, isNew: ${isNewDatabase})`);
        } catch (error) {
            console.error('Failed to initialize TicketDatabase, using in-memory fallback:', error);
            this.useFallback = true;
            this.initialized = true;
        }
    }

    /**
     * Initialize SQLite database connection
     */
    private async initializeSqlite(dbPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        console.error('SQLite connection error:', err);
                        this.useFallback = true;
                        resolve(); // Don't reject, fall back to in-memory
                    } else {
                        console.log(`SQLite connected: ${dbPath}`);
                        resolve();
                    }
                });
            } catch (error) {
                console.error('SQLite initialization error:', error);
                this.useFallback = true;
                resolve();
            }
        });
    }

    /**
     * Run database migrations with versioning
     * Creates/upgrades schema and tracks version for future migrations
     */
    private async runMigrations(): Promise<void> {
        if (!this.db) {
            console.warn('No database connection, skipping migrations');
            return;
        }

        return new Promise((resolve) => {
            if (!this.db) {
                resolve();
                return;
            }

            // Step 1: Create version tracking table if not exists
            const versionTableSql = `
                CREATE TABLE IF NOT EXISTS db_version (
                    version INTEGER NOT NULL
                );
            `;

            this.db.run(versionTableSql, (err) => {
                if (err) {
                    console.warn('⚠️ Could not create version table:', err);
                    this.useFallback = true;
                    resolve();
                    return;
                }

                // Step 2: Initialize version if not already set
                this.db?.run(`INSERT OR IGNORE INTO db_version (version) VALUES (0)`, (err) => {
                    if (err) {
                        console.warn('⚠️ Could not initialize version:', err);
                    }

                    // Step 3: Create tickets table
                    const createTicketsTableSql = `
                        CREATE TABLE IF NOT EXISTS tickets (
                            ticket_id TEXT PRIMARY KEY,
                            type TEXT NOT NULL CHECK(type IN ('ai_to_human', 'human_to_ai')),
                            status TEXT NOT NULL CHECK(status IN ('open', 'in_review', 'resolved', 'escalated', 'rejected')),
                            priority INTEGER NOT NULL CHECK(priority IN (1, 2, 3)),
                            creator TEXT NOT NULL,
                            assignee TEXT NOT NULL,
                            task_id TEXT,
                            title TEXT NOT NULL,
                            description TEXT NOT NULL,
                            thread TEXT NOT NULL DEFAULT '[]',
                            resolution TEXT,
                            created_at TEXT NOT NULL,
                            updated_at TEXT NOT NULL
                        );
                    `;

                    this.db?.run(createTicketsTableSql, (err) => {
                        if (err) {
                            console.error('❌ Tickets table migration failed:', err);
                            this.useFallback = true;
                            resolve();
                            return;
                        }

                        // Step 4: Check schema version and run v1 migration if needed
                        this.getDbVersion((err, version) => {
                            if (err || version === undefined) {
                                console.warn('⚠️ Could not read DB version:', err);
                                resolve();
                                return;
                            }

                            // Migration v0 → v1: Add completed_tasks table
                            if (version < 1) {
                                const createCompletedTableSql = `
                                    CREATE TABLE IF NOT EXISTS completed_tasks (
                                        task_id TEXT PRIMARY KEY,
                                        original_ticket_id TEXT,
                                        title TEXT NOT NULL,
                                        status TEXT NOT NULL,
                                        priority INTEGER NOT NULL,
                                        completed_at TEXT NOT NULL,
                                        duration_minutes INTEGER,
                                        outcome TEXT,
                                        created_at TEXT NOT NULL
                                    );
                                    CREATE INDEX IF NOT EXISTS idx_completed_status ON completed_tasks(status);
                                    CREATE INDEX IF NOT EXISTS idx_completed_at ON completed_tasks(completed_at);
                                `;

                                this.db?.run(createCompletedTableSql, (err) => {
                                    if (err) {
                                        console.warn('⚠️ Completed tasks table migration failed:', err);
                                        resolve();
                                        return;
                                    }

                                    // Update schema version
                                    this.db?.run(`UPDATE db_version SET version = 1`, (err) => {
                                        if (err) {
                                            console.warn('⚠️ Could not update DB version:', err);
                                        } else {
                                            console.log('[TicketDb] ✅ Schema migrated: v0 → v1 (completed_tasks table added)');
                                        }
                                        resolve();
                                    });
                                });
                            } else {
                                console.log('[TicketDb] ✅ Migrations completed successfully (current version: ' + version + ')');
                                resolve();
                            }
                        });
                    });
                });
            });
        });
    }

    /**
     * Get current database schema version
     * @param callback - Returns (error, version) where version is 0 for old DBs
     */
    private getDbVersion(callback: (err: Error | null, version?: number) => void): void {
        if (!this.db) {
            callback(new Error('No database connection'));
            return;
        }

        this.db.get('SELECT version FROM db_version LIMIT 1', (err: Error | null, row: any) => {
            if (err) {
                // Old DB without version table - assume v0
                callback(null, 0);
            } else {
                callback(null, row?.version ?? 0);
            }
        });
    }

    /**
     * Create a new ticket
     * 
     * @param params - Ticket creation parameters
     * @returns Created ticket with generated ID and timestamps
     */
    async createTicket(params: CreateTicketParams): Promise<Ticket> {
        const ticketId = this.generateTicketId();
        const now = new Date();

        const ticket: Ticket = {
            ticket_id: ticketId,
            type: params.type,
            status: 'open',
            priority: params.priority,
            creator: params.creator,
            assignee: params.assignee,
            task_id: params.task_id,
            title: params.title.substring(0, 200), // Max 200 chars
            description: params.description.substring(0, 800), // Max 800 chars
            thread: [],
            created_at: now,
            updated_at: now
        };

        if (this.useFallback) {
            // In-memory fallback
            this.fallbackStore.set(ticketId, ticket);
            return ticket;
        }

        // SQLite storage
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = `
                INSERT INTO tickets (
                    ticket_id, type, status, priority, creator, assignee, task_id,
                    title, description, thread, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                ticket.ticket_id,
                ticket.type,
                ticket.status,
                ticket.priority,
                ticket.creator,
                ticket.assignee,
                ticket.task_id || null,
                ticket.title,
                ticket.description,
                JSON.stringify(ticket.thread),
                ticket.created_at.toISOString(),
                ticket.updated_at.toISOString()
            ];

            this.db.run(sql, values, (err) => {
                if (err) {
                    console.error('Failed to create ticket in SQLite:', err);
                    // Fallback to in-memory
                    this.fallbackStore.set(ticketId, ticket);
                    resolve(ticket);
                } else {
                    resolve(ticket);
                }
            });
        });
    }

    /**
     * Get ticket by ID
     * 
     * @param ticketId - Ticket ID to retrieve
     * @returns Ticket or null if not found
     */
    async getTicket(ticketId: string): Promise<Ticket | null> {
        if (this.useFallback) {
            return this.fallbackStore.get(ticketId) || null;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = `SELECT * FROM tickets WHERE ticket_id = ?`;

            this.db.get(sql, [ticketId], (err, row: any) => {
                if (err) {
                    console.error('Failed to get ticket from SQLite:', err);
                    // Try fallback
                    resolve(this.fallbackStore.get(ticketId) || null);
                } else if (!row) {
                    resolve(null);
                } else {
                    resolve(this.rowToTicket(row));
                }
            });
        });
    }

    /**
     * Get all tickets (optionally filtered by status)
     * 
     * @param status - Optional status filter
     * @returns Array of tickets
     */
    async getAllTickets(status?: Ticket['status']): Promise<Ticket[]> {
        if (this.useFallback) {
            const tickets = Array.from(this.fallbackStore.values());
            return status ? tickets.filter(t => t.status === status) : tickets;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = status
                ? `SELECT * FROM tickets WHERE status = ? ORDER BY priority ASC, created_at DESC`
                : `SELECT * FROM tickets ORDER BY priority ASC, created_at DESC`;

            const params = status ? [status] : [];

            this.db.all(sql, params, (err, rows: any[]) => {
                if (err) {
                    console.error('Failed to get tickets from SQLite:', err);
                    resolve(Array.from(this.fallbackStore.values()));
                } else {
                    resolve(rows.map(row => this.rowToTicket(row)));
                }
            });
        });
    }

    /**
     * Update ticket status and/or assignee
     * 
     * @param params - Update parameters
     * @returns Updated ticket or null if not found
     */
    async updateTicket(params: UpdateTicketParams): Promise<Ticket | null> {
        const ticket = await this.getTicket(params.ticket_id);
        if (!ticket) {
            return null;
        }

        // Update fields
        if (params.status) {
            ticket.status = params.status;
        }
        if (params.assignee) {
            ticket.assignee = params.assignee;
        }
        if (params.resolution !== undefined) {
            ticket.resolution = params.resolution;
        }
        ticket.updated_at = new Date();

        if (this.useFallback) {
            this.fallbackStore.set(ticket.ticket_id, ticket);
            return ticket;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = `
                UPDATE tickets
                SET status = ?, assignee = ?, resolution = ?, updated_at = ?
                WHERE ticket_id = ?
            `;

            const values = [
                ticket.status,
                ticket.assignee,
                ticket.resolution || null,
                ticket.updated_at.toISOString(),
                ticket.ticket_id
            ];

            this.db.run(sql, values, (err) => {
                if (err) {
                    console.error('Failed to update ticket in SQLite:', err);
                    // Update fallback anyway
                    this.fallbackStore.set(ticket.ticket_id, ticket);
                    resolve(ticket);
                } else {
                    resolve(ticket);
                }
            });
        });
    }

    /**
     * Add reply to ticket thread
     * 
     * @param params - Reply parameters
     * @returns Updated ticket or null if ticket not found
     */
    async addReply(params: AddReplyParams): Promise<Ticket | null> {
        const ticket = await this.getTicket(params.ticket_id);
        if (!ticket) {
            return null;
        }

        const reply: TicketReply = {
            reply_id: this.generateReplyId(),
            author: params.author,
            content: params.content.substring(0, 2000), // Max 2000 chars
            clarity_score: params.clarity_score,
            created_at: new Date()
        };

        ticket.thread.push(reply);
        ticket.updated_at = new Date();

        if (this.useFallback) {
            this.fallbackStore.set(ticket.ticket_id, ticket);
            return ticket;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const sql = `
                UPDATE tickets
                SET thread = ?, updated_at = ?
                WHERE ticket_id = ?
            `;

            const values = [
                JSON.stringify(ticket.thread),
                ticket.updated_at.toISOString(),
                ticket.ticket_id
            ];

            this.db.run(sql, values, (err) => {
                if (err) {
                    console.error('Failed to add reply in SQLite:', err);
                    // Update fallback anyway
                    this.fallbackStore.set(ticket.ticket_id, ticket);
                    resolve(ticket);
                } else {
                    resolve(ticket);
                }
            });
        });
    }

    /**
     * Convert SQLite row to Ticket object
     */
    private rowToTicket(row: any): Ticket {
        let thread: TicketReply[] = [];
        try {
            thread = JSON.parse(row.thread || '[]');
        } catch (error) {
            console.error('Failed to parse ticket thread JSON:', error);
            thread = [];
        }

        return {
            ticket_id: row.ticket_id,
            type: row.type,
            status: row.status,
            priority: row.priority,
            creator: row.creator,
            assignee: row.assignee,
            task_id: row.task_id || undefined,
            title: row.title,
            description: row.description,
            thread: thread,
            resolution: row.resolution || undefined,
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at)
        };
    }

    /**
     * Generate unique ticket ID (TK-XXXX format)
     */
    private generateTicketId(): string {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `TK-${timestamp}${random}`;
    }

    /**
     * Generate unique reply ID (RPL-XXXX format)
     */
    private generateReplyId(): string {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `RPL-${timestamp}${random}`;
    }

    /**
     * 💾 Close database connection gracefully
     * 
     * Closes SQLite connection with retry logic for EBUSY (OneDrive/Windows file locks).
     * Max 3 attempts with 500ms delay between retries.
     * Logs warning if close fails but doesn't crash.
     * Always sets db to null after attempt and switches to fallback Map.
     * 
     * This method is safe to call on extension deactivate/reload.
     * If close fails due to file lock, logs warning but continues gracefully.
     * Fallback Map is always available if DB stays locked or after close.
     * 
     * @async
     * @returns Promise that resolves when DB is closed (or after retries exhausted)
     */
    async close(): Promise<void> {
        if (!this.db) {
            return; // Already closed or never opened
        }

        const maxAttempts = 3;
        const retryDelayMs = 500;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.closeAsync();
                console.log('✅ Ticket DB connection closed successfully');
                this.db = null;
                this.useFallback = true; // Switch to fallback Map for any further operations
                return;
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                const isEBUSY = errMsg.includes('EBUSY') || errMsg.includes('locked');

                if (attempt < maxAttempts) {
                    console.warn(
                        `⚠️  DB close attempt ${attempt}/${maxAttempts} failed: ${errMsg}${isEBUSY ? ' (file lock - retrying)' : ''}`
                    );
                    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
                } else {
                    console.warn(
                        `⚠️  DB close failed after ${maxAttempts} attempts: ${errMsg}${isEBUSY ? ' (file may be locked by OneDrive)' : ''} - abandoning but fallback Map still available`
                    );
                    this.db = null; // Null it anyway so we don't try again
                    this.useFallback = true; // Ensure fallback is used
                }
            }
        }
    }

    /**
     * ⚙️ Private helper to close database (promisified)
     * Wraps sqlite3.Database.close() callback in a Promise
     * 
     * @private
     * @async
     * @returns Promise that rejects if close fails
     */
    private closeAsync(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve();
                return;
            }

            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Get database statistics
     */
    async getStats(): Promise<{
        total: number;
        open: number;
        inReview: number;
        resolved: number;
        escalated: number;
        usingFallback: boolean;
    }> {
        const tickets = await this.getAllTickets();
        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            inReview: tickets.filter(t => t.status === 'in_review').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            escalated: tickets.filter(t => t.status === 'escalated').length,
            usingFallback: this.useFallback
        };
    }

    /**
     * Create placeholder ticket for new databases (Strategy B)
     * Used on first initialization to avoid confusing empty state
     * 
     * @private
     * @async
     */
    private async createPlaceholderTicket(): Promise<void> {
        try {
            await this.createTicket({
                type: 'ai_to_human',
                priority: 3,
                creator: 'SYSTEM',
                assignee: 'SYSTEM',
                title: '[PLACEHOLDER] New Database - Delete this task',
                description: 'This is a temporary placeholder ticket created on first run. You can safely delete this ticket by changing its status to resolved or updating any field.'
            });
        } catch (error) {
            console.warn('⚠️ Failed to create placeholder ticket (non-blocking):', error);
        }
    }

    /**
     * 🗑️ Cleanup old completed tasks based on retention policy (P1.3)
     * 
     * Removes completed tasks older than taskRetentionDays from config.json.
     * Default retention: 30 days (can be overridden in .coe/config.json).
     * 
     * Error handling:
     * - Config missing/invalid: Uses default 30 days
     * - DB error: Logs warning but doesn't crash
     * - Cleanup runs silently (no user notification unless error)
     * 
     * Called automatically on initialize() after migrations complete.
     * 
     * @private
     * @async
     */
    private async cleanupOldCompletedTasks(): Promise<void> {
        if (!this.db) {
            return; // DB not initialized, skip cleanup
        }

        try {
            // Load taskRetentionDays from config.json (default: 30 days)
            const retentionDays = await this.getTaskRetentionDays();
            const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

            return new Promise((resolve) => {
                if (!this.db) {
                    resolve();
                    return;
                }

                // Delete completed tasks older than cutoff date
                this.db.run(
                    `DELETE FROM completed_tasks WHERE completed_at < ?`,
                    [cutoffDate],
                    (err) => {
                        if (err) {
                            console.warn(`⚠️ Cleanup: Failed to remove old tasks (>  ${retentionDays} days):`, err);
                        } else {
                            console.log(`🗑️ Cleanup: Removed completed tasks older than ${retentionDays} days`);
                        }
                        resolve();
                    }
                );
            });
        } catch (error) {
            console.warn('⚠️ Cleanup: Unexpected error during old task removal:', error);
        }
    }

    /**
     * Load taskRetentionDays from .coe/config.json
     * 
     * Returns the configured retention period in days.
     * Falls back to 30 days if config missing or invalid.
     * 
     * @private
     * @async
     * @returns Promise<number> - Days to retain completed tasks
     */
    private async getTaskRetentionDays(): Promise<number> {
        const defaultRetention = 30;

        try {
            const configPath = path.join(path.dirname(this.config.dbPath), '..', 'config.json');
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent);

            const retention = config?.database?.taskRetentionDays;
            if (typeof retention === 'number' && retention > 0) {
                return retention;
            }
        } catch (error) {
            // Config file not found or invalid - use default
        }

        return defaultRetention;
    }

    /**
     * Archive a task to completed_tasks table (P1.1 - Task History)
     * Moves task from active tracking to history; used when task completes or is archived.
     * 
     * **Option A (Reusable TicketIds)**: 
     * - `originalTicketId` is stored as reference (can be duplicated across multiple test runs)
     * - Each run gets unique `task_id` (PRIMARY KEY, timestamp-based)
     * - Allows same ticketId to be reused in future test/production cycles
     * - Active queue (hasTaskForTicket) only checks active statuses, not archived
     * - Multiple archived entries with same originalTicketId = safe, expected
     * 
     * Example Flow:
     * ```
     * Run 1: Create ticket 'TEST_001' → archive with originalTicketId='TEST_001'
     * Run 2: Create ticket 'TEST_001' → archive with originalTicketId='TEST_001' 
     *        (different task_id each time, both stored in completed_tasks)
     * Run 3: Create ticket 'TEST_001' → hasTaskForTicket('TEST_001') → false
     *        (active queue is clean, previous archived entries ignored)
     * ```
     * 
     * @param taskId - Unique task identifier (PRIMARY KEY, generated per run)
     * @param title - Task title
     * @param status - Final status ('completed' | 'failed' | 'archived')
     * @param originalTicketId - Reference to original ticket (Option A: can duplicate)
     * @param durationMinutes - How long task took (optional)
     * @returns Promise<void>
     */
    async archiveTask(
        taskId: string,
        title: string,
        status: 'completed' | 'failed' | 'archived' = 'completed',
        originalTicketId?: string,
        durationMinutes?: number
    ): Promise<void> {
        if (!taskId || !title) {
            throw new Error('archiveTask: taskId and title are required');
        }

        if (this.useFallback) {
            // Fallback: store in memory
            const now = new Date().toISOString();
            if (!this.fallbackCompletedTasks) {
                this.fallbackCompletedTasks = new Map();
            }
            this.fallbackCompletedTasks.set(taskId, {
                task_id: taskId,
                original_ticket_id: originalTicketId,
                title,
                status,
                priority: 2, // Default priority for archived tasks
                completed_at: now,
                duration_minutes: durationMinutes,
                outcome: undefined,
                created_at: now
            });
            return;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const now = new Date().toISOString();
            this.db!.run(
                `INSERT INTO completed_tasks (task_id, original_ticket_id, title, status, priority, completed_at, duration_minutes, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [taskId, originalTicketId || null, title, status, 2, now, durationMinutes || null, now],
                (err) => {
                    if (err) {
                        console.error(`❌ Failed to archive task ${taskId}:`, err);
                        reject(err);
                    } else {
                        console.log(`✅ Task archived: ${taskId}`);
                        resolve();
                    }
                }
            );
        });
    }

    /**
     * Get all completed tasks from history (P1.1 - Task History)
     * Retrieves tasks moved to completed_tasks table.
     * 
     * @param filters - Optional: { status?: string; minDaysAgo?: number }
     * @returns Promise<CompletedTask[]>
     */
    async getAllCompleted(filters?: {
        status?: 'completed' | 'failed' | 'archived';
        minDaysAgo?: number;
    }): Promise<any[]> {
        if (this.useFallback) {
            // Fallback: return from memory
            if (!this.fallbackCompletedTasks) {
                return [];
            }
            let tasks = Array.from(this.fallbackCompletedTasks.values());

            if (filters?.status) {
                tasks = tasks.filter(t => t.status === filters.status);
            }
            if (filters?.minDaysAgo !== undefined) {
                const cutoffDate = new Date(Date.now() - filters.minDaysAgo * 24 * 60 * 60 * 1000).toISOString();
                tasks = tasks.filter(t => t.completed_at >= cutoffDate);
            }

            return tasks;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            let where = '';
            const params: any[] = [];

            if (filters?.status) {
                where += `WHERE status = ?`;
                params.push(filters.status);
            }

            if (filters?.minDaysAgo !== undefined) {
                const cutoffDate = new Date(Date.now() - filters.minDaysAgo * 24 * 60 * 60 * 1000).toISOString();
                if (where) {
                    where += ` AND completed_at >= ?`;
                } else {
                    where = `WHERE completed_at >= ?`;
                }
                params.push(cutoffDate);
            }

            const query = `SELECT * FROM completed_tasks ${where} ORDER BY completed_at DESC`;

            this.db!.all(query, params, (err, rows: any[]) => {
                if (err) {
                    console.error('❌ Failed to get completed tasks:', err);
                    reject(err);
                } else {
                    console.log(`✅ Retrieved ${rows.length} completed tasks`);
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Private fallback storage for completed tasks (in-memory)
     * Used when SQLite is unavailable
     */
    private fallbackCompletedTasks?: Map<string, any>;
}

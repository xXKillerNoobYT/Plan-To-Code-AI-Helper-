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

            this.initialized = true;
            console.log(`TicketDatabase initialized at: ${dbPath} (fallback: ${this.useFallback})`);
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
     * Run database migrations
     * Creates tickets table if it doesn't exist
     */
    private async runMigrations(): Promise<void> {
        if (!this.db) {
            console.warn('No database connection, skipping migrations');
            return;
        }

        const createTableSql = `
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

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('No database connection'));
                return;
            }

            this.db.run(createTableSql, (err) => {
                if (err) {
                    console.error('Migration failed:', err);
                    this.useFallback = true;
                    resolve(); // Don't reject, fall back
                } else {
                    console.log('Migrations completed successfully');
                    resolve();
                }
            });
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
     * Close database connection (call on extension deactivate)
     */
    async close(): Promise<void> {
        if (this.db) {
            return new Promise((resolve) => {
                this.db!.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    }
                    this.db = null;
                    resolve();
                });
            });
        }
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
}

/**
 * Convenience function to get database instance
 */
export function getTicketDb(): TicketDatabase {
    return TicketDatabase.getInstance();
}

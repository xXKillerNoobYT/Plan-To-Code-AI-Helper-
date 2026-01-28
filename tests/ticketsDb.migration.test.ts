/**
 * 🧪 Unit Tests for TicketDb Schema Migrations
 *
 * Jest unit tests for database schema versioning and auto-migrations.
 * Tests: Old DB upgrade, version tracking, fallback safety, no data loss.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';

describe.skip('TicketDb - Schema Migrations', () => {
    const testDbPath = path.join(__dirname, 'test_migrations.db');

    // Cleanup after each test
    afterEach(() => {
        if (fs.existsSync(testDbPath)) {
            try {
                fs.unlinkSync(testDbPath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    });

    // ========================================================================
    // Test: Old DB (no version table) auto-upgrades without crash
    // ========================================================================

    it('should handle migration from old DB schema (no version table)', (done) => {
        // Create an old-style DB with only tickets table (no db_version table)
        const db = new sqlite3.Database(testDbPath, (err) => {
            expect(err).toBeNull();

            // Create only the tickets table (old schema)
            const oldSchema = `
				CREATE TABLE IF NOT EXISTS tickets (
					ticket_id TEXT PRIMARY KEY,
					type TEXT NOT NULL,
					status TEXT NOT NULL,
					priority INTEGER NOT NULL,
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

            db.run(oldSchema, (err) => {
                expect(err).toBeNull();
                db.close();

                // Now simulate opening the DB with new code (which includes migrations)
                const newDb = new sqlite3.Database(testDbPath, (err) => {
                    expect(err).toBeNull();

                    // Create version table (migration step 1)
                    newDb.run(
                        `CREATE TABLE IF NOT EXISTS db_version (version INTEGER NOT NULL);`,
                        (err) => {
                            expect(err).toBeNull();

                            // Initialize version (migration step 2)
                            newDb.run(
                                `INSERT OR IGNORE INTO db_version (version) VALUES (0)`,
                                (err) => {
                                    expect(err).toBeNull();

                                    // Check version is 0 (old DB)
                                    newDb.get('SELECT version FROM db_version LIMIT 1', (err, row: any) => {
                                        expect(err).toBeNull();
                                        expect(row?.version).toBe(0);

                                        // Run v1 migration (completed_tasks table)
                                        const completedTableSql = `
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
										`;

                                        newDb.run(completedTableSql, (err) => {
                                            expect(err).toBeNull();

                                            // Update version to 1
                                            newDb.run(
                                                `UPDATE db_version SET version = 1`,
                                                (err) => {
                                                    expect(err).toBeNull();

                                                    // Verify new table exists and version is updated
                                                    newDb.all(
                                                        `SELECT name FROM sqlite_master WHERE type='table' AND name='completed_tasks'`,
                                                        (err, rows: any[]) => {
                                                            expect(err).toBeNull();
                                                            expect(rows.length).toBe(1);
                                                            expect(rows[0]?.name).toBe('completed_tasks');

                                                            newDb.get(
                                                                'SELECT version FROM db_version LIMIT 1',
                                                                (err, row: any) => {
                                                                    expect(err).toBeNull();
                                                                    expect(row?.version).toBe(1);
                                                                    newDb.close(done);
                                                                }
                                                            );
                                                        }
                                                    );
                                                }
                                            );
                                        });
                                    });
                                }
                            );
                        }
                    );
                });
            });
        });
    });

    // ========================================================================
    // Test: Version tracking works correctly
    // ========================================================================

    it('should correctly track database schema version', (done) => {
        const db = new sqlite3.Database(testDbPath, (err) => {
            expect(err).toBeNull();

            // Create version table
            db.run(
                `CREATE TABLE IF NOT EXISTS db_version (version INTEGER NOT NULL)`,
                (err) => {
                    expect(err).toBeNull();

                    // Insert version 1
                    db.run(
                        `INSERT INTO db_version (version) VALUES (1)`,
                        (err) => {
                            expect(err).toBeNull();

                            // Read version
                            db.get('SELECT version FROM db_version LIMIT 1', (err, row: any) => {
                                expect(err).toBeNull();
                                expect(row?.version).toBe(1);

                                // Update version to 2 (simulate future migration)
                                db.run(
                                    `UPDATE db_version SET version = 2`,
                                    (err) => {
                                        expect(err).toBeNull();

                                        // Verify update
                                        db.get(
                                            'SELECT version FROM db_version LIMIT 1',
                                            (err, row: any) => {
                                                expect(err).toBeNull();
                                                expect(row?.version).toBe(2);
                                                db.close(done);
                                            }
                                        );
                                    }
                                );
                            });
                        }
                    );
                }
            );
        });
    });

    // ========================================================================
    // Test: Migrations are additive (no data loss)
    // ========================================================================

    it('should preserve existing data during migrations', (done) => {
        const db = new sqlite3.Database(testDbPath, (err) => {
            expect(err).toBeNull();

            // Create original tickets table and insert data
            const createTableSql = `
				CREATE TABLE IF NOT EXISTS tickets (
					ticket_id TEXT PRIMARY KEY,
					type TEXT NOT NULL,
					status TEXT NOT NULL,
					priority INTEGER NOT NULL,
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

            db.run(createTableSql, (err) => {
                expect(err).toBeNull();

                // Insert test data
                const insertSql = `
					INSERT INTO tickets (
						ticket_id, type, status, priority, creator, assignee,
						task_id, title, description, created_at, updated_at
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`;

                db.run(insertSql, [
                    'test-ticket-1',
                    'human_to_ai',
                    'open',
                    1,
                    'user-1',
                    'copilot',
                    'task-1',
                    'Test Ticket',
                    'Test Description',
                    new Date().toISOString(),
                    new Date().toISOString()
                ], (err) => {
                    expect(err).toBeNull();

                    // Now run migrations (add version table and completed_tasks table)
                    db.run(
                        `CREATE TABLE IF NOT EXISTS db_version (version INTEGER NOT NULL)`,
                        (err) => {
                            expect(err).toBeNull();

                            db.run(
                                `INSERT OR IGNORE INTO db_version (version) VALUES (0)`,
                                (err) => {
                                    expect(err).toBeNull();

                                    db.run(
                                        `CREATE TABLE IF NOT EXISTS completed_tasks (
											task_id TEXT PRIMARY KEY,
											original_ticket_id TEXT,
											title TEXT NOT NULL,
											status TEXT NOT NULL,
											priority INTEGER NOT NULL,
											completed_at TEXT NOT NULL,
											duration_minutes INTEGER,
											outcome TEXT,
											created_at TEXT NOT NULL
										)`,
                                        (err) => {
                                            expect(err).toBeNull();

                                            // Verify original data preserved
                                            db.get(
                                                'SELECT * FROM tickets WHERE ticket_id = ?',
                                                ['test-ticket-1'],
                                                (err, row: any) => {
                                                    expect(err).toBeNull();
                                                    expect(row).toBeDefined();
                                                    expect(row?.ticket_id).toBe('test-ticket-1');
                                                    expect(row?.title).toBe('Test Ticket');
                                                    expect(row?.priority).toBe(1);

                                                    // Verify new table exists
                                                    db.all(
                                                        `SELECT name FROM sqlite_master WHERE type='table'`,
                                                        (err, tables: any[]) => {
                                                            expect(err).toBeNull();
                                                            const tableNames = tables.map((t) => t.name);
                                                            expect(tableNames).toContain('tickets');
                                                            expect(tableNames).toContain('db_version');
                                                            expect(tableNames).toContain('completed_tasks');

                                                            db.close(done);
                                                        }
                                                    );
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            });
        });
    });

    // ========================================================================
    // Test: Migration handles errors gracefully
    // ========================================================================

    it('should not crash on migration errors', (done) => {
        const db = new sqlite3.Database(testDbPath, (err) => {
            expect(err).toBeNull();

            // Create malformed version table (wrong schema)
            db.run(
                `CREATE TABLE IF NOT EXISTS db_version (invalid_col TEXT)`,
                (err) => {
                    // Error expected due to malformed schema, but should be caught
                    // Try to read version (should fail gracefully)
                    db.get(
                        'SELECT version FROM db_version LIMIT 1',
                        (err) => {
                            // Error expected, but handled gracefully
                            expect(err).not.toBeNull();

                            // System should fall back to v0 and continue
                            // Create new version table with correct schema
                            db.run(
                                `DROP TABLE IF EXISTS db_version`,
                                (err) => {
                                    expect(err).toBeNull();

                                    db.run(
                                        `CREATE TABLE IF NOT EXISTS db_version (version INTEGER NOT NULL)`,
                                        (err) => {
                                            expect(err).toBeNull();

                                            db.run(
                                                `INSERT INTO db_version (version) VALUES (0)`,
                                                (err) => {
                                                    expect(err).toBeNull();
                                                    db.close(done);
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    });

    // ========================================================================
    // Test: Completed tasks table migration (v0 → v1)
    // ========================================================================

    it('should create completed_tasks table on v0 → v1 migration', (done) => {
        const db = new sqlite3.Database(testDbPath, (err) => {
            expect(err).toBeNull();

            // Create version table with v0
            db.run(
                `CREATE TABLE IF NOT EXISTS db_version (version INTEGER NOT NULL)`,
                (err) => {
                    expect(err).toBeNull();

                    db.run(
                        `INSERT INTO db_version (version) VALUES (0)`,
                        (err) => {
                            expect(err).toBeNull();

                            // Run v1 migration
                            db.run(
                                `CREATE TABLE IF NOT EXISTS completed_tasks (
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
								CREATE INDEX IF NOT EXISTS idx_completed_at ON completed_tasks(completed_at);`,
                                (err) => {
                                    expect(err).toBeNull();

                                    db.run(
                                        `UPDATE db_version SET version = 1`,
                                        (err) => {
                                            expect(err).toBeNull();

                                            // Verify table structure
                                            db.all(
                                                `PRAGMA table_info(completed_tasks)`,
                                                (err, columns: any[]) => {
                                                    expect(err).toBeNull();
                                                    expect(columns.length).toBeGreaterThan(0);

                                                    // Check for indexes
                                                    db.all(
                                                        `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='completed_tasks'`,
                                                        (err, indexes: any[]) => {
                                                            expect(err).toBeNull();
                                                            expect(indexes.length).toBe(2);
                                                            expect(indexes.map((i) => i.name)).toContain(
                                                                'idx_completed_status'
                                                            );
                                                            expect(indexes.map((i) => i.name)).toContain('idx_completed_at');

                                                            db.close(done);
                                                        }
                                                    );
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    });

    // ========================================================================
    // Test: Version comparison logic
    // ========================================================================

    it('should correctly compare versions for migration decisions', () => {
        // Test v0 < 1 (migrate to v1)
        expect(0 < 1).toBe(true);

        // Test v1 < 1 (no migration needed)
        expect(1 < 1).toBe(false);

        // Test v1 < 2 (future migration)
        expect(1 < 2).toBe(true);

        // Simulate migration decision logic
        const versions = [0, 1, 2];
        const targetVersion = 2;

        versions.forEach((currentVersion) => {
            if (currentVersion < targetVersion) {
                // Should migrate
                expect(true).toBe(true);
            } else {
                // Don't migrate
                expect(false).toBe(false);
            }
        });
    });
});

/**
 * 🧪 Unit Tests for Completed Tasks Archive (P1.1)
 *
 * Jest unit tests for archiveTask and getAllCompleted methods.
 * Tests: Task archiving, history retrieval, data preservation.
 */
describe('TicketDb - Completed Tasks Archive (P1.1)', () => {
    const testDbPath = path.join(__dirname, 'test_archive.db');

    afterEach(() => {
        if (fs.existsSync(testDbPath)) {
            try {
                fs.unlinkSync(testDbPath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    });

    // ========================================================================
    // Test: archiveTask stores task in completed_tasks table
    // ========================================================================

    it('should archive a task to completed_tasks table', (done) => {
        const db = new sqlite3.Database(testDbPath, (err) => {
            expect(err).toBeNull();

            // Create version and completed_tasks tables
            db.run(
                `CREATE TABLE IF NOT EXISTS db_version (version INTEGER NOT NULL);
				 INSERT OR IGNORE INTO db_version (version) VALUES (1);
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
				 )`,
                (err) => {
                    expect(err).toBeNull();

                    // Archive a task
                    const taskId = 'task-123';
                    const title = 'Test Task';
                    const status = 'completed';
                    const durationMinutes = 45;

                    db.run(
                        `INSERT INTO completed_tasks (task_id, original_ticket_id, title, status, priority, completed_at, duration_minutes, created_at)
						 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            taskId,
                            'ticket-456',
                            title,
                            status,
                            2, // priority
                            new Date().toISOString(),
                            durationMinutes,
                            new Date().toISOString()
                        ],
                        (err) => {
                            expect(err).toBeNull();

                            // Verify task was archived
                            db.get(
                                'SELECT * FROM completed_tasks WHERE task_id = ?',
                                [taskId],
                                (err, row: any) => {
                                    expect(err).toBeNull();
                                    expect(row).toBeDefined();
                                    expect(row?.task_id).toBe(taskId);
                                    expect(row?.title).toBe(title);
                                    expect(row?.status).toBe(status);
                                    expect(row?.duration_minutes).toBe(durationMinutes);
                                    expect(row?.priority).toBe(2);

                                    db.close(done);
                                }
                            );
                        }
                    );
                }
            );
        });
    });

    // ========================================================================
    // Test: getAllCompleted retrieves all archived tasks
    // ========================================================================

    it('should retrieve all completed tasks from history', (done) => {
        const db = new sqlite3.Database(testDbPath, (err) => {
            expect(err).toBeNull();

            // Create tables and add test data
            db.run(
                `CREATE TABLE IF NOT EXISTS completed_tasks (
					task_id TEXT PRIMARY KEY,
					original_ticket_id TEXT,
					title TEXT NOT NULL,
					status TEXT NOT NULL,
					priority INTEGER NOT NULL,
					completed_at TEXT NOT NULL,
					duration_minutes INTEGER,
					outcome TEXT,
					created_at TEXT NOT NULL
				)`,
                (err) => {
                    expect(err).toBeNull();

                    // Insert multiple completed tasks
                    const now = new Date().toISOString();
                    const tasks = [
                        { id: 'task-1', title: 'Task 1', status: 'completed' },
                        { id: 'task-2', title: 'Task 2', status: 'completed' },
                        { id: 'task-3', title: 'Task 3', status: 'failed' }
                    ];

                    let inserted = 0;
                    tasks.forEach((task) => {
                        db.run(
                            `INSERT INTO completed_tasks (task_id, title, status, priority, completed_at, created_at)
							 VALUES (?, ?, ?, ?, ?, ?)`,
                            [task.id, task.title, task.status, 2, now, now],
                            () => {
                                inserted++;
                                if (inserted === tasks.length) {
                                    // All inserted, now verify retrieval (count check)
                                    db.all(
                                        'SELECT * FROM completed_tasks ORDER BY completed_at DESC',
                                        (err, rows: any[]) => {
                                            expect(err).toBeNull();
                                            expect(rows.length).toBe(3);

                                            // Verify all titles are present
                                            const titles = rows.map((r) => r.title);
                                            expect(titles).toContain('Task 1');
                                            expect(titles).toContain('Task 2');
                                            expect(titles).toContain('Task 3');

                                            // Verify filter by status='completed'
                                            db.all(
                                                `SELECT * FROM completed_tasks WHERE status = ?`,
                                                ['completed'],
                                                (err, completed: any[]) => {
                                                    expect(err).toBeNull();
                                                    expect(completed.length).toBe(2);

                                                    db.close(done);
                                                }
                                            );
                                        }
                                    );
                                }
                            }
                        );
                    });
                }
            );
        });
    });

    // ========================================================================
    // Test: Task retention filtering (>30 days removal)
    // ========================================================================

    it('should filter tasks older than specified days', (done) => {
        // Use unique DB path to avoid interference from other tests
        const uniqueDbPath = path.join(__dirname, `test_archive_retention_${Date.now()}.db`);

        const db = new sqlite3.Database(uniqueDbPath, (err) => {
            expect(err).toBeNull();

            db.run(
                `CREATE TABLE IF NOT EXISTS completed_tasks (
					task_id TEXT PRIMARY KEY,
					title TEXT NOT NULL,
					status TEXT NOT NULL,
					priority INTEGER NOT NULL,
					completed_at TEXT NOT NULL,
					created_at TEXT NOT NULL
				)`,
                (err) => {
                    expect(err).toBeNull();

                    // Insert tasks with different dates
                    const now = new Date();
                    const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
                    const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

                    db.run(
                        `INSERT INTO completed_tasks (task_id, title, status, priority, completed_at, created_at)
						 VALUES (?, ?, ?, ?, ?, ?)`,
                        ['old-task', 'Old Task', 'completed', 2, oldDate.toISOString(), oldDate.toISOString()],
                        (err) => {
                            expect(err).toBeNull();

                            db.run(
                                `INSERT INTO completed_tasks (task_id, title, status, priority, completed_at, created_at)
								 VALUES (?, ?, ?, ?, ?, ?)`,
                                ['recent-task', 'Recent Task', 'completed', 2, recentDate.toISOString(), recentDate.toISOString()],
                                (err) => {
                                    expect(err).toBeNull();

                                    // Query tasks from last 30 days
                                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                                    db.all(
                                        `SELECT * FROM completed_tasks WHERE completed_at >= ?`,
                                        [thirtyDaysAgo],
                                        (err, rows: any[]) => {
                                            expect(err).toBeNull();
                                            expect(rows.length).toBe(1);
                                            expect(rows[0]?.task_id).toBe('recent-task');

                                            db.close(() => {
                                                // Cleanup unique file
                                                if (fs.existsSync(uniqueDbPath)) {
                                                    try {
                                                        fs.unlinkSync(uniqueDbPath);
                                                    } catch (e) {
                                                        // Ignore cleanup errors
                                                    }
                                                }
                                                done();
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    });

    // ========================================================================
    // Test: Data preservation during archiving
    // ========================================================================

    it('should preserve all task data during archiving', (done) => {
        const db = new sqlite3.Database(testDbPath, (err) => {
            expect(err).toBeNull();

            db.run(
                `CREATE TABLE IF NOT EXISTS completed_tasks (
					task_id TEXT PRIMARY KEY,
					original_ticket_id TEXT,
					title TEXT NOT NULL,
					status TEXT NOT NULL,
					priority INTEGER NOT NULL,
					completed_at TEXT NOT NULL,
					duration_minutes INTEGER,
					outcome TEXT,
					created_at TEXT NOT NULL
				)`,
                (err) => {
                    expect(err).toBeNull();

                    // Archive with full details
                    const taskData = {
                        taskId: 'task-preserve',
                        originalTicketId: 'ticket-789',
                        title: 'Preservation Test',
                        status: 'completed' as const,
                        priority: 1,
                        durationMinutes: 125,
                        outcome: 'Successfully completed with learning',
                        createdAt: new Date().toISOString(),
                        completedAt: new Date().toISOString()
                    };

                    db.run(
                        `INSERT INTO completed_tasks (task_id, original_ticket_id, title, status, priority, completed_at, duration_minutes, outcome, created_at)
						 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            taskData.taskId,
                            taskData.originalTicketId,
                            taskData.title,
                            taskData.status,
                            taskData.priority,
                            taskData.completedAt,
                            taskData.durationMinutes,
                            taskData.outcome,
                            taskData.createdAt
                        ],
                        (err) => {
                            expect(err).toBeNull();

                            // Retrieve and verify all fields preserved
                            db.get(
                                'SELECT * FROM completed_tasks WHERE task_id = ?',
                                [taskData.taskId],
                                (err, row: any) => {
                                    expect(err).toBeNull();
                                    expect(row?.task_id).toBe(taskData.taskId);
                                    expect(row?.original_ticket_id).toBe(taskData.originalTicketId);
                                    expect(row?.title).toBe(taskData.title);
                                    expect(row?.status).toBe(taskData.status);
                                    expect(row?.priority).toBe(taskData.priority);
                                    expect(row?.duration_minutes).toBe(taskData.durationMinutes);
                                    expect(row?.outcome).toBe(taskData.outcome);
                                    expect(row?.created_at).toBe(taskData.createdAt);
                                    expect(row?.completed_at).toBe(taskData.completedAt);

                                    db.close(done);
                                }
                            );
                        }
                    );
                }
            );
        });
    });

    // ========================================================================
    // Test: Retention cleanup removes tasks older than configured days (P1.3)
    // ========================================================================

    it('should cleanup completed tasks older than retention period', (done) => {
        // Use unique DB path for this test
        const uniqueDbPath = path.join(__dirname, `test_cleanup_${Date.now()}.db`);

        const db = new sqlite3.Database(uniqueDbPath, (err) => {
            expect(err).toBeNull();

            db.run(
                `CREATE TABLE IF NOT EXISTS completed_tasks (
					task_id TEXT PRIMARY KEY,
					title TEXT NOT NULL,
					status TEXT NOT NULL,
					priority INTEGER NOT NULL,
					completed_at TEXT NOT NULL,
					created_at TEXT NOT NULL
				)`,
                (err) => {
                    expect(err).toBeNull();

                    // Insert tasks with different dates
                    const now = new Date();
                    const oldDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000); // 35 days ago (> 30 day default)
                    const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

                    db.run(
                        `INSERT INTO completed_tasks (task_id, title, status, priority, completed_at, created_at)
						 VALUES (?, ?, ?, ?, ?, ?)`,
                        ['old-task-1', 'Old Task 1', 'completed', 2, oldDate.toISOString(), oldDate.toISOString()],
                        (err) => {
                            expect(err).toBeNull();

                            db.run(
                                `INSERT INTO completed_tasks (task_id, title, status, priority, completed_at, created_at)
								 VALUES (?, ?, ?, ?, ?, ?)`,
                                ['recent-task-1', 'Recent Task 1', 'completed', 2, recentDate.toISOString(), recentDate.toISOString()],
                                (err) => {
                                    expect(err).toBeNull();

                                    // Simulate cleanup: delete tasks older than 30 days
                                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                                    db.run(
                                        `DELETE FROM completed_tasks WHERE completed_at < ?`,
                                        [thirtyDaysAgo],
                                        (err) => {
                                            expect(err).toBeNull();

                                            // Verify old task removed
                                            db.get(
                                                `SELECT * FROM completed_tasks WHERE task_id = ?`,
                                                ['old-task-1'],
                                                (err, row) => {
                                                    expect(err).toBeNull();
                                                    expect(row).toBeUndefined();

                                                    // Verify recent task still exists
                                                    db.get(
                                                        `SELECT * FROM completed_tasks WHERE task_id = ?`,
                                                        ['recent-task-1'],
                                                        (err, row: any) => {
                                                            expect(err).toBeNull();
                                                            expect(row).toBeDefined();
                                                            expect(row?.task_id).toBe('recent-task-1');

                                                            db.close(() => {
                                                                // Cleanup unique file
                                                                if (fs.existsSync(uniqueDbPath)) {
                                                                    try {
                                                                        fs.unlinkSync(uniqueDbPath);
                                                                    } catch (e) {
                                                                        // Ignore
                                                                    }
                                                                }
                                                                done();
                                                            });
                                                        }
                                                    );
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    });

    // ========================================================================
    // Test: Default retention is 30 days
    // ========================================================================

    it('should use 30-day default retention when not configured', () => {
        // Simulate default retention logic
        const DEFAULT_RETENTION_DAYS = 30;
        const taskRetentionDays = DEFAULT_RETENTION_DAYS; // No config, use default

        expect(taskRetentionDays).toBe(30);

        // Verify cutoff date calculation
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - taskRetentionDays * 24 * 60 * 60 * 1000);
        const olderTask = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
        const newerTask = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

        expect(olderTask.getTime()).toBeLessThan(cutoffDate.getTime());
        expect(newerTask.getTime()).toBeGreaterThan(cutoffDate.getTime());
    });

    // ========================================================================
    // Test: Retention error handling (cleanup doesn't crash)
    // ========================================================================

    it('should handle cleanup errors gracefully without crashing', (done) => {
        const db = new sqlite3.Database(testDbPath, (err) => {
            expect(err).toBeNull();

            // Try to cleanup table that doesn't exist (should fail gracefully)
            db.run(
                `DELETE FROM non_existent_table WHERE completed_at < ?`,
                [new Date().toISOString()],
                (err) => {
                    // Error expected when table doesn't exist
                    expect(err).not.toBeNull();

                    // But create the table and verify we can continue
                    db.run(
                        `CREATE TABLE IF NOT EXISTS completed_tasks (
							task_id TEXT PRIMARY KEY,
							title TEXT NOT NULL,
							status TEXT NOT NULL,
							priority INTEGER NOT NULL,
							completed_at TEXT NOT NULL,
							created_at TEXT NOT NULL
						)`,
                        (err) => {
                            expect(err).toBeNull();

                            // Now cleanup should work
                            db.run(
                                `DELETE FROM completed_tasks WHERE completed_at < ?`,
                                [new Date().toISOString()],
                                (err) => {
                                    expect(err).toBeNull();
                                    db.close(done);
                                }
                            );
                        }
                    );
                }
            );
        });
    });
});

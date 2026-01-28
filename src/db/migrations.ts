/**
 * Manages database schema versioning and migrations.
 * Handles upgrades from old DB format to new schema without data loss.
 */

export function getDbVersion(db: any): number {
	try {
		const result = db.prepare(
			`SELECT version FROM db_version LIMIT 1`
		).get() as { version: number } | undefined;
		return result?.version ?? 0;
	} catch {
		// Old DB without version table - assume schema v0
		return 0;
	}
}

export function migrateSchema(db: any): void {
	try {
		// Step 1: Create version tracking table if not exists
		db.exec(`
			CREATE TABLE IF NOT EXISTS db_version (
				version INTEGER NOT NULL
			)
		`);

		// Initial version for old DBs
		db.exec(`INSERT OR IGNORE INTO db_version (version) VALUES (0)`);

		const currentVersion = getDbVersion(db);
		const targetVersion = 1;

		// Migration v0 -> v1: Add completed_tasks table
		if (currentVersion < 1) {
			db.exec(`
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
			`);

			// Update schema version
			db.exec(`UPDATE db_version SET version = 1`);
			console.log('[TicketDb] ✅ Schema migrated: v0 → v1 (completed_tasks table added)');
		}

		// Future migrations here: if (currentVersion < 2) { ... }

	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error('[TicketDb] ❌ Schema migration failed:', message);
		throw new Error(`Database migration error: ${message}`);
	}
}

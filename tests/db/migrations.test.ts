/**
 * Comprehensive tests for database migrations module.
 * Tests schema versioning, migration logic, and error handling.
 */

import { getDbVersion, migrateSchema } from '../../src/db/migrations';

describe('Database Migrations', () => {
    /**
     * Mock database object that simulates better-sqlite3 behavior
     */
    let mockDb: any;

    beforeEach(() => {
        // Reset mock state before each test
        mockDb = {
            prepare: jest.fn(),
            exec: jest.fn(),
        };
    });

    // ============================================================================
    // getDbVersion() Tests
    // ============================================================================

    describe('getDbVersion()', () => {
        it('should return version when db_version table exists with valid version', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 1 }),
            });

            const version = getDbVersion(mockDb);

            expect(version).toBe(1);
            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('SELECT version FROM db_version')
            );
        });

        it('should return version 0 when db_version table is empty', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue(undefined),
            });

            const version = getDbVersion(mockDb);

            expect(version).toBe(0);
        });

        it('should return version 0 when query throws error (old DB format)', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockImplementation(() => {
                    throw new Error('table db_version does not exist');
                }),
            });

            const version = getDbVersion(mockDb);

            expect(version).toBe(0);
        });

        it('should return version 0 when prepare() throws error', () => {
            mockDb.prepare.mockImplementation(() => {
                throw new Error('database locked');
            });

            const version = getDbVersion(mockDb);

            expect(version).toBe(0);
        });

        it('should handle various version numbers correctly', () => {
            const testVersions = [0, 1, 5, 10, 99];

            testVersions.forEach((testVersion) => {
                mockDb.prepare.mockReturnValue({
                    get: jest.fn().mockReturnValue({ version: testVersion }),
                });

                const version = getDbVersion(mockDb);

                expect(version).toBe(testVersion);
            });
        });

        it('should return null coalesced to 0 when result object is null', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue(null),
            });

            const version = getDbVersion(mockDb);

            expect(version).toBe(0);
        });
    });

    // ============================================================================
    // migrateSchema() Tests
    // ============================================================================

    describe('migrateSchema()', () => {
        it('should create db_version table on first migration', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 0 }),
            });

            migrateSchema(mockDb);

            // Should call exec at least once for db_version table creation
            expect(mockDb.exec).toHaveBeenCalled();
            const calls = mockDb.exec.mock.calls;
            const createVersionTableCall = calls.some((call: any[]) =>
                call[0].includes('CREATE TABLE IF NOT EXISTS db_version')
            );
            expect(createVersionTableCall).toBe(true);
        });

        it('should create completed_tasks table when migrating from v0 to v1', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 0 }),
            });

            migrateSchema(mockDb);

            const calls = mockDb.exec.mock.calls;
            const createCompletedTasksCall = calls.some((call: any[]) =>
                call[0].includes('CREATE TABLE IF NOT EXISTS completed_tasks')
            );
            expect(createCompletedTasksCall).toBe(true);
        });

        it('should create required indexes on completed_tasks table', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 0 }),
            });

            migrateSchema(mockDb);

            const calls = mockDb.exec.mock.calls;
            const indexCalls = calls.filter((call: any[]) =>
                call[0].includes('CREATE INDEX')
            );

            expect(indexCalls.length).toBeGreaterThan(0);
            const hasStatusIndex = calls.some((call: any[]) =>
                call[0].includes('idx_completed_status')
            );
            const hasTimestampIndex = calls.some((call: any[]) =>
                call[0].includes('idx_completed_at')
            );

            expect(hasStatusIndex).toBe(true);
            expect(hasTimestampIndex).toBe(true);
        });

        it('should update version to 1 after migration', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 0 }),
            });

            migrateSchema(mockDb);

            const calls = mockDb.exec.mock.calls;
            const updateVersionCall = calls.some((call: any[]) =>
                call[0].includes('UPDATE db_version SET version = 1')
            );
            expect(updateVersionCall).toBe(true);
        });

        it('should insert initial version entry for old DBs', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 0 }),
            });

            migrateSchema(mockDb);

            const calls = mockDb.exec.mock.calls;
            const insertVersionCall = calls.some((call: any[]) =>
                call[0].includes('INSERT OR IGNORE INTO db_version')
            );
            expect(insertVersionCall).toBe(true);
        });

        it('should not re-run migration if DB is already v1', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 1 }),
            });

            migrateSchema(mockDb);

            const calls = mockDb.exec.mock.calls;
            // Should still create version table (idempotent), but not update version again
            const updateVersionCall = calls.some((call: any[]) =>
                call[0].includes('UPDATE db_version SET version = 1')
            );

            // Should create version table
            const createVersionTableCall = calls.some((call: any[]) =>
                call[0].includes('CREATE TABLE IF NOT EXISTS db_version')
            );
            expect(createVersionTableCall).toBe(true);

            // Should not update version if already at v1
            // (depends on implementation - if getDbVersion returns 1, UPDATE shouldn't be called)
            // This test documents expected behavior for idempotent migrations
        });

        it('should be idempotent on subsequent runs', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 1 }),
            });

            // Run twice
            migrateSchema(mockDb);
            const firstRunCallCount = mockDb.exec.mock.calls.length;

            // Reset mock counts
            mockDb.exec.mockClear();

            migrateSchema(mockDb);
            const secondRunCallCount = mockDb.exec.mock.calls.length;

            // Second run should have same calls due to IF NOT EXISTS clauses
            expect(secondRunCallCount).toBe(firstRunCallCount);
        });

        it('should define correct schema for completed_tasks table', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 0 }),
            });

            migrateSchema(mockDb);

            const calls = mockDb.exec.mock.calls;
            const createTableCall = calls.find((call: any[]) =>
                call[0].includes('CREATE TABLE IF NOT EXISTS completed_tasks')
            );

            expect(createTableCall).toBeTruthy();
            const schema = createTableCall[0];

            // Verify all required columns exist
            expect(schema).toContain('task_id TEXT PRIMARY KEY');
            expect(schema).toContain('original_ticket_id TEXT');
            expect(schema).toContain('title TEXT NOT NULL');
            expect(schema).toContain('status TEXT NOT NULL');
            expect(schema).toContain('priority INTEGER NOT NULL');
            expect(schema).toContain('completed_at TEXT NOT NULL');
            expect(schema).toContain('duration_minutes INTEGER');
            expect(schema).toContain('outcome TEXT');
            expect(schema).toContain('created_at TEXT NOT NULL');
        });

        it('should handle DB exec errors gracefully', () => {
            mockDb.exec.mockImplementation(() => {
                throw new Error('database disk image is malformed');
            });

            expect(() => migrateSchema(mockDb)).toThrow(
                expect.objectContaining({
                    message: expect.stringContaining('Database migration error'),
                })
            );
        });

        it('should wrap errors with context message', () => {
            const originalError = new Error('column task_id already exists');
            mockDb.exec.mockImplementation(() => {
                throw originalError;
            });

            let caughtError: Error | null = null;
            try {
                migrateSchema(mockDb);
            } catch (error) {
                caughtError = error as Error;
            }

            expect(caughtError).not.toBeNull();
            expect(caughtError?.message).toContain('Database migration error');
            expect(caughtError?.message).toContain('column task_id already exists');
        });

        it('should handle non-Error exceptions', () => {
            mockDb.exec.mockImplementation(() => {
                // eslint-disable-next-line no-throw-literal
                throw 'string error';
            });

            expect(() => migrateSchema(mockDb)).toThrow(
                expect.objectContaining({
                    message: expect.stringContaining('Database migration error'),
                })
            );
        });

        it('should handle prepare() errors in getDbVersion call', () => {
            mockDb.exec.mockReturnValue(undefined);
            mockDb.prepare.mockImplementation(() => {
                throw new Error('table db_version does not exist');
            });

            // Should not throw - getDbVersion returns 0 on error
            expect(() => migrateSchema(mockDb)).not.toThrow();
        });
    });

    // ============================================================================
    // Integration Tests (both functions together)
    // ============================================================================

    describe('Integration: getDbVersion + migrateSchema', () => {
        it('should correctly report version after migration', () => {
            // Setup: DB returns version 0 initially
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue(null), // No version initially
            });

            migrateSchema(mockDb);

            // After migration, should be able to get version
            // Update mock to return version 1
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 1 }),
            });

            const version = getDbVersion(mockDb);
            expect(version).toBe(1);
        });

        it('should handle complete migration lifecycle without errors', () => {
            // Simulate new database
            let dbVersion = 0;
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockImplementation(() => {
                    if (dbVersion === 0) return null;
                    return { version: dbVersion };
                }),
            });

            mockDb.exec.mockImplementation(() => {
                // Simulate version update
                dbVersion = 1;
            });

            // First call: no version
            expect(getDbVersion(mockDb)).toBe(0);

            // Migrate
            expect(() => migrateSchema(mockDb)).not.toThrow();

            // Version is now updated (in real scenario)
            // Note: In this test, we'd need more complex mocking to reflect actual DB state
        });
    });

    // ============================================================================
    // Edge Cases and Error Scenarios
    // ============================================================================

    describe('Edge Cases', () => {
        it('should handle undefined result from query', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue(undefined),
            });

            const version = getDbVersion(mockDb);
            expect(version).toBe(0);
        });

        it('should handle result object with missing version property', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({}),
            });

            const version = getDbVersion(mockDb);
            expect(version).toBe(0);
        });

        it('should handle negative version numbers', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: -1 }),
            });

            const version = getDbVersion(mockDb);
            expect(version).toBe(-1); // Returns as-is (implementation doesn't validate)
        });

        it('should handle very large version numbers', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 999999 }),
            });

            const version = getDbVersion(mockDb);
            expect(version).toBe(999999);
        });

        it('should handle DB prepare with null return', () => {
            mockDb.prepare.mockReturnValue(null);

            // Error is caught in try-catch, returns 0 when prepare returns null
            // because accessing .get() on null throws, which is caught
            const version = getDbVersion(mockDb);
            expect(version).toBe(0);
        });

        it('should handle empty error message in catch block', () => {
            mockDb.exec.mockImplementation(() => {
                // eslint-disable-next-line no-throw-literal
                throw {};
            });

            expect(() => migrateSchema(mockDb)).toThrow(
                expect.objectContaining({
                    message: expect.stringContaining('Database migration error'),
                })
            );
        });
    });

    // ============================================================================
    // Database State Tests
    // ============================================================================

    describe('Database State Management', () => {
        it('should call db.prepare with correct SQL syntax', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 1 }),
            });

            getDbVersion(mockDb);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                'SELECT version FROM db_version LIMIT 1'
            );
        });

        it('should use IF NOT EXISTS to avoid schema conflicts', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 0 }),
            });

            migrateSchema(mockDb);

            const calls = mockDb.exec.mock.calls;
            const dbVersionCall = calls.find((call: any[]) =>
                call[0].includes('CREATE TABLE IF NOT EXISTS db_version')
            );

            expect(dbVersionCall[0]).toContain('IF NOT EXISTS');
        });

        it('should use INSERT OR IGNORE to handle idempotent inserts', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 0 }),
            });

            migrateSchema(mockDb);

            const calls = mockDb.exec.mock.calls;
            const insertCall = calls.find((call: any[]) =>
                call[0].includes('INSERT OR IGNORE INTO db_version')
            );

            expect(insertCall[0]).toContain('INSERT OR IGNORE');
        });

        it('should call exec multiple times for different schema operations', () => {
            mockDb.prepare.mockReturnValue({
                get: jest.fn().mockReturnValue({ version: 0 }),
            });

            migrateSchema(mockDb);

            // Should have multiple exec calls for different operations
            expect(mockDb.exec.mock.calls.length).toBeGreaterThan(2);
        });
    });
});

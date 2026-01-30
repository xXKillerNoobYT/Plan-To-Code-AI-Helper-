import { getDbVersion, migrateSchema } from '../../src/db/migrations';

/** @aiContributed-2026-01-29 */
describe('getDbVersion', () => {
  interface MockDb {
    prepare: jest.Mock;
  }

  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = {
      prepare: jest.fn(),
    };
  });

  /** @aiContributed-2026-01-29 */
    it('should return the version number if the version exists in the db_version table', () => {
    const mockGet = jest.fn().mockReturnValue({ version: 2 });
    mockDb.prepare.mockReturnValue({ get: mockGet });

    const version = getDbVersion(mockDb);

    expect(mockDb.prepare).toHaveBeenCalledWith('SELECT version FROM db_version LIMIT 1');
    expect(mockGet).toHaveBeenCalled();
    expect(version).toBe(2);
  });

  /** @aiContributed-2026-01-29 */
    it('should return 0 if the db_version table does not exist', () => {
    mockDb.prepare.mockImplementation(() => {
      throw new Error('Table does not exist');
    });

    const version = getDbVersion(mockDb);

    expect(mockDb.prepare).toHaveBeenCalledWith('SELECT version FROM db_version LIMIT 1');
    expect(version).toBe(0);
  });

  /** @aiContributed-2026-01-29 */
    it('should return 0 if the version is undefined', () => {
    const mockGet = jest.fn().mockReturnValue(undefined);
    mockDb.prepare.mockReturnValue({ get: mockGet });

    const version = getDbVersion(mockDb);

    expect(mockDb.prepare).toHaveBeenCalledWith('SELECT version FROM db_version LIMIT 1');
    expect(mockGet).toHaveBeenCalled();
    expect(version).toBe(0);
  });
});

/** @aiContributed-2026-01-29 */
describe('migrateSchema', () => {
  interface MockDb {
    exec: jest.Mock;
    prepare: jest.Mock;
  }

  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = {
      exec: jest.fn(),
      prepare: jest.fn(),
    };
  });

  /** @aiContributed-2026-01-29 */
    it('should create db_version table and set initial version if it does not exist', () => {
    mockDb.prepare.mockReturnValue({ get: jest.fn().mockReturnValue(undefined) });

    migrateSchema(mockDb);

    expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS db_version'));
    expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('INSERT OR IGNORE INTO db_version (version) VALUES (0)'));
  });

  /** @aiContributed-2026-01-29 */
    it('should migrate schema from version 0 to 1', () => {
    mockDb.prepare.mockReturnValue({ get: jest.fn().mockReturnValue({ version: 0 }) });

    migrateSchema(mockDb);

    expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS completed_tasks'));
    expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_completed_status'));
    expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_completed_at'));
    expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('UPDATE db_version SET version = 1'));
  });

  /** @aiContributed-2026-01-29 */
    it('should not apply migrations if the current version is up-to-date', () => {
    mockDb.prepare.mockReturnValue({ get: jest.fn().mockReturnValue({ version: 1 }) });

    migrateSchema(mockDb);

    expect(mockDb.exec).not.toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS completed_tasks'));
    expect(mockDb.exec).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE db_version SET version = 1'));
  });

  /** @aiContributed-2026-01-29 */
    it('should throw an error if migration fails', () => {
    mockDb.exec.mockImplementation(() => {
      throw new Error('Migration failed');
    });

    expect(() => migrateSchema(mockDb)).toThrow('Database migration error: Migration failed');
  });
});
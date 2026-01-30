import { migrateSchema } from '../../src/db/migrations';

/** @aiContributed-2026-01-29 */
describe('migrateSchema', () => {
  interface MockDb {
    exec: jest.Mock;
    prepare: jest.Mock;
    getMock: jest.Mock;
  }

  let mockDb: MockDb;

  beforeEach(() => {
    const getMock = jest.fn();
    mockDb = {
      exec: jest.fn(),
      prepare: jest.fn(() => ({
        get: getMock,
      })),
      getMock,
    };
  });

  /** @aiContributed-2026-01-29 */
  it('should create the db_version table if it does not exist', () => {
    mockDb.getMock.mockReturnValueOnce(undefined);

    migrateSchema(mockDb);

    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS db_version')
    );
    expect(mockDb.exec).toHaveBeenCalledWith(
      'INSERT OR IGNORE INTO db_version (version) VALUES (0)'
    );
  });

  /** @aiContributed-2026-01-29 */
  it('should migrate schema from version 0 to version 1', () => {
    mockDb.getMock.mockReturnValueOnce({ version: 0 });

    migrateSchema(mockDb);

    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS completed_tasks')
    );
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_completed_status')
    );
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_completed_at')
    );
    expect(mockDb.exec).toHaveBeenCalledWith('UPDATE db_version SET version = 1');
  });

  /** @aiContributed-2026-01-29 */
  it('should not apply migrations if the current version is up-to-date', () => {
    mockDb.getMock.mockReturnValueOnce({ version: 1 });

    migrateSchema(mockDb);

    expect(mockDb.exec).not.toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS completed_tasks'));
    expect(mockDb.exec).not.toHaveBeenCalledWith(`UPDATE db_version SET version = 1`);
  });

  /** @aiContributed-2026-01-29 */
  it('should throw an error if a database operation fails', () => {
    mockDb.exec.mockImplementationOnce(() => {
      throw new Error('Mocked DB error');
    });

    expect(() => migrateSchema(mockDb)).toThrow('Database migration error: Mocked DB error');
  });
});
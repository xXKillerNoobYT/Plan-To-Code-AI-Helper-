// ./migrations.getDbVersion.gptgen.web.spec.ts
import { getDbVersion } from '../../src/db/migrations';

/** @aiContributed-2026-01-28 */
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

  /** @aiContributed-2026-01-28 */
  it('should return the version number if the version exists in the db_version table', () => {
    const mockGet = jest.fn().mockReturnValue({ version: 2 });
    mockDb.prepare.mockReturnValue({ get: mockGet });

    const version = getDbVersion(mockDb);

    expect(mockDb.prepare).toHaveBeenCalledWith('SELECT version FROM db_version LIMIT 1');
    expect(mockGet).toHaveBeenCalled();
    expect(version).toBe(2);
  });

  /** @aiContributed-2026-01-28 */
  it('should return 0 if the db_version table does not exist', () => {
    mockDb.prepare.mockImplementation(() => {
      throw new Error('Table does not exist');
    });

    const version = getDbVersion(mockDb);

    expect(mockDb.prepare).toHaveBeenCalledWith('SELECT version FROM db_version LIMIT 1');
    expect(version).toBe(0);
  });

  /** @aiContributed-2026-01-28 */
  it('should return 0 if the version is undefined', () => {
    const mockGet = jest.fn().mockReturnValue(undefined);
    mockDb.prepare.mockReturnValue({ get: mockGet });

    const version = getDbVersion(mockDb);

    expect(mockDb.prepare).toHaveBeenCalledWith('SELECT version FROM db_version LIMIT 1');
    expect(mockGet).toHaveBeenCalled();
    expect(version).toBe(0);
  });
});
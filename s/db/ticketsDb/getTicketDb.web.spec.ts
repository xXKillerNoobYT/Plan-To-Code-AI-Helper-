import { getTicketDb } from '../../../src/db/ticketsDb';
import * as sqlite3 from 'sqlite3';

jest.mock('sqlite3', () => {
    const mockDatabase = jest.fn();
    return { Database: mockDatabase };
});

/** @aiContributed-2026-01-26 */
describe('getTicketDb', () => {
    let dbInstance: ReturnType<typeof getTicketDb>;

    beforeEach(() => {
        jest.clearAllMocks();
        dbInstance = getTicketDb();
    });

    afterEach(async () => {
        await dbInstance.close();
        (getTicketDb() as { constructor: { resetInstance: () => void } }).constructor.resetInstance();
    });

    /** @aiContributed-2026-01-26 */
    it('should return the same instance on multiple calls', () => {
        const instance1 = getTicketDb();
        const instance2 = getTicketDb();
        expect(instance1).toBe(instance2);
    });

    /** @aiContributed-2026-01-26 */
    it('should fall back to in-memory storage on SQLite initialization error', async () => {
        (sqlite3.Database as unknown as jest.Mock).mockImplementationOnce(() => {
            throw new Error('SQLite error');
        });

        await dbInstance.initialize('/workspace');

        expect(dbInstance['useFallback']).toBe(true);
    });
});
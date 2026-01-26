// ./issuesSync.IssuesSync.stopSync.gptgen.web.spec.ts
import { IssuesSync } from '../../../src/github/issuesSync';
import { jest } from '@jest/globals';

/** @aiContributed-2026-01-24 */
describe('IssuesSync - stopSync', () => {
    let issuesSync: IssuesSync;

    beforeEach(() => {
        issuesSync = new IssuesSync();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllTimers();
    });

    /** @aiContributed-2026-01-24 */
    test('should clear the sync interval and set it to null', () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        const mockInterval = setInterval(() => {}, 1000);
        (issuesSync as unknown as { syncInterval: NodeJS.Timeout }).syncInterval = mockInterval;

        issuesSync.stopSync();

        expect(clearIntervalSpy).toHaveBeenCalledWith(mockInterval);
        expect((issuesSync as unknown as { syncInterval: NodeJS.Timeout | null }).syncInterval).toBeNull();
    });

    /** @aiContributed-2026-01-24 */
    test('should log "Issues Sync: Stopped" when called', () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        (issuesSync as unknown as { syncInterval: NodeJS.Timeout }).syncInterval = setInterval(() => {}, 1000);

        issuesSync.stopSync();

        expect(consoleLogSpy).toHaveBeenCalledWith('Issues Sync: Stopped');
    });

    /** @aiContributed-2026-01-24 */
    test('should not throw an error if syncInterval is already null', () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        (issuesSync as unknown as { syncInterval: NodeJS.Timeout | null }).syncInterval = null;

        expect(() => issuesSync.stopSync()).not.toThrow();
        expect(clearIntervalSpy).not.toHaveBeenCalled();
    });
});
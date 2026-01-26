import { IssuesSync } from '../../../src/github/issuesSync';
import { GitHubAPI } from '../../../src/github/api';

jest.useFakeTimers();

/** @aiContributed-2026-01-24 */
describe('IssuesSync - startSync', () => {
    let issuesSync: IssuesSync;
    let githubAPI: GitHubAPI;

    beforeEach(() => {
        issuesSync = new IssuesSync();
        githubAPI = new GitHubAPI();
        jest.spyOn(global.console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.restoreAllMocks();
    });

    /** @aiContributed-2026-01-24 */
    it('should call performSync immediately and schedule periodic sync', () => {
        const performSyncSpy = jest
            .spyOn(issuesSync as unknown as { performSync: () => Promise<void> }, 'performSync')
            .mockResolvedValue(undefined);

        issuesSync.startSync(githubAPI);

        // Verify initial sync
        expect(performSyncSpy).toHaveBeenCalledTimes(1);
        expect(performSyncSpy).toHaveBeenCalledWith(githubAPI);

        // Fast-forward time to verify periodic sync
        jest.advanceTimersByTime((issuesSync as unknown as { SYNC_INTERVAL_MS: number }).SYNC_INTERVAL_MS);
        expect(performSyncSpy).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime((issuesSync as unknown as { SYNC_INTERVAL_MS: number }).SYNC_INTERVAL_MS);
        expect(performSyncSpy).toHaveBeenCalledTimes(3);
    });

    /** @aiContributed-2026-01-24 */
    it('should log messages when starting sync', () => {
        issuesSync.startSync(githubAPI);

        expect(console.log).toHaveBeenCalledWith('Issues Sync: Starting (5-minute interval)...');
        expect(console.log).toHaveBeenCalledWith('Issues Sync: Started');
    });

    /* it('should not schedule periodic sync if already running', () => {
            const performSyncSpy = jest
                .spyOn(issuesSync as unknown as { performSync: () => Promise<void> }, 'performSync')
                .mockResolvedValue(undefined);

            issuesSync.startSync(githubAPI);

            // Simulate already running state
            issuesSync.startSync(githubAPI);

            // Verify performSync is not called more than once
            expect(performSyncSpy).toHaveBeenCalledTimes(1);
        }); */
});
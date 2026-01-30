// ./issuesSync.web.spec.ts
import { IssuesSync } from '../../src/github/issuesSync.ts';
import { GitHubAPI } from '../../src/github/api';

jest.useFakeTimers();

/** @aiContributed-2026-01-29 */
describe('IssuesSync - startSync', () => {
  let issuesSync: IssuesSync;
  let githubAPI: GitHubAPI;

  beforeEach(() => {
    issuesSync = new IssuesSync();
    githubAPI = {
      performSync: jest.fn(),
    } as unknown as GitHubAPI;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  /** @aiContributed-2026-01-29 */
  it('should call performSync immediately and schedule periodic sync', () => {
    const performSyncSpy = jest
      .spyOn(issuesSync as unknown as { performSync: (api: GitHubAPI) => Promise<void> }, 'performSync')
      .mockResolvedValue(undefined);

    issuesSync.startSync(githubAPI);

    expect(performSyncSpy).toHaveBeenCalledTimes(1);
    expect(performSyncSpy).toHaveBeenCalledWith(githubAPI);

    jest.advanceTimersByTime(issuesSync['SYNC_INTERVAL_MS']);
    expect(performSyncSpy).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(issuesSync['SYNC_INTERVAL_MS']);
    expect(performSyncSpy).toHaveBeenCalledTimes(3);
  });

  /** @aiContributed-2026-01-29 */
  it('should set syncInterval when startSync is called', () => {
    issuesSync.startSync(githubAPI);
    expect(issuesSync['syncInterval']).not.toBeNull();
  });
});
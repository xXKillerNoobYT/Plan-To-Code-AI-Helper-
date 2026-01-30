// ./issuesSync.web.spec.ts
import { IssuesSync } from '../../src/github/issuesSync';
import { GitHubAPI } from '../../src/github/api';

jest.mock('../../src/github/api', () => {
  return {
    ...jest.requireActual('../../src/github/api'),
    GitHubAPI: jest.fn().mockImplementation(() => ({
      getIssue: jest.fn(),
      createIssue: jest.fn(),
      updateIssue: jest.fn(),
      listIssues: jest.fn(),
    })),
  };
});

/** @aiContributed-2026-01-29 */
describe('IssuesSync', () => {
  let issuesSync: IssuesSync;
  let githubAPI: GitHubAPI;

  beforeEach(() => {
    issuesSync = new IssuesSync();
    githubAPI = new GitHubAPI();
  });

  /** @aiContributed-2026-01-29 */
  it('should call performSync when syncNow is invoked', async () => {
    const performSyncSpy = jest
      .spyOn(issuesSync as unknown as { performSync: (api: GitHubAPI) => Promise<void> }, 'performSync')
      .mockResolvedValue(undefined);

    await issuesSync.syncNow(githubAPI);

    expect(performSyncSpy).toHaveBeenCalledWith(githubAPI);
  });
});
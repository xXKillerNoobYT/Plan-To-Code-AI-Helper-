import { GitHubAPI } from '../../src/github/api';
import { Octokit } from '@octokit/rest';

type MockOctokit = {
  issues: {
    get: jest.Mock;
  };
};

jest.mock('@octokit/rest', () => ({
  ...jest.requireActual('@octokit/rest'),
  Octokit: jest.fn().mockImplementation(() => ({
    issues: {
      get: jest.fn(),
    },
  })),
}));

/** @aiContributed-2026-01-29 */
describe('GitHubAPI - getIssue', () => {
  let gitHubAPI: GitHubAPI;
  let mockOctokit: MockOctokit;

  beforeEach(() => {
    gitHubAPI = new GitHubAPI();
    mockOctokit = {
      issues: {
        get: jest.fn(),
      },
    };
    (gitHubAPI as unknown as { octokit: MockOctokit }).octokit = mockOctokit;
    (gitHubAPI as unknown as { isAuthenticated: boolean }).isAuthenticated = true;
  });

  /** @aiContributed-2026-01-29 */
  it('should throw an error if octokit is not initialized', async () => {
    (gitHubAPI as unknown as { octokit: null }).octokit = null;

    await expect(gitHubAPI.getIssue('owner', 'repo', 1)).rejects.toThrow('Not implemented');
  });

  /** @aiContributed-2026-01-29 */
  it('should throw an error if not authenticated', async () => {
    (gitHubAPI as unknown as { isAuthenticated: boolean }).isAuthenticated = false;

    await expect(gitHubAPI.getIssue('owner', 'repo', 1)).rejects.toThrow('Not implemented');
  });
});

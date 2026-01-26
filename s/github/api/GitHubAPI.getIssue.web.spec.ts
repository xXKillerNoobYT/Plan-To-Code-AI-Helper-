import { GitHubAPI } from '../../../src/github/api';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest', () => {
  return {
    ...jest.requireActual('@octokit/rest'),
    Octokit: jest.fn().mockImplementation(() => ({
      issues: {
        get: jest.fn().mockResolvedValue({
          data: { id: 1, title: 'Test Issue', body: 'Issue body' },
        }),
      },
    })),
  };
});

/** @aiContributed-2026-01-24 */
describe('GitHubAPI - getIssue', () => {
  let gitHubAPI: GitHubAPI;
  let mockOctokit: InstanceType<typeof Octokit>;

  beforeEach(() => {
    gitHubAPI = new GitHubAPI();
    mockOctokit = new Octokit();
    (gitHubAPI as unknown as { octokit: InstanceType<typeof Octokit> }).octokit = mockOctokit;
    (gitHubAPI as unknown as { isAuthenticated: boolean }).isAuthenticated = true;
  });

  /* it('should fetch the issue details from GitHub', async () => {
        const owner = 'test-owner';
        const repo = 'test-repo';
        const issueNumber = 123;
        const mockIssue = { id: 1, title: 'Test Issue', body: 'Issue body' };

        const result = await gitHubAPI.getIssue(owner, repo, issueNumber);

        expect(mockOctokit.issues.get).toHaveBeenCalledWith({
          owner,
          repo,
          issue_number: issueNumber,
        });
        expect(result).toEqual(mockIssue);
      }); */

  /** @aiContributed-2026-01-24 */
    it('should throw an error if octokit is not initialized', async () => {
    (gitHubAPI as unknown as { octokit: null }).octokit = null;

    await expect(gitHubAPI.getIssue('owner', 'repo', 1)).rejects.toThrow('Not implemented');
  });

  /** @aiContributed-2026-01-24 */
    it('should throw an error if not authenticated', async () => {
    (gitHubAPI as unknown as { isAuthenticated: boolean }).isAuthenticated = false;

    await expect(gitHubAPI.getIssue('owner', 'repo', 1)).rejects.toThrow('Not implemented');
  });
});
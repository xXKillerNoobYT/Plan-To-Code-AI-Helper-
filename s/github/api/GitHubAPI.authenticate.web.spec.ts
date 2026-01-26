// ./api.web.spec.ts
import { GitHubAPI } from '../../../src/github/api.ts';
import { jest } from '@jest/globals';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest', () => ({
  ...jest.requireActual('@octokit/rest'),
  Octokit: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn(),
  })),
}));

/** @aiContributed-2026-01-24 */
describe('GitHubAPI - authenticate', () => {
  let gitHubAPI: GitHubAPI;

  beforeEach(() => {
    gitHubAPI = new GitHubAPI();
  });

  /** @aiContributed-2026-01-24 */
  it('should set isAuthenticated to false and return false when authentication fails', async () => {
    const token = 'invalid-token';
    const mockOctokitInstance = {
      authenticate: jest.fn().mockRejectedValue(new Error('Authentication failed')),
    };
    (Octokit as jest.Mock).mockImplementation(() => mockOctokitInstance);

    const result = await (gitHubAPI as unknown as { authenticate: (token: string) => Promise<boolean> }).authenticate(token);

    expect(result).toBe(false);
    expect((gitHubAPI as unknown as { isAuthenticated: boolean }).isAuthenticated).toBe(false);
    expect(mockOctokitInstance.authenticate).toHaveBeenCalledWith({ type: 'token', token });
  });

  /** @aiContributed-2026-01-24 */
  it('should set isAuthenticated to true and return true when authentication succeeds', async () => {
    const token = 'valid-token';
    const mockOctokitInstance = {
      authenticate: jest.fn().mockResolvedValue(true),
    };
    (Octokit as jest.Mock).mockImplementation(() => mockOctokitInstance);

    const result = await (gitHubAPI as unknown as { authenticate: (token: string) => Promise<boolean> }).authenticate(token);

    expect(result).toBe(true);
    expect((gitHubAPI as unknown as { isAuthenticated: boolean }).isAuthenticated).toBe(true);
    expect(mockOctokitInstance.authenticate).toHaveBeenCalledWith({ type: 'token', token });
  });
});
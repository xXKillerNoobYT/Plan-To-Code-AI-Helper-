// ./api.GitHubAPI.createIssue.gptgen.web.spec.ts
import { GitHubAPI } from '../../../src/github/api.ts';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest', () => {
  return {
    ...jest.requireActual('@octokit/rest'),
    Octokit: jest.fn().mockImplementation(() => ({
      issues: {
        create: jest.fn(),
      },
    })),
  };
});

/** @aiContributed-2026-01-24 */
describe('GitHubAPI - createIssue', () => {
  let gitHubAPI: GitHubAPI;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    gitHubAPI = new GitHubAPI();
    gitHubAPI['octokit'] = new Octokit() as unknown as InstanceType<typeof Octokit>;
    mockCreate = (gitHubAPI['octokit'] as InstanceType<typeof Octokit>).issues.create as jest.Mock;
  });

  /** @aiContributed-2026-01-24 */
  it('should create an issue with the correct parameters', async () => {
    const owner = 'test-owner';
    const repo = 'test-repo';
    const title = 'Test Issue';
    const body = 'This is a test issue.';
    const mockResponse = { data: { id: 123, title, body } };

    mockCreate.mockResolvedValueOnce(mockResponse);

    const result = await gitHubAPI.createIssue(owner, repo, title, body);

    expect(mockCreate).toHaveBeenCalledWith({
      owner,
      repo,
      title,
      body,
    });
    expect(result).toEqual(mockResponse.data);
  });

  /** @aiContributed-2026-01-24 */
  it('should throw an error if the API call fails', async () => {
    const owner = 'test-owner';
    const repo = 'test-repo';
    const title = 'Test Issue';
    const body = 'This is a test issue.';
    const mockError = new Error('API Error');

    mockCreate.mockRejectedValueOnce(mockError);

    await expect(gitHubAPI.createIssue(owner, repo, title, body)).rejects.toThrow('API Error');
  });
});
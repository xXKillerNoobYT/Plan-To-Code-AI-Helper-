// ./update-prd.web.spec.ts

import { run } from '../../src/scripts/update-prd';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import path from 'path';

jest.mock('@octokit/rest', () => ({
  ...jest.requireActual('@octokit/rest'),
  Octokit: jest.fn(),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn(),
  join: jest.fn(),
}));

/** @aiContributed-2026-01-29 */
describe('run', () => {
  const mockReadFile = fs.promises.readFile as jest.Mock;
  const mockWriteFile = fs.promises.writeFile as jest.Mock;
  const mockResolve = path.resolve as jest.Mock;
  const mockJoin = path.join as jest.Mock;
  const mockListForRepo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Octokit as unknown as jest.Mock).mockImplementation(() => ({
      issues: {
        listForRepo: mockListForRepo,
      },
    }));
  });

  /** @aiContributed-2026-01-29 */
  it('should fetch issues, update PRD.md, and append to status-log.md', async () => {
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.COE_GITHUB_OWNER = 'test-owner';
    process.env.COE_GITHUB_REPO = 'test-repo';

    const mockIssues = [
      {
        number: 1,
        title: 'Test Issue 1',
        html_url: 'https://github.com/test/1',
        labels: [{ name: 'bug' }],
      },
      {
        number: 2,
        title: 'Test Issue 2',
        html_url: 'https://github.com/test/2',
        labels: [{ name: 'feature' }],
      },
    ];

    mockListForRepo.mockResolvedValue({ data: mockIssues });
    mockReadFile.mockResolvedValueOnce('Existing PRD content');
    mockReadFile.mockResolvedValueOnce('Existing status-log content');
    mockResolve.mockReturnValueOnce('/resolved/PRD.md');
    mockResolve.mockReturnValueOnce('/resolved/status-log.md');

    await run();

    expect(mockListForRepo).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      state: 'open',
      per_page: 100,
    });

    expect(mockReadFile).toHaveBeenCalledWith('/resolved/PRD.md', 'utf8');
    expect(mockReadFile).toHaveBeenCalledWith('/resolved/status-log.md', 'utf8');

    expect(mockWriteFile).toHaveBeenCalledWith(
      '/resolved/PRD.md',
      expect.stringContaining('## Updates from GitHub Issues'),
      'utf8',
    );

    expect(mockWriteFile).toHaveBeenCalledWith(
      '/resolved/status-log.md',
      expect.stringContaining('##'),
      'utf8',
    );
  });

  /** @aiContributed-2026-01-29 */
  it('should not update files if no issues are categorized', async () => {
    process.env.GITHUB_TOKEN = 'test-token';
    mockListForRepo.mockResolvedValue({ data: [] });

    await run();

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  /** @aiContributed-2026-01-29 */
  it('should throw an error if GITHUB_TOKEN is missing', async () => {
    delete process.env.GITHUB_TOKEN;

    await expect(run()).rejects.toThrow('GITHUB_TOKEN (or GH_TOKEN) is required to fetch GitHub issues.');
  });
});
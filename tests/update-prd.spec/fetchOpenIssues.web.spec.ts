// ./update-prd.web.spec.ts
import { fetchOpenIssues } from '../../src/scripts/update-prd';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest', () => {
    const mockIssues = {
        ...jest.requireActual('@octokit/rest'),
        listForRepo: jest.fn(),
    };
    return {
        Octokit: jest.fn(() => ({
            issues: mockIssues,
        })),
    };
});

/** @aiContributed-2026-01-29 */
describe('fetchOpenIssues', () => {
    /** @aiContributed-2026-01-29 */
    it('should fetch open issues from the specified repository', async () => {
        const mockListForRepo = jest.fn().mockResolvedValue({
            data: [
                { number: 1, title: 'Issue 1', html_url: 'https://example.com/1' },
                { number: 2, title: 'Issue 2', html_url: 'https://example.com/2' },
            ],
        });
        (Octokit as unknown as jest.Mock).mockImplementation(() => ({
            issues: { listForRepo: mockListForRepo },
        }));

        const octokit = new Octokit();
        const owner = 'test-owner';
        const repo = 'test-repo';

        const result = await fetchOpenIssues(octokit, owner, repo);

        expect(mockListForRepo).toHaveBeenCalledWith({
            owner,
            repo,
            state: 'open',
            per_page: 100,
        });
        expect(result).toEqual([
            { number: 1, title: 'Issue 1', html_url: 'https://example.com/1' },
            { number: 2, title: 'Issue 2', html_url: 'https://example.com/2' },
        ]);
    });

    /** @aiContributed-2026-01-29 */
    it('should return an empty array if no issues are found', async () => {
        const mockListForRepo = jest.fn().mockResolvedValue({ data: [] });
        (Octokit as unknown as jest.Mock).mockImplementation(() => ({
            issues: { listForRepo: mockListForRepo },
        }));

        const octokit = new Octokit();
        const owner = 'test-owner';
        const repo = 'test-repo';

        const result = await fetchOpenIssues(octokit, owner, repo);

        expect(mockListForRepo).toHaveBeenCalledWith({
            owner,
            repo,
            state: 'open',
            per_page: 100,
        });
        expect(result).toEqual([]);
    });

    /** @aiContributed-2026-01-29 */
    it('should throw an error if the API call fails', async () => {
        const mockListForRepo = jest.fn().mockRejectedValue(new Error('API Error'));
        (Octokit as unknown as jest.Mock).mockImplementation(() => ({
            issues: { listForRepo: mockListForRepo },
        }));

        const octokit = new Octokit();
        const owner = 'test-owner';
        const repo = 'test-repo';

        await expect(fetchOpenIssues(octokit, owner, repo)).rejects.toThrow('API Error');
        expect(mockListForRepo).toHaveBeenCalledWith({
            owner,
            repo,
            state: 'open',
            per_page: 100,
        });
    });
});
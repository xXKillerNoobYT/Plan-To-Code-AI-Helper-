import { IssuesSync } from '../../../src/github/issuesSync';
import { GitHubAPI } from '../../../src/github/api';

jest.mock('../../../src/github/api');
jest.mock('vscode', () => ({
    ...jest.requireActual('vscode'),
    window: {
        showErrorMessage: jest.fn(),
    },
}));

/** @aiContributed-2026-01-24 */
describe('IssuesSync', () => {
    let githubAPI: jest.Mocked<GitHubAPI>;
    let issuesSync: IssuesSync;

    beforeEach(() => {
        githubAPI = new GitHubAPI() as jest.Mocked<GitHubAPI>;
        issuesSync = new IssuesSync();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /** @aiContributed-2026-01-24 */
    it('should complete without reporting an error when no exception occurs', async () => {
        const showErrorMessage = jest.requireMock('vscode').window.showErrorMessage as jest.Mock;

        await issuesSync['performSync'](githubAPI);

        expect(showErrorMessage).not.toHaveBeenCalled();
    });
});
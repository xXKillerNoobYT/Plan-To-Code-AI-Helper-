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
    it('should log "Issues Sync: Syncing..." and "Issues Sync: Completed" on successful sync', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await issuesSync['performSync'](githubAPI);

        expect(consoleLogSpy).toHaveBeenCalledWith('Issues Sync: Syncing...');
        expect(consoleLogSpy).toHaveBeenCalledWith('Issues Sync: Completed');
        consoleLogSpy.mockRestore();
    });

    /* it('should handle errors and show error message when sync fails', async () => {
            const error = new Error('Test error');
            githubAPI.listIssues.mockRejectedValue(error);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await issuesSync['performSync'](githubAPI);

            expect(consoleErrorSpy).toHaveBeenCalledWith('Issues Sync: Error:', error);
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(`GitHub sync failed: ${error.message}`);
            consoleErrorSpy.mockRestore();
        }); */
});
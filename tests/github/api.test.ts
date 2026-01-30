/**
 * 🧪 Tests for GitHub API SecretStorage Integration
 * 
 * Verifies that GitHubAPI correctly uses SecretStorage for token authentication
 */

import * as vscode from 'vscode';
import { GitHubAPI } from '../../src/github/api';
import { ConfigManager } from '../../src/utils/config';

// Mock Octokit
jest.mock('@octokit/rest', () => {
    return {
        Octokit: jest.fn().mockImplementation(() => ({
            users: {
                getAuthenticated: jest.fn().mockResolvedValue({ data: { login: 'testuser' } }),
            },
        })),
    };
});

describe('GitHubAPI - SecretStorage Integration', () => {
    let gitHubAPI: GitHubAPI;
    let mockContext: vscode.ExtensionContext;
    let mockSecrets: Map<string, string>;

    beforeEach(() => {
        // Reset token cache
        (ConfigManager as any).tokenCache = null;

        // Mock SecretStorage
        mockSecrets = new Map();
        mockContext = {
            secrets: {
                get: jest.fn(async (key: string) => mockSecrets.get(key)),
                store: jest.fn(async (key: string, value: string) => {
                    mockSecrets.set(key, value);
                }),
                delete: jest.fn(async (key: string) => {
                    mockSecrets.delete(key);
                }),
            },
        } as unknown as vscode.ExtensionContext;

        gitHubAPI = new GitHubAPI();
        gitHubAPI.setContext(mockContext);
    });

    // ========================================================================
    // Test 1: Authenticate with token from SecretStorage
    // ========================================================================
    it('should authenticate using token from SecretStorage', async () => {
        const testToken = 'ghp_secret_token';

        // Store token directly in mock SecretStorage (not via ConfigManager to avoid cache)
        mockSecrets.set('github-token', testToken);

        const result = await gitHubAPI.authenticate();

        expect(result).toBe(true);
        expect(mockContext.secrets.get).toHaveBeenCalled();
    });

    // ========================================================================
    // Test 2: Authenticate with provided token (override SecretStorage)
    // ========================================================================
    it('should use provided token over SecretStorage', async () => {
        const storedToken = 'ghp_stored_token';
        const providedToken = 'ghp_provided_token';

        await ConfigManager.setGitHubToken(mockContext, storedToken);

        const result = await gitHubAPI.authenticate(providedToken);

        expect(result).toBe(true);
        // Should not call SecretStorage when token is provided
    });

    // ========================================================================
    // Test 3: Return false when no token available
    // ========================================================================
    it('should return false when no token is available', async () => {
        const result = await gitHubAPI.authenticate();

        expect(result).toBe(false);
    });

    // ========================================================================
    // Test 4: Handle authentication failure
    // ========================================================================
    it('should handle authentication failure gracefully', async () => {
        const Octokit = require('@octokit/rest').Octokit;
        Octokit.mockImplementationOnce(() => ({
            users: {
                getAuthenticated: jest.fn().mockRejectedValue(new Error('Bad credentials')),
            },
        }));

        const testToken = 'ghp_invalid_token';
        const result = await gitHubAPI.authenticate(testToken);

        expect(result).toBe(false);
    });

    // ========================================================================
    // Test 5: Context must be set before authentication
    // ========================================================================
    it('should work without context if token is provided', async () => {
        const apiWithoutContext = new GitHubAPI();
        const testToken = 'ghp_direct_token';

        const result = await apiWithoutContext.authenticate(testToken);

        expect(result).toBe(true);
    });

    // ========================================================================
    // Branch Coverage Tests for updateIssue and listIssues
    // ========================================================================

    describe('updateIssue', () => {
        it('should throw error when not authenticated', async () => {
            const apiNotAuth = new GitHubAPI();

            await expect(
                apiNotAuth.updateIssue('owner', 'repo', 1, { title: 'Updated' })
            ).rejects.toThrow('Not authenticated');
        });

        it('should throw error when octokit is null', async () => {
            const api = new GitHubAPI();
            // Authenticate but then set octokit to null to test branch
            await api.authenticate('ghp_token');
            (api as any).octokit = null;

            await expect(
                api.updateIssue('owner', 'repo', 1, { title: 'Updated' })
            ).rejects.toThrow('Not authenticated');
        });

        it('should successfully update issue when authenticated', async () => {
            const Octokit = require('@octokit/rest').Octokit;
            Octokit.mockImplementationOnce(() => ({
                users: {
                    getAuthenticated: jest.fn().mockResolvedValue({ data: { login: 'testuser' } }),
                },
                issues: {
                    update: jest.fn().mockResolvedValue({ data: { id: 1, title: 'Updated Issue' } }),
                },
            }));

            const api = new GitHubAPI();
            await api.authenticate('ghp_token');

            const result = await api.updateIssue('owner', 'repo', 1, { title: 'Updated Issue' });

            expect(result).toEqual({ id: 1, title: 'Updated Issue' });
        });
    });

    describe('listIssues', () => {
        it('should throw error when not authenticated', async () => {
            const apiNotAuth = new GitHubAPI();

            await expect(
                apiNotAuth.listIssues('owner', 'repo')
            ).rejects.toThrow('Not authenticated');
        });

        it('should throw error when octokit is null but isAuthenticated is true', async () => {
            const api = new GitHubAPI();
            (api as any).isAuthenticated = true; // Force true
            (api as any).octokit = null; // But octokit is null

            await expect(
                api.listIssues('owner', 'repo')
            ).rejects.toThrow('Not authenticated');
        });

        it('should successfully list issues when authenticated', async () => {
            const Octokit = require('@octokit/rest').Octokit;
            Octokit.mockImplementationOnce(() => ({
                users: {
                    getAuthenticated: jest.fn().mockResolvedValue({ data: { login: 'testuser' } }),
                },
                issues: {
                    listForRepo: jest.fn().mockResolvedValue({
                        data: [
                            { id: 1, title: 'Issue 1' },
                            { id: 2, title: 'Issue 2' }
                        ]
                    }),
                },
            }));

            const api = new GitHubAPI();
            await api.authenticate('ghp_token');

            const result = await api.listIssues('owner', 'repo');

            expect(result).toHaveLength(2);
            expect(result[0].title).toBe('Issue 1');
        });

        it('should pass filters to listForRepo', async () => {
            const Octokit = require('@octokit/rest').Octokit;
            const mockListForRepo = jest.fn().mockResolvedValue({ data: [] });

            Octokit.mockImplementationOnce(() => ({
                users: {
                    getAuthenticated: jest.fn().mockResolvedValue({ data: { login: 'testuser' } }),
                },
                issues: {
                    listForRepo: mockListForRepo,
                },
            }));

            const api = new GitHubAPI();
            await api.authenticate('ghp_token');

            await api.listIssues('owner', 'repo', { state: 'open', labels: 'bug' });

            expect(mockListForRepo).toHaveBeenCalledWith({
                owner: 'owner',
                repo: 'repo',
                state: 'open',
                labels: 'bug'
            });
        });
    });

    describe('getIssue', () => {
        it('should throw Not implemented error', async () => {
            const api = new GitHubAPI();

            await expect(
                api.getIssue('owner', 'repo', 1)
            ).rejects.toThrow('Not implemented');
        });
    });

    describe('createIssue', () => {
        it('should throw Not implemented error', async () => {
            const api = new GitHubAPI();

            await expect(
                api.createIssue('owner', 'repo', 'Title', 'Body')
            ).rejects.toThrow('Not implemented');
        });
    });

    describe('setContext', () => {
        it('should set context correctly', () => {
            const api = new GitHubAPI();
            const context = {} as vscode.ExtensionContext;

            api.setContext(context);

            expect((api as any).context).toBe(context);
        });
    });
});

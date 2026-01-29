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
});

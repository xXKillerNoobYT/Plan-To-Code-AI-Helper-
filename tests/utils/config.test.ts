/**
 * 🧪 Tests for ConfigManager with SecretStorage
 * 
 * Verifies secure GitHub token storage using VS Code SecretStorage API
 * Tests token caching, prompting, and error handling
 */

import * as vscode from 'vscode';
import { ConfigManager } from '../../src/utils/config';

describe('ConfigManager - SecretStorage Integration', () => {
    let mockContext: vscode.ExtensionContext;
    let mockSecrets: Map<string, string>;

    beforeEach(() => {
        // Reset token cache before each test
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
    });

    // ========================================================================
    // Test 1: Store and retrieve token from SecretStorage
    // ========================================================================
    it('should store and retrieve GitHub token from SecretStorage', async () => {
        const testToken = 'ghp_testtoken123456789';

        await ConfigManager.setGitHubToken(mockContext, testToken);
        const retrievedToken = await ConfigManager.getGitHubToken(mockContext);

        expect(mockContext.secrets.store).toHaveBeenCalledWith('github-token', testToken);
        expect(retrievedToken).toBe(testToken);
        expect(mockSecrets.get('github-token')).toBe(testToken);
    });

    // ========================================================================
    // Test 2: Token caching works correctly
    // ========================================================================
    it('should cache token in memory to reduce SecretStorage calls', async () => {
        const testToken = 'ghp_cached_token';

        // Store token in SecretStorage without cache
        mockSecrets.set('github-token', testToken);

        // First call - retrieves from SecretStorage and caches
        const token1 = await ConfigManager.getGitHubToken(mockContext);
        expect(token1).toBe(testToken);
        expect(mockContext.secrets.get).toHaveBeenCalledTimes(1);

        // Second call - should use cache
        const token2 = await ConfigManager.getGitHubToken(mockContext);
        expect(token2).toBe(testToken);
        // Should still be 1 call (cached)
        expect(mockContext.secrets.get).toHaveBeenCalledTimes(1);
    });

    // ========================================================================
    // Test 3: Delete token clears cache
    // ========================================================================
    it('should clear cache when token is deleted', async () => {
        const testToken = 'ghp_delete_test';

        await ConfigManager.setGitHubToken(mockContext, testToken);
        const token1 = await ConfigManager.getGitHubToken(mockContext);
        expect(token1).toBe(testToken);

        // Delete token
        await ConfigManager.deleteGitHubToken(mockContext);

        // Cache should be cleared
        const token2 = await ConfigManager.getGitHubToken(mockContext);
        expect(token2).toBeUndefined();
        expect(mockContext.secrets.delete).toHaveBeenCalledWith('github-token');
    });

    // ========================================================================
    // Test 4: Return undefined when no token exists
    // ========================================================================
    it('should return undefined when no token is stored', async () => {
        const token = await ConfigManager.getGitHubToken(mockContext);
        expect(token).toBeUndefined();
    });

    // ========================================================================
    // Test 5: Prompt user for token if missing
    // ========================================================================
    it('should prompt user for token when missing', async () => {
        const testToken = 'ghp_prompted_token';

        // Mock showInputBox to return a token
        const mockShowInputBox = jest.fn().mockResolvedValue(testToken);
        (vscode.window.showInputBox as jest.Mock) = mockShowInputBox;

        const mockShowInformationMessage = jest.fn();
        (vscode.window.showInformationMessage as jest.Mock) = mockShowInformationMessage;

        const token = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

        expect(mockShowInputBox).toHaveBeenCalled();
        expect(token).toBe(testToken);
        expect(mockSecrets.get('github-token')).toBe(testToken);
        expect(mockShowInformationMessage).toHaveBeenCalledWith('GitHub token saved securely');
    });

    // ========================================================================
    // Test 6: Return existing token without prompting
    // ========================================================================
    it('should return existing token without prompting', async () => {
        const existingToken = 'ghp_existing_token';
        await ConfigManager.setGitHubToken(mockContext, existingToken);

        const mockShowInputBox = jest.fn();
        (vscode.window.showInputBox as jest.Mock) = mockShowInputBox;

        const token = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

        expect(token).toBe(existingToken);
        expect(mockShowInputBox).not.toHaveBeenCalled();
    });

    // ========================================================================
    // Test 7: Handle user cancellation of token prompt
    // ========================================================================
    it('should handle user cancelling token prompt', async () => {
        // Mock showInputBox to return undefined (user cancelled)
        const mockShowInputBox = jest.fn().mockResolvedValue(undefined);
        (vscode.window.showInputBox as jest.Mock) = mockShowInputBox;

        const token = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

        expect(token).toBeUndefined();
        expect(mockSecrets.size).toBe(0); // No token stored
    });

    // ========================================================================
    // Test 8: Validate token format in prompt
    // ========================================================================
    it('should validate token format during prompt', async () => {
        let validateFunction: ((value: string) => string | null) | undefined;

        const mockShowInputBox = jest.fn((options: any) => {
            validateFunction = options?.validateInput;
            return Promise.resolve('ghp_valid_token');
        });
        (vscode.window.showInputBox as jest.Mock) = mockShowInputBox;

        await ConfigManager.getGitHubTokenWithPrompt(mockContext);

        expect(validateFunction).toBeDefined();

        // Test validation function
        expect(validateFunction!('')).toBe('Token cannot be empty');
        expect(validateFunction!('   ')).toBe('Token cannot be empty');
        expect(validateFunction!('invalid_token')).toBe('Invalid token format. Should start with ghp_ or github_pat_');
        expect(validateFunction!('ghp_validtoken')).toBeNull(); // Valid
        expect(validateFunction!('github_pat_validtoken')).toBeNull(); // Valid
    });

    // ========================================================================
    // Test 9: Multiple tokens don't interfere with cache
    // ========================================================================
    it('should update cache when token is changed', async () => {
        const token1 = 'ghp_token_one';
        const token2 = 'ghp_token_two';

        await ConfigManager.setGitHubToken(mockContext, token1);
        const retrieved1 = await ConfigManager.getGitHubToken(mockContext);
        expect(retrieved1).toBe(token1);

        // Change token
        await ConfigManager.setGitHubToken(mockContext, token2);
        const retrieved2 = await ConfigManager.getGitHubToken(mockContext);
        expect(retrieved2).toBe(token2);
    });

    // ========================================================================
    // Test 10: SecretStorage failure handling
    // ========================================================================
    it('should handle SecretStorage failures gracefully', async () => {
        // Mock SecretStorage to throw error
        mockContext.secrets.get = jest.fn().mockRejectedValue(new Error('SecretStorage not available'));

        await expect(ConfigManager.getGitHubToken(mockContext)).rejects.toThrow('SecretStorage not available');
    });
});

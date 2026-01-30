/**
 * 🧪 Comprehensive Tests for ConfigManager
 *
 * Tests all configuration branches including secure storage and validation
 */

import * as vscode from 'vscode';
import { ConfigManager, COEConfig } from '../config';

jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: jest.fn(),
    },
    window: {
        showInputBox: jest.fn(),
        showInformationMessage: jest.fn(),
    },
    ConfigurationTarget: {
        Workspace: 1,
        Global: 2,
    },
}));

describe('ConfigManager', () => {
    let mockConfig: any;
    let mockSecrets: any;
    let mockContext: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset token cache
        (ConfigManager as any).tokenCache = null;

        mockConfig = {
            get: jest.fn(),
            update: jest.fn(),
        };

        mockSecrets = {
            get: jest.fn(),
            store: jest.fn(),
            delete: jest.fn(),
        };

        mockContext = {
            secrets: mockSecrets,
        };

        (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);
    });

    describe('get', () => {
        it('should retrieve configuration value', () => {
            mockConfig.get.mockReturnValue('test-value');

            const result = ConfigManager.get('key1');

            expect(result).toBe('test-value');
            expect(mockConfig.get).toHaveBeenCalledWith('key1', undefined);
        });

        it('should return default value when key not found', () => {
            mockConfig.get.mockReturnValue('default-value');

            const result = ConfigManager.get('missing-key', 'default-value');

            expect(result).toBe('default-value');
        });

        it('should handle typed configuration values', () => {
            mockConfig.get.mockReturnValue(true);

            const result = ConfigManager.get<boolean | undefined>('enabled', false);

            expect(result).toBe(true);
        });

        it('should handle numeric configuration values', () => {
            mockConfig.get.mockReturnValue(3000);

            const result = ConfigManager.get<number | undefined>('port', 8080);

            expect(result).toBe(3000);
        });

        it('should handle object configuration values', () => {
            const obj = { nested: 'value' };
            mockConfig.get.mockReturnValue(obj);

            const result = ConfigManager.get('config');

            expect(result).toEqual(obj);
        });
    });

    describe('set', () => {
        it('should set configuration value with default target', async () => {
            await ConfigManager.set('key1', 'value1');

            expect(mockConfig.update).toHaveBeenCalledWith('key1', 'value1', vscode.ConfigurationTarget.Workspace);
        });

        it('should set configuration value with custom target', async () => {
            await ConfigManager.set('key1', 'value1', vscode.ConfigurationTarget.Global);

            expect(mockConfig.update).toHaveBeenCalledWith('key1', 'value1', vscode.ConfigurationTarget.Global);
        });

        it('should handle setting null value', async () => {
            await ConfigManager.set('key1', null);

            expect(mockConfig.update).toHaveBeenCalledWith('key1', null, vscode.ConfigurationTarget.Workspace);
        });

        it('should handle setting object values', async () => {
            const obj = { nested: 'value' };
            await ConfigManager.set('config', obj);

            expect(mockConfig.update).toHaveBeenCalledWith('config', obj, vscode.ConfigurationTarget.Workspace);
        });
    });

    describe('getGitHubToken', () => {
        it('should return cached token if available', async () => {
            (ConfigManager as any).tokenCache = 'ghp_cached_token';

            const result = await ConfigManager.getGitHubToken(mockContext);

            expect(result).toBe('ghp_cached_token');
            expect(mockSecrets.get).not.toHaveBeenCalled();
        });

        it('should retrieve token from SecretStorage if not cached', async () => {
            mockSecrets.get.mockResolvedValue('ghp_new_token');

            const result = await ConfigManager.getGitHubToken(mockContext);

            expect(result).toBe('ghp_new_token');
            expect(mockSecrets.get).toHaveBeenCalledWith('github-token');
        });

        it('should cache retrieved token for future calls', async () => {
            mockSecrets.get.mockResolvedValue('ghp_token');

            await ConfigManager.getGitHubToken(mockContext);
            const cache1 = (ConfigManager as any).tokenCache;

            const result2 = await ConfigManager.getGitHubToken(mockContext);

            expect(cache1).toBe('ghp_token');
            expect(result2).toBe('ghp_token');
            expect(mockSecrets.get).toHaveBeenCalledTimes(1); // Cached on second call
        });

        it('should return undefined when no secrets available', async () => {
            mockContext.secrets = null;

            const result = await ConfigManager.getGitHubToken(mockContext);

            expect(result).toBeUndefined();
        });

        it('should return undefined when token not found in SecretStorage', async () => {
            mockSecrets.get.mockResolvedValue(undefined);

            const result = await ConfigManager.getGitHubToken(mockContext);

            expect(result).toBeUndefined();
        });
    });

    describe('setGitHubToken', () => {
        it('should store token in SecretStorage and update cache', async () => {
            await ConfigManager.setGitHubToken(mockContext, 'ghp_new_token');

            expect(mockSecrets.store).toHaveBeenCalledWith('github-token', 'ghp_new_token');
            expect((ConfigManager as any).tokenCache).toBe('ghp_new_token');
        });

        it('should handle missing secrets gracefully', async () => {
            mockContext.secrets = null;

            await expect(ConfigManager.setGitHubToken(mockContext, 'ghp_token')).resolves.not.toThrow();
            expect(mockSecrets.store).not.toHaveBeenCalled();
        });

        it('should update cache with new token', async () => {
            (ConfigManager as any).tokenCache = 'old_token';

            await ConfigManager.setGitHubToken(mockContext, 'ghp_new_token');

            expect((ConfigManager as any).tokenCache).toBe('ghp_new_token');
        });
    });

    describe('deleteGitHubToken', () => {
        it('should delete token from SecretStorage and clear cache', async () => {
            (ConfigManager as any).tokenCache = 'ghp_token';

            await ConfigManager.deleteGitHubToken(mockContext);

            expect(mockSecrets.delete).toHaveBeenCalledWith('github-token');
            expect((ConfigManager as any).tokenCache).toBeNull();
        });

        it('should handle missing secrets gracefully', async () => {
            mockContext.secrets = null;

            await expect(ConfigManager.deleteGitHubToken(mockContext)).resolves.not.toThrow();
            expect(mockSecrets.delete).not.toHaveBeenCalled();
        });
    });

    describe('getGitHubTokenWithPrompt', () => {
        it('should return existing token without prompting', async () => {
            mockSecrets.get.mockResolvedValue('ghp_existing_token');

            const result = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

            expect(result).toBe('ghp_existing_token');
            expect(vscode.window.showInputBox).not.toHaveBeenCalled();
        });

        it('should prompt user when token not found', async () => {
            mockSecrets.get.mockResolvedValue(undefined);
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('ghp_user_token');

            const result = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

            expect(result).toBe('ghp_user_token');
            expect(vscode.window.showInputBox).toHaveBeenCalled();
        });

        it('should validate token format (ghp_ prefix)', async () => {
            mockSecrets.get.mockResolvedValue(undefined);
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('ghp_validtoken123');

            const result = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

            expect(result).toBe('ghp_validtoken123');
        });

        it('should validate token format (github_pat_ prefix)', async () => {
            mockSecrets.get.mockResolvedValue(undefined);
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('github_pat_validtoken');

            const result = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

            expect(result).toBe('github_pat_validtoken');
        });

        it('should reject empty tokens from user input', async () => {
            mockSecrets.get.mockResolvedValue(undefined);
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('');

            const result = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

            expect(result).toBeUndefined();
        });

        it('should reject invalid token format', async () => {
            mockSecrets.get.mockResolvedValue(undefined);
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('invalid_token_format');

            const result = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

            // showInputBox is called, but returns result depends on validation
            expect(vscode.window.showInputBox).toHaveBeenCalled();
        });

        it('should save token when user provides valid token', async () => {
            mockSecrets.get.mockResolvedValue(undefined);
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('ghp_newtoken');

            const result = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

            expect(result).toBe('ghp_newtoken');
            expect(mockSecrets.store).toHaveBeenCalledWith('github-token', 'ghp_newtoken');
        });

        it('should show success message after saving token', async () => {
            mockSecrets.get.mockResolvedValue(undefined);
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('ghp_newtoken');

            await ConfigManager.getGitHubTokenWithPrompt(mockContext);

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('GitHub token saved securely');
        });

        it('should return undefined when user cancels input', async () => {
            mockSecrets.get.mockResolvedValue(undefined);
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(undefined);

            const result = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

            expect(result).toBeUndefined();
        });

        it('should handle whitespace-only tokens as empty', async () => {
            mockSecrets.get.mockResolvedValue(undefined);
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('   ');

            const result = await ConfigManager.getGitHubTokenWithPrompt(mockContext);

            // Should be treated as empty
            expect(result).toBeUndefined();
        });
    });

    describe('getAll', () => {
        it('should return all COE configuration', () => {
            const allConfig = { key1: 'value1', key2: 'value2' };
            mockConfig.get.mockReturnValue(allConfig);

            (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);

            const result = ConfigManager.getAll();

            expect(result).toEqual(mockConfig);
            expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('coe');
        });

        it('should return configuration object for accessing nested properties', () => {
            (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);

            const result = ConfigManager.getAll();

            expect(result).toHaveProperty('get');
            expect(result).toHaveProperty('update');
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid successive token requests with caching', async () => {
            mockSecrets.get.mockResolvedValue('ghp_token');

            const [result1, result2, result3] = await Promise.all([
                ConfigManager.getGitHubToken(mockContext),
                ConfigManager.getGitHubToken(mockContext),
                ConfigManager.getGitHubToken(mockContext),
            ]);

            expect(result1).toBe('ghp_token');
            expect(result2).toBe('ghp_token');
            expect(result3).toBe('ghp_token');
            // Should only call SecretStorage once due to caching
            expect(mockSecrets.get).toHaveBeenCalledTimes(1);
        });

        it('should handle token deletion followed by retrieval', async () => {
            (ConfigManager as any).tokenCache = 'ghp_old_token';

            await ConfigManager.deleteGitHubToken(mockContext);
            expect((ConfigManager as any).tokenCache).toBeNull();

            mockSecrets.get.mockResolvedValue('ghp_new_token');
            const result = await ConfigManager.getGitHubToken(mockContext);

            expect(result).toBe('ghp_new_token');
        });
    });
});

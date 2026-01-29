/**
 * Configuration Manager
 * Handles extension configuration and settings
 */

import * as vscode from 'vscode';

export class ConfigManager {
    private static readonly CONFIG_SECTION = 'coe';
    private static tokenCache: string | null = null;

    /**
     * Get configuration value
     */
    static get<T>(key: string, defaultValue?: T): T | undefined {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        return config.get<T>(key, defaultValue!);
    }

    /**
     * Set configuration value
     */
    static async set(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        await config.update(key, value, target);
    }

    /**
     * Get GitHub token from secure storage (with cache)
     */
    static async getGitHubToken(context: vscode.ExtensionContext): Promise<string | undefined> {
        // Return cached token if available
        if (this.tokenCache) {
            return this.tokenCache;
        }

        // Retrieve from SecretStorage
        const token = await context.secrets.get('github-token');
        if (token) {
            this.tokenCache = token;
        }
        return token;
    }

    /**
     * Set GitHub token in secure storage
     */
    static async setGitHubToken(context: vscode.ExtensionContext, token: string): Promise<void> {
        await context.secrets.store('github-token', token);
        this.tokenCache = token; // Update cache
    }

    /**
     * Delete GitHub token from secure storage
     */
    static async deleteGitHubToken(context: vscode.ExtensionContext): Promise<void> {
        await context.secrets.delete('github-token');
        this.tokenCache = null; // Clear cache
    }

    /**
     * Get GitHub token with user prompt if missing
     * Returns token or undefined if user cancels
     */
    static async getGitHubTokenWithPrompt(context: vscode.ExtensionContext): Promise<string | undefined> {
        // Try to get existing token
        let token = await this.getGitHubToken(context);

        // If no token, prompt user
        if (!token) {
            token = await vscode.window.showInputBox({
                prompt: 'Enter your GitHub Personal Access Token',
                password: true,
                placeHolder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
                ignoreFocusOut: true,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Token cannot be empty';
                    }
                    if (!value.startsWith('ghp_') && !value.startsWith('github_pat_')) {
                        return 'Invalid token format. Should start with ghp_ or github_pat_';
                    }
                    return null;
                }
            });

            // Store token if provided
            if (token) {
                await this.setGitHubToken(context, token);
                vscode.window.showInformationMessage('GitHub token saved securely');
            }
        }

        return token;
    }

    /**
     * Get all COE configuration
     */
    static getAll(): any {
        return vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    }
}

/**
 * Default configuration structure
 */
export interface COEConfig {
    mcpServer: {
        enabled: boolean;
        port?: number;
    };
    github: {
        enabled: boolean;
        syncInterval: number; // minutes
        repository?: string;
        owner?: string;
    };
    tasks: {
        autoRefresh: boolean;
        refreshInterval: number; // seconds
    };
    ui: {
        showStatusBar: boolean;
        showTaskCount: boolean;
    };
}



/**
 * Configuration Manager
 * Handles extension configuration and settings
 */

import * as vscode from 'vscode';

export class ConfigManager {
    private static readonly CONFIG_SECTION = 'coe';

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
     * Get GitHub token from secure storage
     */
    static async getGitHubToken(context: vscode.ExtensionContext): Promise<string | undefined> {
        return await context.secrets.get('github-token');
    }

    /**
     * Set GitHub token in secure storage
     */
    static async setGitHubToken(context: vscode.ExtensionContext, token: string): Promise<void> {
        await context.secrets.store('github-token', token);
    }

    /**
     * Delete GitHub token from secure storage
     */
    static async deleteGitHubToken(context: vscode.ExtensionContext): Promise<void> {
        await context.secrets.delete('github-token');
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

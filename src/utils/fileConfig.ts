/**
 * File-Based Configuration Manager
 * Reads/writes configuration from .coe/config.json in workspace root
 * 
 * This allows COE to be:
 * - Tool-agnostic (not locked to VS Code settings)
 * - Easily edited in any code editor
 * - Portable across projects
 * - Compatible with any coding agent (GitHub Copilot, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { z } from 'zod';

/**
 * LLM Configuration interface
 */
export interface LLMConfig {
    url: string;
    model: string;
    inputTokenLimit: number;
    maxOutputTokens: number;
    timeoutSeconds: number;
    temperature?: number;
}

/**
 * Extension Configuration interface
 */
export interface ExtensionConfig {
    autoRegeneratePRD?: boolean;
    debugMode?: boolean;
}

/**
 * Full COE Configuration
 */
export interface COEFileConfig {
    llm: LLMConfig;
    extension?: ExtensionConfig;
}

/**
 * Zod schemas for runtime validation (project-by-project configuration)
 */
export const LLMConfigSchema = z.object({
    url: z.string().url('Invalid LLM URL format'),
    model: z.string().min(1, 'Model name cannot be empty'),
    inputTokenLimit: z.number().int().positive('Input token limit must be positive'),
    maxOutputTokens: z.number().int().positive('Max output tokens must be positive'),
    timeoutSeconds: z.number().int().positive('Timeout must be positive'),
    temperature: z.number().min(0).max(2).optional(),
});

export const ExtensionConfigSchema = z.object({
    autoRegeneratePRD: z.boolean().optional(),
    debugMode: z.boolean().optional(),
}).optional();

export const COEFileConfigSchema = z.object({
    llm: LLMConfigSchema,
    extension: ExtensionConfigSchema,
});

/**
 * Default configuration (fallback if .coe/config.json is missing or invalid)
 * Uses localhost:1234 and mistral-7b as defaults (project-by-project)
 */
const DEFAULT_CONFIG: COEFileConfig = {
    llm: {
        url: 'http://localhost:1234/v1/chat/completions',
        model: 'mistral-7b',
        inputTokenLimit: 4000,
        maxOutputTokens: 2000,
        timeoutSeconds: 300,
        temperature: 0.3,
    },
    extension: {
        autoRegeneratePRD: true,
        debugMode: false,
    },
};

/**
 * FileConfigManager - Manages .coe/config.json
 * 
 * Features:
 * - Auto-create config.json if missing
 * - Watch for file changes and reload
 * - Fallback to defaults if file is missing/invalid
 * - Easy to edit in any code editor
 */
export class FileConfigManager {
    private static configPath: string = '';
    private static instance: COEFileConfig = DEFAULT_CONFIG;
    private static watchers: Set<(config: COEFileConfig) => void> = new Set();
    private static fileWatcher: fs.FSWatcher | null = null;

    /**
     * Initialize config manager
     * Call this once on extension activate
     */
    static async initialize(workspaceRoot?: string): Promise<void> {
        try {
            // Get workspace root
            const root = workspaceRoot || this.getWorkspaceRoot();
            if (!root) {
                this.instance = DEFAULT_CONFIG;
                return;
            }

            this.configPath = path.join(root, '.coe', 'config.json');

            // Auto-create if missing
            if (!fs.existsSync(this.configPath)) {
                await this.createDefaultConfig();
            }

            // Load config
            await this.reload();

            // Watch for changes
            this.watch();
        } catch (error) {
            this.instance = DEFAULT_CONFIG;
        }
    }

    /**
     * Get workspace root directory
     */
    private static getWorkspaceRoot(): string | undefined {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        }
        return undefined;
    }

    /**
     * Create default config.json if missing
     */
    private static async createDefaultConfig(): Promise<void> {
        try {
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
        } catch (error) {
            // eslint-disable-next-line no-empty
        }
    }

    /**
     * Reload config from file
     */
    static async reload(): Promise<void> {
        try {
            if (!fs.existsSync(this.configPath)) {
                this.instance = DEFAULT_CONFIG;
                return;
            }

            const content = fs.readFileSync(this.configPath, 'utf-8');
            const parsed = JSON.parse(content);

            // Validate required fields
            if (!parsed.llm || !parsed.llm.url || !parsed.llm.model) {
                this.instance = DEFAULT_CONFIG;
                return;
            }

            // Merge with defaults (fill in missing optional fields)
            this.instance = {
                llm: {
                    ...DEFAULT_CONFIG.llm,
                    ...parsed.llm,
                },
                extension: {
                    ...DEFAULT_CONFIG.extension,
                    ...parsed.extension,
                },
            };

            this.notifyWatchers();
        } catch (error) {
            this.instance = DEFAULT_CONFIG;
        }
    }

    /**
     * Watch for config file changes and auto-reload
     */
    private static watch(): void {
        if (!this.configPath || !fs.existsSync(path.dirname(this.configPath))) {
            return;
        }

        try {
            // Debounce rapid changes
            let debounceTimer: NodeJS.Timeout | null = null;

            this.fileWatcher = fs.watch(this.configPath, async (eventType) => {
                if (eventType !== 'change') return;

                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.reload();
                }, 500);
            });
        } catch (error) {
            // eslint-disable-next-line no-empty
        }
    }

    /**
     * Notify all watchers of config changes
     */
    private static notifyWatchers(): void {
        this.watchers.forEach(callback => callback(this.instance));
    }

    /**
     * Get current LLM config
     */
    static getLLMConfig(): LLMConfig {
        return { ...this.instance.llm };
    }

    /**
     * Get current extension config
     */
    static getExtensionConfig(): ExtensionConfig {
        return { ...(this.instance.extension || {}) };
    }

    /**
     * Get full config
     */
    static getConfig(): COEFileConfig {
        return JSON.parse(JSON.stringify(this.instance)); // Deep copy
    }

    /**
     * Update LLM config
     */
    static async updateLLMConfig(update: Partial<LLMConfig>): Promise<void> {
        try {
            this.instance.llm = { ...this.instance.llm, ...update };
            await this.save();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update extension config
     */
    static async updateExtensionConfig(update: Partial<ExtensionConfig>): Promise<void> {
        try {
            this.instance.extension = { ...(this.instance.extension || {}), ...update };
            await this.save();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Save config to file
     */
    private static async save(): Promise<void> {
        try {
            if (!this.configPath) {
                throw new Error('Config path not initialized');
            }

            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(this.configPath, JSON.stringify(this.instance, null, 2));
            this.notifyWatchers();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Subscribe to config changes
     */
    static onConfigChange(callback: (config: COEFileConfig) => void): () => void {
        this.watchers.add(callback);
        return () => this.watchers.delete(callback);
    }

    /**
     * Stop watching config file
     */
    static dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.close();
            this.fileWatcher = null;
        }
        this.watchers.clear();
    }

    /**
     * Get config file path (for debugging)
     */
    static getConfigPath(): string {
        return this.configPath;
    }
}



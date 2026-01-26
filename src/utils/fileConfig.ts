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
 * Default configuration (fallback if .coe/config.json is missing or invalid)
 */
const DEFAULT_CONFIG: COEFileConfig = {
    llm: {
        url: 'http://192.168.1.205:1234/v1/chat/completions',
        model: 'mistralai/ministral-3-14b-reasoning',
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
                console.warn('No workspace root found, using defaults');
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
            console.error('Failed to initialize FileConfigManager:', error);
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
            console.log(`Created default config at ${this.configPath}`);
        } catch (error) {
            console.error('Failed to create default config:', error);
        }
    }

    /**
     * Reload config from file
     */
    static async reload(): Promise<void> {
        try {
            if (!fs.existsSync(this.configPath)) {
                console.warn(`Config file not found at ${this.configPath}, using defaults`);
                this.instance = DEFAULT_CONFIG;
                return;
            }

            const content = fs.readFileSync(this.configPath, 'utf-8');
            const parsed = JSON.parse(content);

            // Validate required fields
            if (!parsed.llm || !parsed.llm.url || !parsed.llm.model) {
                console.warn('Invalid config file, using defaults');
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

            console.log('Config reloaded from', this.configPath);
            this.notifyWatchers();
        } catch (error) {
            console.error('Failed to reload config:', error);
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
            console.warn('Failed to watch config file:', error);
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
            console.error('Failed to update LLM config:', error);
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
            console.error('Failed to update extension config:', error);
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
            console.log('Config saved to', this.configPath);
            this.notifyWatchers();
        } catch (error) {
            console.error('Failed to save config:', error);
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

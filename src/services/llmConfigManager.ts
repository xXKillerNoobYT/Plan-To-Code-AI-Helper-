/**
 * LLM Configuration Manager
 * Loads and validates LLM config with priority: VS Code settings > .coe/config.json > defaults
 * Ensures project-by-project configuration with no hardcoded values
 * 
 * Priority chain:
 * 1. VS Code settings (coe.llm.url, coe.llm.model, etc.)
 * 2. .coe/config.json file
 * 3. Safe defaults (localhost:1234, mistral-7b)
 */

import * as vscode from 'vscode';
import { FileConfigManager, LLMConfig, LLMConfigSchema } from '../utils/fileConfig';
import { z } from 'zod';

/**
 * Error type for config validation failures
 */
export class ConfigValidationError extends Error {
    constructor(message: string, public readonly field?: string) {
        super(message);
        this.name = 'ConfigValidationError';
    }
}

/**
 * LLM Config Manager
 * - Loads from VS Code settings (highest priority)
 * - Falls back to .coe/config.json
 * - Falls back to safe defaults
 * - Validates with Zod schema
 */
export class LLMConfigManager {
    /**
     * Load raw config from priority sources (no validation)
     * Priority: VS Code settings > .coe/config.json > defaults
     * 
     * @returns Raw config object (may be invalid)
     */
    private static loadRawConfig(): Partial<LLMConfig> {
        const merged: Partial<LLMConfig> = {};

        // Start with file config as base
        const fileConfig = FileConfigManager.getLLMConfig();
        Object.assign(merged, fileConfig);

        // Override with VS Code settings if present
        const vscodeConfig = vscode.workspace.getConfiguration('coe');
        if (vscodeConfig.has('llm.url')) {
            merged.url = vscodeConfig.get<string>('llm.url');
        }
        if (vscodeConfig.has('llm.model')) {
            merged.model = vscodeConfig.get<string>('llm.model');
        }
        if (vscodeConfig.has('llm.inputTokenLimit')) {
            merged.inputTokenLimit = vscodeConfig.get<number>('llm.inputTokenLimit');
        }
        if (vscodeConfig.has('llm.maxOutputTokens')) {
            merged.maxOutputTokens = vscodeConfig.get<number>('llm.maxOutputTokens');
        }
        if (vscodeConfig.has('llm.timeoutSeconds')) {
            merged.timeoutSeconds = vscodeConfig.get<number>('llm.timeoutSeconds');
        }
        if (vscodeConfig.has('llm.temperature')) {
            merged.temperature = vscodeConfig.get<number>('llm.temperature');
        }

        return merged;
    }

    /**
     * Get and validate LLM configuration
     * Priority: VS Code settings > .coe/config.json > Defaults
     * 
     * @returns Validated LLM config
     * @throws ConfigValidationError if validation fails (strict mode)
     */
    static async getConfig(): Promise<LLMConfig> {
        try {
            // Load raw config from priority sources
            const rawConfig = this.loadRawConfig();

            // Validate with Zod schema
            const validated = LLMConfigSchema.parse(rawConfig);
            return validated;
        } catch (error) {
            // Extract validation error details
            if (error instanceof z.ZodError) {
                const fieldError = error.errors[0];
                const message = `Invalid LLM config: ${fieldError.path.join('.')}: ${fieldError.message}`;
                throw new ConfigValidationError(message, fieldError.path[0]?.toString());
            }

            // Handle other errors
            const message = error instanceof Error ? error.message : 'Unknown config error';
            throw new ConfigValidationError(message);
        }
    }

    /**
     * Get config with automatic fallback to safe defaults
     * Never throws - always returns a valid config
     * 
     * @returns Validated LLM config (or defaults if validation fails)
     */
    static async getConfigOrDefault(): Promise<LLMConfig> {
        try {
            return await this.getConfig();
        } catch (error) {
            // Fallback to defaults from FileConfigManager
            const defaults = FileConfigManager.getLLMConfig();
            console.info('✓ Loaded default LLM config (localhost:1234, mistral-7b)');
            return defaults;
        }
    }

    /**
     * Get config source for debugging/logging
     * Shows which source provided each config value
     * 
     * @returns Object showing config sources
     */
    static getConfigSources(): {
        url: 'vscode' | 'file' | 'default';
        model: 'vscode' | 'file' | 'default';
        source: string;
    } {
        const vscodeConfig = vscode.workspace.getConfiguration('coe');
        let urlSource: 'vscode' | 'file' | 'default' = 'default';
        let modelSource: 'vscode' | 'file' | 'default' = 'default';

        if (vscodeConfig.has('llm.url') && vscodeConfig.get('llm.url')) {
            urlSource = 'vscode';
        } else if (FileConfigManager.getLLMConfig().url) {
            urlSource = 'file';
        }

        if (vscodeConfig.has('llm.model') && vscodeConfig.get('llm.model')) {
            modelSource = 'vscode';
        } else if (FileConfigManager.getLLMConfig().model) {
            modelSource = 'file';
        }

        return {
            url: urlSource,
            model: modelSource,
            source: `url from ${urlSource}, model from ${modelSource}`,
        };
    }
}



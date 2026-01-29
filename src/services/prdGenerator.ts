/**
 * PRD Generator Service
 * 
 * Orchestrates the entire PRD generation workflow:
 * 1. Read Plans/ folder
 * 2. Bundle content with token limits
 * 3. Call LLM for synthesis
 * 4. Write to PRD.md/PRD.json
 * 5. Handle errors and retries
 * 
 * @module prdGenerator
 */

import * as vscode from 'vscode';
import { PlansReader } from './plansReader';
import { ContextBundler } from './contextBundler';
import { PRDWriter, PRDMetadata } from './prdWriter';
import { PRDGenerationPrompt } from '../prompts/prdGenerationPrompt';
import { FileConfigManager, LLMConfig } from '../utils/fileConfig';
import { callLLMWithStreaming } from '../utils/streamingLLM';

/**
 * 🔄 PRD Generation Options
 */
export interface PRDGenerationOptions {
    tokenLimit?: number;          // Max input tokens (default 4000)
    retryOnFailure?: boolean;     // Retry if validation fails (default true)
    showPreview?: boolean;        // Show diff preview before writing (default true)
    llmConfig?: {
        url: string;
        model: string;
        maxOutputTokens: number;
        timeoutSeconds: number;
        temperature?: number;
    };
}

/**
 * 📊 Generation Result
 */
export interface GenerationResult {
    success: boolean;
    prdContent?: string;
    mdPath?: string;
    jsonPath?: string;
    mdUri?: vscode.Uri;
    jsonUri?: vscode.Uri;
    backupPath?: string;
    message: string;
    warning?: string;
    tokenCount?: number;
    duration?: number;  // milliseconds
}

/**
 * 🤖 PRD Generator Service
 * Main orchestrator for PRD generation
 */
export class PRDGenerator {
    /**
     * 🚀 Generate PRD from Plans folder
     * 
     * Full workflow:
     * 1. Read all .md files from Plans/
     * 2. Bundle with token limits
     * 3. Create prompts
     * 4. Call LLM with streaming
     * 5. Validate output
     * 6. Write to PRD.md/PRD.json
     * 
     * @param options - Generation options
     * @param onStatus - Callback for status updates
     * @param outputChannel - Output channel for streaming tokens
     * @returns Generation result
     */
    static async generate(
        options: PRDGenerationOptions = {},
        onStatus?: (status: string) => void,
        outputChannel?: vscode.OutputChannel
    ): Promise<GenerationResult> {
        const startTime = Date.now();
        const tokenLimit = options.tokenLimit || 4000;

        try {
            // Step 1: Read plans
            onStatus?.('📂 Reading Plans/ folder...');
            const planFiles = await PlansReader.readAllPlans();
            if (planFiles.length === 0) {
                return {
                    success: false,
                    message: '❌ No plan files found in Plans/ folder',
                };
            }
            onStatus?.(`✅ Found ${planFiles.length} plan files`);

            // Step 2: Bundle content
            onStatus?.('📦 Bundling content with token limit...');
            const bundleResult = ContextBundler.bundle(planFiles, tokenLimit);
            onStatus?.(ContextBundler.formatBundleInfo(bundleResult));

            if (bundleResult.warning) {
                onStatus?.(`⚠️  ${bundleResult.warning}`);
            }

            // Step 3: Create prompts
            onStatus?.('✏️  Creating prompts...');
            const systemPrompt = PRDGenerationPrompt.getSystemPrompt();
            const userPrompt = PRDGenerationPrompt.getUserPrompt(bundleResult.prompt);

            // Step 4: Call LLM (with streaming)
            onStatus?.('🤖 Calling LLM for PRD synthesis (streaming)...');
            const llmResponse = await this.callLLM(
                systemPrompt,
                userPrompt,
                options.llmConfig,
                outputChannel
            );

            if (!llmResponse.success) {
                return {
                    success: false,
                    message: `❌ LLM call failed: ${llmResponse.error}`,
                };
            }

            let prdContent = llmResponse.content!;

            // Step 5: Validate output
            onStatus?.('✅ Validating PRD structure...');
            const validation = PRDGenerationPrompt.validatePRDOutput(prdContent);

            if (!validation.isValid && options.retryOnFailure) {
                onStatus?.('🔄 Validation failed - retrying with corrected prompt...');
                const retryPrompt = PRDGenerationPrompt.getRetryPrompt(
                    prdContent,
                    validation.missingSection?.join(', ') || 'Unknown validation error'
                );

                const retryResponse = await this.callLLM(
                    systemPrompt,
                    retryPrompt,
                    options.llmConfig,
                    outputChannel
                );

                if (retryResponse.success) {
                    prdContent = retryResponse.content!;
                    onStatus?.('✅ Retry successful');
                } else {
                    onStatus?.('⚠️  Retry failed, using original content');
                }
            }

            if (!validation.isValid) {
                onStatus?.(
                    `⚠️  ⚠️  Validation failed: Missing sections: ${validation.missingSection?.join(', ')}`
                );
            }

            // Step 6: Write to files
            onStatus?.('💾 Writing PRD.md and PRD.json...');
            const metadata = PRDWriter.createMetadata(
                bundleResult.includedFiles,
                bundleResult.totalTokens
            );

            const writeResult = await PRDWriter.writePRD(prdContent, metadata);
            onStatus?.(`✅ Wrote PRD.md to: ${writeResult.mdPath}`);
            onStatus?.(`✅ Wrote PRD.json to: ${writeResult.jsonPath}`);

            const duration = Date.now() - startTime;

            return {
                success: true,
                prdContent,
                mdPath: writeResult.mdPath,
                jsonPath: writeResult.jsonPath,
                mdUri: writeResult.mdUri,
                jsonUri: writeResult.jsonUri,
                backupPath: writeResult.backupPath,
                message: writeResult.message,
                warning: bundleResult.warning || (validation.warnings?.join('; ')),
                tokenCount: bundleResult.totalTokens,
                duration,
            };
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                message: `❌ PRD generation failed: ${errMsg}`,
            };
        }
    }

    /**
     * 🌊 Call LLM with streaming and inactivity timeout
     * 
     * Uses streaming fetch with inactivity-based timeout (not hard timeout).
     * Falls back to non-streaming if stream fails.
     * Appends tokens to output channel in real-time.
     * 
     * @param systemPrompt - System prompt
     * @param userPrompt - User prompt
     * @param llmConfig - LLM configuration
     * @param outputChannel - Output channel for token streaming (optional)
     * @returns Response with generated content
     */
    private static async callLLM(
        systemPrompt: string,
        userPrompt: string,
        llmConfig?: PRDGenerationOptions['llmConfig'],
        outputChannel?: vscode.OutputChannel
    ): Promise<{
        success: boolean;
        content?: string;
        error?: string;
    }> {
        // Use passed config or get from global config
        const fullConfig = llmConfig || this.getDefaultLLMConfig();
        if (!fullConfig) {
            throw new Error('LLM configuration is required');
        }

        // Convert to LLMConfig type expected by streaming utility
        const streamingConfig: LLMConfig = {
            url: fullConfig.url,
            model: fullConfig.model,
            inputTokenLimit: 4000,
            maxOutputTokens: fullConfig.maxOutputTokens || 4000,
            timeoutSeconds: fullConfig.timeoutSeconds || 300,
            temperature: fullConfig.temperature || 0.3,
        };

        // Track collected tokens for PRD generation
        const collectedTokens: string[] = [];

        try {
            outputChannel?.appendLine(
                `🌊 Starting streaming PRD generation (inactivity timeout: ${streamingConfig.timeoutSeconds}s)...`
            );

            const result = await callLLMWithStreaming({
                config: streamingConfig,
                systemPrompt,
                userPrompt,
                temperature: 0.3,  // Deterministic for PRD generation
                maxTokens: streamingConfig.maxOutputTokens,
                onToken: (token) => {
                    collectedTokens.push(token);
                    // Note: vscode.OutputChannel doesn't support append(), only appendLine()
                    // Token streaming happens in-memory and is output after completion
                },
                onError: (error) => {
                    outputChannel?.appendLine(`⚠️  Streaming error: ${error}`);
                },
                onComplete: () => {
                    outputChannel?.appendLine('✅ Streaming complete');
                },
            });

            if (!result.success) {
                outputChannel?.appendLine(`❌ LLM call failed: ${result.error}`);
                return {
                    success: false,
                    error: result.error || 'Unknown streaming error',
                };
            }

            const content = result.content || (collectedTokens.length > 0 ? collectedTokens.join('') : '');

            if (!content) {
                outputChannel?.appendLine('❌ LLM returned empty response');
                return {
                    success: false,
                    error: 'LLM returned empty response',
                };
            }

            outputChannel?.appendLine(`✅ Received ${collectedTokens.length} tokens from LLM (method: ${result.method})`);

            return {
                success: true,
                content,
            };
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            outputChannel?.appendLine(`❌ Fatal error in LLM call: ${errMsg}`);
            return {
                success: false,
                error: errMsg,
            };
        }
    }


    /**
     * ⚙️  Get default LLM configuration
     * Reads from FileConfigManager (.coe/config.json) with fallback to hardcoded defaults
     * 
     * @returns Default LLM config with timeout from config
     */
    private static getDefaultLLMConfig(): Required<PRDGenerationOptions['llmConfig']> {
        try {
            const fileConfig = FileConfigManager.getLLMConfig();
            const timeoutSeconds = fileConfig.timeoutSeconds || 300;

            return {
                url: fileConfig.url,
                model: fileConfig.model,
                maxOutputTokens: fileConfig.maxOutputTokens || 4000,
                timeoutSeconds,
                temperature: fileConfig.temperature || 0.3,
            };
        } catch (error) {
            // Fallback to hardcoded defaults if config unavailable
            const fallbackTimeout = 300;
            return {
                url: 'http://192.168.1.205:1234/v1/chat/completions',
                model: 'mistralai/ministral-3-14b-reasoning',
                maxOutputTokens: 4000,
                timeoutSeconds: fallbackTimeout,
                temperature: 0.3,
            };
        }
    }
}



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
     * 4. Call LLM
     * 5. Validate output
     * 6. Write to PRD.md/PRD.json
     * 
     * @param options - Generation options
     * @param onStatus - Callback for status updates
     * @returns Generation result
     */
    static async generate(
        options: PRDGenerationOptions = {},
        onStatus?: (status: string) => void
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

            // Step 4: Call LLM
            onStatus?.('🤖 Calling LLM for PRD synthesis...');
            const llmResponse = await this.callLLM(
                systemPrompt,
                userPrompt,
                options.llmConfig
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
                    options.llmConfig
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

            const duration = Date.now() - startTime;

            return {
                success: true,
                prdContent,
                mdPath: writeResult.mdPath,
                jsonPath: writeResult.jsonPath,
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
     * 🔗 Call LLM with prompt
     * 
     * Uses fetch to call configured LLM endpoint
     * Implements streaming and parsing
     * 
     * @param systemPrompt - System prompt
     * @param userPrompt - User prompt
     * @param llmConfig - LLM configuration
     * @returns Response with generated content
     */
    private static async callLLM(
        systemPrompt: string,
        userPrompt: string,
        llmConfig?: PRDGenerationOptions['llmConfig']
    ): Promise<{
        success: boolean;
        content?: string;
        error?: string;
    }> {
        // Use passed config or get from global config
        const config = llmConfig || this.getDefaultLLMConfig(); if (!config) {
            throw new Error('LLM configuration is required');
        }
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                (config.timeoutSeconds || 300) * 1000
            );

            try {
                const response = await fetch(config.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: config.model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt },
                        ],
                        temperature: 0.3,  // Deterministic for PRD generation
                        max_tokens: config.maxOutputTokens || 4000,
                        stream: true,
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const statusInfo = `HTTP ${response.status} ${response.statusText}`.trim();
                    return {
                        success: false,
                        error: statusInfo,
                    };
                }

                // Parse streaming response
                const content = await this.parseStreamingResponse(response);

                return {
                    success: true,
                    content,
                };
            } catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof Error && error.name === 'AbortError') {
                    return {
                        success: false,
                        error: `Timeout after ${config.timeoutSeconds || 300} seconds`,
                    };
                }
                throw error;
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                error: errMsg,
            };
        }
    }

    /**
     * 📨 Parse streaming LLM response
     * 
     * Handles both SSE format (data: {json}) and direct JSON chunks
     * 
     * @param response - Fetch response object
     * @returns Accumulated content string
     */
    private static async parseStreamingResponse(response: Response): Promise<string> {
        const reader = (response.body as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder();

        let fullContent = '';
        let partialLine = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                partialLine += chunk;

                const lines = partialLine.split('\n');
                partialLine = lines[lines.length - 1];

                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Handle SSE format (data: {...})
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        if (dataStr === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(dataStr) as {
                                choices?: Array<{ delta?: { content?: string }; finish_reason?: string }>;
                            };
                            const delta = parsed.choices?.[0]?.delta?.content;
                            if (typeof delta === 'string' && delta.length > 0) {
                                fullContent += delta;
                            }
                        } catch {
                            // Parsing error - skip this chunk
                        }
                    } else {
                        // Try to parse as direct JSON
                        try {
                            const parsed = JSON.parse(line) as {
                                choices?: Array<{ delta?: { content?: string }; finish_reason?: string }>;
                            };
                            const delta = parsed.choices?.[0]?.delta?.content;
                            if (typeof delta === 'string' && delta.length > 0) {
                                fullContent += delta;
                            }
                        } catch {
                            // Not valid JSON - might be malformed
                        }
                    }
                }
            }

            // Process any remaining partial line
            if (partialLine.trim()) {
                try {
                    if (partialLine.trim().startsWith('data: ')) {
                        const dataStr = partialLine.trim().substring(6);
                        if (dataStr !== '[DONE]') {
                            const parsed = JSON.parse(dataStr) as {
                                choices?: Array<{ delta?: { content?: string } }>;
                            };
                            const delta = parsed.choices?.[0]?.delta?.content;
                            if (typeof delta === 'string') {
                                fullContent += delta;
                            }
                        }
                    } else {
                        const parsed = JSON.parse(partialLine) as {
                            choices?: Array<{ delta?: { content?: string } }>;
                        };
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (typeof delta === 'string') {
                            fullContent += delta;
                        }
                    }
                } catch {
                    // Final parse attempt failed
                }
            }
        } finally {
            reader.releaseLock();
        }

        return fullContent;
    }

    /**
     * ⚙️  Get default LLM configuration
     * From FileConfigManager or extension context
     * 
     * @returns Default LLM config
     */
    private static getDefaultLLMConfig(): Required<PRDGenerationOptions['llmConfig']> {
        return {
            url: 'http://192.168.1.205:1234/v1/chat/completions',
            model: 'mistralai/ministral-3-14b-reasoning',
            maxOutputTokens: 4000,
            timeoutSeconds: 300,
            temperature: 0.3,
        };
    }
}

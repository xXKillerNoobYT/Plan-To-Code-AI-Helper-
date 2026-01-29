/**
 * 🌊 Streaming LLM Utility
 * 
 * Handles streaming LLM calls with inactivity-based timeout (no hard timeout)
 * - Reads config.timeoutSeconds as max inactivity window
 * - Tracks lastTokenTime — errors if no tokens for timeoutSeconds
 * - Falls back to non-streaming if stream errors
 * - Appends tokens to callback in real-time
 * 
 * TODO: Add unit tests for:
 * - Streaming with valid tokens (verify onToken called per chunk)
 * - Inactivity timeout (no token for N seconds → error)
 * - Stream malformed JSON (fallback to non-streaming)
 * - Fallback non-streaming call (verify full response captured)
 * - Config timeout missing (verify fallback to 300s)
 * - Stream [DONE] signal (verify completion)
 * 
 * References:
 * - https://axios-http.com/docs/res_stream
 * - https://stackoverflow.com/questions/61632649/how-to-detect-no-data-in-stream-nodejs
 * - https://platform.openai.com/docs/api-reference/chat/create#chat-create-stream
 */

import { LLMConfig } from './fileConfig';

/**
 * ⚙️ Streaming Configuration Options
 */
export interface StreamOptions {
    /** LLM configuration (url, model, timeout, etc.) */
    config: LLMConfig;
    /** System prompt for LLM */
    systemPrompt: string;
    /** User/content prompt for LLM */
    userPrompt: string;
    /** Temperature for LLM (default: 0.7) */
    temperature?: number;
    /** Max output tokens (default from config) */
    maxTokens?: number;
    /** Callback to append tokens as they arrive (optional) */
    onToken?: (token: string) => void;
    /** Callback on stream error (for logging) (optional) */
    onError?: (error: string) => void;
    /** Callback on stream completion (optional) */
    onComplete?: () => void;
}

/**
 * 📊 Streaming Result
 */
export interface StreamResult {
    success: boolean;
    content?: string;
    error?: string;
    method?: 'streaming' | 'fallback-non-streaming';
    inactivityTimeoutSeconds?: number;
}

/**
 * ⏱️ Inactivity Configuration
 */
interface InactivityConfig {
    /** Timeout in milliseconds (from config.timeoutSeconds) */
    timeoutMs: number;
    /** Last token time (updated on every chunk) */
    lastTokenTime: number;
    /** Check interval (100ms) */
    checkInterval: number;
    /** Timer ID (for cleanup) */
    timerId?: NodeJS.Timeout;
}

/**
 * 🎯 Parse streaming chunk from OpenAI/Mistral format
 * Expected format: "data: {...json...}" or "data: [DONE]"
 * 
 * @param line Raw line from stream
 * @returns Parsed content or null
 */
function parseStreamChunk(line: string): string | null {
    if (!line.startsWith('data:')) {
        return null;
    }

    const dataStr = line.slice(5).trim();
    if (!dataStr || dataStr === '[DONE]') {
        return null;
    }

    try {
        const parsed = JSON.parse(dataStr) as {
            choices?: Array<{ delta?: { content?: string }; finish_reason?: string }>;
        };
        return parsed.choices?.[0]?.delta?.content || null;
    } catch {
        // Malformed JSON chunk — return null, let caller decide fallback
        return null;
    }
}

/**
 * 🔔 Create inactivity timer that fires if no tokens for N seconds
 * 
 * @param config Inactivity configuration
 * @param onTimeout Callback when timeout fires
 * @returns Timer object with start/stop methods
 */
function createInactivityTimer(
    config: InactivityConfig,
    onTimeout: () => void
): { start: () => void; stop: () => void; resetTime: () => void } {
    return {
        start(): void {
            config.timerId = setInterval(() => {
                const elapsed = Date.now() - config.lastTokenTime;
                if (elapsed > config.timeoutMs) {
                    onTimeout();
                }
            }, config.checkInterval);
        },

        stop(): void {
            if (config.timerId) {
                clearInterval(config.timerId);
                config.timerId = undefined;
            }
        },

        resetTime(): void {
            config.lastTokenTime = Date.now();
        },
    };
}

/**
 * 🌊 Call LLM with streaming enabled and inactivity-based timeout
 * 
 * Streams tokens in real-time, calls onToken() for each chunk.
 * Uses inactivity timeout (no token for timeoutSeconds) instead of hard timeout.
 * Falls back to non-streaming if stream fails.
 * 
 * TODO: Add unit test to verify:
 * - onToken callback fires for each token chunk
 * - Inactivity timer resets on every token
 * - Timeout error fires after config.timeoutSeconds of silence
 * - Stream end ([DONE]) auto-completes
 * - Malformed JSON chunks trigger fallback
 * 
 * @param options Streaming configuration
 * @returns Result with success flag and content
 */
export async function callLLMWithStreaming(options: StreamOptions): Promise<StreamResult> {
    const {
        config,
        systemPrompt,
        userPrompt,
        temperature = 0.7,
        maxTokens = config.maxOutputTokens || 2000,
        onToken,
        onError,
        onComplete,
    } = options;

    // Get inactivity timeout from config (fallback to 300s if missing)
    const timeoutSeconds = config.timeoutSeconds || 300;
    const timeoutMs = timeoutSeconds * 1000;

    // Initialize inactivity tracker
    const inactivityConfig: InactivityConfig = {
        timeoutMs,
        lastTokenTime: Date.now(),
        checkInterval: 100, // 100ms check interval
    };

    let timeoutFired = false;
    const inactivityTimer = createInactivityTimer(inactivityConfig, () => {
        timeoutFired = true;
        inactivityTimer.stop();
    });

    try {
        // Start inactivity timer
        inactivityTimer.start();

        // Make streaming request
        const response = await fetch(config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature,
                max_tokens: maxTokens,
                stream: true,
            }),
        });

        if (!response.ok) {
            inactivityTimer.stop();
            const status = `HTTP ${response.status} ${response.statusText}`.trim();
            onError?.(status);
            // Fall back to non-streaming
            return callLLMFallback(options, status);
        }

        // Check if response has a readable stream
        if (!response.body) {
            inactivityTimer.stop();
            const error = 'Response body is not readable';
            onError?.(error);
            return callLLMFallback(options, error);
        }

        // Read streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const collectedContent: string[] = [];
        let partialLine = '';
        let sawDoneSignal = false;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            // Check if inactivity timeout fired
            if (timeoutFired) {
                inactivityTimer.stop();
                reader.cancel();
                const errorMsg = `Inactivity timeout — no token for ${timeoutSeconds} seconds`;
                onError?.(errorMsg);
                return {
                    success: false,
                    error: errorMsg,
                    method: 'streaming',
                    inactivityTimeoutSeconds: timeoutSeconds,
                };
            }

            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            // Update last token time and reset timer
            inactivityTimer.resetTime();

            // Decode chunk
            const chunk = decoder.decode(value, { stream: true });
            const combined = partialLine + chunk;
            const lines = combined.split('\n');
            partialLine = lines.pop() ?? '';

            // Process complete lines
            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line) continue;

                const token = parseStreamChunk(line);
                if (token) {
                    collectedContent.push(token);
                    onToken?.(token);
                } else if (line.startsWith('data: [DONE]')) {
                    sawDoneSignal = true;
                    break;
                }
            }

            if (sawDoneSignal) {
                break;
            }
        }

        // Process any remaining partial line
        if (!sawDoneSignal && partialLine.trim()) {
            const token = parseStreamChunk(partialLine.trim());
            if (token) {
                collectedContent.push(token);
                onToken?.(token);
            }
        }

        inactivityTimer.stop();
        onComplete?.();

        const content = collectedContent.join('');
        return {
            success: true,
            content: content || undefined,
            method: 'streaming',
            inactivityTimeoutSeconds: timeoutSeconds,
        };
    } catch (error) {
        inactivityTimer.stop();

        const errorMsg = error instanceof Error ? error.message : String(error);

        // If streaming failed, fall back to non-streaming
        if (errorMsg.includes('stream') || errorMsg.includes('Stream') || errorMsg.includes('readable')) {
            onError?.(`Stream error: ${errorMsg} - falling back to non-streaming`);
            return callLLMFallback(options, errorMsg);
        }

        onError?.(errorMsg);
        return {
            success: false,
            error: errorMsg,
            method: 'streaming',
        };
    }
}

/**
 * 🔄 Fallback: Call LLM without streaming
 * 
 * Used when streaming fails or is not available.
 * Also uses inactivity-based timeout, not hard timeout.
 * 
 * TODO: Add unit test to verify:
 * - Non-streaming fetch completes successfully
 * - Inactivity timeout triggers if response takes too long
 * - Error handling for HTTP failures
 * - JSON parse errors are caught
 * 
 * @param options Streaming configuration (same as streaming)
 * @param fallbackReason Why we're falling back (for logging)
 * @returns Result with success flag and content
 */
export async function callLLMFallback(
    options: StreamOptions,
    fallbackReason?: string
): Promise<StreamResult> {
    const {
        config,
        systemPrompt,
        userPrompt,
        temperature = 0.7,
        maxTokens = config.maxOutputTokens || 2000,
        onError,
        onComplete,
    } = options;

    // Get inactivity timeout from config (fallback to 300s if missing)
    const timeoutSeconds = config.timeoutSeconds || 300;
    const timeoutMs = timeoutSeconds * 1000;

    // Initialize inactivity tracker for non-streaming call
    const inactivityConfig: InactivityConfig = {
        timeoutMs,
        lastTokenTime: Date.now(),
        checkInterval: 100,
    };

    let timeoutFired = false;
    const inactivityTimer = createInactivityTimer(inactivityConfig, () => {
        timeoutFired = true;
        inactivityTimer.stop();
    });

    try {
        inactivityTimer.start();

        const response = await fetch(config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature,
                max_tokens: maxTokens,
                stream: false,
            }),
        });

        // Update last token time (response received)
        inactivityTimer.resetTime();

        if (timeoutFired) {
            inactivityTimer.stop();
            const errorMsg = `Inactivity timeout — no response for ${timeoutSeconds} seconds (non-streaming)`;
            onError?.(errorMsg);
            return {
                success: false,
                error: errorMsg,
                method: 'fallback-non-streaming',
                inactivityTimeoutSeconds: timeoutSeconds,
            };
        }

        if (!response.ok) {
            inactivityTimer.stop();
            const status = `HTTP ${response.status} ${response.statusText}`.trim();
            onError?.(status);
            return {
                success: false,
                error: status,
                method: 'fallback-non-streaming',
            };
        }

        // Parse JSON response
        const jsonResponse = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
        };

        inactivityTimer.stop();
        onComplete?.();

        const content = jsonResponse.choices?.[0]?.message?.content || '';
        return {
            success: true,
            content: content || undefined,
            method: 'fallback-non-streaming',
            inactivityTimeoutSeconds: timeoutSeconds,
        };
    } catch (error) {
        inactivityTimer.stop();

        const errorMsg = error instanceof Error ? error.message : String(error);
        onError?.(errorMsg);

        return {
            success: false,
            error: `${fallbackReason ? `Fallback reason: ${fallbackReason} — ` : ''}Non-streaming error: ${errorMsg}`,
            method: 'fallback-non-streaming',
        };
    }
}



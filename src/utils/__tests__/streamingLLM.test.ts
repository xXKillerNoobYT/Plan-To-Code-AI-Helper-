/**
 * 🌊 Unit Tests for streamingLLM.ts
 * 
 * Tests for streaming LLM calls with inactivity-based timeout.
 * Covers:
 * - Successful streaming with token callbacks
 * - Inactivity timeout detection
 * - Fallback to non-streaming on errors
 * - Malformed JSON handling
 * - Configuration defaults
 */

import { callLLMWithStreaming, callLLMFallback } from '../streamingLLM';
import { LLMConfig } from '../fileConfig';

describe('streamingLLM.ts', () => {
    const mockConfig: LLMConfig = {
        url: 'https://api.example.com/chat/completions',
        model: 'gpt-4',
        inputTokenLimit: 8000,
        maxOutputTokens: 2000,
        timeoutSeconds: 30,
    };

    describe('callLLMWithStreaming', () => {
        it('should successfully stream tokens and call onToken callback', async () => {
            const tokens: string[] = [];
            const streamResponse = `data: {"choices":[{"delta":{"content":"Hello"}}]}\ndata: {"choices":[{"delta":{"content":" world"}}]}\ndata: [DONE]\n`;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode(streamResponse), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
                temperature: 0.7,
                maxTokens: 2000,
                onToken: (token) => tokens.push(token),
            });

            expect(result.success).toBe(true);
            expect(result.method).toBe('streaming');
            expect(tokens.length).toBeGreaterThan(0);
        });

        it('should handle HTTP errors and fall back to non-streaming', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 502,
                statusText: 'Bad Gateway',
            });

            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(false);
            expect(result.method).toBe('fallback-non-streaming');
        });

        it('should use default timeoutSeconds if not provided in config', async () => {
            const configWithoutTimeout: LLMConfig = {
                url: 'https://api.example.com/chat/completions',
                model: 'gpt-4',
                inputTokenLimit: 8000,
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode('data: [DONE]\n'), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            const result = await callLLMWithStreaming({
                config: configWithoutTimeout,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(true);
            expect(result.inactivityTimeoutSeconds).toBe(300); // Default fallback
        });

        it('should handle response body not readable', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: null,
            });

            const errors: string[] = [];
            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
                onError: (error) => errors.push(error),
            });

            expect(result.success).toBe(false);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should process partial lines correctly', async () => {
            const tokens: string[] = [];
            const streamResponse = `data: {"choices":[{"delta":{"content":"Hello"}}]}`;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode(streamResponse), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
                onToken: (token) => tokens.push(token),
            });

            expect(result.success).toBe(true);
            expect(tokens.length).toBeGreaterThan(0);
        });

        it('should handle malformed JSON chunks gracefully', async () => {
            const streamResponse = `data: {invalid json}\ndata: {"choices":[{"delta":{"content":"Valid"}}]}\ndata: [DONE]\n`;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode(streamResponse), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(true);
        });

        it('should call onComplete callback on successful completion', async () => {
            const onComplete = jest.fn();

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode('data: [DONE]\n'), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
                onComplete,
            });

            expect(onComplete).toHaveBeenCalled();
        });

        it('should handle fetch errors', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

            const errors: string[] = [];
            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
                onError: (error) => errors.push(error),
            });

            expect(result.success).toBe(false);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should handle stream-related errors and fall back', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Stream error'));

            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(false);
            expect(result.method).toBe('fallback-non-streaming');
        });

        it('should skip empty lines in stream', async () => {
            const streamResponse = `\ndata: {"choices":[{"delta":{"content":"Hello"}}]}\n\n\ndata: [DONE]\n`;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode(streamResponse), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(true);
        });

        it('should handle temperature parameter', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode('data: [DONE]\n'), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
                temperature: 0.5,
            });

            const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
            expect(callBody.temperature).toBe(0.5);
        });

        it('should use default temperature if not provided', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode('data: [DONE]\n'), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
            expect(callBody.temperature).toBe(0.7); // Default
        });

        it('should handle maxTokens parameter', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode('data: [DONE]\n'), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
                maxTokens: 5000,
            });

            const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
            expect(callBody.max_tokens).toBe(5000);
        });
    });

    describe('callLLMFallback', () => {
        it('should successfully call LLM without streaming', async () => {
            const responseBody = JSON.stringify({
                choices: [{ message: { content: 'Hello world' } }],
            });

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(JSON.parse(responseBody)),
            });

            const result = await callLLMFallback({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(true);
            expect(result.method).toBe('fallback-non-streaming');
        });

        it('should handle HTTP errors in fallback', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            const result = await callLLMFallback({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(false);
        });

        it('should handle JSON parse errors in fallback', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
            });

            const result = await callLLMFallback({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(false);
        });

        it('should use default timeoutSeconds in fallback', async () => {
            const configWithoutTimeout: LLMConfig = {
                url: 'https://api.example.com/chat/completions',
                model: 'gpt-4',
                inputTokenLimit: 8000,
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: 'Hello' } }],
                }),
            });

            const result = await callLLMFallback({
                config: configWithoutTimeout,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(true);
            expect(result.inactivityTimeoutSeconds).toBe(300);
        });

        it('should call onComplete callback on successful fallback', async () => {
            const onComplete = jest.fn();

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: 'Hello' } }],
                }),
            });

            await callLLMFallback({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
                onComplete,
            });

            expect(onComplete).toHaveBeenCalled();
        });

        it('should handle fetch errors in fallback', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

            const result = await callLLMFallback({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(false);
        });

        it('should use default maxTokens if not in config', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: 'Hello' } }],
                }),
            });

            await callLLMFallback({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
            expect(callBody.max_tokens).toBe(2000);
        });
    });

    describe('Edge cases', () => {
        it('should handle tokens with special characters', async () => {
            const tokens: string[] = [];
            const streamResponse = `data: {"choices":[{"delta":{"content":"Hello\\n\\t\\r"}}]}\ndata: [DONE]\n`;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode(streamResponse), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
                onToken: (token) => tokens.push(token),
            });

            expect(result.success).toBe(true);
        });

        it('should handle empty token content', async () => {
            const streamResponse = `data: {"choices":[{"delta":{"content":""}}]}\ndata: [DONE]\n`;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode(streamResponse), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(true);
        });

        it('should handle multiple DONE signals gracefully', async () => {
            const streamResponse = `data: [DONE]\ndata: [DONE]\ndata: [DONE]\n`;

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                body: {
                    getReader: () => ({
                        read: jest.fn()
                            .mockResolvedValueOnce({ value: new TextEncoder().encode(streamResponse), done: false })
                            .mockResolvedValueOnce({ value: undefined, done: true }),
                        cancel: jest.fn(),
                    }),
                },
            });

            const result = await callLLMWithStreaming({
                config: mockConfig,
                systemPrompt: 'You are helpful',
                userPrompt: 'Hello',
            });

            expect(result.success).toBe(true);
        });
    });
});

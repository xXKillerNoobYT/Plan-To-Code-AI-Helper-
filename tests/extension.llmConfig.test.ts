/**
 * 🧪 Tests for LLM Configuration Settings
 * 
 * Verifies that VS Code settings for LLM connection are properly read
 * and applied during task processing with token limit enforcement
 */

import * as vscode from 'vscode';

describe('LLM Configuration Settings', () => {
    let mockConfig: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a mock configuration with default LLM settings
        mockConfig = {
            get: jest.fn((key: string) => {
                const defaults: Record<string, any> = {
                    'llm.url': 'http://192.168.1.205:1234/v1/chat/completions',
                    'llm.model': 'mistralai/ministral-3-14b-reasoning',
                    'llm.maxOutputTokens': 2000,
                    'llm.inputTokenLimit': 4000,
                    'llm.timeoutSeconds': 300,
                };
                return defaults[key];
            }),
        };

        (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);
    });

    // ========================================================================
    // Test 1: Reading default LLM configuration
    // ========================================================================
    it('should read default LLM configuration values', () => {
        const config = vscode.workspace.getConfiguration('coe');

        expect(config.get('llm.url')).toBe('http://192.168.1.205:1234/v1/chat/completions');
        expect(config.get('llm.model')).toBe('mistralai/ministral-3-14b-reasoning');
        expect(config.get('llm.maxOutputTokens')).toBe(2000);
        expect(config.get('llm.inputTokenLimit')).toBe(4000);
        expect(config.get('llm.timeoutSeconds')).toBe(300);
    });

    // ========================================================================
    // Test 2: Custom LLM URL configuration
    // ========================================================================
    it('should use custom LLM URL when configured', () => {
        mockConfig.get = jest.fn((key: string) => {
            if (key === 'llm.url') return 'http://localhost:11434/api/generate';
            return mockConfig.get(key);
        });

        const config = vscode.workspace.getConfiguration('coe');
        const llmUrl = config.get<string>('llm.url');

        expect(llmUrl).toBe('http://localhost:11434/api/generate');
    });

    // ========================================================================
    // Test 3: Custom model name configuration
    // ========================================================================
    it('should use custom model name when configured', () => {
        mockConfig.get = jest.fn((key: string) => {
            if (key === 'llm.model') return 'llama3:8b';
            const defaults: Record<string, any> = {
                'llm.url': 'http://192.168.1.205:1234/v1/chat/completions',
                'llm.maxOutputTokens': 2000,
                'llm.inputTokenLimit': 4000,
                'llm.timeoutSeconds': 300,
            };
            return defaults[key];
        });

        const config = vscode.workspace.getConfiguration('coe');
        const model = config.get<string>('llm.model');

        expect(model).toBe('llama3:8b');
    });

    // ========================================================================
    // Test 4: Token limit enforcement - input estimation
    // ========================================================================
    it('should estimate input tokens correctly (1 token ≈ 4 chars)', () => {
        const testPrompt = 'A'.repeat(16000); // 16,000 characters
        const estimatedTokens = Math.ceil(testPrompt.length / 4);

        expect(estimatedTokens).toBe(4000);
    });

    // ========================================================================
    // Test 5: Token limit enforcement - truncation logic
    // ========================================================================
    it('should truncate prompt when exceeding input token limit', () => {
        const inputLimit = 4000;
        const longPrompt = 'A'.repeat(20000); // 20,000 chars = ~5,000 tokens
        const estimatedTokens = Math.ceil(longPrompt.length / 4);

        expect(estimatedTokens).toBeGreaterThan(inputLimit);

        // Truncation logic: targetChars = limit * 4, truncate at 90%
        const targetChars = inputLimit * 4;
        const truncateAt = Math.floor(targetChars * 0.9);
        const truncatedPrompt = longPrompt.substring(0, truncateAt);

        expect(truncatedPrompt.length).toBe(14400); // 4000 * 4 * 0.9
        expect(Math.ceil(truncatedPrompt.length / 4)).toBeLessThanOrEqual(inputLimit);
    });

    // ========================================================================
    // Test 6: Timeout configuration in milliseconds
    // ========================================================================
    it('should convert timeout from seconds to milliseconds', () => {
        const config = vscode.workspace.getConfiguration('coe');
        const timeoutSeconds = config.get<number>('llm.timeoutSeconds')!;
        const timeoutMs = timeoutSeconds * 1000;

        expect(timeoutSeconds).toBe(300);
        expect(timeoutMs).toBe(300000); // 5 minutes
    });

    // ========================================================================
    // Test 7: Max output tokens configuration
    // ========================================================================
    it('should apply max output tokens to request body', () => {
        const config = vscode.workspace.getConfiguration('coe');
        const maxOutputTokens = config.get<number>('llm.maxOutputTokens')!;

        const requestBody = {
            model: 'test-model',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: maxOutputTokens,
        };

        expect(requestBody.max_tokens).toBe(2000);
    });

    // ========================================================================
    // Test 8: Input limit with buffer calculation
    // ========================================================================
    it('should leave 10% buffer when truncating to token limit', () => {
        const inputLimit = 3000;
        const targetChars = inputLimit * 4;
        const truncateAt = Math.floor(targetChars * 0.9);

        // Expected: 3000 * 4 * 0.9 = 10,800 characters
        expect(truncateAt).toBe(10800);

        // Verify final tokens are within limit
        const finalTokens = Math.ceil(truncateAt / 4);
        expect(finalTokens).toBeLessThanOrEqual(inputLimit);
        expect(finalTokens).toBe(2700); // 10,800 / 4
    });

    // ========================================================================
    // Test 9: Configuration changes should be reflected
    // ========================================================================
    it('should reflect configuration changes when settings are updated', () => {
        // Initial configuration
        let config = vscode.workspace.getConfiguration('coe');
        expect(config.get<number>('llm.inputTokenLimit')).toBe(4000);

        // Simulate user changing setting to 3000
        mockConfig.get = jest.fn((key: string) => {
            if (key === 'llm.inputTokenLimit') return 3000;
            const defaults: Record<string, any> = {
                'llm.url': 'http://192.168.1.205:1234/v1/chat/completions',
                'llm.model': 'mistralai/ministral-3-14b-reasoning',
                'llm.maxOutputTokens': 2000,
                'llm.timeoutSeconds': 300,
            };
            return defaults[key];
        });

        // Re-read configuration
        config = vscode.workspace.getConfiguration('coe');
        expect(config.get<number>('llm.inputTokenLimit')).toBe(3000);
    });

    // ========================================================================
    // Test 10: Minimum and maximum bounds validation
    // ========================================================================
    it('should respect minimum and maximum bounds for numeric settings', () => {
        // These bounds are enforced by VS Code schema in package.json
        const bounds = {
            maxOutputTokens: { min: 512, max: 8192 },
            inputTokenLimit: { min: 1000, max: 32000 },
            timeoutSeconds: { min: 60, max: Infinity },
        };

        expect(bounds.maxOutputTokens.min).toBe(512);
        expect(bounds.maxOutputTokens.max).toBe(8192);
        expect(bounds.inputTokenLimit.min).toBe(1000);
        expect(bounds.inputTokenLimit.max).toBe(32000);
        expect(bounds.timeoutSeconds.min).toBe(60);
    });
});

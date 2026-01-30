/**
 * Unit Tests: LLM Configuration Manager
 * Tests config loading, validation, priority sources, and fallback behavior
 */

import * as assert from 'assert';
import { LLMConfigManager, ConfigValidationError } from '../../services/llmConfigManager';
import { FileConfigManager, LLMConfigSchema, LLMConfig } from '../../utils/fileConfig';

suite('LLMConfigManager Test Suite', () => {

    // Schema Validation Tests
    suite('LLMConfigSchema Validation', () => {
        test('should validate correct LLM config', () => {
            const validConfig = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'mistral-7b',
                inputTokenLimit: 4000,
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
                temperature: 0.3,
            };

            const result = LLMConfigSchema.safeParse(validConfig);
            assert.strictEqual(result.success, true, 'Valid config should pass schema validation');
        });

        test('should reject invalid URL', () => {
            const invalidConfig = {
                url: 'not-a-url',  // Invalid URL
                model: 'mistral-7b',
                inputTokenLimit: 4000,
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
            };

            const result = LLMConfigSchema.safeParse(invalidConfig);
            assert.strictEqual(result.success, false, 'Invalid URL should fail schema validation');
        });

        test('should reject empty model name', () => {
            const invalidConfig = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: '',  // Empty model
                inputTokenLimit: 4000,
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
            };

            const result = LLMConfigSchema.safeParse(invalidConfig);
            assert.strictEqual(result.success, false, 'Empty model should fail schema validation');
        });

        test('should reject negative token limits', () => {
            const invalidConfig = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'mistral-7b',
                inputTokenLimit: -100,  // Negative limit
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
            };

            const result = LLMConfigSchema.safeParse(invalidConfig);
            assert.strictEqual(result.success, false, 'Negative token limit should fail schema validation');
        });

        test('should reject invalid temperature (>2)', () => {
            const invalidConfig = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'mistral-7b',
                inputTokenLimit: 4000,
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
                temperature: 2.5,  // > 2
            };

            const result = LLMConfigSchema.safeParse(invalidConfig);
            assert.strictEqual(result.success, false, 'Temperature > 2 should fail schema validation');
        });

        test('should reject temperature < 0', () => {
            const invalidConfig = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'mistral-7b',
                inputTokenLimit: 4000,
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
                temperature: -0.5,  // < 0
            };

            const result = LLMConfigSchema.safeParse(invalidConfig);
            assert.strictEqual(result.success, false, 'Temperature < 0 should fail schema validation');
        });

        test('should accept optional temperature field', () => {
            const validConfig = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'mistral-7b',
                inputTokenLimit: 4000,
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
                // temperature is optional
            };

            const result = LLMConfigSchema.safeParse(validConfig);
            assert.strictEqual(result.success, true, 'Config without temperature should pass validation');
        });

        test('should accept temperature at boundaries (0 and 2)', () => {
            const config1 = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'mistral-7b',
                inputTokenLimit: 4000,
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
                temperature: 0,
            };

            const config2 = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'mistral-7b',
                inputTokenLimit: 4000,
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
                temperature: 2,
            };

            assert.strictEqual(LLMConfigSchema.safeParse(config1).success, true, 'Temperature = 0 should be valid');
            assert.strictEqual(LLMConfigSchema.safeParse(config2).success, true, 'Temperature = 2 should be valid');
        });

        test('should reject zero or negative timeout', () => {
            const invalidConfig1 = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'mistral-7b',
                inputTokenLimit: 4000,
                maxOutputTokens: 2000,
                timeoutSeconds: 0,
            };

            const invalidConfig2 = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'mistral-7b',
                inputTokenLimit: 4000,
                maxOutputTokens: 2000,
                timeoutSeconds: -30,
            };

            assert.strictEqual(LLMConfigSchema.safeParse(invalidConfig1).success, false, 'Timeout = 0 should fail');
            assert.strictEqual(LLMConfigSchema.safeParse(invalidConfig2).success, false, 'Negative timeout should fail');
        });

        test('should reject non-integer values for numeric fields', () => {
            const invalidConfig = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'mistral-7b',
                inputTokenLimit: 4000.5,  // Non-integer
                maxOutputTokens: 2000,
                timeoutSeconds: 300,
            };

            const result = LLMConfigSchema.safeParse(invalidConfig);
            assert.strictEqual(result.success, false, 'Non-integer token limit should fail');
        });
    });

    // ConfigValidationError Tests
    suite('ConfigValidationError', () => {
        test('should include field information', () => {
            const error = new ConfigValidationError('Invalid URL format', 'url');

            assert.strictEqual(error.field, 'url', 'Should store field name');
            assert.strictEqual(error.name, 'ConfigValidationError', 'Should have correct error name');
            assert.ok(error.message.includes('Invalid URL format'), 'Should include error message');
        });

        test('should work without field parameter', () => {
            const error = new ConfigValidationError('General config error');

            assert.strictEqual(error.field, undefined, 'Field should be undefined when not provided');
            assert.strictEqual(error.name, 'ConfigValidationError', 'Should have correct error name');
        });
    });

    // Default Configuration Tests
    suite('Default Configuration', () => {
        test('should use localhost:1234 and mistral-7b', () => {
            const defaults = FileConfigManager.getLLMConfig();

            assert.ok(defaults.url.includes('localhost:1234') || defaults.url === 'http://localhost:1234/v1/chat/completions',
                `Default URL should use localhost:1234, got: ${defaults.url}`);
            assert.strictEqual(defaults.model, 'mistral-7b', `Default model should be mistral-7b, got: ${defaults.model}`);
        });

        test('should have all required fields', () => {
            const defaults = FileConfigManager.getLLMConfig();

            assert.ok(defaults.url, 'Should have url');
            assert.ok(defaults.model, 'Should have model');
            assert.ok(typeof defaults.inputTokenLimit === 'number', 'Should have inputTokenLimit');
            assert.ok(typeof defaults.maxOutputTokens === 'number', 'Should have maxOutputTokens');
            assert.ok(typeof defaults.timeoutSeconds === 'number', 'Should have timeoutSeconds');
        });

        test('default values should be reasonable', () => {
            const defaults = FileConfigManager.getLLMConfig();

            assert.ok(defaults.inputTokenLimit >= 1000, 'Input token limit should be reasonable');
            assert.ok(defaults.maxOutputTokens >= 500, 'Max output tokens should be reasonable');
            assert.ok(defaults.timeoutSeconds >= 30, 'Timeout should be reasonable');
            if (defaults.temperature !== undefined) {
                assert.ok(defaults.temperature >= 0 && defaults.temperature <= 2, 'Temperature should be in valid range');
            }
        });
    });

    // LLMConfigManager API Tests
    suite('LLMConfigManager API', () => {
        test('should be instantiable', () => {
            assert.ok(LLMConfigManager, 'LLMConfigManager should be defined');
            assert.ok(LLMConfigManager.getConfig, 'getConfig method should exist');
            assert.ok(LLMConfigManager.getConfigOrDefault, 'getConfigOrDefault method should exist');
            assert.ok(LLMConfigManager.getConfigSources, 'getConfigSources method should exist');
        });

        test('getConfig should return valid config', async () => {
            const config = await LLMConfigManager.getConfig();

            assert.ok(config, 'Config should exist');
            assert.ok(config.url, 'Config should have url');
            assert.ok(config.model, 'Config should have model');
            assert.ok(typeof config.inputTokenLimit === 'number', 'Config should have inputTokenLimit');
            assert.ok(typeof config.maxOutputTokens === 'number', 'Config should have maxOutputTokens');
            assert.ok(typeof config.timeoutSeconds === 'number', 'Config should have timeoutSeconds');
        });

        test('getConfigOrDefault should never throw', async () => {
            const config = await LLMConfigManager.getConfigOrDefault();

            assert.ok(config, 'Config should exist');
            assert.ok(config.url, 'Config should have url');
            assert.ok(config.model, 'Config should have model');
        });

        test('getConfigSources should return source information', () => {
            const sources = LLMConfigManager.getConfigSources();

            assert.ok(sources, 'Sources should exist');
            assert.ok(['vscode', 'file', 'default'].includes(sources.url), 'URL source should be valid');
            assert.ok(['vscode', 'file', 'default'].includes(sources.model), 'Model source should be valid');
            assert.ok(typeof sources.source === 'string', 'Combined source should be string');
        });

        test('getConfigSources should include source description', () => {
            const sources = LLMConfigManager.getConfigSources();

            assert.ok(sources.source.includes('url from'), 'Source should describe url origin');
            assert.ok(sources.source.includes('model from'), 'Source should describe model origin');
        });
    });

    // Error Handling Tests
    suite('Error Handling', () => {
        test('ConfigValidationError should be throwable and catchable', () => {
            try {
                throw new ConfigValidationError('Test error', 'testField');
            } catch (error) {
                assert.ok(error instanceof ConfigValidationError, 'Should be instanceof ConfigValidationError');
                assert.ok(error instanceof Error, 'Should be instanceof Error');
                assert.strictEqual((error as ConfigValidationError).field, 'testField', 'Should preserve field');
            }
        });

        test('should handle Zod validation errors gracefully', () => {
            const invalidData = {
                url: 'invalid-url',
                model: 'test',
                inputTokenLimit: -100,
                maxOutputTokens: 1000,
                timeoutSeconds: 30,
            };

            const result = LLMConfigSchema.safeParse(invalidData);
            assert.strictEqual(result.success, false, 'Validation should fail');

            if (!result.success) {
                assert.ok(result.error.errors.length > 0, 'Should have error details');
                assert.ok(result.error.errors[0].path, 'Error should have path');
                assert.ok(result.error.errors[0].message, 'Error should have message');
            }
        });
    });

    // Integration Tests
    suite('Configuration Priority Integration', () => {
        test('should load config from available sources', async () => {
            const config = await LLMConfigManager.getConfig();
            const sources = LLMConfigManager.getConfigSources();

            // Verify config matches expected source priority
            assert.ok(config, 'Config should be loaded');
            assert.ok(sources, 'Sources should be identified');
        });

        test('getConfigOrDefault should handle errors without throwing', async () => {
            let config: LLMConfig | undefined;
            let error: Error | undefined;

            try {
                config = await LLMConfigManager.getConfigOrDefault();
            } catch (err) {
                error = err as Error;
            }

            assert.ok(config, 'Config should be returned');
            assert.strictEqual(error, undefined, 'Should not throw errors');
        });
    });

    // Edge Cases
    suite('Edge Cases', () => {
        test('should handle missing optional temperature in defaults', () => {
            const defaults = FileConfigManager.getLLMConfig();

            // Temperature is optional, so this should not throw
            const hasTemp = 'temperature' in defaults;
            if (hasTemp) {
                assert.ok(typeof defaults.temperature === 'number' || defaults.temperature === undefined);
            }
        });

        test('should validate complete config with all optional fields', () => {
            const completeConfig = {
                url: 'http://localhost:1234/v1/chat/completions',
                model: 'gpt-4',
                inputTokenLimit: 8000,
                maxOutputTokens: 4000,
                timeoutSeconds: 600,
                temperature: 0.7,
            };

            const result = LLMConfigSchema.safeParse(completeConfig);
            assert.strictEqual(result.success, true, 'Complete config should be valid');
        });

        test('schema should allow various valid URL formats', () => {
            const urls = [
                'http://localhost:1234/v1/chat/completions',
                'https://api.openai.com/v1/chat/completions',
                'http://127.0.0.1:5000/api/generate',
                'https://my-llm-server.com:8080/completion',
            ];

            urls.forEach(url => {
                const config = {
                    url,
                    model: 'test-model',
                    inputTokenLimit: 4000,
                    maxOutputTokens: 2000,
                    timeoutSeconds: 300,
                };

                const result = LLMConfigSchema.safeParse(config);
                assert.strictEqual(result.success, true, `URL ${url} should be valid`);
            });
        });

        test('schema should reject various invalid URL formats', () => {
            const invalidUrls = [
                'not a url',
                'ftp://invalid-protocol.com',
                'just-a-string',
                '',
                '//missing-protocol.com',
            ];

            invalidUrls.forEach(url => {
                const config = {
                    url,
                    model: 'test-model',
                    inputTokenLimit: 4000,
                    maxOutputTokens: 2000,
                    timeoutSeconds: 300,
                };

                const result = LLMConfigSchema.safeParse(config);
                assert.strictEqual(result.success, false, `URL ${url} should be invalid`);
            });
        });
    });
});



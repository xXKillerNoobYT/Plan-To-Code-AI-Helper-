/**
 * Unit Tests: LLM Configuration Manager
 * Tests config loading, validation, and fallback behavior
 */

import * as assert from 'assert';
import { LLMConfigManager, ConfigValidationError } from '../../services/llmConfigManager';
import { FileConfigManager, LLMConfigSchema } from '../../utils/fileConfig';

suite('LLMConfigManager Test Suite', () => {

    test('LLMConfigSchema should validate correct LLM config', () => {
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

    test('LLMConfigSchema should reject invalid URL', () => {
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

    test('LLMConfigSchema should reject empty model name', () => {
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

    test('LLMConfigSchema should reject negative token limits', () => {
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

    test('LLMConfigSchema should reject invalid temperature (>2)', () => {
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

    test('LLMConfigSchema should accept optional temperature field', () => {
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

    test('ConfigValidationError should include field information', () => {
        const error = new ConfigValidationError('Invalid URL format', 'url');

        assert.strictEqual(error.field, 'url', 'Should store field name');
        assert.strictEqual(error.name, 'ConfigValidationError', 'Should have correct error name');
    });

    test('Default config should use localhost:1234 and mistral-7b', () => {
        // Get defaults from FileConfigManager
        const defaults = FileConfigManager.getLLMConfig();

        assert.ok(defaults.url.includes('localhost:1234') || defaults.url === 'http://localhost:1234/v1/chat/completions',
            `Default URL should use localhost:1234, got: ${defaults.url}`);
        assert.strictEqual(defaults.model, 'mistral-7b', `Default model should be mistral-7b, got: ${defaults.model}`);
    });

    test('LLMConfigManager should be instantiable', () => {
        // Simple test that the class exists and is usable
        assert.ok(LLMConfigManager, 'LLMConfigManager should be defined');
        assert.ok(LLMConfigManager.getConfig, 'getConfig method should exist');
        assert.ok(LLMConfigManager.getConfigOrDefault, 'getConfigOrDefault method should exist');
    });
});



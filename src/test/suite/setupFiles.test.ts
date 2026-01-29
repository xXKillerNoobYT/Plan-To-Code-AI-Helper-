/**
 * 🧪 Integration Tests for Workspace Setup Files
 * 
 * Tests the setupMissingFiles() utility that auto-creates configuration
 * and plan files on extension startup if they don't exist.
 * 
 * Note: These are integration tests that verify setupMissingFiles is properly
 * integrated into the extension. Full unit tests with mocks are in the
 * Jest test files.
 */

import * as assert from 'assert';
import { setupMissingFiles } from '../../utils/setupFiles';

suite('Workspace Setup Files Test Suite', () => {
    // ========================================================================
    // Test: setupMissingFiles exists and is callable
    // ========================================================================
    test('setupMissingFiles should be a callable function', () => {
        assert.strictEqual(
            typeof setupMissingFiles,
            'function',
            'setupMissingFiles should be a function'
        );
    });

    // ========================================================================
    // Test: setupMissingFiles can be called and returns a Promise
    // ========================================================================
    test('setupMissingFiles should return a Promise', () => {
        const result = setupMissingFiles();
        assert.ok(
            result instanceof Promise || (result && typeof (result as any).then === 'function'),
            'setupMissingFiles should return a Promise'
        );
    });

    // ========================================================================
    // Test: setupMissingFiles executes without error in test environment
    // ========================================================================
    test('setupMissingFiles should execute without throwing errors', async () => {
        try {
            // In the test environment, there is typically no workspace folder,
            // so setupMissingFiles should return early gracefully
            await setupMissingFiles();
            assert.ok(true, 'Function executed successfully');
        } catch (error) {
            assert.fail(
                `setupMissingFiles threw an error: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    });

    // ========================================================================
    // Test: setupMissingFiles is available and can be imported
    // ========================================================================
    test('setupMissingFiles should be importable from utils/setupFiles', () => {
        assert.ok(
            setupMissingFiles !== undefined,
            'setupMissingFiles should be defined and importable'
        );
    });
});



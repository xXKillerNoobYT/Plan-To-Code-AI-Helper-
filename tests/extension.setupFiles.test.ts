/**
 * 🧪 Unit Tests for Workspace Setup Files Utility (setupFiles.ts)
 * 
 * Jest unit tests for auto-creation of configuration and plan files.
 * Covers checking the function exists and is callable.
 */

import { setupMissingFiles } from '../src/utils/setupFiles';

describe('setupMissingFiles - Unit Tests', () => {
    // ========================================================================
    // Test: Function exists and is callable
    // ========================================================================

    it('should export setupMissingFiles as a function', () => {
        expect(typeof setupMissingFiles).toBe('function');
    });

    // ========================================================================
    // Test: Function has correct signature
    // ========================================================================

    it('should return a Promise when called', () => {
        // setupMissingFiles is async, so it always returns a Promise
        const result = setupMissingFiles();
        expect(result).toBeInstanceOf(Promise);
    });

    // ========================================================================
    // Test: Function can be imported
    // ========================================================================

    it('should be importable from utils/setupFiles', () => {
        expect(setupMissingFiles).toBeDefined();
        expect(setupMissingFiles).not.toBeNull();
    });

    // ========================================================================
    // Test: Function name is correct
    // ========================================================================

    it('should have correct function name', () => {
        expect(setupMissingFiles.name).toBe('setupMissingFiles');
    });

    // ========================================================================
    // Test: Function length (number of parameters)
    // ========================================================================

    it('should not require any parameters', () => {
        // setupMissingFiles() takes no required parameters
        expect(setupMissingFiles.length).toBe(0);
    });

    // ========================================================================
    // Test: Type definitions
    // ========================================================================

    it('should have async function signature', async () => {
        const result = setupMissingFiles();

        // Verify it's a Promise
        expect(result).toHaveProperty('then');
        expect(result).toHaveProperty('catch');
        expect(result).toHaveProperty('finally');

        // Wait for it to complete (should not throw)
        await expect(result).resolves.toBeUndefined();
    });
});

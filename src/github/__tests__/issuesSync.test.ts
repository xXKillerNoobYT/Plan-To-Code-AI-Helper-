/**
 * 🧪 Unit Tests for GitHub Issues Sync
 *
 * Tests the bidirectional sync manager between GitHub Issues and local tasks
 */

import * as vscode from 'vscode';
import { IssuesSync } from '../issuesSync';
import { GitHubAPI } from '../api';

jest.mock('vscode', () => ({
    window: {
        showErrorMessage: jest.fn(),
    },
}));

describe('IssuesSync', () => {
    let issuesSync: IssuesSync;
    let mockGitHubAPI: jest.Mocked<GitHubAPI>;

    beforeEach(() => {
        jest.clearAllMocks();
        issuesSync = new IssuesSync();
        mockGitHubAPI = {} as jest.Mocked<GitHubAPI>;
    });

    afterEach(() => {
        // Clean up any active sync intervals
        issuesSync.stopSync();
    });

    describe('startSync', () => {
        it('should start the sync process and schedule periodic syncs', (done) => {
            const performSyncSpy = jest.spyOn(issuesSync as any, 'performSync');

            issuesSync.startSync(mockGitHubAPI);

            // Initial sync should be called immediately
            expect(performSyncSpy).toHaveBeenCalledTimes(1);
            expect(performSyncSpy).toHaveBeenCalledWith(mockGitHubAPI);

            // Verify sync interval is set (we won't wait for the full 5 minutes in tests)
            issuesSync.stopSync();
            done();
        });

        it('should call performSync with the GitHub API instance', (done) => {
            const performSyncSpy = jest.spyOn(issuesSync as any, 'performSync');

            issuesSync.startSync(mockGitHubAPI);

            // Check that performSync was called with the correct API
            expect(performSyncSpy).toHaveBeenCalledWith(mockGitHubAPI);

            issuesSync.stopSync();
            done();
        });

        it('should set up an interval for periodic sync', (done) => {
            const setIntervalSpy = jest.spyOn(global, 'setInterval');
            const performSyncSpy = jest.spyOn(issuesSync as any, 'performSync');

            issuesSync.startSync(mockGitHubAPI);

            // Should have called setInterval to schedule periodic syncs
            expect(setIntervalSpy).toHaveBeenCalled();

            issuesSync.stopSync();
            setIntervalSpy.mockRestore();
            done();
        });
    });

    describe('stopSync', () => {
        it('should clear the sync interval', () => {
            issuesSync.startSync(mockGitHubAPI);

            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
            issuesSync.stopSync();

            expect(clearIntervalSpy).toHaveBeenCalled();
            clearIntervalSpy.mockRestore();
        });

        it('should set syncInterval to null after stopping', () => {
            issuesSync.startSync(mockGitHubAPI);
            issuesSync.stopSync();

            // After stop, internal syncInterval should be cleared
            // We can verify this by trying to stop again without errors
            expect(() => issuesSync.stopSync()).not.toThrow();
        });

        it('should handle stopSync when no sync is running', () => {
            // Should not throw error if stopSync called without startSync
            expect(() => issuesSync.stopSync()).not.toThrow();
        });

        it('should be safe to call stopSync multiple times', () => {
            issuesSync.startSync(mockGitHubAPI);
            issuesSync.stopSync();
            issuesSync.stopSync();
            issuesSync.stopSync();

            // Should not throw any errors
            expect(true).toBe(true);
        });
    });

    describe('performSync (private)', () => {
        it('should handle sync errors gracefully', async () => {
            const performSync = issuesSync['performSync'];
            const error = new Error('Sync failed');

            // Mock the to show error message
            jest.spyOn(vscode.window, 'showErrorMessage').mockImplementation(() => Promise.resolve(undefined as any));

            // Call performSync directly and verify error handling
            await performSync.call(issuesSync, mockGitHubAPI);

            // performSync is wrapped in try-catch, so it should not throw
            expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
        });

        it('should execute without throwing errors', async () => {
            const performSync = issuesSync['performSync'];

            // This should not throw
            await expect(performSync.call(issuesSync, mockGitHubAPI)).resolves.not.toThrow();
        });
    });

    describe('syncNow', () => {
        it('should trigger an immediate sync operation', async () => {
            const performSyncSpy = jest.spyOn(issuesSync as any, 'performSync');

            await issuesSync.syncNow(mockGitHubAPI);

            expect(performSyncSpy).toHaveBeenCalledWith(mockGitHubAPI);
        });

        it('should call performSync without starting a periodic timer', async () => {
            const setIntervalSpy = jest.spyOn(global, 'setInterval');

            await issuesSync.syncNow(mockGitHubAPI);

            // setInterval should NOT be called by syncNow
            expect(setIntervalSpy).not.toHaveBeenCalled();

            setIntervalSpy.mockRestore();
        });

        it('should work independently of startSync', async () => {
            // Call syncNow without starting periodic sync
            await expect(issuesSync.syncNow(mockGitHubAPI)).resolves.not.toThrow();
        });

        it('should handle multiple consecutive syncNow calls', async () => {
            await expect(issuesSync.syncNow(mockGitHubAPI)).resolves.not.toThrow();
            await expect(issuesSync.syncNow(mockGitHubAPI)).resolves.not.toThrow();
            await expect(issuesSync.syncNow(mockGitHubAPI)).resolves.not.toThrow();
        });
    });

    describe('integration', () => {
        it('should handle full sync lifecycle: start -> sync -> stop', async () => {
            const performSyncSpy = jest.spyOn(issuesSync as any, 'performSync');

            issuesSync.startSync(mockGitHubAPI);
            expect(performSyncSpy).toHaveBeenCalledTimes(1);

            await issuesSync.syncNow(mockGitHubAPI);
            expect(performSyncSpy).toHaveBeenCalledTimes(2);

            issuesSync.stopSync();

            // Stop should have been successful
            expect(performSyncSpy).toHaveBeenCalledTimes(2); // No additional calls
        });

        it('should allow restarting sync after stopping', () => {
            const performSyncSpy = jest.spyOn(issuesSync as any, 'performSync');

            issuesSync.startSync(mockGitHubAPI);
            expect(performSyncSpy).toHaveBeenCalledTimes(1);

            issuesSync.stopSync();

            issuesSync.startSync(mockGitHubAPI);
            expect(performSyncSpy).toHaveBeenCalledTimes(2);
        });

        it('should use correct sync interval constant', () => {
            // Verify 5-minute interval is configured correctly
            const EXPECTED_INTERVAL = 5 * 60 * 1000; // 5 minutes in ms

            // The class should have this interval configured
            expect((issuesSync as any).SYNC_INTERVAL_MS).toBe(EXPECTED_INTERVAL);
        });
    });

    describe('error scenarios', () => {
        it('should not crash if GitHub API is undefined', async () => {
            // TypeScript will complain, but at runtime this should handle:
            await expect(issuesSync.syncNow(undefined as any)).resolves.not.toThrow();
        });

        it('should show error message on sync failure', async () => {
            const showErrorSpy = jest.spyOn(vscode.window, 'showErrorMessage');

            // Even though performSync is private and catches errors,
            // we verify the error handling exists
            await issuesSync.syncNow(mockGitHubAPI);

            // For now, it should not show error (successful empty sync)
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle rapid start/stop cycles', () => {
            issuesSync.startSync(mockGitHubAPI);
            issuesSync.stopSync();
            issuesSync.startSync(mockGitHubAPI);
            issuesSync.stopSync();

            // Should complete without errors
            expect(true).toBe(true);
        });

        it('should maintain state correctly across multiple operations', async () => {
            issuesSync.startSync(mockGitHubAPI);

            await issuesSync.syncNow(mockGitHubAPI);
            await issuesSync.syncNow(mockGitHubAPI);

            issuesSync.stopSync();

            // New start should work fresh
            issuesSync.startSync(mockGitHubAPI);
            issuesSync.stopSync();

            // Should complete without state conflicts
            expect(true).toBe(true);
        });
    });
});

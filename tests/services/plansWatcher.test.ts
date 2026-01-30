/**
 * Tests for PlansFileWatcher
 * 
 * Comprehensive test suite covering:
 * - File watcher initialization
 * - Debouncing file changes
 * - PRD auto-regeneration
 * - File filtering (ignore PRD, backups, ipynb)
 * - Error handling
 */

import * as vscode from 'vscode';
import { PlansFileWatcher } from '../../src/services/plansWatcher';
import { PRDGenerator } from '../../src/services/prdGenerator';

// Mock vscode module
jest.mock('vscode');

// Mock PRDGenerator
jest.mock('../../src/services/prdGenerator', () => ({
    PRDGenerator: {
        generate: jest.fn()
    }
}));

// Helper to create mock URI
const createMockUri = (fsPath: string): vscode.Uri => ({
    fsPath,
    scheme: 'file',
    authority: '',
    path: fsPath,
    query: '',
    fragment: '',
    with: jest.fn(),
    toJSON: jest.fn(),
    toString: jest.fn(() => fsPath),
} as any);

describe('PlansFileWatcher', () => {
    let mockContext: vscode.ExtensionContext;
    let mockWatcher: vscode.FileSystemWatcher;
    let mockOutputChannel: vscode.OutputChannel;
    let onDidChangeCallback: ((uri: vscode.Uri) => void) | null = null;
    let onDidCreateCallback: ((uri: vscode.Uri) => void) | null = null;
    let onDidDeleteCallback: ((uri: vscode.Uri) => void) | null = null;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Reset callbacks
        onDidChangeCallback = null;
        onDidCreateCallback = null;
        onDidDeleteCallback = null;

        // Mock output channel
        mockOutputChannel = {
            appendLine: jest.fn(),
            append: jest.fn(),
            clear: jest.fn(),
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn(),
            name: 'Test Output',
            replace: jest.fn(),
        } as any;

        // Mock file system watcher
        mockWatcher = {
            onDidChange: jest.fn((callback, thisArgs, subscriptions) => {
                onDidChangeCallback = callback;
                return { dispose: jest.fn() };
            }),
            onDidCreate: jest.fn((callback, thisArgs, subscriptions) => {
                onDidCreateCallback = callback;
                return { dispose: jest.fn() };
            }),
            onDidDelete: jest.fn((callback, thisArgs, subscriptions) => {
                onDidDeleteCallback = callback;
                return { dispose: jest.fn() };
            }),
            dispose: jest.fn(),
        } as any;

        // Mock context
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: jest.fn(),
                update: jest.fn(),
                keys: jest.fn(() => []),
            },
            globalState: {
                get: jest.fn(),
                update: jest.fn(),
                keys: jest.fn(() => []),
                setKeysForSync: jest.fn(),
            },
            extensionPath: '/mock/path',
            extensionUri: createMockUri('/mock/path'),
            extensionMode: 3,
            storageUri: createMockUri('/mock/storage'),
            globalStorageUri: createMockUri('/mock/global'),
            logUri: createMockUri('/mock/log'),
            storagePath: '/mock/storage',
            globalStoragePath: '/mock/global',
            logPath: '/mock/log',
            asAbsolutePath: jest.fn((path) => `/mock/path/${path}`),
            environmentVariableCollection: {} as any,
            secrets: {} as any,
            extension: {} as any,
        } as any;

        // Mock vscode.Uri.file
        (vscode.Uri.file as jest.Mock) = jest.fn((path: string) => createMockUri(path));

        // Mock workspace.createFileSystemWatcher
        (vscode.workspace.createFileSystemWatcher as jest.Mock) = jest.fn(() => mockWatcher);

        // Mock window.showInformationMessage
        (vscode.window.showInformationMessage as jest.Mock) = jest.fn(() => Promise.resolve(undefined));

        // Mock commands.executeCommand
        (vscode.commands.executeCommand as jest.Mock) = jest.fn();

        // Stop any existing watchers before each test
        PlansFileWatcher.stopWatching();
    });

    afterEach(() => {
        jest.useRealTimers();
        PlansFileWatcher.stopWatching();
    });

    describe('startWatching', () => {
        it('should create file watcher when autoRegenerate is true', () => {
            PlansFileWatcher.startWatching(mockContext, true, mockOutputChannel);

            expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledWith('**/Plans/**/*.md');
            expect(mockWatcher.onDidChange).toHaveBeenCalled();
            expect(mockWatcher.onDidCreate).toHaveBeenCalled();
            expect(mockWatcher.onDidDelete).toHaveBeenCalled();
            expect(mockContext.subscriptions).toContain(mockWatcher);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Plans/ folder watcher started')
            );
        });

        it('should not create file watcher when autoRegenerate is false', () => {
            PlansFileWatcher.startWatching(mockContext, false, mockOutputChannel);

            expect(vscode.workspace.createFileSystemWatcher).not.toHaveBeenCalled();
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Auto-regeneration disabled')
            );
        });

        it('should handle errors gracefully during watcher creation', () => {
            const error = new Error('Failed to create watcher');
            (vscode.workspace.createFileSystemWatcher as jest.Mock).mockImplementationOnce(() => {
                throw error;
            });

            PlansFileWatcher.startWatching(mockContext, true, mockOutputChannel);

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Failed to start Plans watcher')
            );
        });

        it('should work without output channel', () => {
            expect(() => {
                PlansFileWatcher.startWatching(mockContext, true);
            }).not.toThrow();

            expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalled();
        });
    });

    describe('stopWatching', () => {
        it('should dispose watcher and clear timer', () => {
            PlansFileWatcher.startWatching(mockContext, true, mockOutputChannel);
            PlansFileWatcher.stopWatching();

            expect(mockWatcher.dispose).toHaveBeenCalled();

            const status = PlansFileWatcher.getStatus();
            expect(status.isWatching).toBe(false);
        });

        it('should handle stopping when not watching', () => {
            expect(() => {
                PlansFileWatcher.stopWatching();
            }).not.toThrow();
        });
    });

    describe('file change handling', () => {
        beforeEach(() => {
            PlansFileWatcher.startWatching(mockContext, true, mockOutputChannel);
        });

        it('should ignore changes to PRD.md', () => {
            const uri = createMockUri('c:/test/Plans/PRD.md');
            onDidChangeCallback?.(uri);

            jest.advanceTimersByTime(6000);

            expect(PRDGenerator.generate).not.toHaveBeenCalled();
        });

        it('should ignore changes to PRD.json', () => {
            const uri = createMockUri('c:/test/Plans/PRD.json');
            onDidChangeCallback?.(uri);

            jest.advanceTimersByTime(6000);

            expect(PRDGenerator.generate).not.toHaveBeenCalled();
        });

        it('should ignore changes to .backup files', () => {
            const uri = createMockUri('c:/test/Plans/file.backup');
            onDidChangeCallback?.(uri);

            jest.advanceTimersByTime(6000);

            expect(PRDGenerator.generate).not.toHaveBeenCalled();
        });

        it('should ignore changes to .ipynb files', () => {
            const uri = createMockUri('c:/test/Plans/PRD.ipynb');
            onDidChangeCallback?.(uri);

            jest.advanceTimersByTime(6000);

            expect(PRDGenerator.generate).not.toHaveBeenCalled();
        });

        it('should process valid file changes', () => {
            const uri = createMockUri('c:/test/Plans/CONSOLIDATED-MASTER-PLAN.md');

            (PRDGenerator.generate as jest.Mock).mockResolvedValue({
                success: true,
                mdPath: '/test/PRD.md',
                jsonPath: '/test/PRD.json',
                duration: 1000,
            });

            onDidChangeCallback?.(uri);

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Plans/ change detected: change')
            );

            // Advance timer past debounce
            jest.advanceTimersByTime(6000);

            expect(PRDGenerator.generate).toHaveBeenCalled();
        });

        it('should process file creates', () => {
            const uri = createMockUri('c:/test/Plans/NEW-FILE.md');

            (PRDGenerator.generate as jest.Mock).mockResolvedValue({
                success: true,
            });

            onDidCreateCallback?.(uri);

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Plans/ change detected: create')
            );

            jest.advanceTimersByTime(6000);

            expect(PRDGenerator.generate).toHaveBeenCalled();
        });

        it('should process file deletes', () => {
            const uri = createMockUri('c:/test/Plans/OLD-FILE.md');

            (PRDGenerator.generate as jest.Mock).mockResolvedValue({
                success: true,
            });

            onDidDeleteCallback?.(uri);

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Plans/ change detected: delete')
            );

            jest.advanceTimersByTime(6000);

            expect(PRDGenerator.generate).toHaveBeenCalled();
        });
    });

    describe('debouncing', () => {
        beforeEach(() => {
            PlansFileWatcher.startWatching(mockContext, true, mockOutputChannel);
        });

        it('should debounce rapid file changes', async () => {
            const uri1 = createMockUri('c:/test/Plans/file1.md');
            const uri2 = createMockUri('c:/test/Plans/file2.md');
            const uri3 = createMockUri('c:/test/Plans/file3.md');

            (PRDGenerator.generate as jest.Mock).mockResolvedValue({
                success: true,
            });

            // Trigger multiple changes rapidly
            onDidChangeCallback?.(uri1);
            jest.advanceTimersByTime(1000);
            onDidChangeCallback?.(uri2);
            jest.advanceTimersByTime(1000);
            onDidChangeCallback?.(uri3);
            jest.advanceTimersByTime(1000);

            // Should not have called generate yet
            expect(PRDGenerator.generate).not.toHaveBeenCalled();

            // Advance past debounce period and run all pending timers
            await jest.runAllTimersAsync();

            // Should only call generate once
            expect(PRDGenerator.generate).toHaveBeenCalledTimes(1);
        });

        it('should reset debounce timer on new changes', async () => {
            const uri = createMockUri('c:/test/Plans/file.md');

            (PRDGenerator.generate as jest.Mock).mockResolvedValue({
                success: true,
            });

            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(3000);

            // Trigger another change before debounce completes
            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(3000);

            expect(PRDGenerator.generate).not.toHaveBeenCalled();

            // Complete debounce
            jest.advanceTimersByTime(2000);
            await Promise.resolve(); // Flush promises

            expect(PRDGenerator.generate).toHaveBeenCalledTimes(1);
        });
    });

    describe('PRD regeneration', () => {
        beforeEach(() => {
            PlansFileWatcher.startWatching(mockContext, true, mockOutputChannel);
        });

        it('should trigger successful regeneration', async () => {
            const uri = createMockUri('c:/test/Plans/test.md');
            const mockMdUri = createMockUri('/test/PRD.md');

            (PRDGenerator.generate as jest.Mock).mockResolvedValue({
                success: true,
                mdPath: '/test/PRD.md',
                jsonPath: '/test/PRD.json',
                mdUri: mockMdUri,
                duration: 1234,
            });

            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(6000);

            // Wait for async operations
            await Promise.resolve();
            await Promise.resolve();

            expect(PRDGenerator.generate).toHaveBeenCalledWith(
                { tokenLimit: 4000, retryOnFailure: true },
                expect.any(Function),
                mockOutputChannel
            );

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('PRD auto-regenerated successfully')
            );

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('PRD auto-regenerated'),
                'Open PRD.md'
            );
        });

        it('should handle regeneration failure', async () => {
            const uri = createMockUri('c:/test/Plans/test.md');

            (PRDGenerator.generate as jest.Mock).mockResolvedValue({
                success: false,
                message: 'Generation failed',
            });

            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(6000);

            await Promise.resolve();
            await Promise.resolve();

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Auto-regeneration failed')
            );
        });

        it('should handle regeneration with warning', async () => {
            const uri = createMockUri('c:/test/Plans/test.md');

            (PRDGenerator.generate as jest.Mock).mockResolvedValue({
                success: true,
                mdPath: '/test/PRD.md',
                warning: 'Token limit exceeded',
            });

            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(6000);

            await Promise.resolve();
            await Promise.resolve();

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Token limit exceeded')
            );
        });

        it('should handle regeneration errors', async () => {
            const uri = createMockUri('c:/test/Plans/test.md');
            const error = new Error('Unexpected error');

            (PRDGenerator.generate as jest.Mock).mockRejectedValue(error);

            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(6000);

            await Promise.resolve();
            await Promise.resolve();

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Error during auto-regeneration')
            );
        });

        it('should prevent concurrent regenerations', async () => {
            const uri = createMockUri('c:/test/Plans/test.md');

            let resolveGenerate: (value: any) => void;
            const generatePromise = new Promise((resolve) => {
                resolveGenerate = resolve;
            });

            (PRDGenerator.generate as jest.Mock).mockReturnValue(generatePromise);

            // Trigger first regeneration
            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(6000);
            await Promise.resolve();

            // Trigger second regeneration while first is in progress
            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(6000);
            await Promise.resolve();

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('regeneration already in progress')
            );

            // Only one call to generate
            expect(PRDGenerator.generate).toHaveBeenCalledTimes(1);

            // Resolve the first generation
            resolveGenerate!({ success: true });
            await Promise.resolve();
        });

        it('should call status callback during generation', async () => {
            const uri = createMockUri('c:/test/Plans/test.md');
            let capturedCallback: ((status: string) => void) | undefined;

            (PRDGenerator.generate as jest.Mock).mockImplementation((options, callback, output) => {
                capturedCallback = callback;
                return Promise.resolve({ success: true });
            });

            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(6000);
            await Promise.resolve();

            expect(capturedCallback).toBeDefined();

            // Simulate status updates
            capturedCallback?.('Reading Plans/...');
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('Reading Plans/...');
        });

        it('should open PRD.md when user clicks notification button', async () => {
            const uri = createMockUri('c:/test/Plans/test.md');
            const mockMdUri = createMockUri('/test/PRD.md');

            (PRDGenerator.generate as jest.Mock).mockResolvedValue({
                success: true,
                mdUri: mockMdUri,
            });

            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue('Open PRD.md');
            (vscode.commands.executeCommand as jest.Mock) = jest.fn();

            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(6000);

            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('vscode.open', mockMdUri);
        });

        it('should not open PRD.md when user dismisses notification', async () => {
            const uri = createMockUri('c:/test/Plans/test.md');

            (PRDGenerator.generate as jest.Mock).mockResolvedValue({
                success: true,
            });

            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
            (vscode.commands.executeCommand as jest.Mock) = jest.fn();

            onDidChangeCallback?.(uri);
            jest.advanceTimersByTime(6000);

            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
        });
    });

    describe('getStatus', () => {
        it('should return correct status when not watching', () => {
            const status = PlansFileWatcher.getStatus();

            expect(status.isWatching).toBe(false);
            expect(status.isRegenerating).toBe(false);
            expect(status.debouncePending).toBe(false);
        });

        it('should return correct status when watching', () => {
            PlansFileWatcher.startWatching(mockContext, true, mockOutputChannel);

            const status = PlansFileWatcher.getStatus();

            expect(status.isWatching).toBe(true);
            expect(status.isRegenerating).toBe(false);
            expect(status.debouncePending).toBe(false);
        });

        it('should return correct status when debounce is pending', () => {
            PlansFileWatcher.startWatching(mockContext, true, mockOutputChannel);

            const uri = createMockUri('c:/test/Plans/test.md');
            onDidChangeCallback?.(uri);

            const status = PlansFileWatcher.getStatus();

            expect(status.isWatching).toBe(true);
            expect(status.isRegenerating).toBe(false);
            expect(status.debouncePending).toBe(true);
        });

        it('should return correct status during regeneration', async () => {
            PlansFileWatcher.startWatching(mockContext, true, mockOutputChannel);

            const uri = createMockUri('c:/test/Plans/test.md');

            let resolveGenerate: (value: any) => void;
            const generatePromise = new Promise((resolve) => {
                resolveGenerate = resolve;
            });

            (PRDGenerator.generate as jest.Mock).mockReturnValue(generatePromise);

            onDidChangeCallback?.(uri);

            // Advance past debounce period to trigger regeneration
            jest.advanceTimersByTime(6000);

            // Run timers and flush microtasks
            await jest.runOnlyPendingTimersAsync();

            const status = PlansFileWatcher.getStatus();

            expect(status.isWatching).toBe(true);
            expect(status.isRegenerating).toBe(true);
            expect(status.debouncePending).toBe(false);

            // Clean up
            resolveGenerate!({ success: true });
            await Promise.resolve();
        });
    });
});

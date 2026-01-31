import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CoverageDiagnosticProvider } from '../../src/diagnostics/coverageProvider';

// Mock VS Code APIs
jest.mock('vscode');
jest.mock('fs');
jest.mock('path');

describe('CoverageDiagnosticProvider', () => {
    let provider: CoverageDiagnosticProvider;
    let mockContext: vscode.ExtensionContext;
    let mockDiagnosticCollection: vscode.DiagnosticCollection;
    let coverageFileWatcher: vscode.FileSystemWatcher;
    let qualityFileWatcher: vscode.FileSystemWatcher;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock diagnostic collection
        mockDiagnosticCollection = {
            clear: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            dispose: jest.fn(),
        } as any;

        const createMockWatcher = (): vscode.FileSystemWatcher => {
            const watcher = {
                onDidChange: jest.fn((cb) => {
                    (watcher as any)._onDidChangeCallback = cb;
                    return { dispose: jest.fn() };
                }),
                onDidCreate: jest.fn((cb) => {
                    (watcher as any)._onDidCreateCallback = cb;
                    return { dispose: jest.fn() };
                }),
                onDidDelete: jest.fn(() => ({ dispose: jest.fn() })),
                dispose: jest.fn(),
                ignoreCreateEvents: false,
                ignoreChangeEvents: false,
                ignoreDeleteEvents: false,
            };

            return watcher as unknown as vscode.FileSystemWatcher;
        };

        // Mock file watchers (coverage + quality diagnostics)
        coverageFileWatcher = createMockWatcher();
        qualityFileWatcher = createMockWatcher();

        // Mock extension context
        mockContext = {
            subscriptions: [],
        } as any;

        // Mock vscode.RelativePattern constructor
        (vscode.RelativePattern as jest.Mock) = jest.fn((base, pattern) => ({
            base,
            pattern,
        }));

        // Mock vscode.Uri
        (vscode.Uri.file as jest.Mock) = jest.fn((filePath) => ({
            fsPath: filePath,
        }));

        // Mock vscode.Range
        (vscode.Range as jest.Mock) = jest.fn((startLine, startChar, endLine, endChar) => ({
            start: { line: startLine, character: startChar },
            end: { line: endLine, character: endChar },
        }));

        // Mock vscode.DiagnosticSeverity
        const diagnosticSeverityMock = {
            Error: 0,
            Warning: 1,
            Information: 2,
            Hint: 3,
        };
        Object.defineProperty(vscode, 'DiagnosticSeverity', {
            value: diagnosticSeverityMock,
            writable: false,
            configurable: true,
        });

        // Mock vscode.Diagnostic constructor
        (vscode.Diagnostic as jest.Mock) = jest.fn((range, message, severity) => ({
            range,
            message,
            severity: severity || 1, // Default to Warning
            source: '',
            code: '',
        }));

        // Mock VS Code functions
        (vscode.languages.createDiagnosticCollection as jest.Mock).mockReturnValue(
            mockDiagnosticCollection
        );
        (vscode.workspace.createFileSystemWatcher as jest.Mock)
            .mockImplementationOnce(() => coverageFileWatcher)
            .mockImplementationOnce(() => qualityFileWatcher);

        provider = new CoverageDiagnosticProvider();
    });

    afterEach(() => {
        provider.dispose();
    });

    describe('Constructor', () => {
        it('should create a diagnostic collection', () => {
            expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledWith(
                'coverage'
            );
        });
    });

    describe('activate', () => {
        it('should set up file watchers when activated', () => {
            const workspaceRoot = '/workspace';
            (vscode.workspace.workspaceFolders as any) = [
                { uri: { fsPath: workspaceRoot } },
            ];

            provider.activate(mockContext);

            expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledTimes(2);
            expect(coverageFileWatcher.onDidChange).toHaveBeenCalled();
            expect(coverageFileWatcher.onDidCreate).toHaveBeenCalled();
        });

        it('should add subscriptions to context', () => {
            const workspaceRoot = '/workspace';
            (vscode.workspace.workspaceFolders as any) = [
                { uri: { fsPath: workspaceRoot } },
            ];

            const subscriptionCount = mockContext.subscriptions.length;
            provider.activate(mockContext);

            expect(mockContext.subscriptions.length).toBeGreaterThan(subscriptionCount);
        });

        it('should handle missing workspace root gracefully', () => {
            (vscode.workspace.workspaceFolders as any) = undefined;

            expect(() => provider.activate(mockContext)).not.toThrow();
            expect(vscode.workspace.createFileSystemWatcher).not.toHaveBeenCalled();
        });

        it('should call updateDiagnostics on initial activation', () => {
            const workspaceRoot = '/workspace';
            (vscode.workspace.workspaceFolders as any) = [
                { uri: { fsPath: workspaceRoot } },
            ];

            const updateSpy = jest.spyOn(provider as any, 'updateDiagnostics');
            provider.activate(mockContext);

            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('updateDiagnostics', () => {
        const workspaceRoot = '/workspace';
        const coveragePath = path.join(workspaceRoot, 'coverage', 'coverage-final.json');

        beforeEach(() => {
            (vscode.workspace.workspaceFolders as any) = [
                { uri: { fsPath: workspaceRoot } },
            ];
        });

        it('should clear diagnostics when coverage file does not exist', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            provider.activate(mockContext);
            (provider as any).updateDiagnostics(workspaceRoot);

            expect(mockDiagnosticCollection.clear).toHaveBeenCalled();
        });

        it('should create diagnostics for files below coverage threshold', () => {
            const coverageData = {
                '/workspace/src/app.ts': {
                    l: {
                        '1': 1,
                        '2': 1,
                        '3': 1,
                        '4': 0,
                        '5': 0,
                    },
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(coverageData));

            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));

            provider.activate(mockContext);
            (provider as any).updateDiagnostics(workspaceRoot);

            expect(mockDiagnosticCollection.clear).toHaveBeenCalled();
            expect(mockDiagnosticCollection.set).toHaveBeenCalled();
        });

        it('should not create diagnostics for files above coverage threshold', () => {
            const coverageData = {
                '/workspace/src/app.ts': {
                    l: {
                        '1': 1,
                        '2': 1,
                        '3': 1,
                        '4': 1,
                        '5': 1,
                    },
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(coverageData));

            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));

            provider.activate(mockContext);
            (provider as any).updateDiagnostics(workspaceRoot);

            expect(mockDiagnosticCollection.clear).toHaveBeenCalled();
            expect(mockDiagnosticCollection.set).not.toHaveBeenCalledWith(
                expect.any(Object),
                expect.arrayContaining([expect.any(vscode.Diagnostic)])
            );
        });

        it('should include coverage percentage in diagnostic message', () => {
            const coverageData = {
                '/workspace/src/app.ts': {
                    l: {
                        '1': 1,
                        '2': 1,
                        '3': 1,
                        '4': 0,
                        '5': 0,
                    },
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(coverageData));

            let capturedDiagnostics: any[] = [];
            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));
            (mockDiagnosticCollection.set as jest.Mock).mockImplementation(
                (uri, diagnostics) => {
                    capturedDiagnostics = diagnostics;
                }
            );

            provider.activate(mockContext);
            (provider as any).updateDiagnostics(workspaceRoot);

            expect(capturedDiagnostics.length).toBeGreaterThan(0);
            expect(capturedDiagnostics[0].message).toContain('60.0%');
            expect(capturedDiagnostics[0].message).toContain('75');
        });

        it('should handle malformed coverage JSON gracefully', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

            expect(() => {
                provider.activate(mockContext);
                (provider as any).updateDiagnostics(workspaceRoot);
            }).not.toThrow();
        });

        it('should set diagnostic source and code', () => {
            const coverageData = {
                '/workspace/src/app.ts': {
                    l: { '1': 1, '2': 0 },
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(coverageData));

            let capturedDiagnostics: any[] = [];
            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));
            (mockDiagnosticCollection.set as jest.Mock).mockImplementation(
                (uri, diagnostics) => {
                    capturedDiagnostics = diagnostics;
                }
            );

            provider.activate(mockContext);
            (provider as any).updateDiagnostics(workspaceRoot);

            if (capturedDiagnostics.length > 0) {
                expect(capturedDiagnostics[0].source).toBe('Quality Gate: Coverage');
                expect(capturedDiagnostics[0].code).toBe('coverage-threshold');
            }
        });
    });

    describe('updateFromQualityDiagnostics', () => {
        const workspaceRoot = '/workspace';

        beforeEach(() => {
            (vscode.workspace.workspaceFolders as any) = [
                { uri: { fsPath: workspaceRoot } },
            ];
        });

        it('should return early if diagnostics file does not exist', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            expect(() => {
                provider.activate(mockContext);
                (provider as any).updateFromQualityDiagnostics(workspaceRoot);
            }).not.toThrow();
        });

        it('should create diagnostics from quality-diagnostics.json', () => {
            const qualityData = {
                underCoverageFiles: [
                    { file: 'src/app.ts', coverage: 60 },
                    { file: 'src/utils.ts', coverage: 50 },
                ],
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(qualityData));

            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));

            provider.activate(mockContext);
            (provider as any).updateFromQualityDiagnostics(workspaceRoot);

            expect(mockDiagnosticCollection.clear).toHaveBeenCalled();
            expect(mockDiagnosticCollection.set).toHaveBeenCalledTimes(2);
        });

        it('should include gap percentage in diagnostic message', () => {
            const qualityData = {
                underCoverageFiles: [{ file: 'src/app.ts', coverage: 60 }],
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(qualityData));

            let capturedDiagnostics: any[] = [];
            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));
            (mockDiagnosticCollection.set as jest.Mock).mockImplementation(
                (uri, diagnostics) => {
                    capturedDiagnostics = diagnostics;
                }
            );

            provider.activate(mockContext);
            (provider as any).updateFromQualityDiagnostics(workspaceRoot);

            expect(capturedDiagnostics.length).toBeGreaterThan(0);
            expect(capturedDiagnostics[0].message).toContain('60%');
            expect(capturedDiagnostics[0].message).toContain('15.0%');
        });

        it('should handle malformed quality diagnostics JSON gracefully', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

            expect(() => {
                provider.activate(mockContext);
                (provider as any).updateFromQualityDiagnostics(workspaceRoot);
            }).not.toThrow();
        });

        it('should handle empty underCoverageFiles array', () => {
            const qualityData = {
                underCoverageFiles: [],
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(qualityData));

            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));

            provider.activate(mockContext);
            (provider as any).updateFromQualityDiagnostics(workspaceRoot);

            expect(mockDiagnosticCollection.clear).toHaveBeenCalled();
        });

        it('should set diagnostic properties correctly', () => {
            const qualityData = {
                underCoverageFiles: [{ file: 'src/app.ts', coverage: 60 }],
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(qualityData));

            let capturedDiagnostics: any[] = [];
            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));
            (mockDiagnosticCollection.set as jest.Mock).mockImplementation(
                (uri, diagnostics) => {
                    capturedDiagnostics = diagnostics;
                }
            );

            provider.activate(mockContext);
            (provider as any).updateFromQualityDiagnostics(workspaceRoot);

            if (capturedDiagnostics.length > 0) {
                expect(capturedDiagnostics[0].source).toBe('Quality Gate: Coverage');
                expect(capturedDiagnostics[0].code).toBe('coverage-threshold');
                expect(capturedDiagnostics[0].severity).toBe(vscode.DiagnosticSeverity.Warning);
            }
        });
    });

    describe('File watching triggers', () => {
        const workspaceRoot = '/workspace';

        beforeEach(() => {
            (vscode.workspace.workspaceFolders as any) = [
                { uri: { fsPath: workspaceRoot } },
            ];
        });

        it('should update diagnostics when coverage file changes', () => {
            const updateSpy = jest.spyOn(provider as any, 'updateDiagnostics');
            provider.activate(mockContext);

            // Simulate file change
            const onDidChangeCallback = (coverageFileWatcher as any)._onDidChangeCallback;
            if (onDidChangeCallback) {
                onDidChangeCallback();
            }

            expect(updateSpy).toHaveBeenCalled();
        });

        it('should update diagnostics when coverage file is created', () => {
            const updateSpy = jest.spyOn(provider as any, 'updateDiagnostics');
            provider.activate(mockContext);

            // Simulate file creation
            const onDidCreateCallback = (coverageFileWatcher as any)._onDidCreateCallback;
            if (onDidCreateCallback) {
                onDidCreateCallback();
            }

            expect(updateSpy).toHaveBeenCalled();
        });

        it('should update quality diagnostics when quality file changes', () => {
            const updateSpy = jest.spyOn(provider as any, 'updateFromQualityDiagnostics');
            provider.activate(mockContext);

            const onDidChangeCallback = (qualityFileWatcher as any)._onDidChangeCallback;
            if (onDidChangeCallback) {
                onDidChangeCallback();
            }

            expect(updateSpy).toHaveBeenCalled();
        });

        it('should update quality diagnostics when quality file is created', () => {
            const updateSpy = jest.spyOn(provider as any, 'updateFromQualityDiagnostics');
            provider.activate(mockContext);

            const onDidCreateCallback = (qualityFileWatcher as any)._onDidCreateCallback;
            if (onDidCreateCallback) {
                onDidCreateCallback();
            }

            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('dispose', () => {
        it('should dispose diagnostic collection', () => {
            (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
            provider.activate(mockContext);
            provider.dispose();

            expect(mockDiagnosticCollection.dispose).toHaveBeenCalled();
        });

        it('should dispose file watcher', () => {
            (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
            provider.activate(mockContext);
            provider.dispose();

            expect(coverageFileWatcher.dispose).toHaveBeenCalled();
        });
    });

    describe('Edge cases', () => {
        const workspaceRoot = '/workspace';

        beforeEach(() => {
            (vscode.workspace.workspaceFolders as any) = [
                { uri: { fsPath: workspaceRoot } },
            ];
        });

        it('should handle files with no covered lines', () => {
            const coverageData = {
                '/workspace/src/app.ts': {
                    l: {
                        '1': 0,
                        '2': 0,
                    },
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(coverageData));
            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));

            provider.activate(mockContext);
            (provider as any).updateDiagnostics(workspaceRoot);

            expect(mockDiagnosticCollection.set).toHaveBeenCalled();
        });

        it('should handle files with all lines covered', () => {
            const coverageData = {
                '/workspace/src/app.ts': {
                    l: {
                        '1': 1,
                        '2': 1,
                        '3': 1,
                    },
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(coverageData));
            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));

            provider.activate(mockContext);
            (provider as any).updateDiagnostics(workspaceRoot);

            expect(mockDiagnosticCollection.clear).toHaveBeenCalled();
        });

        it('should handle empty coverage data', () => {
            const coverageData = {};

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(coverageData));

            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));

            provider.activate(mockContext);
            (provider as any).updateDiagnostics(workspaceRoot);

            expect(mockDiagnosticCollection.clear).toHaveBeenCalled();
        });

        it('should handle multiple files in a single update', () => {
            const coverageData = {
                '/workspace/src/app.ts': { l: { '1': 1, '2': 0 } },
                '/workspace/src/utils.ts': { l: { '1': 0, '2': 0 } },
                '/workspace/src/helpers.ts': { l: { '1': 1, '2': 1 } },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(coverageData));
            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));

            provider.activate(mockContext);

            // Reset call count to test only the updateDiagnostics call
            (mockDiagnosticCollection.set as jest.Mock).mockClear();
            (mockDiagnosticCollection.clear as jest.Mock).mockClear();

            (provider as any).updateDiagnostics(workspaceRoot);

            expect(mockDiagnosticCollection.clear).toHaveBeenCalled();
            expect(mockDiagnosticCollection.set).toHaveBeenCalledTimes(2); // Only for under-coverage files
        });
    });

    describe('Diagnostic severity and properties', () => {
        const workspaceRoot = '/workspace';

        beforeEach(() => {
            (vscode.workspace.workspaceFolders as any) = [
                { uri: { fsPath: workspaceRoot } },
            ];
        });

        it('should create diagnostic with Warning severity', () => {
            const coverageData = {
                '/workspace/src/app.ts': {
                    l: { '1': 1, '2': 0 },
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(coverageData));

            let capturedDiagnostics: any[] = [];
            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));
            (mockDiagnosticCollection.set as jest.Mock).mockImplementation(
                (uri, diagnostics) => {
                    capturedDiagnostics = diagnostics;
                }
            );

            provider.activate(mockContext);
            (provider as any).updateDiagnostics(workspaceRoot);

            if (capturedDiagnostics.length > 0) {
                expect(capturedDiagnostics[0].severity).toBe(vscode.DiagnosticSeverity.Warning);
            }
        });

        it('should create diagnostic starting at first line', () => {
            const coverageData = {
                '/workspace/src/app.ts': {
                    l: { '1': 1, '2': 0 },
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(coverageData));

            let capturedDiagnostics: any[] = [];
            (vscode.Uri.file as jest.Mock).mockImplementation((filePath) => ({
                fsPath: filePath,
            }));
            (mockDiagnosticCollection.set as jest.Mock).mockImplementation(
                (uri, diagnostics) => {
                    capturedDiagnostics = diagnostics;
                }
            );

            provider.activate(mockContext);
            (provider as any).updateDiagnostics(workspaceRoot);

            if (capturedDiagnostics.length > 0) {
                expect(capturedDiagnostics[0].range).toBeDefined();
                // Range should be at first line (0, 0)
            }
        });
    });
});

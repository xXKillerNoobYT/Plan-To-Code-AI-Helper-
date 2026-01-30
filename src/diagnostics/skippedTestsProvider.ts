import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Diagnostic provider that scans test files for .skip, .only, .pending patterns
 * and reports them to the VS Code Problems panel in real-time.
 */
export class SkippedTestsDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private documentChangeListener: vscode.Disposable | undefined;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('skipped-tests');
    }

    /**
     * Activate the skipped tests provider
     */
    public activate(context: vscode.ExtensionContext): void {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            return;
        }

        // Watch for test file changes
        const testFilePattern = new vscode.RelativePattern(
            workspaceRoot,
            '**/*.{test,spec}.ts'
        );

        this.fileWatcher = vscode.workspace.createFileSystemWatcher(testFilePattern);

        this.fileWatcher.onDidChange((uri) => this.updateFileSync(uri));
        this.fileWatcher.onDidCreate((uri) => this.updateFileSync(uri));
        this.fileWatcher.onDidDelete((uri) => this.diagnosticCollection.delete(uri));

        // Listen to document changes for real-time updates
        this.documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
            const uri = event.document.uri;
            if (uri.fsPath.match(/\.(test|spec)\.ts$/)) {
                this.updateFileAsync(event.document);
            }
        });

        // Listen to document opens
        const documentOpenListener = vscode.workspace.onDidOpenTextDocument((document) => {
            if (document.uri.fsPath.match(/\.(test|spec)\.ts$/)) {
                this.updateFileAsync(document);
            }
        });

        context.subscriptions.push(
            this.fileWatcher,
            this.diagnosticCollection,
            this.documentChangeListener,
            documentOpenListener
        );

        // Scan all open test files initially
        for (const document of vscode.workspace.textDocuments) {
            if (document.uri.fsPath.match(/\.(test|spec)\.ts$/)) {
                this.updateFileAsync(document);
            }
        }

        // Also watch quality-diagnostics.json for batch updates
        const qualityDiagnosticsPattern = new vscode.RelativePattern(
            workspaceRoot,
            '.vscode/quality-diagnostics.json'
        );

        const qualityWatcher = vscode.workspace.createFileSystemWatcher(qualityDiagnosticsPattern);
        qualityWatcher.onDidChange(() => this.updateFromQualityDiagnostics(workspaceRoot));
        qualityWatcher.onDidCreate(() => this.updateFromQualityDiagnostics(workspaceRoot));

        context.subscriptions.push(qualityWatcher);

        // Initial update from quality diagnostics
        this.updateFromQualityDiagnostics(workspaceRoot);
    }

    /**
     * Update diagnostics for a file synchronously (from file system)
     */
    private updateFileSync(uri: vscode.Uri): void {
        try {
            const content = fs.readFileSync(uri.fsPath, 'utf-8');
            const diagnostics = this.scanForSkippedTests(content, uri);
            this.diagnosticCollection.set(uri, diagnostics);
        } catch (error) {
            // eslint-disable-next-line no-empty
        }
    }

    /**
     * Update diagnostics for a file asynchronously (from open document)
     */
    private updateFileAsync(document: vscode.TextDocument): void {
        const diagnostics = this.scanForSkippedTests(document.getText(), document.uri);
        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    /**
     * Scan file content for skipped test patterns
     */
    private scanForSkippedTests(content: string, _uri: vscode.Uri): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = content.split('\n');

        const patterns = [
            { regex: /\b(describe|it|test)\.skip\s*\(/g, name: '.skip', severity: vscode.DiagnosticSeverity.Warning },
            { regex: /\b(describe|it|test)\.only\s*\(/g, name: '.only', severity: vscode.DiagnosticSeverity.Error },
            { regex: /\b(describe|it|test)\.pending\s*\(/g, name: '.pending', severity: vscode.DiagnosticSeverity.Information },
            { regex: /\bxdescribe\s*\(/g, name: 'xdescribe', severity: vscode.DiagnosticSeverity.Warning },
            { regex: /\bxit\s*\(/g, name: 'xit', severity: vscode.DiagnosticSeverity.Warning },
            { regex: /\bxtest\s*\(/g, name: 'xtest', severity: vscode.DiagnosticSeverity.Warning }
        ];

        lines.forEach((line, lineIndex) => {
            for (const { regex, name, severity } of patterns) {
                const matches = line.matchAll(regex);
                for (const match of matches) {
                    const startCol = match.index || 0;
                    const endCol = startCol + match[0].length;

                    const range = new vscode.Range(
                        lineIndex,
                        startCol,
                        lineIndex,
                        endCol
                    );

                    let message = '';
                    if (name === '.only') {
                        message = `Test is focused with ${name}. This will prevent other tests from running! Remove before committing.`;
                    } else if (name === '.skip' || name.startsWith('x')) {
                        message = `Test is skipped with ${name}. This test will not run in CI.`;
                    } else {
                        message = `Test is pending with ${name}.`;
                    }

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        message,
                        severity
                    );

                    diagnostic.source = 'Quality Gate: Tests';
                    diagnostic.code = `skipped-test-${name.replace('.', '')}`;

                    diagnostics.push(diagnostic);
                }
            }
        });

        return diagnostics;
    }

    /**
     * Update diagnostics from quality-diagnostics.json (generated by quality-gates.test.ts)
     */
    private updateFromQualityDiagnostics(workspaceRoot: string): void {
        const diagnosticsPath = path.join(workspaceRoot, '.vscode', 'quality-diagnostics.json');

        if (!fs.existsSync(diagnosticsPath)) {
            return;
        }

        try {
            const qualityData = JSON.parse(fs.readFileSync(diagnosticsPath, 'utf-8'));
            const skippedTests = qualityData.skippedTests || [];

            // Group by file
            const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();

            for (const { file, line, pattern, match } of skippedTests) {
                const fullPath = path.join(workspaceRoot, file);
                const _fileUri = vscode.Uri.file(fullPath);

                const severity = pattern === '.only'
                    ? vscode.DiagnosticSeverity.Error
                    : vscode.DiagnosticSeverity.Warning;

                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(line - 1, 0, line - 1, 200),
                    `Skipped test detected: ${pattern} - ${match}`,
                    severity
                );

                diagnostic.source = 'Quality Gate: Tests';
                diagnostic.code = `skipped-test-${pattern.replace('.', '')}`;

                if (!diagnosticsByFile.has(fullPath)) {
                    diagnosticsByFile.set(fullPath, []);
                }
                diagnosticsByFile.get(fullPath)!.push(diagnostic);
            }

            // Update diagnostics for each file
            for (const [filePath, fileDiagnostics] of diagnosticsByFile.entries()) {
                this.diagnosticCollection.set(vscode.Uri.file(filePath), fileDiagnostics);
            }

        } catch (error) {
            // eslint-disable-next-line no-empty
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.diagnosticCollection.dispose();
        this.fileWatcher?.dispose();
        this.documentChangeListener?.dispose();
    }
}



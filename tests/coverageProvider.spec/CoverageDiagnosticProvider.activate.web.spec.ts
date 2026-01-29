// ./coverageProvider.web.spec.ts
import { CoverageDiagnosticProvider } from '../../src/diagnostics/coverageProvider';
import * as vscode from 'vscode';

jest.mock('vscode', () => ({
    ...jest.requireActual('vscode'),
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
        createFileSystemWatcher: jest.fn(() => ({
            onDidChange: jest.fn(),
            onDidCreate: jest.fn(),
        })),
    },
    RelativePattern: jest.fn(),
}));

/** @aiContributed-2026-01-28 */
describe('CoverageDiagnosticProvider', () => {
    let provider: CoverageDiagnosticProvider;
    let context: vscode.ExtensionContext;

    beforeEach(() => {
        context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
        provider = new CoverageDiagnosticProvider();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /** @aiContributed-2026-01-28 */
    it('should activate and set up file watchers correctly', () => {
        const mockWorkspaceRoot = '/mock/workspace';
        const mockFileWatcher = {
            onDidChange: jest.fn(),
            onDidCreate: jest.fn(),
        };
        const mockQualityWatcher = {
            onDidChange: jest.fn(),
            onDidCreate: jest.fn(),
        };

        (vscode.workspace.createFileSystemWatcher as jest.Mock)
            .mockReturnValueOnce(mockFileWatcher)
            .mockReturnValueOnce(mockQualityWatcher);

        provider.activate(context);

        expect(vscode.RelativePattern).toHaveBeenCalledWith(
            mockWorkspaceRoot,
            'coverage/coverage-final.json'
        );
        expect(vscode.RelativePattern).toHaveBeenCalledWith(
            mockWorkspaceRoot,
            '.vscode/quality-diagnostics.json'
        );

        expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledTimes(2);
        expect(mockFileWatcher.onDidChange).toHaveBeenCalledTimes(1);
        expect(mockFileWatcher.onDidCreate).toHaveBeenCalledTimes(1);
        expect(mockQualityWatcher.onDidChange).toHaveBeenCalledTimes(1);
        expect(mockQualityWatcher.onDidCreate).toHaveBeenCalledTimes(1);

        expect(context.subscriptions).toContain(mockFileWatcher);
        expect(context.subscriptions).toContain(mockQualityWatcher);
    });

    /** @aiContributed-2026-01-28 */
    it('should not activate if no workspace folders are available', () => {
        (vscode.workspace.workspaceFolders as vscode.WorkspaceFolder[] | undefined) = undefined;

        provider.activate(context);

        expect(vscode.workspace.createFileSystemWatcher).not.toHaveBeenCalled();
        expect(context.subscriptions).toHaveLength(0);
    });
});
import * as vscode from 'vscode';
import { activate, deactivate } from './extension';
import { ProgrammingOrchestrator } from './orchestrator/programmingOrchestrator';

jest.mock('vscode', () => ({
    ...jest.requireActual('vscode'),
    window: {
        createOutputChannel: jest.fn(() => ({
            appendLine: jest.fn(),
            show: jest.fn(),
            dispose: jest.fn(),
        })),
        createStatusBarItem: jest.fn(() => ({
            text: '',
            tooltip: '',
            command: '',
            color: '',
            show: jest.fn(),
            dispose: jest.fn(),
        })),
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
    },
    commands: {
        registerCommand: jest.fn(),
    },
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
        createFileSystemWatcher: jest.fn(() => ({
            onDidChange: jest.fn(),
            onDidCreate: jest.fn(),
            onDidDelete: jest.fn(),
            dispose: jest.fn(),
        })),
        onDidSaveTextDocument: jest.fn(),
    },
}));

jest.mock('./orchestrator/programmingOrchestrator', () => {
    const originalModule = jest.requireActual('./orchestrator/programmingOrchestrator');
    return {
        ...originalModule,
        ProgrammingOrchestrator: jest.fn().mockImplementation(() => ({
            init: jest.fn().mockResolvedValue(undefined),
            addTask: jest.fn(),
            getNextTask: jest.fn(() => null),
            getQueueStatus: jest.fn(() => ({
                totalTasks: 0,
                byPriority: {},
                byStatus: {},
                currentTask: null,
                activeSessions: 0,
            })),
            shutdown: jest.fn().mockResolvedValue(undefined),
        })),
    };
});

describe('activate', () => {
    let context: vscode.ExtensionContext;

    beforeEach(() => {
        context = {
            subscriptions: [],
        } as unknown as vscode.ExtensionContext;
    });

    it('should initialize the extension successfully', async () => {
        await activate(context);

        expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('COE Orchestrator');
        expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
        expect(vscode.commands.registerCommand).toHaveBeenCalledWith('coe.activate', expect.any(Function));
        expect(vscode.commands.registerCommand).toHaveBeenCalledWith('coe.processNextTask', expect.any(Function));
    });

    it('should handle initialization errors gracefully', async () => {
        const errorMessage = 'Initialization failed';
        const mockInit = jest.fn().mockRejectedValueOnce(new Error(errorMessage));
        (ProgrammingOrchestrator as jest.Mock).mockImplementationOnce(() => ({
            init: mockInit,
            shutdown: jest.fn(),
        }));

        await activate(context);

        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(`❌ COE: Failed to activate extension: ${errorMessage}`);
    });
});

describe('deactivate', () => {
    it('should clean up resources on deactivation', async () => {
        const mockShutdown = jest.fn().mockResolvedValue(undefined);
        (ProgrammingOrchestrator as jest.Mock).mockImplementationOnce(() => ({
            shutdown: mockShutdown,
        }));

        await deactivate();

        expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('COE Orchestrator');
        expect(vscode.window.createOutputChannel).toHaveBeenCalledTimes(1);
        expect(vscode.window.createOutputChannel('COE Orchestrator').dispose).toHaveBeenCalled();
        expect(vscode.window.createStatusBarItem().dispose).toHaveBeenCalled();
    });
});
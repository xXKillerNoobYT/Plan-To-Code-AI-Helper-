import * as vscode from 'vscode';
import { activate } from '../../src/extension';
import { ProgrammingOrchestrator } from '../../src/orchestrator/programmingOrchestrator';

jest.mock('vscode', () => ({
    ...jest.requireActual('vscode'),
    window: {
        createOutputChannel: jest.fn(() => ({
            appendLine: jest.fn(),
            show: jest.fn(),
            dispose: jest.fn(),
        })),
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
    },
    commands: {
        registerCommand: jest.fn(),
    },
}));

jest.mock('../../src/orchestrator/programmingOrchestrator', () => {
    const originalModule = jest.requireActual('../../src/orchestrator/programmingOrchestrator');
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

/** @aiContributed-2026-01-24 */
describe('activate', () => {
    let context: vscode.ExtensionContext;

    beforeEach(() => {
        context = {
            subscriptions: [],
        } as unknown as vscode.ExtensionContext;
    });

    /** @aiContributed-2026-01-24 */
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
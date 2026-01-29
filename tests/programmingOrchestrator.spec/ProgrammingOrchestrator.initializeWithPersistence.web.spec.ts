// ./programmingOrchestrator.web.spec.ts
import { ProgrammingOrchestrator } from '../../src/orchestrator/programmingOrchestrator';
import * as vscode from 'vscode';

jest.mock('vscode', () => ({
    ...jest.requireActual('vscode'),
    Memento: jest.fn(),
}));

/** @aiContributed-2026-01-28 */
describe('ProgrammingOrchestrator - initializeWithPersistence', () => {
    let orchestrator: ProgrammingOrchestrator;
    let mockWorkspaceState: vscode.Memento;

    beforeEach(() => {
        mockWorkspaceState = {
            get: jest.fn(),
            update: jest.fn(),
        } as unknown as vscode.Memento;

        orchestrator = new ProgrammingOrchestrator();
    });

    /** @aiContributed-2026-01-28 */
    it('should set workspaceState and call loadPersistedTasks and reconcileTasks', async () => {
        const loadPersistedTasksSpy = jest.spyOn(
            orchestrator as unknown as { loadPersistedTasks: () => Promise<void> },
            'loadPersistedTasks'
        ).mockResolvedValue(undefined);

        const reconcileTasksSpy = jest.spyOn(
            orchestrator as unknown as { reconcileTasks: () => Promise<void> },
            'reconcileTasks'
        ).mockResolvedValue(undefined);

        await orchestrator.initializeWithPersistence(mockWorkspaceState);

        expect(orchestrator['workspaceState']).toBe(mockWorkspaceState);
        expect(loadPersistedTasksSpy).toHaveBeenCalledTimes(1);
        expect(reconcileTasksSpy).toHaveBeenCalledTimes(1);

        loadPersistedTasksSpy.mockRestore();
        reconcileTasksSpy.mockRestore();
    });
});
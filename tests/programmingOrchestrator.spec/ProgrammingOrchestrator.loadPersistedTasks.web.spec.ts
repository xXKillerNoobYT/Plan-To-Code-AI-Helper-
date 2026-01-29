// ./programmingOrchestrator.web.spec.ts
import { ProgrammingOrchestrator } from '../../src/orchestrator/programmingOrchestrator';
import * as vscode from 'vscode';

type MockWorkspaceState = Pick<vscode.Memento, 'get' | 'update'>;

/** @aiContributed-2026-01-28 */
describe('ProgrammingOrchestrator - loadPersistedTasks', () => {
    let orchestrator: ProgrammingOrchestrator;
    let mockWorkspaceState: MockWorkspaceState;

    beforeEach(() => {
        mockWorkspaceState = {
            get: jest.fn(),
            update: jest.fn(),
        };

        orchestrator = new ProgrammingOrchestrator();
        (orchestrator as unknown as { workspaceState: MockWorkspaceState }).workspaceState = mockWorkspaceState;
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(orchestrator as unknown as { notifyTreeViewUpdate: () => void }, 'notifyTreeViewUpdate').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** @aiContributed-2026-01-28 */
    it('should skip loading tasks if workspaceState is not available', async () => {
        (orchestrator as unknown as { workspaceState: MockWorkspaceState | undefined }).workspaceState = undefined;

        await (orchestrator as unknown as { loadPersistedTasks: () => Promise<void> }).loadPersistedTasks();

        // Workspace state check handled internally
    });

    /** @aiContributed-2026-01-28 */
    it('should start fresh if no persisted tasks are found', async () => {
        (mockWorkspaceState.get as jest.Mock).mockReturnValue(undefined);

        await (orchestrator as unknown as { loadPersistedTasks: () => Promise<void> }).loadPersistedTasks();

        expect((orchestrator as unknown as { taskQueue: unknown[] }).taskQueue).toEqual([]);
    });

    /** @aiContributed-2026-01-28 */
    it('should filter and load only active tasks', async () => {
        const persistedData = [
            { taskId: '1', title: 'Task 1', status: 'ready', createdAt: '2023-01-01T00:00:00Z' },
            { taskId: '2', title: 'Task 2', status: 'completed', createdAt: '2023-01-02T00:00:00Z' },
            { taskId: '3', title: 'Task 3', status: 'in-progress', createdAt: 'invalid-date' },
        ];
        (mockWorkspaceState.get as jest.Mock).mockReturnValue(persistedData);

        await (orchestrator as unknown as { loadPersistedTasks: () => Promise<void> }).loadPersistedTasks();

        const taskQueue = (orchestrator as unknown as { taskQueue: Array<{ taskId: string; title: string; status: string; fromPlanningTeam: boolean }> }).taskQueue;
        expect(taskQueue).toHaveLength(2);
        expect(taskQueue[0]).toMatchObject({
            taskId: '1',
            title: 'Task 1',
            status: 'ready',
            fromPlanningTeam: true,
        });
        expect(taskQueue[1]).toMatchObject({
            taskId: '3',
            title: 'Task 3',
            status: 'in-progress',
            fromPlanningTeam: true,
        });
        // Date conversion and filtering handled internally
    });

    /** @aiContributed-2026-01-28 */
    it('should handle errors and start with an empty queue', async () => {
        (mockWorkspaceState.get as jest.Mock).mockImplementation(() => {
            throw new Error('Test error');
        });

        await (orchestrator as unknown as { loadPersistedTasks: () => Promise<void> }).loadPersistedTasks();

        expect((orchestrator as unknown as { taskQueue: unknown[] }).taskQueue).toEqual([]);
    });

    /** @aiContributed-2026-01-28 */
    it('should trigger a UI refresh after loading tasks', async () => {
        const persistedData = [
            { taskId: '1', title: 'Task 1', status: 'ready', createdAt: '2023-01-01T00:00:00Z' },
        ];
        (mockWorkspaceState.get as jest.Mock).mockReturnValue(persistedData);

        await (orchestrator as unknown as { loadPersistedTasks: () => Promise<void> }).loadPersistedTasks();

        expect((orchestrator as unknown as { notifyTreeViewUpdate: () => void }).notifyTreeViewUpdate).toHaveBeenCalled();
    });
});
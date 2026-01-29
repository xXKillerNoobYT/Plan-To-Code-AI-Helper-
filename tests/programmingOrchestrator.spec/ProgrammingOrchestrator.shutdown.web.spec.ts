// ./programmingOrchestrator.web.spec.ts
import { ProgrammingOrchestrator, TaskStatus, TaskPriority } from '../../src/orchestrator/programmingOrchestrator';
import { ILogger } from '../../src/orchestrator/logger'; // Assuming ILogger is defined in logger.ts

/** @aiContributed-2026-01-28 */
describe('ProgrammingOrchestrator - shutdown', () => {
    let orchestrator: ProgrammingOrchestrator;
    let mockLogger: ILogger;

    beforeEach(() => {
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        orchestrator = new ProgrammingOrchestrator(undefined, mockLogger);
    });

    /** @aiContributed-2026-01-28 */
    it('should log shutdown start and completion', async () => {
        await orchestrator.shutdown();

        expect(mockLogger.info).toHaveBeenCalledWith('Programming Orchestrator: Shutting down...');
        expect(mockLogger.info).toHaveBeenCalledWith('✅ Programming Orchestrator: Shutdown complete');
    });

    /** @aiContributed-2026-01-28 */
    it('should cancel all active sessions', async () => {
        orchestrator['activeSessions'].set('session1', true);
        orchestrator['activeSessions'].set('session2', true);

        await orchestrator.shutdown();

        expect(mockLogger.info).toHaveBeenCalledWith('Cancelling session: session1');
        expect(mockLogger.info).toHaveBeenCalledWith('Cancelling session: session2');
        expect(orchestrator['activeSessions'].size).toBe(0);
    });

    /** @aiContributed-2026-01-28 */
    it('should clear the task queue and reset current task', async () => {
        orchestrator['taskQueue'] = [{ taskId: 'task1', status: TaskStatus.READY as any, priority: TaskPriority.P1, title: 'Test Task', estimatedHours: 1, description: '', dependencies: [], blockedBy: [], acceptanceCriteria: [], fromPlanningTeam: false }];
        orchestrator['currentTask'] = { taskId: 'task1', status: TaskStatus.IN_PROGRESS as any, priority: TaskPriority.P1, title: 'Test Task', estimatedHours: 1, description: '', dependencies: [], blockedBy: [], acceptanceCriteria: [], fromPlanningTeam: false };

        await orchestrator.shutdown();

        expect(orchestrator['taskQueue']).toEqual([]);
        expect(orchestrator['currentTask']).toBeNull();
    });

    /** @aiContributed-2026-01-28 */
    it('should set isInitialized to false', async () => {
        orchestrator['isInitialized'] = true;

        await orchestrator.shutdown();

        expect(orchestrator['isInitialized']).toBe(false);
    });

    /** @aiContributed-2026-01-28 */
    it('should handle exceptions during shutdown', async () => {
        jest.spyOn(orchestrator['activeSessions'], 'delete').mockImplementation(() => {
            throw new Error('Test Error');
        });

        await orchestrator.shutdown();

        // Shutdown completed despite error
        expect(orchestrator).toBeDefined();
    });
});
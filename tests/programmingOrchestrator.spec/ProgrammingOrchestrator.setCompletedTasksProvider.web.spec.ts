// ./programmingOrchestrator.web.spec.ts
import { ProgrammingOrchestrator } from '../../src/orchestrator/programmingOrchestrator';

/** @aiContributed-2026-01-28 */
describe('ProgrammingOrchestrator - setCompletedTasksProvider', () => {
    let orchestrator: ProgrammingOrchestrator;

    beforeEach(() => {
        orchestrator = new ProgrammingOrchestrator();
    });

    /** @aiContributed-2026-01-28 */
    it('should set the completedTasksProvider', () => {
        const mockProvider = { provideTasks: jest.fn() };

        orchestrator.setCompletedTasksProvider(mockProvider);

        expect(orchestrator['completedTasksProvider']).toBe(mockProvider);
    });
});
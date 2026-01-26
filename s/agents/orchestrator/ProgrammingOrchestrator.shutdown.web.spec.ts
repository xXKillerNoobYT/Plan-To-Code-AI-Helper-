// ./orchestrator.ProgrammingOrchestrator.shutdown.gptgen.web.spec.ts
import { ProgrammingOrchestrator } from '../../../src/agents/orchestrator';

/** @aiContributed-2026-01-25 */
describe('ProgrammingOrchestrator', () => {
    let orchestrator: ProgrammingOrchestrator;

    beforeEach(() => {
        orchestrator = new ProgrammingOrchestrator();
    });

    /** @aiContributed-2026-01-25 */
    it('should log messages during shutdown', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await orchestrator.shutdown();

        expect(consoleLogSpy).toHaveBeenCalledWith('Programming Orchestrator: Shutting down...');
        expect(consoleLogSpy).toHaveBeenCalledWith('Programming Orchestrator: Shutdown complete');

        consoleLogSpy.mockRestore();
    });
});
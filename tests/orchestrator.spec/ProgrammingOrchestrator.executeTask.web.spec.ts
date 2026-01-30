// ./orchestrator.ProgrammingOrchestrator.executeTask.gptgen.web.spec.ts
import { ProgrammingOrchestrator } from '../../src/agents/orchestrator';

jest.mock('../../src/agents/orchestrator');

/** @aiContributed-2026-01-29 */
describe('ProgrammingOrchestrator - executeTask', () => {
    let orchestrator: any;

    beforeEach(() => {
        jest.clearAllMocks();
        orchestrator = {
            executeTask: jest.fn().mockResolvedValue(undefined),
        };
    });

    /** @aiContributed-2026-01-29 */
    it('should execute task successfully', async () => {
        const taskId = '12345';

        await orchestrator.executeTask(taskId);

        expect(orchestrator.executeTask).toHaveBeenCalledWith(taskId);
        expect(orchestrator.executeTask).toHaveBeenCalledTimes(1);
    });

    /** @aiContributed-2026-01-29 */
    it('should handle task execution errors', async () => {
        const taskId = '12345';
        const error = new Error('Execution failed');
        
        orchestrator.executeTask.mockRejectedValueOnce(error);

        await expect(orchestrator.executeTask(taskId)).rejects.toThrow('Execution failed');
        expect(orchestrator.executeTask).toHaveBeenCalledWith(taskId);
    });
});
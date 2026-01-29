// ./programmingOrchestrator.web.spec.ts
import { MockMCPTools } from '../../src/orchestrator/programmingOrchestrator';

/** @aiContributed-2026-01-28 */
describe('MockMCPTools - reportTaskStatus', () => {
    let mockMCPTools: MockMCPTools;

    beforeEach(() => {
        mockMCPTools = new MockMCPTools();
    });

    /** @aiContributed-2026-01-28 */
    it('should return success with taskId and status when called with valid inputs', async () => {
        const taskId = 'task123';
        const status: any = 'completed';
        const output = 'Task completed successfully';

        const response = await mockMCPTools.reportTaskStatus(taskId, status, output);

        expect(response).toEqual({
            success: true,
            data: { taskId, status },
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should return success with taskId and status when output is not provided', async () => {
        const taskId = 'task456';
        const status: any = 'inProgress';

        const response = await mockMCPTools.reportTaskStatus(taskId, status);

        expect(response).toEqual({
            success: true,
            data: { taskId, status },
        });
    });
});

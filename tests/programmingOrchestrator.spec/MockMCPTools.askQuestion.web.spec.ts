// ./programmingOrchestrator.web.spec.ts
import { MockMCPTools } from '../../src/orchestrator/programmingOrchestrator';

/** @aiContributed-2026-01-28 */
describe('MockMCPTools - askQuestion', () => {
    let mockMCPTools: MockMCPTools;

    beforeEach(() => {
        mockMCPTools = new MockMCPTools();
    });

    /** @aiContributed-2026-01-28 */
    it('should return a successful response with the provided question and context', async () => {
        const question = 'What is the capital of France?';
        const context = { user: 'testUser', sessionId: '12345' };

        const response = await mockMCPTools.askQuestion(question, context);

        expect(response).toEqual({
            success: true,
            data: { answer: 'Mock response', context },
        });
    });

    /** @aiContributed-2026-01-28 */
    it('should include the provided context in the response', async () => {
        const question = 'What is 2 + 2?';
        const context = { calculation: true };

        const response = await mockMCPTools.askQuestion(question, context);

        expect((response.data as any)?.context).toEqual(context);
    });
});

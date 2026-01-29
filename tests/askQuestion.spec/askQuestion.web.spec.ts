// ./askQuestion.web.spec.ts
import { askQuestion } from '../../src/mcpServer/tools/askQuestion';
import { MCPProtocolError } from '../../src/mcpServer/protocol';

/** @aiContributed-2026-01-28 */
describe('askQuestion', () => {
    /** @aiContributed-2026-01-28 */
    it('should return a valid response for a well-formed question', async () => {
        const params = {
            question: 'How do I implement responsive design?',
        };

        const response = await askQuestion(params);

        expect(response.success).toBe(true);
        expect(response.question).toBe(params.question);
        expect(response.confidence).toBeGreaterThan(0.7);
        expect(response.answerFromPlan).toBeDefined();
        expect(response.evidence).toBeDefined();
        expect(response.guidance).toBeDefined();
    });

    /** @aiContributed-2026-01-28 */
    it('should throw an error for invalid parameters', async () => {
        const params = {
            question: '',
        };

        await expect(askQuestion(params)).rejects.toThrow(MCPProtocolError);
    });

    /** @aiContributed-2026-01-28 */
    it('should include related decisions when requested', async () => {
        const params = {
            question: 'What is the state management approach?',
            includeRelatedDecisions: true,
        };

        const response = await askQuestion(params);

        expect(response.relatedDecisions).toBeDefined();
        expect(response.relatedDecisions?.length).toBeGreaterThan(0);
    });

    /** @aiContributed-2026-01-28 */
    it('should not include related decisions when explicitly disabled', async () => {
        const params = {
            question: 'What is the state management approach?',
            includeRelatedDecisions: false,
        };

        const response = await askQuestion(params);

        expect(response.relatedDecisions).toBeUndefined();
    });

    /** @aiContributed-2026-01-28 */
    it('should return low confidence for unrecognized questions', async () => {
        const params = {
            question: 'What is the meaning of life?',
        };

        const response = await askQuestion(params);

        expect(response.confidence).toBeLessThan(0.7);
        expect(response.uncertainty).toBeDefined();
    });
});
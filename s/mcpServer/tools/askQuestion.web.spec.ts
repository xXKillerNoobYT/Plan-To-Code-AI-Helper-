// ./tools.askQuestion.gptgen.web.spec.ts
import { askQuestion } from '../../../src/mcpServer/tools';

/** @aiContributed-2026-01-24 */
describe('askQuestion', () => {
  /** @aiContributed-2026-01-24 */
    it('should throw an error indicating the tool is not yet implemented', async () => {
    const params = { question: 'What is your name?' };
    await expect(askQuestion(params)).rejects.toThrow(
      'askQuestion tool not yet implemented. Coming soon!'
    );
  });
});
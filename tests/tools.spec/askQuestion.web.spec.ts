// ./tools.web.spec.ts
import { askQuestion } from '../../src/mcpServer/tools';

/** @aiContributed-2026-01-28 */
describe('askQuestion', () => {
  /** @aiContributed-2026-01-28 */
    it('should throw an error indicating the tool is not yet implemented', async () => {
    await expect(askQuestion({})).rejects.toThrow(
      'askQuestion tool not yet implemented. Coming soon!'
    );
  });
});

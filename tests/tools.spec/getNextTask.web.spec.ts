// ./tools.web.spec.ts
import { getNextTask } from '../../src/mcpServer/tools';

/** @aiContributed-2026-01-28 */
describe('getNextTask', () => {
  /** @aiContributed-2026-01-28 */
    it('should throw an error indicating the function is deprecated', async () => {
    await expect(getNextTask({})).rejects.toThrow(
      'This function is deprecated. Import from ./tools/getNextTask instead.'
    );
  });
});
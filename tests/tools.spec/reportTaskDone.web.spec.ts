// ./tools.web.spec.ts
import { reportTaskDone } from '../../src/mcpServer/tools';

/** @aiContributed-2026-01-28 */
describe('reportTaskDone', () => {
  /** @aiContributed-2026-01-28 */
    it('should throw an error indicating the function is deprecated', async () => {
    await expect(reportTaskDone({})).rejects.toThrow(
      'This function is deprecated. Import from ./tools/reportTaskStatus instead.'
    );
  });
});

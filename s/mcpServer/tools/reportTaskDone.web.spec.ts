// ./tools.web.spec.ts
import { reportTaskDone } from '../../../src/mcpServer/tools';

/** @aiContributed-2026-01-24 */
describe('reportTaskDone', () => {
  /** @aiContributed-2026-01-24 */
  it('should throw an error indicating deprecation', async () => {
    await expect(reportTaskDone({})).rejects.toThrow(
      'This function is deprecated. Import from ./tools/reportTaskStatus instead.'
    );
  });
});
// ./extension.web.spec.ts
import { deactivate } from '../../src/extension';
import { PlansFileWatcher } from '../../src/services/plansWatcher';
import { FileConfigManager } from '../../src/utils/fileConfig';

jest.mock('../../src/services/plansWatcher', () => ({
    ...jest.requireActual('../../src/services/plansWatcher'),
    PlansFileWatcher: {
    stopWatching: jest.fn(),
  },
}));

jest.mock('../../src/utils/fileConfig', () => ({
    ...jest.requireActual('../../src/utils/fileConfig'),
    FileConfigManager: {
    dispose: jest.fn(),
  },
}));

/** @aiContributed-2026-01-28 */
describe('deactivate', () => {
  /** @aiContributed-2026-01-28 */
    it('should stop the PlansFileWatcher, dispose FileConfigManager, and clean up resources', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await deactivate();

    expect(PlansFileWatcher.stopWatching).toHaveBeenCalled();
    expect(FileConfigManager.dispose).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Plans Watcher stopped');
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ File Config Manager disposed');

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
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

/** @aiContributed-2026-01-29 */
describe('deactivate', () => {
    /** @aiContributed-2026-01-29 */
    it('should stop the PlansFileWatcher and dispose FileConfigManager', async () => {
        const stopWatchingSpy = jest.spyOn(PlansFileWatcher, 'stopWatching').mockImplementation();
        const disposeSpy = jest.spyOn(FileConfigManager, 'dispose').mockImplementation();

        await deactivate();

        expect(stopWatchingSpy).toHaveBeenCalledTimes(1);
        expect(disposeSpy).toHaveBeenCalledTimes(1);

        stopWatchingSpy.mockRestore();
        disposeSpy.mockRestore();
    });
});
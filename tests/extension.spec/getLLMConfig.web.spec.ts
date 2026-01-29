// ./extension.web.spec.ts
import { getLLMConfig } from '../../src/extension';
import { FileConfigManager } from '../../src/utils/fileConfig';

jest.mock('../../src/utils/fileConfig', () => ({
    ...jest.requireActual('../../src/utils/fileConfig'),
    FileConfigManager: {
    getLLMConfig: jest.fn(),
  },
}));

/** @aiContributed-2026-01-28 */
describe('getLLMConfig', () => {
  /** @aiContributed-2026-01-28 */
    it('should return the LLM configuration from FileConfigManager', () => {
    const mockConfig = {
      url: 'http://localhost:3000',
      model: 'gpt-4',
      inputTokenLimit: 1000,
      maxOutputTokens: 500,
      timeoutSeconds: 30,
      temperature: 0.7,
    };

    (FileConfigManager.getLLMConfig as jest.Mock).mockReturnValue(mockConfig);

    const result = getLLMConfig();

    expect(FileConfigManager.getLLMConfig).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockConfig);
  });
});
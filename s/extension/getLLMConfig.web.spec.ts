// ./extension.web.spec.ts
import { getLLMConfig } from '../../src/extension';

/** @aiContributed-2026-01-26 */
describe('getLLMConfig', () => {
    /** @aiContributed-2026-01-26 */
    it('should return the default LLM configuration', () => {
        const config = getLLMConfig();
        expect(config).toEqual({
            url: 'http://192.168.1.205:1234/v1/chat/completions',
            model: 'mistralai/ministral-3-14b-reasoning',
            inputTokenLimit: 4000,
            maxOutputTokens: 2000,
            timeoutSeconds: 300,
        });
    });

    /** @aiContributed-2026-01-26 */
    it('should return a new object each time it is called', () => {
        const config1 = getLLMConfig();
        const config2 = getLLMConfig();
        expect(config1).not.toBe(config2);
        expect(config1).toEqual(config2);
    });
});
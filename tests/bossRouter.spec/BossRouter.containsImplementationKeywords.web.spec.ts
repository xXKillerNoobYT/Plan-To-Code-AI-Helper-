// ./bossRouter.web.spec.ts

import { BossRouter } from '../../src/services/bossRouter';

/** @aiContributed-2026-01-29 */
describe('BossRouter.containsImplementationKeywords', () => {
    let bossRouter: BossRouter;

    beforeEach(() => {
        bossRouter = BossRouter.getInstance();
    });

    /** @aiContributed-2026-01-29 */
    it('should return true if the text contains implementation-related keywords', () => {
        const text = 'We need to implement a new feature and refactor the code.';
        const result = (bossRouter as any).containsImplementationKeywords(text);
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false if the text does not contain implementation-related keywords', () => {
        const text = 'This is a general discussion about the project.';
        const result = (bossRouter as any).containsImplementationKeywords(text);
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-29 */
    it('should return true for partial matches of implementation-related keywords', () => {
        const text = 'Let us build something amazing.';
        const result = (bossRouter as any).containsImplementationKeywords(text);
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false for an empty string', () => {
        const text = '';
        const result = (bossRouter as any).containsImplementationKeywords(text);
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-29 */
    it('should handle case-insensitive matches', () => {
        const text = 'We need to DEVELOP a new module.';
        const result = (bossRouter as any).containsImplementationKeywords(text);
        expect(result).toBe(true);
    });
});
// ./bossRouter.web.spec.ts

import { BossRouter } from '../../src/services/bossRouter';

/** @aiContributed-2026-01-29 */
describe('BossRouter - containsResearchKeywords', () => {
    let bossRouter: BossRouter;

    beforeEach(() => {
        bossRouter = BossRouter.getInstance();
    });

    /** @aiContributed-2026-01-29 */
    it('should return true if the text contains research-related keywords', () => {
        const text = 'We need to research the feasibility of this project.';
        const result = (bossRouter as any).containsResearchKeywords(text);
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false if the text does not contain research-related keywords', () => {
        const text = 'This is a simple task to complete.';
        const result = (bossRouter as any).containsResearchKeywords(text);
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-29 */
    it('should return true for text with mixed case research-related keywords', () => {
        const text = 'The team needs to Investigate the options available.';
        const result = (bossRouter as any).containsResearchKeywords(text);
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false for an empty string', () => {
        const text = '';
        const result = (bossRouter as any).containsResearchKeywords(text);
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-29 */
    it('should return true if the text contains multiple research-related keywords', () => {
        const text = 'We need to analyze and evaluate the data for this study.';
        const result = (bossRouter as any).containsResearchKeywords(text);
        expect(result).toBe(true);
    });
});
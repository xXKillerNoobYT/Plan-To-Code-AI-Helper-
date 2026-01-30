// ./bossRouter.web.spec.ts

import { BossRouter } from '../../src/services/bossRouter';

/** @aiContributed-2026-01-29 */
describe('BossRouter.containsPlanningKeywords', () => {
    let bossRouter: BossRouter;

    beforeEach(() => {
        bossRouter = BossRouter.getInstance() as any;
    });

    /** @aiContributed-2026-01-29 */
    it('should return true if the text contains planning-related keywords', () => {
        const text = 'We need to define the roadmap for the next quarter.';
        const result = (bossRouter as any).containsPlanningKeywords(text);
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false if the text does not contain any planning-related keywords', () => {
        const text = 'This is a random sentence without relevant keywords.';
        const result = (bossRouter as any).containsPlanningKeywords(text);
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-29 */
    it('should return true for text containing multiple planning-related keywords', () => {
        const text = 'Let us design and architect the new system.';
        const result = (bossRouter as any).containsPlanningKeywords(text);
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-29 */
    it('should be case insensitive when checking for planning-related keywords', () => {
        const text = 'The PLAN needs to be outlined clearly.';
        const result = (bossRouter as any).containsPlanningKeywords(text);
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false for empty text', () => {
        const text = '';
        const result = (bossRouter as any).containsPlanningKeywords(text);
        expect(result).toBe(false);
    });
});
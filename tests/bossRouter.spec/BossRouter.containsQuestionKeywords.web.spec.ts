// ./bossRouter.web.spec.ts

import { BossRouter } from '../../src/services/bossRouter';

/** @aiContributed-2026-01-29 */
describe('BossRouter.containsQuestionKeywords', () => {
    let bossRouter: BossRouter;

    beforeEach(() => {
        bossRouter = BossRouter.getInstance();
    });

    /** @aiContributed-2026-01-29 */
    it('should return true if the text contains question keywords', () => {
        const text = 'Can you explain how this works?';
        const result = (bossRouter as any).containsQuestionKeywords(text);
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false if the text does not contain question keywords', () => {
        const text = 'This is a statement without any inquiry.';
        const result = (bossRouter as any).containsQuestionKeywords(text);
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-29 */
    it('should return true if the text contains a question mark', () => {
        const text = 'Is this correct?';
        const result = (bossRouter as any).containsQuestionKeywords(text);
        expect(result).toBe(true);
    });

    /** @aiContributed-2026-01-29 */
    it('should return false for an empty string', () => {
        const text = '';
        const result = (bossRouter as any).containsQuestionKeywords(text);
        expect(result).toBe(false);
    });

    /** @aiContributed-2026-01-29 */
    it('should be case insensitive when checking for keywords', () => {
        const text = 'Who is responsible for this task?';
        const result = (bossRouter as any).containsQuestionKeywords(text);
        expect(result).toBe(true);
    });
});
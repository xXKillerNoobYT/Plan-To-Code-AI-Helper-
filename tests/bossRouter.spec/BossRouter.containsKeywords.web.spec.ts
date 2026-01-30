// ./bossRouter.web.spec.ts

import { BossRouter } from '../../src/services/bossRouter';

/** @aiContributed-2026-01-29 */
describe('BossRouter.containsKeywords', () => {
  let bossRouter: any;

  beforeEach(() => {
    bossRouter = BossRouter.getInstance();
  });

  /** @aiContributed-2026-01-29 */
  it('should return true if the text contains any of the keywords', () => {
    const text = 'This is a test message containing the keyword planning.';
    const keywords = ['planning', 'verification', 'research'];
    const result = bossRouter.containsKeywords(text, keywords);
    expect(result).toBe(true);
  });

  /** @aiContributed-2026-01-29 */
  it('should return false if the text does not contain any of the keywords', () => {
    const text = 'This is a test message with no relevant keywords.';
    const keywords = ['planning', 'verification', 'research'];
    const result = bossRouter.containsKeywords(text, keywords);
    expect(result).toBe(false);
  });

  /** @aiContributed-2026-01-29 */
  it('should handle special characters in keywords correctly', () => {
    const text = 'This message includes a special keyword like research.';
    const keywords = ['re.search', 'plan*ning', 'veri?fication'];
    const result = bossRouter.containsKeywords(text, keywords);
    expect(result).toBe(false);
  });

  /** @aiContributed-2026-01-29 */
  it('should return true for standalone "?" keyword in the text', () => {
    const text = 'Does this message contain a question mark?';
    const keywords = ['?'];
    const result = bossRouter.containsKeywords(text, keywords);
    expect(result).toBe(true);
  });

  /** @aiContributed-2026-01-29 */
  it('should return false for empty keywords array', () => {
    const text = 'This is a test message.';
    const keywords: string[] = [];
    const result = bossRouter.containsKeywords(text, keywords);
    expect(result).toBe(false);
  });

  /** @aiContributed-2026-01-29 */
  it('should return false for empty text', () => {
    const text = '';
    const keywords = ['planning', 'verification', 'research'];
    const result = bossRouter.containsKeywords(text, keywords);
    expect(result).toBe(false);
  });
});
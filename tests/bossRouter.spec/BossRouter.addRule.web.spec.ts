// ./bossRouter.web.spec.ts
import { BossRouter } from '../../src/services/bossRouter';

/** @aiContributed-2026-01-29 */
describe('BossRouter - addRule', () => {
  let bossRouter: BossRouter;

  beforeEach(() => {
    bossRouter = BossRouter.getInstance();
    bossRouter.resetRules();
  });

  /** @aiContributed-2026-01-29 */
  it('should add a new rule to the rules list', () => {
    const newRule: any = { id: 'rule1', name: 'Test Rule', condition: jest.fn(), action: jest.fn(), team: 'planning', priority: 1 };
    bossRouter.addRule(newRule);

    const rules = bossRouter.getRules();
    expect(rules).toContainEqual(newRule);
  });

  /** @aiContributed-2026-01-29 */
  it('should not modify existing rules when adding a new rule', () => {
    const existingRule: any = { id: 'rule1', name: 'Existing Rule', condition: jest.fn(), action: jest.fn(), team: 'planning', priority: 1 };
    bossRouter.addRule(existingRule);

    const rulesAfterFirst = bossRouter.getRules();
    const countAfterFirst = rulesAfterFirst.length;

    const newRule: any = { id: 'rule2', name: 'New Rule', condition: jest.fn(), action: jest.fn(), team: 'verification', priority: 2 };
    bossRouter.addRule(newRule);

    const rules = bossRouter.getRules();
    expect(rules).toHaveLength(countAfterFirst + 1);
    expect(rules).toContainEqual(existingRule);
    expect(rules).toContainEqual(newRule);
  });
});
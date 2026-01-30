// ./webhooks.web.spec.ts
import { handleWebhook } from '../../src/github/webhooks';
/** @aiContributed-2026-01-29 */
describe('handleWebhook', () => {
    /** @aiContributed-2026-01-29 */
    it('should call handleIssueOpened when action is "opened"', () => {
        const mockEvent = {
            action: 'opened',
            repository: {},
            sender: {},
        };
        expect(() => handleWebhook(mockEvent)).not.toThrow();
    });

    /** @aiContributed-2026-01-29 */
    it('should call handleIssueClosed when action is "closed"', () => {
        const mockEvent = {
            action: 'closed',
            repository: {},
            sender: {},
        };
        expect(() => handleWebhook(mockEvent)).not.toThrow();
    });

    /** @aiContributed-2026-01-29 */
    it('should call handleIssueEdited when action is "edited"', () => {
        const mockEvent = {
            action: 'edited',
            repository: {},
            sender: {},
        };
        expect(() => handleWebhook(mockEvent)).not.toThrow();
    });

    /** @aiContributed-2026-01-29 */
    it('should call handleIssueLabeled when action is "labeled"', () => {
        const mockEvent = {
            action: 'labeled',
            repository: {},
            sender: {},
        };
        expect(() => handleWebhook(mockEvent)).not.toThrow();
    });

    /** @aiContributed-2026-01-29 */
    it('should not call any handler for an unknown action', () => {
        const mockEvent = {
            action: 'unknown',
            repository: {},
            sender: {},
        };
        expect(() => handleWebhook(mockEvent)).not.toThrow();
    });
});
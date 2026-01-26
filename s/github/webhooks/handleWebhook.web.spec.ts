// ./webhooks.handleWebhook.gptgen.web.spec.ts
import { handleWebhook } from '../../../src/github/webhooks';

/** @aiContributed-2026-01-24 */
describe('handleWebhook', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** @aiContributed-2026-01-24 */
    it('should call handleIssueOpened when action is "opened"', () => {
        const event = {
            action: 'opened',
            repository: {},
            sender: {},
        };

        handleWebhook(event);

        expect(consoleLogSpy).toHaveBeenCalledWith('GitHub Webhook: Received event', 'opened');
        expect(consoleLogSpy).toHaveBeenCalledWith('GitHub Webhook: Issue opened');
    });

    /** @aiContributed-2026-01-24 */
    it('should call handleIssueClosed when action is "closed"', () => {
        const event = {
            action: 'closed',
            repository: {},
            sender: {},
        };

        handleWebhook(event);

        expect(consoleLogSpy).toHaveBeenCalledWith('GitHub Webhook: Received event', 'closed');
        expect(consoleLogSpy).toHaveBeenCalledWith('GitHub Webhook: Issue closed');
    });

    /** @aiContributed-2026-01-24 */
    it('should call handleIssueEdited when action is "edited"', () => {
        const event = {
            action: 'edited',
            repository: {},
            sender: {},
        };

        handleWebhook(event);

        expect(consoleLogSpy).toHaveBeenCalledWith('GitHub Webhook: Received event', 'edited');
        expect(consoleLogSpy).toHaveBeenCalledWith('GitHub Webhook: Issue edited');
    });

    /** @aiContributed-2026-01-24 */
    it('should call handleIssueLabeled when action is "labeled"', () => {
        const event = {
            action: 'labeled',
            repository: {},
            sender: {},
        };

        handleWebhook(event);

        expect(consoleLogSpy).toHaveBeenCalledWith('GitHub Webhook: Received event', 'labeled');
        expect(consoleLogSpy).toHaveBeenCalledWith('GitHub Webhook: Issue labeled');
    });

    /** @aiContributed-2026-01-24 */
    it('should log unhandled action for unknown actions', () => {
        const event = {
            action: 'unknown_action',
            repository: {},
            sender: {},
        };

        handleWebhook(event);

        expect(consoleLogSpy).toHaveBeenCalledWith('GitHub Webhook: Received event', 'unknown_action');
        expect(consoleLogSpy).toHaveBeenCalledWith('GitHub Webhook: Unhandled action', 'unknown_action');
    });
});
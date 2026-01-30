/**
 * Test Suite: webhooks.ts
 * Tests for GitHub webhook event handling
 */

import { handleWebhook, WebhookEvent } from '../../src/github/webhooks';

describe('Webhook Handler', () => {
  describe('WebhookEvent Interface', () => {
    it('should create valid webhook event', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: { id: 1, title: 'Test Issue', number: 123 },
        repository: { name: 'test-repo', owner: { login: 'user' } },
        sender: { login: 'user' },
      };

      expect(event.action).toBe('opened');
      expect(event.issue).toBeDefined();
    });

    it('should support optional pull_request field', () => {
      const event: WebhookEvent = {
        action: 'opened',
        pull_request: { id: 1, title: 'Test PR', number: 123 },
        repository: { name: 'test-repo', owner: { login: 'user' } },
        sender: { login: 'user' },
      };

      expect(event.pull_request).toBeDefined();
    });
  });

  describe('handleWebhook', () => {
    it('should not throw on valid webhook', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: { id: 1, number: 123 },
        repository: { name: 'test' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });

    it('should handle unknown action gracefully', () => {
      const event: WebhookEvent = {
        action: 'unknown-action',
        repository: { name: 'test' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });
  });

  describe('Issue Opened Event', () => {
    it('should handle issue opened action', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: {
          id: 1,
          number: 123,
          title: 'New Feature Request',
          body: 'Please add feature X',
          state: 'open',
        },
        repository: { name: 'test-repo' },
        sender: { login: 'john-dev' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });

    it('should handle issue opened with labels', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: {
          id: 1,
          number: 123,
          title: 'Bug Report',
          labels: [{ name: 'bug' }, { name: 'critical' }],
        },
        repository: { name: 'test-repo' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });

    it('should handle issue opened with assignee', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: {
          id: 1,
          number: 123,
          title: 'Task',
          assignee: { login: 'developer' },
        },
        repository: { name: 'test-repo' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });
  });

  describe('Issue Closed Event', () => {
    it('should handle issue closed action', () => {
      const event: WebhookEvent = {
        action: 'closed',
        issue: {
          id: 1,
          number: 123,
          title: 'Completed Task',
          state: 'closed',
          closedAt: '2026-01-29T12:00:00Z',
        },
        repository: { name: 'test-repo' },
        sender: { login: 'developer' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });

    it('should handle issue closed with reason', () => {
      const event: WebhookEvent = {
        action: 'closed',
        issue: {
          id: 1,
          number: 123,
          title: 'Duplicate Issue',
          state: 'closed',
          stateReason: 'duplicate',
        },
        repository: { name: 'test-repo' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });
  });

  describe('Issue Edited Event', () => {
    it('should handle issue edited action', () => {
      const event: WebhookEvent = {
        action: 'edited',
        issue: {
          id: 1,
          number: 123,
          title: 'Updated Title',
          body: 'Updated description',
        },
        repository: { name: 'test-repo' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });

    it('should handle issue edited with description change', () => {
      const event: WebhookEvent = {
        action: 'edited',
        issue: {
          id: 1,
          number: 123,
          title: 'Task',
          body: 'New description',
        },
        repository: { name: 'test-repo' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });
  });

  describe('Issue Labeled Event', () => {
    it('should handle issue labeled action', () => {
      const event: WebhookEvent = {
        action: 'labeled',
        issue: {
          id: 1,
          number: 123,
          title: 'Task',
          labels: [{ name: 'priority-high' }],
        },
        repository: { name: 'test-repo' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });

    it('should handle issue labeled with multiple labels', () => {
      const event: WebhookEvent = {
        action: 'labeled',
        issue: {
          id: 1,
          number: 123,
          title: 'Task',
          labels: [
            { name: 'bug' },
            { name: 'critical' },
            { name: 'frontend' },
          ],
        },
        repository: { name: 'test-repo' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });
  });

  describe('Repository Information', () => {
    it('should handle repository data in webhook', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: { id: 1, number: 1 },
        repository: {
          id: 123456,
          name: 'test-repo',
          full_name: 'user/test-repo',
          owner: { login: 'user' },
          private: false,
          description: 'Test repository',
        },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });
  });

  describe('Sender Information', () => {
    it('should handle sender data in webhook', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: { id: 1, number: 1 },
        repository: { name: 'test' },
        sender: {
          login: 'john-dev',
          id: 12345,
          avatar_url: 'https://example.com/avatar.jpg',
          type: 'User',
        },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });
  });

  describe('Complex Event Payloads', () => {
    it('should handle full featured webhook payload', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: {
          id: 1,
          number: 123,
          title: 'Complex Issue',
          body: 'Detailed description',
          state: 'open',
          labels: [
            { id: 1, name: 'bug', color: 'FF0000' },
            { id: 2, name: 'high-priority', color: 'FF6600' },
          ],
          assignee: { login: 'dev1' },
          assignees: [
            { login: 'dev1' },
            { login: 'dev2' },
          ],
          milestone: { number: 1, title: 'v1.0' },
          created_at: '2026-01-29T10:00:00Z',
          updated_at: '2026-01-29T10:00:00Z',
        },
        repository: {
          id: 123456,
          name: 'test-repo',
          full_name: 'org/test-repo',
          owner: { login: 'org' },
        },
        sender: {
          login: 'creator',
          id: 67890,
        },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle event with minimal data', () => {
      const event: WebhookEvent = {
        action: 'opened',
        repository: { name: 'test' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });

    it('should handle empty string action', () => {
      const event: WebhookEvent = {
        action: '',
        repository: { name: 'test' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });

    it('should handle issue with empty title', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: { id: 1, number: 1, title: '' },
        repository: { name: 'test' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });

    it('should handle issue with very long title', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: {
          id: 1,
          number: 1,
          title: 'a'.repeat(10000),
        },
        repository: { name: 'test' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });

    it('should handle special characters in title', () => {
      const event: WebhookEvent = {
        action: 'opened',
        issue: {
          id: 1,
          number: 1,
          title: 'Special chars: !@#$%^&*()[]{}|\\;:"\'<>?,./\n\t',
        },
        repository: { name: 'test' },
        sender: { login: 'user' },
      };

      expect(() => {
        handleWebhook(event);
      }).not.toThrow();
    });
  });
});

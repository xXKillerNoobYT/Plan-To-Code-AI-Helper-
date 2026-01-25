import type { RestEndpointMethodTypes } from '@octokit/rest';
import {
    appendIssueUpdatesToPrd,
    appendStatusLog,
    categorizeIssue,
    mapIssuesToUpdates,
} from '../update-prd';

type IssueData = RestEndpointMethodTypes['issues']['listForRepo']['response']['data'][number];

const createIssue = (overrides: Partial<IssueData> = {}): IssueData => ({
    number: overrides.number ?? 1,
    title: overrides.title ?? 'Sample issue',
    html_url: overrides.html_url ?? 'https://example.com/issue/1',
    labels: overrides.labels ?? [{ name: 'bug' }],
    state: overrides.state ?? 'open',
    url: overrides.url ?? 'https://api.github.com/issues/1',
    repository_url: overrides.repository_url ?? 'https://api.github.com/repos/test/repo',
    labels_url: overrides.labels_url ?? 'https://api.github.com/issues/1/labels{/name}',
    comments_url: overrides.comments_url ?? 'https://api.github.com/issues/1/comments',
    events_url: overrides.events_url ?? 'https://api.github.com/issues/1/events',
    body: overrides.body ?? '',
    locked: overrides.locked ?? false,
    comments: overrides.comments ?? 0,
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? new Date().toISOString(),
    closed_at: overrides.closed_at ?? null,
    author_association: overrides.author_association ?? 'NONE',
    active_lock_reason: overrides.active_lock_reason ?? null,
    assignee: overrides.assignee ?? null,
    assignees: overrides.assignees ?? [],
    milestone: overrides.milestone ?? null,
    pull_request: overrides.pull_request ?? undefined,
    draft: overrides.draft ?? false,
    node_id: overrides.node_id ?? 'MDU6SXNzdWUx',
    id: overrides.id ?? 1,
    state_reason: overrides.state_reason ?? null,
    reactions: overrides.reactions ?? {
        url: 'https://api.github.com/issues/1/reactions',
        total_count: 0,
        '+1': 0,
        '-1': 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        heart: 0,
        rocket: 0,
        eyes: 0,
    },
    user: overrides.user ?? null,
    closed_by: overrides.closed_by ?? null,
    timeline_url: overrides.timeline_url ?? 'https://api.github.com/issues/1/timeline',
    performed_via_github_app: overrides.performed_via_github_app ?? null,
    repository: overrides.repository ?? undefined,
} as IssueData);

describe('categorizeIssue', () => {
    it('returns testing for bug labels', () => {
        const issue = createIssue({ labels: [{ name: 'bug' }] });
        expect(categorizeIssue(issue)).toBe('testing');
    });

    it('returns plans for feature/enhancement labels', () => {
        const issue = createIssue({ labels: [{ name: 'enhancement' }] });
        expect(categorizeIssue(issue)).toBe('plans');
    });

    it('returns null when no relevant labels exist', () => {
        const issue = createIssue({ labels: [{ name: 'question' }] });
        expect(categorizeIssue(issue)).toBeNull();
    });
});

describe('mapIssuesToUpdates', () => {
    it('filters out uncategorized issues and maps remaining', () => {
        const issues: IssueData[] = [
            createIssue({ number: 1, labels: [{ name: 'bug' }], title: 'Bug A' }),
            createIssue({ number: 2, labels: [{ name: 'feature' }], title: 'Feature B' }),
            createIssue({ number: 3, labels: [{ name: 'question' }], title: 'Question C' }),
        ];

        const updates = mapIssuesToUpdates(issues);

        expect(updates).toHaveLength(2);
        expect(updates.map((u) => u.number)).toEqual([1, 2]);
        expect(updates[0].category).toBe('testing');
        expect(updates[1].category).toBe('plans');
    });
});

describe('appendIssueUpdatesToPrd', () => {
    it('adds a new section when missing and appends deduped issues', () => {
        const prdContent = '# PRD\n';
        const updates = [
            { number: 10, title: 'Bug fix', htmlUrl: 'https://example.com/10', category: 'testing' as const },
            { number: 11, title: 'Feature work', htmlUrl: 'https://example.com/11', category: 'plans' as const },
        ];

        const result = appendIssueUpdatesToPrd(prdContent, updates);

        expect(result.added).toHaveLength(2);
        expect(result.content).toContain('## Updates from GitHub Issues');
        expect(result.content).toContain('From issue #10: Bug fix');
        expect(result.content).toContain('From issue #11: Feature work');
    });

    it('skips issues already present', () => {
        const prdContent = '# PRD\n\n## Updates from GitHub Issues\n\n- From issue #5: Existing (https://example.com/5) [Testing]\n';
        const updates = [
            { number: 5, title: 'Existing', htmlUrl: 'https://example.com/5', category: 'testing' as const },
            { number: 6, title: 'New issue', htmlUrl: 'https://example.com/6', category: 'plans' as const },
        ];

        const result = appendIssueUpdatesToPrd(prdContent, updates);

        expect(result.added).toHaveLength(1);
        expect(result.added[0].number).toBe(6);
        expect(result.content).toContain('From issue #6: New issue');
        expect(result.content).not.toContain('From issue #5: Existing (https://example.com/5) [Testing]\n- From issue #5: Existing');
    });
});

describe('appendStatusLog', () => {
    it('appends a dated status entry with updates', () => {
        const statusLog = '# Status Log';
        const updates = [
            { number: 2, title: 'Bug', htmlUrl: 'https://example.com/2', category: 'testing' as const },
        ];

        const result = appendStatusLog(statusLog, updates, '2026-01-24');

        expect(result).toContain('## 2026-01-24: GitHub Issue Sync');
        expect(result).toContain('Issue #2 (Testing): Bug (https://example.com/2)');
    });

    it('returns unchanged content when no updates provided', () => {
        const statusLog = '# Status Log';
        const result = appendStatusLog(statusLog, []);
        expect(result).toBe(statusLog);
    });
});
import { promises as fs } from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/rest';

type IssueData = RestEndpointMethodTypes['issues']['listForRepo']['response']['data'][number];
type IssueCategory = 'testing' | 'plans';

interface IssueUpdate {
    readonly number: number;
    readonly title: string;
    readonly htmlUrl: string;
    readonly category: IssueCategory;
}

const PRD_SECTION_HEADER = '## Updates from GitHub Issues';
const DEFAULT_OWNER = 'xXKillerNoobYT';
const DEFAULT_REPO = 'Plan-To-Code-AI-Helper-';
const PRD_FILENAME = 'PRD.md';
const STATUS_LOG_PATH = path.join('Status', 'status-log.md');

/**
 * 🚀 Fetches open GitHub issues for the configured repository.
 *
 * @param octokit - Authenticated Octokit client
 * @param owner - Repository owner (defaults to configured env var or fallback)
 * @param repo - Repository name (defaults to configured env var or fallback)
 * @returns Open issues for the repository
 */
export async function fetchOpenIssues(
    octokit: Octokit,
    owner: string,
    repo: string,
): Promise<IssueData[]> {
    const response = await octokit.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: 100,
    });

    return response.data;
}

/**
 * 🔍 Determines issue category based on labels.
 *
 * @param issue - GitHub issue payload
 * @returns Issue category or null if uncategorized
 */
export function categorizeIssue(issue: IssueData): IssueCategory | null {
    const labels = (issue.labels ?? []).map((label) =>
        typeof label === 'string' ? label.toLowerCase() : label.name?.toLowerCase() ?? '',
    );

    if (labels.some((label) => label.includes('bug'))) {
        return 'testing';
    }

    if (labels.some((label) => label.includes('feature') || label.includes('enhancement'))) {
        return 'plans';
    }

    return null;
}

/**
 * 🧭 Converts GitHub issues into structured updates for PRD/Status.
 *
 * @param issues - Open GitHub issues
 * @returns Structured updates (filtered to categorized issues)
 */
export function mapIssuesToUpdates(issues: IssueData[]): IssueUpdate[] {
    return issues
        .map((issue) => {
            const category = categorizeIssue(issue);
            if (!category) {
                return null;
            }

            return {
                number: issue.number,
                title: issue.title.trim(),
                htmlUrl: issue.html_url,
                category,
            } satisfies IssueUpdate;
        })
        .filter((issueUpdate): issueUpdate is IssueUpdate => issueUpdate !== null);
}

/**
 * 🧱 Ensures the PRD has an issue update section and appends new entries.
 *
 * @param prdContent - Existing PRD.md content
 * @param updates - Issue updates to append
 * @returns Updated PRD content and the issues actually added (deduped)
 */
export function appendIssueUpdatesToPrd(prdContent: string, updates: IssueUpdate[]): {
    readonly content: string;
    readonly added: IssueUpdate[];
} {
    const existingIssueNumbers = new Set<number>();
    const issueNumberPattern = /From issue #(\d+):/g;
    let match: RegExpExecArray | null;

    while ((match = issueNumberPattern.exec(prdContent)) !== null) {
        const issueNumber = Number.parseInt(match[1], 10);
        if (!Number.isNaN(issueNumber)) {
            existingIssueNumbers.add(issueNumber);
        }
    }

    const deduped = updates.filter((update) => !existingIssueNumbers.has(update.number));

    if (deduped.length === 0) {
        return { content: prdContent, added: [] };
    }

    let nextContent = prdContent.includes(PRD_SECTION_HEADER)
        ? prdContent.trimEnd()
        : `${prdContent.trimEnd()}\n\n${PRD_SECTION_HEADER}`;

    const updateLines = deduped.map((update) =>
        `- From issue #${update.number}: ${update.title} (${update.htmlUrl}) [${update.category === 'testing' ? 'Testing' : 'Plans'}]`,
    );

    nextContent = `${nextContent}\n\n${updateLines.join('\n')}\n`;

    return { content: nextContent, added: deduped };
}

/**
 * 📝 Appends a dated entry to Status/status-log.md for the provided updates.
 *
 * @param statusLogContent - Existing status-log content
 * @param updates - Issue updates that were written to the PRD
 * @param asOfDate - ISO date string (YYYY-MM-DD); defaults to today
 * @returns Updated status-log content
 */
export function appendStatusLog(
    statusLogContent: string,
    updates: IssueUpdate[],
    asOfDate: string = new Date().toISOString().split('T')[0],
): string {
    if (updates.length === 0) {
        return statusLogContent;
    }

    const heading = `## ${asOfDate}: GitHub Issue Sync`;
    const lines = updates.map((update) =>
        `- Issue #${update.number} (${update.category === 'testing' ? 'Testing' : 'Plans'}): ${update.title} (${update.htmlUrl})`,
    );

    return `${statusLogContent.trimEnd()}\n\n${heading}\n\n${lines.join('\n')}\n`;
}

async function loadFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf8');
}

async function saveFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf8');
}

function resolveRepoPath(...segments: string[]): string {
    return path.resolve(__dirname, '..', '..', ...segments);
}

/**
 * 🎯 Main entry point: fetches issues, updates PRD.md, and appends Status/status-log.md.
 */
export async function run(): Promise<void> {
    const owner = process.env.COE_GITHUB_OWNER ?? DEFAULT_OWNER;
    const repo = process.env.COE_GITHUB_REPO ?? DEFAULT_REPO;
    const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;

    if (!token) {
        throw new Error('GITHUB_TOKEN (or GH_TOKEN) is required to fetch GitHub issues.');
    }

    const octokit = new Octokit({ auth: token });
    const issues = await fetchOpenIssues(octokit, owner, repo);
    const updates = mapIssuesToUpdates(issues);

    if (updates.length === 0) {
        console.log('No categorized issues found (bug/feature labels missing). Nothing to update.');
        return;
    }

    const prdPath = resolveRepoPath(PRD_FILENAME);
    const statusLogPath = resolveRepoPath(STATUS_LOG_PATH);

    const [prdContent, statusContent] = await Promise.all([
        loadFile(prdPath),
        loadFile(statusLogPath),
    ]);

    const { content: nextPrd, added } = appendIssueUpdatesToPrd(prdContent, updates);

    if (added.length === 0) {
        console.log('All issues already recorded in PRD.md. No new entries added.');
        return;
    }

    const nextStatusLog = appendStatusLog(statusContent, added);

    await Promise.all([
        saveFile(prdPath, nextPrd),
        saveFile(statusLogPath, nextStatusLog),
    ]);

    console.log(`Updated PRD.md with ${added.length} issue update(s) and logged to Status/status-log.md.`);
}

if (require.main === module) {
    run().catch((error) => {
        console.error('Failed to update PRD/Status from GitHub issues:', error);
        process.exitCode = 1;
    });
}
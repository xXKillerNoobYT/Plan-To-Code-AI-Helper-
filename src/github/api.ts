/**
 * GitHub API Integration
 * Wrapper around Octokit for GitHub operations
 */

import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';
import { ConfigManager } from '../utils/config';

export class GitHubAPI {
    private octokit: Octokit | null = null;
    private isAuthenticated: boolean = false;
    private context: vscode.ExtensionContext | null = null;

    /**
     * Set extension context for secure token access
     */
    setContext(context: vscode.ExtensionContext): void {
        this.context = context;
    }

    /**
     * Initialize GitHub API with authentication
     * Uses SecretStorage for secure token retrieval
     */
    async authenticate(token?: string): Promise<boolean> {

        try {
            // Get token from SecretStorage if not provided
            if (!token && this.context) {
                token = await ConfigManager.getGitHubToken(this.context);
            }

            if (!token) {
                this.isAuthenticated = false;
                return false;
            }

            // Initialize Octokit client
            this.octokit = new Octokit({
                auth: token,
            });

            // Verify authentication by getting user info
            await this.octokit.users.getAuthenticated();

            this.isAuthenticated = true;
            return true;
        } catch (error) {
            this.isAuthenticated = false;
            return false;
        }
    }

    /**
     * Get a single issue
     */
    async getIssue(_owner: string, _repo: string, _issueNumber: number): Promise<any> {
        // TODO: Fetch issue from GitHub
        throw new Error('Not implemented');
    }

    /**
     * Create a new issue
     */
    async createIssue(_owner: string, _repo: string, _title: string, _body: string): Promise<any> {
        // TODO: Create issue on GitHub
        throw new Error('Not implemented');
    }

    /**
     * Update an existing issue
     */
    async updateIssue(owner: string, repo: string, issueNumber: number, updates: any): Promise<any> {
        if (!this.isAuthenticated || !this.octokit) {
            throw new Error('Not authenticated');
        }

        const response = await this.octokit.issues.update({
            owner,
            repo,
            issue_number: issueNumber,
            ...updates,
        });

        return response.data;
    }

    /**
     * List all issues for a repository
     */
    async listIssues(owner: string, repo: string, filters?: any): Promise<any[]> {
        if (!this.isAuthenticated || !this.octokit) {
            throw new Error('Not authenticated');
        }

        const response = await this.octokit.issues.listForRepo({
            owner,
            repo,
            ...filters,
        });

        return response.data;
    }
}



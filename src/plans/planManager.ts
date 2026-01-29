/**
 * Plan Manager
 * Loads, parses, and manages plan.json files
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PlanData {
    version: string;
    project: string;
    tasks: any[];
    metadata?: any;
}

export class PlanManager {
    private planPath: string;
    private currentPlan: PlanData | null = null;

    constructor() {
        // Default to Docs/Plans/plan.json
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        this.planPath = path.join(workspaceRoot, 'Docs', 'Plans', 'plan.json');
    }

    /**
     * Load plan from disk
     */
    async loadPlan(): Promise<PlanData | null> {
        try {
            const content = await fs.readFile(this.planPath, 'utf-8');
            this.currentPlan = JSON.parse(content);
            return this.currentPlan;
        } catch (error) {
            return null;
        }
    }

    /**
     * Save plan to disk
     */
    async savePlan(plan: PlanData): Promise<boolean> {
        try {
            await fs.writeFile(this.planPath, JSON.stringify(plan, null, 2), 'utf-8');
            this.currentPlan = plan;
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get current plan
     */
    getCurrentPlan(): PlanData | null {
        return this.currentPlan;
    }

    /**
     * Update plan path
     */
    setPlanPath(newPath: string): void {
        this.planPath = newPath;
    }
}



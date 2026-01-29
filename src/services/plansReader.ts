/**
 * Plans Reader Service
 * 
 * Reads all markdown files from the Plans/ folder recursively.
 * Filters out backup files, ipynb files, and temporary files.
 * 
 * @module plansReader
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * 📄 Plan File Information
 */
export interface PlanFile {
    path: string;                    // Full file path
    relativeDir: string;             // Relative directory (e.g., "Plans", "Plans/COE-Master-Plan")
    name: string;                    // File name (e.g., "CONSOLIDATED-MASTER-PLAN.md")
    size: number;                    // File size in bytes
    content: string;                 // File content
    category?: string;               // Category (architecture, agent-spec, workflow, etc.)
    priority?: number;               // Reading priority (lower = read first)
}

/**
 * 🔍 Plans Reader Service
 * Reads and categorizes plan files from the Plans/ folder
 */
export class PlansReader {
    /**
     * Priority mapping for important files
     * Lower number = higher priority (read first)
     */
    private static readonly FILE_PRIORITY: Record<string, number> = {
        'CONSOLIDATED-MASTER-PLAN.md': 1,
        'README.md': 2,
        '02-Agent-Role-Definitions.md': 3,
        '05-MCP-API-Reference.md': 4,
        'MODULAR-EXECUTION-PHILOSOPHY.md': 5,
        'PLANNING-WIZARD-SPECIFICATION.md': 6,
        'ANSWER-AI-TEAM-SPECIFICATION.md': 7,
    };

    /**
     * 📂 Read all plan files from the Plans/ folder
     * 
     * @returns Array of plan files sorted by priority
     * @throws Error if Plans folder not found or read fails
     */
    static async readAllPlans(): Promise<PlanFile[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const plansDir = path.join(workspaceRoot, 'Plans');

        try {
            // Check if Plans directory exists
            await fs.access(plansDir);
        } catch {
            throw new Error(`Plans directory not found at ${plansDir}`);
        }

        const planFiles: PlanFile[] = [];

        // Recursively read all .md files
        const readDir = async (dir: string, baseDir: string = 'Plans'): Promise<void> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativeDir = path.relative(plansDir, fullPath);

                // Skip backup, temp, and ipynb files
                if (
                    entry.name.startsWith('old-') ||
                    entry.name.startsWith('temp-') ||
                    entry.name.startsWith('.') ||
                    entry.name.endsWith('.ipynb') ||
                    entry.name.endsWith('.backup')
                ) {
                    continue;
                }

                if (entry.isDirectory()) {
                    // Recursively read subdirectories
                    await readDir(fullPath, path.join(baseDir, entry.name));
                } else if (entry.name.endsWith('.md')) {
                    // Read markdown file
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        const stats = await fs.stat(fullPath);

                        // Determine category based on file name or directory
                        let category = 'general';
                        if (entry.name.includes('Agent') || entry.name.includes('Team')) {
                            category = 'agent-spec';
                        } else if (entry.name.includes('MCP')) {
                            category = 'api-reference';
                        } else if (entry.name.includes('Workflow') || entry.name.includes('Process')) {
                            category = 'workflow';
                        } else if (entry.name.includes('Architecture')) {
                            category = 'architecture';
                        }

                        // Get priority from mapping, or use default
                        const priority = this.FILE_PRIORITY[entry.name] || 999;

                        planFiles.push({
                            path: fullPath,
                            relativeDir: path.dirname(relativeDir) || 'Plans',
                            name: entry.name,
                            size: stats.size,
                            content,
                            category,
                            priority,
                        });
                    } catch (error) {
                        const errMsg = error instanceof Error ? error.message : String(error);
                    }
                }
            }
        };

        await readDir(plansDir);

        // Sort by priority (ascending)
        planFiles.sort((a, b) => (a.priority || 999) - (b.priority || 999));

        return planFiles;
    }

    /**
     * 📊 Estimate token count for content
     * Rough estimation: ~1 token per 4 characters for English text
     * 
     * @param content - Text content
     * @returns Estimated token count
     */
    static estimateTokens(content: string): number {
        // Rough estimation: 1 token ≈ 4 characters in English
        return Math.ceil(content.length / 4);
    }

    /**
     * 📋 Get category label for display
     * 
     * @param category - Category string
     * @returns Human-readable category name
     */
    static getCategoryLabel(category?: string): string {
        const labels: Record<string, string> = {
            'agent-spec': 'Agent Specification',
            'api-reference': 'API Reference',
            'workflow': 'Workflow',
            'architecture': 'Architecture',
            'general': 'General',
        };
        return labels[category || 'general'] || 'Unknown';
    }
}



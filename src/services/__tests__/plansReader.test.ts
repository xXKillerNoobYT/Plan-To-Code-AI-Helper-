/**
 * Plans Reader Service Tests
 */

import { PlansReader } from '../plansReader';
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock vscode
jest.mock('vscode');

// Mock fs/promises
jest.mock('fs/promises');

describe('PlansReader', () => {
    const mockWorkspacePath = '/mock/workspace';
    const mockPlansPath = path.join(mockWorkspacePath, 'Plans');

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup default vscode workspace mock
        (vscode.workspace as any).workspaceFolders = [
            {
                uri: { fsPath: mockWorkspacePath },
                name: 'test-workspace',
                index: 0
            }
        ];
    });

    describe('readAllPlans', () => {
        it('should throw error when no workspace folder found', async () => {
            (vscode.workspace as any).workspaceFolders = undefined;

            await expect(PlansReader.readAllPlans()).rejects.toThrow(
                'No workspace folder found'
            );
        });

        it('should throw error when Plans directory does not exist', async () => {
            (fs.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

            await expect(PlansReader.readAllPlans()).rejects.toThrow(
                `Plans directory not found at ${mockPlansPath}`
            );
        });

        it('should read all markdown files from Plans folder', async () => {
            // Mock Plans directory exists
            (fs.access as jest.Mock).mockResolvedValue(undefined);

            // Mock directory structure
            const mockEntries = [
                {
                    name: 'CONSOLIDATED-MASTER-PLAN.md',
                    isDirectory: () => false
                },
                {
                    name: 'README.md',
                    isDirectory: () => false
                },
                {
                    name: '02-Agent-Role-Definitions.md',
                    isDirectory: () => false
                }
            ];

            (fs.readdir as jest.Mock).mockResolvedValue(mockEntries);
            (fs.readFile as jest.Mock).mockImplementation((filePath: string) => {
                const fileName = path.basename(filePath);
                return Promise.resolve(`# ${fileName}\n\nContent for ${fileName}`);
            });
            (fs.stat as jest.Mock).mockResolvedValue({ size: 1234 });

            const files = await PlansReader.readAllPlans();

            expect(files.length).toBe(3);
            expect(files.every(f => f.name.endsWith('.md'))).toBe(true);
            expect(files[0].content).toContain('CONSOLIDATED-MASTER-PLAN.md');
        });

        it('should filter out backup and temp files', async () => {
            (fs.access as jest.Mock).mockResolvedValue(undefined);

            const mockEntries = [
                { name: 'CONSOLIDATED-MASTER-PLAN.md', isDirectory: () => false },
                { name: 'old-plan.md', isDirectory: () => false },
                { name: 'temp-notes.md', isDirectory: () => false },
                { name: '.hidden.md', isDirectory: () => false },
                { name: 'notebook.ipynb', isDirectory: () => false },
                { name: 'backup.md.backup', isDirectory: () => false },
                { name: 'README.md', isDirectory: () => false }
            ];

            (fs.readdir as jest.Mock).mockResolvedValue(mockEntries);
            (fs.readFile as jest.Mock).mockResolvedValue('# Content');
            (fs.stat as jest.Mock).mockResolvedValue({ size: 100 });

            const files = await PlansReader.readAllPlans();

            // Should only include CONSOLIDATED-MASTER-PLAN.md and README.md
            expect(files.length).toBe(2);
            expect(files.some(f => f.name.startsWith('old-'))).toBe(false);
            expect(files.some(f => f.name.startsWith('temp-'))).toBe(false);
            expect(files.some(f => f.name.startsWith('.'))).toBe(false);
            expect(files.some(f => f.name.endsWith('.ipynb'))).toBe(false);
            expect(files.some(f => f.name.endsWith('.backup'))).toBe(false);
        });

        it('should recursively read subdirectories', async () => {
            (fs.access as jest.Mock).mockResolvedValue(undefined);

            // First call to readdir (Plans/)
            // Second call to readdir (Plans/COE-Master-Plan/)
            (fs.readdir as jest.Mock)
                .mockResolvedValueOnce([
                    { name: 'README.md', isDirectory: () => false },
                    { name: 'COE-Master-Plan', isDirectory: () => true }
                ])
                .mockResolvedValueOnce([
                    { name: '01-Architecture-Document.md', isDirectory: () => false }
                ]);

            (fs.readFile as jest.Mock).mockResolvedValue('# Content');
            (fs.stat as jest.Mock).mockResolvedValue({ size: 200 });

            const files = await PlansReader.readAllPlans();

            expect(files.length).toBe(2);
            expect(files.some(f => f.name === 'README.md')).toBe(true);
            expect(files.some(f => f.name === '01-Architecture-Document.md')).toBe(true);
        });

        it('should prioritize files correctly', async () => {
            (fs.access as jest.Mock).mockResolvedValue(undefined);

            const mockEntries = [
                { name: 'random-file.md', isDirectory: () => false },
                { name: 'CONSOLIDATED-MASTER-PLAN.md', isDirectory: () => false },
                { name: 'README.md', isDirectory: () => false },
                { name: '02-Agent-Role-Definitions.md', isDirectory: () => false }
            ];

            (fs.readdir as jest.Mock).mockResolvedValue(mockEntries);
            (fs.readFile as jest.Mock).mockResolvedValue('# Content');
            (fs.stat as jest.Mock).mockResolvedValue({ size: 300 });

            const files = await PlansReader.readAllPlans();

            // Should be sorted by priority
            expect(files[0].name).toBe('CONSOLIDATED-MASTER-PLAN.md');
            expect(files[0].priority).toBe(1);
            expect(files[1].name).toBe('README.md');
            expect(files[1].priority).toBe(2);
            expect(files[2].name).toBe('02-Agent-Role-Definitions.md');
            expect(files[2].priority).toBe(3);
            expect(files[3].name).toBe('random-file.md');
            expect(files[3].priority).toBe(999); // Default priority
        });

        it('should categorize files correctly', async () => {
            (fs.access as jest.Mock).mockResolvedValue(undefined);

            const mockEntries = [
                { name: 'Agent-Role-Definitions.md', isDirectory: () => false },
                { name: 'MCP-API-Reference.md', isDirectory: () => false },
                { name: 'Workflow-Guide.md', isDirectory: () => false },
                { name: 'Architecture-Document.md', isDirectory: () => false },
                { name: 'random-notes.md', isDirectory: () => false }
            ];

            (fs.readdir as jest.Mock).mockResolvedValue(mockEntries);
            (fs.readFile as jest.Mock).mockResolvedValue('# Content');
            (fs.stat as jest.Mock).mockResolvedValue({ size: 400 });

            const files = await PlansReader.readAllPlans();

            const agentFile = files.find(f => f.name.includes('Agent'));
            const mcpFile = files.find(f => f.name.includes('MCP'));
            const workflowFile = files.find(f => f.name.includes('Workflow'));
            const archFile = files.find(f => f.name.includes('Architecture'));
            const randomFile = files.find(f => f.name === 'random-notes.md');

            expect(agentFile?.category).toBe('agent-spec');
            expect(mcpFile?.category).toBe('api-reference');
            expect(workflowFile?.category).toBe('workflow');
            expect(archFile?.category).toBe('architecture');
            expect(randomFile?.category).toBe('general');
        });

        it('should handle file read errors gracefully', async () => {
            (fs.access as jest.Mock).mockResolvedValue(undefined);

            const mockEntries = [
                { name: 'good-file.md', isDirectory: () => false },
                { name: 'bad-file.md', isDirectory: () => false }
            ];

            (fs.readdir as jest.Mock).mockResolvedValue(mockEntries);
            (fs.readFile as jest.Mock).mockImplementation((filePath: string) => {
                if (filePath.includes('bad-file')) {
                    return Promise.reject(new Error('Permission denied'));
                }
                return Promise.resolve('# Content');
            });
            (fs.stat as jest.Mock).mockResolvedValue({ size: 500 });

            const files = await PlansReader.readAllPlans();

            // Should only include the successfully read file
            expect(files.length).toBe(1);
            expect(files[0].name).toBe('good-file.md');
        });

        it('should include all expected fields in PlanFile objects', async () => {
            (fs.access as jest.Mock).mockResolvedValue(undefined);

            const mockEntries = [
                { name: 'test-plan.md', isDirectory: () => false }
            ];

            (fs.readdir as jest.Mock).mockResolvedValue(mockEntries);
            (fs.readFile as jest.Mock).mockResolvedValue('# Test Plan\n\nThis is test content.');
            (fs.stat as jest.Mock).mockResolvedValue({ size: 42 });

            const files = await PlansReader.readAllPlans();

            expect(files.length).toBe(1);
            const file = files[0];

            expect(file.path).toBe(path.join(mockPlansPath, 'test-plan.md'));
            expect(file.relativeDir).toBe('.'); // Root of Plans folder
            expect(file.name).toBe('test-plan.md');
            expect(file.size).toBe(42);
            expect(file.content).toBe('# Test Plan\n\nThis is test content.');
            expect(file.category).toBeDefined();
            expect(file.priority).toBeDefined();
        });
    });

    describe('estimateTokens', () => {
        it('should estimate tokens for content', () => {
            const content = 'This is a test content with exactly 40 characters.';
            const tokens = PlansReader.estimateTokens(content);

            // Should be roughly 1 token per 4 characters
            expect(tokens).toBe(Math.ceil(50 / 4)); // 13 tokens
        });

        it('should return 0 for empty content', () => {
            const tokens = PlansReader.estimateTokens('');
            expect(tokens).toBe(0);
        });

        it('should handle large content', () => {
            const largeContent = 'a'.repeat(10000);
            const tokens = PlansReader.estimateTokens(largeContent);

            expect(tokens).toBe(Math.ceil(10000 / 4)); // 2500 tokens
        });

        it('should round up partial tokens', () => {
            const content = 'abc'; // 3 characters
            const tokens = PlansReader.estimateTokens(content);

            expect(tokens).toBe(1); // Should round up from 0.75
        });

        it('should estimate tokens for markdown content', () => {
            const markdown = '# Heading\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2';
            const tokens = PlansReader.estimateTokens(markdown);

            expect(tokens).toBeGreaterThan(0);
            expect(tokens).toBe(Math.ceil(markdown.length / 4));
        });
    });

    describe('getCategoryLabel', () => {
        it('should return correct labels for known categories', () => {
            expect(PlansReader.getCategoryLabel('agent-spec')).toBe('Agent Specification');
            expect(PlansReader.getCategoryLabel('api-reference')).toBe('API Reference');
            expect(PlansReader.getCategoryLabel('workflow')).toBe('Workflow');
            expect(PlansReader.getCategoryLabel('architecture')).toBe('Architecture');
            expect(PlansReader.getCategoryLabel('general')).toBe('General');
        });

        it('should return Unknown for unrecognized category', () => {
            expect(PlansReader.getCategoryLabel('unknown-category')).toBe('Unknown');
            expect(PlansReader.getCategoryLabel('random')).toBe('Unknown');
        });

        it('should handle undefined category', () => {
            expect(PlansReader.getCategoryLabel(undefined)).toBe('General');
        });

        it('should handle empty string category', () => {
            expect(PlansReader.getCategoryLabel('')).toBe('General'); // Empty string uses default
        });
    });
});



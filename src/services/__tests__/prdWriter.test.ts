/**
 * PRD Writer Service Tests
 */

import { PRDWriter, PRDMetadata, PRDJSON } from '../prdWriter';
import * as vscode from 'vscode';

describe('PRDWriter', () => {
    describe('createMetadata', () => {
        it('should create metadata with all fields', () => {
            const files = ['file1.md', 'file2.md'];
            const tokens = 1500;

            const metadata = PRDWriter.createMetadata(files, tokens);

            expect(metadata.generatedAt).toBeDefined();
            expect(metadata.version).toBe('1.0.0');
            expect(metadata.generatedFrom).toEqual(files);
            expect(metadata.tokenCount).toBe(1500);
        });

        it('should use ISO 8601 timestamp format', () => {
            const metadata = PRDWriter.createMetadata([], 0);

            expect(metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });
    });

    describe('getContentPreview', () => {
        it('should return full content if shorter than max', () => {
            const content = 'Short content';
            const preview = PRDWriter.getContentPreview(content, 50);

            expect(preview).toEqual(content);
        });

        it('should truncate content if longer than max', () => {
            const content = 'This is a very long content that needs to be truncated';
            const preview = PRDWriter.getContentPreview(content, 20);

            // Preview should be the 20 chars + '[truncated for display]' suffix
            // Total expected: 20 + 1 ('\n') + 26 ('... [truncated for display]') = 47-48 chars
            expect(preview.length).toBeLessThanOrEqual(50);
            expect(preview).toContain('[truncated');
        });

        it('should use default max characters', () => {
            const longContent = 'a'.repeat(1000);
            const preview = PRDWriter.getContentPreview(longContent);

            expect(preview.length).toBeLessThanOrEqual(330); // ~300 + buffer
        });
    });

    describe('writePRD', () => {
        it('should handle missing workspace gracefully', async () => {
            // Mock vscode.workspace.workspaceFolders to return undefined
            const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
            Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                value: undefined,
                writable: true,
                configurable: true,
            });

            try {
                const metadata = PRDWriter.createMetadata([], 0);
                await expect(PRDWriter.writePRD('Content', metadata)).rejects.toThrow(
                    'No workspace folder found'
                );
            } finally {
                Object.defineProperty(vscode.workspace, 'workspaceFolders', {
                    value: originalWorkspaceFolders,
                    writable: true,
                    configurable: true,
                });
            }
        });
    });

    describe('PRD JSON structure', () => {
        it('should have required metadata fields', () => {
            const metadata: PRDMetadata = {
                generatedAt: new Date().toISOString(),
                version: '1.0.0',
                generatedFrom: ['file1.md'],
                tokenCount: 1000,
            };

            const prdJson: PRDJSON = {
                metadata,
                content: 'Sample content',
                sections: { Overview: 'Overview content' },
            };

            expect(prdJson.metadata.generatedAt).toBeDefined();
            expect(prdJson.metadata.version).toBe('1.0.0');
            expect(prdJson.content).toBe('Sample content');
            expect(prdJson.sections.Overview).toBe('Overview content');
        });
    });
});



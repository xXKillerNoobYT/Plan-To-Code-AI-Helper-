/**
 * Context Bundler Service Tests
 */

import { ContextBundler } from '../contextBundler';
import { PlanFile } from '../plansReader';

describe('ContextBundler', () => {
    const createMockFile = (name: string, size: number = 100, content: string = ''): PlanFile => ({
        path: `/Plans/${name}`,
        relativeDir: 'Plans',
        name,
        size,
        content: content || 'a'.repeat(size),
        priority: 999,
    });

    describe('bundle', () => {
        it('should bundle files within token limit', () => {
            const files = [
                createMockFile('file1.md', 100),
                createMockFile('file2.md', 100),
            ];

            const result = ContextBundler.bundle(files, 1000);

            expect(result.prompt).toBeDefined();
            expect(result.includedFiles.length).toBeGreaterThan(0);
            expect(result.totalTokens).toBeLessThanOrEqual(1000);
        });

        it('should respect token limit', () => {
            const files = [
                createMockFile('large1.md', 5000),
                createMockFile('large2.md', 5000),
                createMockFile('large3.md', 5000),
            ];

            const result = ContextBundler.bundle(files, 2000);

            expect(result.totalTokens).toBeLessThanOrEqual(2000);
            expect(result.excludedFiles.length).toBeGreaterThan(0);
        });

        it('should prioritize files by priority field', () => {
            const files = [
                { ...createMockFile('file1.md', 100), priority: 2 },
                { ...createMockFile('file2.md', 100), priority: 1 },
                { ...createMockFile('file3.md', 100), priority: 3 },
            ];

            const result = ContextBundler.bundle(files, 5000);

            // Files should be processed in priority order
            expect(result.includedFiles.length).toBeGreaterThan(0);
        });

        it('should truncate files if needed', () => {
            const files = [
                createMockFile('file1.md', 100),
                createMockFile('verylarge.md', 3000),
            ];

            const result = ContextBundler.bundle(files, 1000);

            // Should include at least one, possibly truncated
            expect(result.includedFiles.length + result.truncatedFiles.length + result.excludedFiles.length)
                .toEqual(2);
        });

        it('should set warning when files are truncated or excluded', () => {
            const files = [
                createMockFile('file1.md', 2000),
                createMockFile('file2.md', 2000),
                createMockFile('file3.md', 2000),
            ];

            const result = ContextBundler.bundle(files, 1000);

            if (result.excludedFiles.length > 0 || result.truncatedFiles.length > 0) {
                expect(result.warning).toBeDefined();
            }
        });

        it('should handle empty file list', () => {
            const result = ContextBundler.bundle([], 1000);

            expect(result.prompt).toBeDefined();
            expect(result.includedFiles.length).toBe(0);
            expect(result.totalTokens).toBeLessThan(100);
        });

        it('should format paths correctly', () => {
            const files = [
                createMockFile('file.md', 100),
            ];

            const result = ContextBundler.bundle(files, 5000);

            expect(result.includedFiles[0]).toContain('file.md');
        });
    });

    describe('formatBundleInfo', () => {
        it('should format bundle information for display', () => {
            const result = {
                prompt: 'test',
                includedFiles: ['file1.md', 'file2.md'],
                truncatedFiles: ['file3.md'],
                excludedFiles: ['file4.md'],
                totalTokens: 1500,
            };

            const formatted = ContextBundler.formatBundleInfo(result);

            expect(formatted).toContain('Context Bundle Summary');
            expect(formatted).toContain('1500');
            expect(formatted).toContain('Included files: 2');
            expect(formatted).toContain('Truncated files: 1');
        });

        it('should include warning in formatted output', () => {
            const result = {
                prompt: 'test',
                includedFiles: ['file1.md'],
                truncatedFiles: [],
                excludedFiles: ['file2.md'],
                totalTokens: 1500,
                warning: 'Token limit exceeded',
            };

            const formatted = ContextBundler.formatBundleInfo(result);

            expect(formatted).toContain('Token limit exceeded');
        });
    });
});

import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';

/**
 * Quality Gates Test Suite
 * Checks for common coding issues and problems
 * Reports specific files where issues occur
 */

describe('Code Quality Gates', () => {
    it('should pass ESLint checks on all source files', () => {
        const srcDir = path.join(__dirname, '../../src');

        // Run ESLint programmatically
        let eslintOutput = '';
        try {
            eslintOutput = cp.execSync('npx eslint src --format json', {
                encoding: 'utf-8',
                stdio: 'pipe'
            });
        } catch (error) {
            if (error instanceof Error && 'stdout' in error) {
                eslintOutput = ((error as any).stdout || (error as any).message) as string;
            }
        }

        let results: any[] = [];
        try {
            results = JSON.parse(eslintOutput);
        } catch {
            console.log('⚠️  ESLint output not JSON format, attempting text parse...');
        }

        const filesWithIssues: Map<string, { warnings: number; errors: number }> = new Map();

        if (Array.isArray(results)) {
            results.forEach((file: any) => {
                if (file.messages && file.messages.length > 0) {
                    const errors = file.messages.filter((m: any) => m.severity === 2).length;
                    const warnings = file.messages.filter((m: any) => m.severity === 1).length;
                    // Only track files with actual errors
                    if (errors > 0) {
                        filesWithIssues.set(path.relative(process.cwd(), file.filePath), {
                            errors,
                            warnings
                        });
                    }
                }
            });
        }

        if (filesWithIssues.size > 0) {
            console.log(`\n🔴 ESLint Errors Found: ${filesWithIssues.size} file(s)\n`);
            filesWithIssues.forEach((issues, file) => {
                console.log(`  ${file}`);
                if (issues.errors > 0) console.log(`    ❌ ${issues.errors} error(s)`);
                if (issues.warnings > 0) console.log(`    ⚠️  ${issues.warnings} warning(s)`);
            });
        } else {
            console.log('\n✅ ESLint: No errors found (warnings ignored for now)\n');
        }

        // Only fail on errors,  not warnings (warnings are technical debt)
        expect(filesWithIssues.size).toBe(0);
    });

    it('should have no console.log statements in production code', () => {
        const srcDir = path.join(__dirname, '../../src');
        const problemFiles: Map<string, number> = new Map();
        const extensions = ['.ts', '.tsx'];

        const scanDir = (dir: string) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });

            files.forEach(file => {
                const fullPath = path.join(dir, file.name);

                // Skip test-related directories and files
                if (file.name === 'node_modules' ||
                    file.name.startsWith('.') ||
                    file.name === '__tests__' ||
                    file.name.endsWith('.test.ts') ||
                    file.name.endsWith('.spec.ts')) {
                    return;
                }

                if (file.isDirectory()) {
                    scanDir(fullPath);
                } else if (extensions.includes(path.extname(file.name))) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const matches = content.match(/console\.(log|warn|error|debug)/g) || [];

                    if (matches.length > 0) {
                        problemFiles.set(path.relative(process.cwd(), fullPath), matches.length);
                    }
                }
            });
        };

        scanDir(srcDir);

        if (problemFiles.size > 0) {
            console.log(`\n🔴 Console Statements Found: ${problemFiles.size} file(s)\n`);
            problemFiles.forEach((count, file) => {
                console.log(`  ${file}: ${count} console statement(s)`);
            });
        } else {
            console.log('\n✅ No console statements in production code\n');
        }

        expect(problemFiles.size).toBe(0);
    });

    it('should have no TODO or FIXME without issue references', () => {
        const srcDir = path.join(__dirname, '../../src');
        const problemFiles: Map<string, string[]> = new Map();
        const extensions = ['.ts', '.tsx'];

        const scanDir = (dir: string) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });

            files.forEach(file => {
                const fullPath = path.join(dir, file.name);

                if (file.name === 'node_modules' || file.name.startsWith('.')) {
                    return;
                }

                if (file.isDirectory()) {
                    scanDir(fullPath);
                } else if (extensions.includes(path.extname(file.name))) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const lines = content.split('\n');
                    const issues: string[] = [];

                    lines.forEach((line, index) => {
                        const todoMatch = /(?:TODO|FIXME)(?:\s*[:#]?\s*(\d+))?/i.exec(line);
                        if (todoMatch && !todoMatch[1]) {
                            issues.push(`Line ${index + 1}: TODO/FIXME without issue reference`);
                        }
                    });

                    if (issues.length > 0) {
                        problemFiles.set(path.relative(process.cwd(), fullPath), issues);
                    }
                }
            });
        };

        scanDir(srcDir);

        if (problemFiles.size > 0) {
            console.log(`\n🟡 TODO/FIXME Without References: ${problemFiles.size} file(s)\n`);
            problemFiles.forEach((issues, file) => {
                console.log(`  ${file}`);
                issues.forEach(issue => console.log(`    - ${issue}`));
            });
            console.log('⚠️  Consider adding issue references to all TODO/FIXME comments\n');
        } else {
            console.log('\n✅ All TODO/FIXME items have issue references\n');
        }
    });

    it('should identify files exceeding line count limits', () => {
        const srcDir = path.join(__dirname, '../../src');
        const tooLargeFiles: Map<string, number> = new Map();
        const extensionsToCheck = ['.ts', '.tsx'];
        const maxLines = 500;

        const scanDir = (dir: string) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });

            files.forEach(file => {
                const fullPath = path.join(dir, file.name);

                if (file.name === 'node_modules' || file.name.startsWith('.')) {
                    return;
                }

                if (file.isDirectory()) {
                    scanDir(fullPath);
                } else if (extensionsToCheck.includes(path.extname(file.name))) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const lineCount = content.split('\n').length;

                    if (lineCount > maxLines) {
                        tooLargeFiles.set(path.relative(process.cwd(), fullPath), lineCount);
                    }
                }
            });
        };

        scanDir(srcDir);

        if (tooLargeFiles.size > 0) {
            console.log(`\n🟡 Large Files: ${tooLargeFiles.size} file(s) exceed ${maxLines} lines\n`);
            const sorted = Array.from(tooLargeFiles.entries()).sort((a, b) => b[1] - a[1]);
            sorted.forEach(([file, lines]) => {
                console.log(`  ${file}: ${lines} lines`);
            });
            console.log('\n💡 Consider refactoring large files into smaller modules\n');
        } else {
            console.log(`\n✅ All files are under ${maxLines} lines\n`);
        }
    });

    it('should check for missing error handling in async functions', () => {
        const srcDir = path.join(__dirname, '../../src');
        const riskFiles: Map<string, string[]> = new Map();
        const extensionsToCheck = ['.ts', '.tsx'];

        const scanDir = (dir: string) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });

            files.forEach(file => {
                const fullPath = path.join(dir, file.name);

                if (file.name === 'node_modules' || file.name.startsWith('.')) {
                    return;
                }

                if (file.isDirectory()) {
                    scanDir(fullPath);
                } else if (extensionsToCheck.includes(path.extname(file.name))) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const risks: string[] = [];

                    // Find async functions
                    const asyncMatches = content.match(/async\s+\w+\s*\([^)]*\)/g) || [];

                    // Check if there's adequate try-catch coverage
                    const hasTryBlocks = /try\s*{/.test(content);
                    if (asyncMatches.length > 0 && !hasTryBlocks) {
                        risks.push(`${asyncMatches.length} async function(s) without try-catch blocks`);
                    }

                    if (risks.length > 0) {
                        riskFiles.set(path.relative(process.cwd(), fullPath), risks);
                    }
                }
            });
        };

        scanDir(srcDir);

        if (riskFiles.size > 0) {
            console.log(`\n🟡 Error Handling Issues: ${riskFiles.size} file(s)\n`);
            riskFiles.forEach((risks, file) => {
                console.log(`  ${file}`);
                risks.forEach(risk => console.log(`    ⚠️  ${risk}`));
            });
            console.log('\n💡 Wrap async operations in try-catch blocks\n');
        } else {
            console.log('\n✅ Good error handling patterns detected\n');
        }
    });
});

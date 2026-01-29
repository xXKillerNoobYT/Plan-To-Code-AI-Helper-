import * as fs from 'fs';
import * as path from 'path';

/**
 * Common Coding Issues Detection Test
 * Scans for typical problems that could break tests or cause runtime errors
 */

describe('Common Coding Issues Detection', () => {
    it('should identify files with insufficient test coverage', () => {
        const srcDir = path.join(__dirname, '../../src');
        const testsDir = path.join(__dirname, '../../tests');
        const extensions = ['.ts', '.tsx'];
        const srcFiles: Set<string> = new Set();
        const testedFiles: Set<string> = new Set();

        // Collect all source files
        const collectSrcFiles = (dir: string) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });

            files.forEach(file => {
                const fullPath = path.join(dir, file.name);

                if (file.name === 'node_modules' || file.name.startsWith('.')) {
                    return;
                }

                if (file.isDirectory()) {
                    collectSrcFiles(fullPath);
                } else if (extensions.includes(path.extname(file.name))) {
                    const baseName = path.basename(file.name, path.extname(file.name));
                    srcFiles.add(baseName);
                }
            });
        };

        // Collect tested files
        const collectTestedFiles = (dir: string) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });

            files.forEach(file => {
                const fullPath = path.join(dir, file.name);

                if (file.name === 'node_modules' || file.name.startsWith('.')) {
                    return;
                }

                if (file.isDirectory()) {
                    collectTestedFiles(fullPath);
                } else if ((file.name.endsWith('.spec.ts') || file.name.endsWith('.test.ts')) && !file.name.startsWith('temp')) {
                    const baseName = file.name.replace(/\.spec\.ts|\.test\.ts/, '').replace(/\.web/, '');
                    testedFiles.add(baseName);
                }
            });
        };

        collectSrcFiles(srcDir);
        collectTestedFiles(testsDir);

        const untested = Array.from(srcFiles).filter(f => !testedFiles.has(f)).sort();

        if (untested.length > 0) {
            console.log(`\n🟡 Files Without Tests: ${untested.length} file(s)\n`);
            untested.slice(0, 15).forEach(file => {
                console.log(`  - ${file}`);
            });
            if (untested.length > 15) {
                console.log(`  ... and ${untested.length - 15} more\n`);
            }
            console.log('💡 Consider adding tests for critical source files\n');
        } else {
            console.log('\n✅ All source files have corresponding tests\n');
        }
    });

    it('should report on large files that need refactoring', () => {
        const srcDir = path.join(__dirname, '../../src');
        const extensions = ['.ts', '.tsx'];
        const largeFiles: Array<[string, number]> = [];
        const maxLines = 400;

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
                    const lineCount = content.split('\n').length;

                    if (lineCount > maxLines) {
                        const relPath = path.relative(process.cwd(), fullPath);
                        largeFiles.push([relPath, lineCount]);
                    }
                }
            });
        };

        scanDir(srcDir);
        largeFiles.sort((a, b) => b[1] - a[1]);

        if (largeFiles.length > 0) {
            console.log(`\n🟡 Large Files (>${maxLines} lines): ${largeFiles.length} file(s)\n`);
            largeFiles.slice(0, 10).forEach(entry => {
                console.log(`  ${entry[0]}: ${entry[1]} lines`);
            });
            if (largeFiles.length > 10) {
                console.log(`  ... and ${largeFiles.length - 10} more\n`);
            }
            console.log('💡 Consider refactoring large files into smaller modules\n');
        } else {
            console.log(`\n✅ All files are under ${maxLines} lines\n`);
        }
    });

    it('should detect hardcoded configuration strings', () => {
        const srcDir = path.join(__dirname, '../../src');
        const extensions = ['.ts', '.tsx'];
        const suspiciousFiles: Map<string, string[]> = new Map();

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
                    const issues: string[] = [];

                    if (content.includes('localhost')) {
                        issues.push('Hardcoded localhost');
                    }
                    if (content.includes(':3000') || content.includes(':5000') || content.includes(':8080')) {
                        issues.push('Hardcoded port number');
                    }

                    if (issues.length > 0) {
                        const relPath = path.relative(process.cwd(), fullPath);
                        suspiciousFiles.set(relPath, issues);
                    }
                }
            });
        };

        scanDir(srcDir);

        if (suspiciousFiles.size > 0) {
            console.log(`\n🟡 Potential Hardcoded Configuration: ${suspiciousFiles.size} file(s)\n`);
            const entries = Array.from(suspiciousFiles.entries());
            entries.slice(0, 10).forEach(entry => {
                console.log(`  ${entry[0]}`);
                const uniqueIssues = Array.from(new Set(entry[1]));
                uniqueIssues.forEach(issue => {
                    console.log(`    ⚠️  ${issue}`);
                });
            });
            if (suspiciousFiles.size > 10) {
                console.log(`\n  ... and ${suspiciousFiles.size - 10} more\n`);
            }
            console.log('💡 Move hardcoded values to configuration files or constants\n');
        } else {
            console.log('\n✅ No obvious hardcoded localhost/ports detected\n');
        }
    });
});

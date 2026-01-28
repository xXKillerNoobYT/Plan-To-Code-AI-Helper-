import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { execSync } from 'child_process';

describe('Quality Gates (Warning-Only)', () => {
    describe('Skipped Test Detector', () => {
        it('should detect and warn about skipped tests (.skip, .only, .pending)', async () => {
            const projectRoot = path.resolve(__dirname, '../..');
            const testPatterns = [
                path.join(projectRoot, 'src/**/*.test.ts'),
                path.join(projectRoot, 'src/**/__tests__/**/*.ts'),
                path.join(projectRoot, 'tests/**/*.test.ts'),
                path.join(projectRoot, 'tests/**/*.spec.ts')
            ];

            const skippedTestsFound: Array<{ file: string; line: number; pattern: string; match: string }> = [];

            // Scan all test files
            for (const pattern of testPatterns) {
                const files = await glob(pattern, { absolute: true, windowsPathsNoEscape: true });

                for (const file of files) {
                    const content = fs.readFileSync(file, 'utf-8');
                    const lines = content.split('\n');

                    lines.forEach((line, index) => {
                        // Detect .skip, .only, .pending patterns
                        const skipPatterns = [
                            { regex: /\b(describe|it|test)\.skip\s*\(/g, name: '.skip' },
                            { regex: /\b(describe|it|test)\.only\s*\(/g, name: '.only' },
                            { regex: /\b(describe|it|test)\.pending\s*\(/g, name: '.pending' },
                            { regex: /\bxdescribe\s*\(/g, name: 'xdescribe' },
                            { regex: /\bxit\s*\(/g, name: 'xit' },
                            { regex: /\bxtest\s*\(/g, name: 'xtest' }
                        ];

                        for (const { regex, name } of skipPatterns) {
                            const matches = line.matchAll(regex);
                            for (const match of matches) {
                                skippedTestsFound.push({
                                    file: path.relative(projectRoot, file),
                                    line: index + 1,
                                    pattern: name,
                                    match: line.trim().substring(0, 80) // First 80 chars
                                });
                            }
                        }
                    });
                }
            }

            // Report findings as warnings (test still passes)
            if (skippedTestsFound.length > 0) {
                console.warn('\n⚠️  QUALITY GATE WARNING: Skipped Tests Detected\n');
                console.warn(`Found ${skippedTestsFound.length} skipped/focused test(s):\n`);

                skippedTestsFound.forEach(({ file, line, pattern, match }) => {
                    console.warn(`  ${file}:${line} - ${pattern}`);
                    console.warn(`    ${match}`);
                });

                console.warn('\n💡 Tip: Remove .skip/.only before committing to ensure all tests run in CI\n');

                // Store for VS Code diagnostic provider to use
                const diagnosticsPath = path.join(projectRoot, '.vscode', 'quality-diagnostics.json');
                const diagnostics = {
                    skippedTests: skippedTestsFound,
                    timestamp: new Date().toISOString()
                };

                fs.mkdirSync(path.dirname(diagnosticsPath), { recursive: true });
                fs.writeFileSync(diagnosticsPath, JSON.stringify(diagnostics, null, 2));
            } else {
                console.log('✅ No skipped tests found');
            }

            // Test passes regardless (warning-only mode)
            expect(true).toBe(true);
        });
    });

    describe('Coverage Checker', () => {
        it('should detect and warn about files below coverage threshold', () => {
            const projectRoot = path.resolve(__dirname, '../..');
            const coveragePath = path.join(projectRoot, 'coverage', 'coverage-final.json');

            // Skip if coverage file doesn't exist
            if (!fs.existsSync(coveragePath)) {
                console.warn('⚠️  Coverage file not found. Run tests with --coverage first.');
                expect(true).toBe(true);
                return;
            }

            const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
            const threshold = 75; // 75% coverage target
            const underCoverageFiles: Array<{ file: string; coverage: number }> = [];

            for (const [filePath, fileData] of Object.entries<any>(coverageData)) {
                const { s, b, f, l } = fileData;

                // Skip files without line coverage data
                if (!l || typeof l !== 'object') {
                    continue;
                }

                // Calculate line coverage percentage
                const totalLines = Object.keys(l).length;
                const coveredLines = Object.values(l).filter((hits: any) => hits > 0).length;
                const lineCoverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 100;

                if (lineCoverage < threshold) {
                    underCoverageFiles.push({
                        file: path.relative(projectRoot, filePath),
                        coverage: Math.round(lineCoverage * 10) / 10
                    });
                }
            }

            // Report findings as warnings
            if (underCoverageFiles.length > 0) {
                console.warn('\n⚠️  QUALITY GATE WARNING: Files Below Coverage Threshold\n');
                console.warn(`Target: ${threshold}% | Found ${underCoverageFiles.length} file(s) below threshold:\n`);

                // Sort by coverage (lowest first)
                underCoverageFiles.sort((a, b) => a.coverage - b.coverage);

                underCoverageFiles.forEach(({ file, coverage }) => {
                    const gap = threshold - coverage;
                    console.warn(`  ${file}: ${coverage}% (${gap.toFixed(1)}% below target)`);
                });

                console.warn('\n💡 Tip: Add tests to increase coverage or adjust threshold in jest.config.js\n');

                // Store for VS Code diagnostic provider
                const diagnosticsPath = path.join(projectRoot, '.vscode', 'quality-diagnostics.json');
                let diagnostics: any = { timestamp: new Date().toISOString() };

                if (fs.existsSync(diagnosticsPath)) {
                    diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, 'utf-8'));
                }

                diagnostics.underCoverageFiles = underCoverageFiles;
                diagnostics.timestamp = new Date().toISOString();

                fs.writeFileSync(diagnosticsPath, JSON.stringify(diagnostics, null, 2));
            } else {
                console.log(`✅ All files meet ${threshold}% coverage threshold`);
            }

            // Test passes regardless
            expect(true).toBe(true);
        });
    });

    describe('TypeScript Strict Mode Checker', () => {
        it('should detect and warn about TypeScript strict mode violations', () => {
            const projectRoot = path.resolve(__dirname, '../..');

            try {
                // Run TypeScript in strict mode without emitting files
                execSync('npx tsc --noEmit --strict', {
                    cwd: projectRoot,
                    encoding: 'utf-8',
                    stdio: 'pipe'
                });

                console.log('✅ No TypeScript strict mode violations detected');
            } catch (error: any) {
                const stderr = error.stderr || error.stdout || '';

                if (stderr && stderr.includes('error TS')) {
                    // Parse TypeScript errors
                    const errorLines = stderr.split('\n').filter((line: string) => line.includes('error TS'));
                    const errors = errorLines.map((line: string): { file: string; line: number; column: number; code: string; message: string } => {
                        const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
                        if (match) {
                            return {
                                file: match[1],
                                line: parseInt(match[2]),
                                column: parseInt(match[3]),
                                code: match[4],
                                message: match[5]
                            };
                        }
                        return { file: '', line: 0, column: 0, code: '', message: line };
                    });

                    console.warn('\n⚠️  QUALITY GATE WARNING: TypeScript Strict Mode Violations\n');
                    console.warn(`Found ${errors.length} TypeScript error(s):\n`);

                    errors.slice(0, 10).forEach(({ file, line, code, message }: { file: string; line: number; code: string; message: string }) => {
                        if (file) {
                            console.warn(`  ${file}:${line} - ${code}`);
                            console.warn(`    ${message}`);
                        } else {
                            console.warn(`  ${message}`);
                        }
                    });

                    if (errors.length > 10) {
                        console.warn(`\n  ... and ${errors.length - 10} more errors`);
                    }

                    console.warn('\n💡 Tip: Run "npx tsc --noEmit --strict" to see full error list\n');

                    // Store for VS Code diagnostic provider
                    const diagnosticsPath = path.join(projectRoot, '.vscode', 'quality-diagnostics.json');
                    let diagnostics: any = { timestamp: new Date().toISOString() };

                    if (fs.existsSync(diagnosticsPath)) {
                        diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, 'utf-8'));
                    }

                    diagnostics.typeScriptErrors = errors;
                    diagnostics.timestamp = new Date().toISOString();

                    fs.writeFileSync(diagnosticsPath, JSON.stringify(diagnostics, null, 2));
                }
            }

            // Test passes regardless
            expect(true).toBe(true);
        });
    });
});

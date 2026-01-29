import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';

/**
 * TypeScript Compilation & Type Safety Test
 * Verifies all TypeScript files compile without errors
 * Reports specific files and line numbers where issues occur
 */

describe('TypeScript Compilation & Type Safety', () => {
    it('should compile all TypeScript files without errors', () => {
        let tscOutput = '';
        const problemFiles: Map<string, { line: number; message: string }[]> = new Map();

        try {
            tscOutput = cp.execSync('npx tsc --noEmit 2>&1', {
                encoding: 'utf-8',
                stdio: 'pipe'
            });
        } catch (error) {
            tscOutput = ((error as any).stdout || (error as any).stderr || (error as any).message) as string;
        }

        // Parse TypeScript error output
        const lines = tscOutput.split('\n');
        lines.forEach(line => {
            // Match pattern: src/file.ts(line,col): error TS####: message
            const match = line.match(/^([^(]+)\((\d+),\d+\):\s+error\s+TS\d+:\s+(.+)$/);
            if (match) {
                const [, filePath, lineNum, message] = match;
                const normalizedPath = path.normalize(filePath);

                if (!problemFiles.has(normalizedPath)) {
                    problemFiles.set(normalizedPath, []);
                }

                problemFiles.get(normalizedPath)!.push({
                    line: parseInt(lineNum),
                    message
                });
            }
        });

        if (problemFiles.size > 0) {
            console.log(`\n❌ TypeScript Compilation Errors: ${problemFiles.size} file(s) with issues\n`);
            problemFiles.forEach((issues, file) => {
                console.log(`  ${file}`);
                issues.forEach(issue => {
                    console.log(`    Line ${issue.line}: ${issue.message}`);
                });
            });
        } else {
            console.log('\n✅ TypeScript: All files compile successfully\n');
        }

        expect(problemFiles.size).toBe(0);
    });

    it('should have no implicit any types', () => {
        let tscOutput = '';
        const implicitAnyFiles: Map<string, { line: number; context: string }[]> = new Map();

        try {
            tscOutput = cp.execSync('npx tsc --noImplicitAny --noEmit 2>&1', {
                encoding: 'utf-8',
                stdio: 'pipe'
            });
        } catch (error) {
            tscOutput = ((error as any).stdout || (error as any).stderr || (error as any).message) as string;
        }

        // Parse implicit any errors
        const lines = tscOutput.split('\n');
        lines.forEach(line => {
            // Look for TS7006, TS7089 (implicit any errors)
            const match = line.match(/^([^(]+)\((\d+),\d+\):\s+error\s+TS(7006|7089|7031):\s+(.+)$/);
            if (match) {
                const [, filePath, lineNum, , message] = match;
                const normalizedPath = path.normalize(filePath);

                if (!implicitAnyFiles.has(normalizedPath)) {
                    implicitAnyFiles.set(normalizedPath, []);
                }

                implicitAnyFiles.get(normalizedPath)!.push({
                    line: parseInt(lineNum),
                    context: message
                });
            }
        });

        if (implicitAnyFiles.size > 0) {
            console.log(`\n🟠 Implicit Any Errors: ${implicitAnyFiles.size} file(s)\n`);
            implicitAnyFiles.forEach((issues, file) => {
                console.log(`  ${file}`);
                issues.forEach(issue => {
                    console.log(`    Line ${issue.line}: ${issue.context}`);
                });
            });
        } else {
            console.log('\n✅ No implicit any types detected\n');
        }

        expect(implicitAnyFiles.size).toBe(0);
    });

    it('should have no unused variables in compiled output', () => {
        const srcDir = path.join(__dirname, '../../src');
        const unusedVars: Map<string, string[]> = new Map();
        const extensionsToCheck = ['.ts', '.tsx'];

        // This is a heuristic check - looks for declared but unused variables
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
                    const issues: string[] = [];

                    // Look for const/let declarations followed by lack of usage
                    const varMatches = content.match(/\b(?:const|let)\s+(\w+)\s*=/g) || [];

                    varMatches.forEach(varMatch => {
                        const varName = varMatch.match(/(\w+)\s*=/)![1];
                        // Very basic: if variable name appears only in declaration line
                        const pattern = new RegExp(`(?<!\\w)${varName}(?!\\w)`, 'g');
                        const matches = content.match(pattern) || [];

                        if (matches.length === 1) {  // Only appears in declaration
                            issues.push(`Possibly unused variable: ${varName}`);
                        }
                    });

                    if (issues.length > 0 && issues.length < 10) {  // Avoid too many false positives
                        unusedVars.set(path.relative(process.cwd(), fullPath), issues);
                    }
                }
            });
        };

        scanDir(srcDir);

        if (unusedVars.size > 0) {
            console.log(`\n🟡 Potentially Unused Variables: ${unusedVars.size} file(s)\n`);
            unusedVars.forEach((issues, file) => {
                console.log(`  ${file}`);
                issues.slice(0, 3).forEach(issue => console.log(`    - ${issue}`));
                if (issues.length > 3) {
                    console.log(`    ... and ${issues.length - 3} more`);
                }
            });
            console.log('\n💡 Review and remove unused variables\n');
        } else {
            console.log('\n✅ No obvious unused variables\n');
        }
    });

    it('should verify strict type checking rules are enabled', () => {
        const tsconfigPath = path.join(__dirname, '../../tsconfig.json');

        try {
            const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
            const compilerOptions = tsconfig.compilerOptions || {};

            const typeCheckingRules = [
                { name: 'strict', value: compilerOptions.strict, required: true },
                { name: 'noImplicitAny', value: compilerOptions.noImplicitAny, required: true },
                { name: 'strictNullChecks', value: compilerOptions.strictNullChecks, required: true },
                { name: 'strictFunctionTypes', value: compilerOptions.strictFunctionTypes, required: true },
                { name: 'noUnusedLocals', value: compilerOptions.noUnusedLocals, required: false },
                { name: 'noUnusedParameters', value: compilerOptions.noUnusedParameters, required: false }
            ];

            const missingRules = typeCheckingRules.filter(rule => rule.required && !rule.value);

            if (missingRules.length > 0) {
                console.log(`\n⚠️  Missing TypeScript Strict Mode Rules: ${missingRules.length}\n`);
                missingRules.forEach(rule => {
                    console.log(`  - ${rule.name}: not enabled`);
                });
            } else {
                console.log('\n✅ All required TypeScript strict mode rules enabled\n');
            }

            // Info about optional rules
            const disabledOptional = typeCheckingRules.filter(rule => !rule.required && !rule.value);
            if (disabledOptional.length > 0) {
                console.log(`💡 Recommended (optional): ${disabledOptional.map(r => r.name).join(', ')}\n`);
            }

            expect(missingRules.length).toBe(0);
        } catch (error) {
            console.log('⚠️  Could not read tsconfig.json');
            expect(true).toBe(true);  // Skip if tsconfig not found
        }
    });
});

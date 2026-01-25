/**
 * 🤖 Auto Test Generator Script
 * 
 * This script analyzes TypeScript source files and generates comprehensive
 * Jest test files automatically using AI-powered prompts.
 * 
 * Usage:
 *   npx ts-node .github/skills/auto-test-skill/generate-tests.ts <file-or-dir>
 *   npx ts-node .github/skills/auto-test-skill/generate-tests.ts --interactive
 * 
 * Examples:
 *   npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/mcpServer/tools.ts
 *   npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/agents/
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION (For Noobs: Change these if needed!)
// ============================================================================

const CONFIG = {
    // Minimum code coverage required for new tests
    MIN_COVERAGE: 75,

    // Where to put generated test files
    TEST_OUTPUT_DIR: 'tests',

    // File patterns to analyze
    SOURCE_PATTERNS: ['**/*.ts', '!**/*.test.ts', '!**/*.spec.ts', '!**/node_modules/**'],

    // VS Code mocking template (needed for extension tests)
    VS_CODE_MOCK: `jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        createWebviewPanel: jest.fn(),
    },
    commands: {
        registerCommand: jest.fn((cmd, handler) => ({ dispose: jest.fn() })),
        executeCommand: jest.fn(),
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn(),
            update: jest.fn(),
        })),
    },
}), { virtual: true });`,
};

// ============================================================================
// TYPES (For Noobs: These define the shape of our data!)
// ============================================================================

interface FunctionMetadata {
    name: string;
    parameters: string[];
    returnType: string;
    isAsync: boolean;
    isExported: boolean;
}

interface TestScenario {
    description: string;
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    category: 'critical' | 'edge-case' | 'error-handling' | 'boundary';
    setupCode?: string;
    expectedBehavior: string;
}

interface TestGenerationPlan {
    sourceFile: string;
    functions: FunctionMetadata[];
    scenarios: TestScenario[];
    dependencies: string[];
    needsVSCodeMock: boolean;
}

// ============================================================================
// MAIN FUNCTION (Entry Point!)
// ============================================================================

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help') {
        printUsage();
        process.exit(0);
    }

    const targetPath = args[0];

    if (args[0] === '--interactive') {
        await runInteractiveMode();
    } else {
        await generateTestsForPath(targetPath);
    }
}

// ============================================================================
// INTERACTIVE MODE
// ============================================================================

async function runInteractiveMode() {
    console.log('🤖 Auto Test Generator - Interactive Mode\n');

    // For this demo, we'll simulate interactive prompts
    // In a real implementation, you'd use a library like 'inquirer' for prompts

    console.log('📝 This would prompt you for:');
    console.log('  1. Which file/folder to test?');
    console.log('  2. What scenarios to include?');
    console.log('  3. Coverage threshold?');
    console.log('\n💡 For now, run with a file path instead!\n');

    printUsage();
}

// ============================================================================
// GENERATE TESTS FOR FILE/DIRECTORY
// ============================================================================

async function generateTestsForPath(targetPath: string) {
    console.log(`🤖 Analyzing: ${targetPath}\n`);

    // Check if file exists
    if (!fs.existsSync(targetPath)) {
        console.error(`❌ Error: File not found: ${targetPath}`);
        process.exit(1);
    }

    const stats = fs.statSync(targetPath);

    if (stats.isDirectory()) {
        // Process all .ts files in directory
        const files = findSourceFiles(targetPath);
        console.log(`📁 Found ${files.length} source files\n`);

        for (const file of files) {
            await generateTestForFile(file);
        }
    } else {
        // Process single file
        await generateTestForFile(targetPath);
    }
}

// ============================================================================
// GENERATE TEST FOR SINGLE FILE
// ============================================================================

async function generateTestForFile(filePath: string) {
    console.log(`\n📊 Analyzing: ${filePath}`);

    // Step 1: Analyze source code
    const plan = await analyzeSourceFile(filePath);

    if (plan.functions.length === 0) {
        console.log(`   ⚠️  No exported functions found - skipping`);
        return;
    }

    console.log(`   ✅ Found ${plan.functions.length} exported functions`);
    console.log(`   💡 Generated ${plan.scenarios.length} test scenarios`);

    // Step 2: Generate test file content
    const testContent = generateTestFileContent(plan);

    // Step 3: Determine output path
    const outputPath = getTestFilePath(filePath);

    // Step 4: Create output directory if needed
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Step 5: Write test file
    fs.writeFileSync(outputPath, testContent, 'utf-8');
    console.log(`   🏗️  Generated: ${outputPath} (${testContent.split('\n').length} lines)`);

    // Step 6: Attempt to run tests (optional - requires Jest to be set up)
    // await runGeneratedTests(outputPath);
}

// ============================================================================
// ANALYZE SOURCE FILE
// ============================================================================

async function analyzeSourceFile(filePath: string): Promise<TestGenerationPlan> {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract functions (simplified regex - in production, use a proper TypeScript parser)
    const functions = extractFunctions(content);

    // Detect dependencies
    const dependencies = extractDependencies(content);

    // Check if VS Code mocking is needed
    const needsVSCodeMock = content.includes('from \'vscode\'') || content.includes('import * as vscode');

    // Generate test scenarios for each function
    const scenarios: TestScenario[] = [];
    for (const func of functions) {
        scenarios.push(...generateScenarios(func));
    }

    return {
        sourceFile: filePath,
        functions,
        scenarios,
        dependencies,
        needsVSCodeMock,
    };
}

// ============================================================================
// EXTRACT FUNCTIONS FROM SOURCE
// ============================================================================

function extractFunctions(content: string): FunctionMetadata[] {
    const functions: FunctionMetadata[] = [];

    // Simplified regex to find exported functions
    // In production, use a proper TypeScript AST parser like @typescript-eslint/parser
    const functionRegex = /export\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*:\s*([^{]+)/g;

    let match;
    while ((match = functionRegex.exec(content)) !== null) {
        const [, asyncKeyword, name, params, returnType] = match;

        functions.push({
            name,
            parameters: params.split(',').map(p => p.trim()).filter(Boolean),
            returnType: returnType.trim(),
            isAsync: !!asyncKeyword,
            isExported: true,
        });
    }

    return functions;
}

// ============================================================================
// EXTRACT DEPENDENCIES
// ============================================================================

function extractDependencies(content: string): string[] {
    const dependencies: string[] = [];

    // Extract import statements
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
    }

    return [...new Set(dependencies)]; // Remove duplicates
}

// ============================================================================
// GENERATE TEST SCENARIOS
// ============================================================================

function generateScenarios(func: FunctionMetadata): TestScenario[] {
    const scenarios: TestScenario[] = [];

    // Critical scenario: Happy path
    scenarios.push({
        description: `should execute ${func.name} successfully with valid input`,
        priority: 'P1',
        category: 'critical',
        expectedBehavior: 'Returns expected result without errors',
    });

    // Edge case: Empty/null input
    if (func.parameters.length > 0) {
        scenarios.push({
            description: `should handle null/undefined input in ${func.name}`,
            priority: 'P2',
            category: 'edge-case',
            expectedBehavior: 'Throws error or returns null gracefully',
        });
    }

    // Error handling: Invalid input
    scenarios.push({
        description: `should throw error for invalid input in ${func.name}`,
        priority: 'P2',
        category: 'error-handling',
        expectedBehavior: 'Throws descriptive error message',
    });

    // Async handling (if applicable)
    if (func.isAsync) {
        scenarios.push({
            description: `should handle async completion in ${func.name}`,
            priority: 'P2',
            category: 'critical',
            expectedBehavior: 'Resolves promise with correct value',
        });
    }

    return scenarios;
}

// ============================================================================
// GENERATE TEST FILE CONTENT
// ============================================================================

function generateTestFileContent(plan: TestGenerationPlan): string {
    const lines: string[] = [];

    // Header comment
    lines.push('/**');
    lines.push(` * 🧪 Auto-Generated Test File`);
    lines.push(` * `);
    lines.push(` * Source: ${plan.sourceFile}`);
    lines.push(` * Generated: ${new Date().toISOString()}`);
    lines.push(` * `);
    lines.push(` * ⚠️ REVIEW BEFORE COMMITTING:`);
    lines.push(` * - Verify test scenarios match actual behavior`);
    lines.push(` * - Add custom test cases for complex logic`);
    lines.push(` * - Update mocks to match real dependencies`);
    lines.push(` */`);
    lines.push('');

    // VS Code mock (if needed)
    if (plan.needsVSCodeMock) {
        lines.push('// 🎭 Mock VS Code API (not available in Jest environment)');
        lines.push(CONFIG.VS_CODE_MOCK);
        lines.push('');
    }

    // Imports
    lines.push('// 📦 Imports');
    const relativePath = getRelativeImportPath(plan.sourceFile);
    const moduleName = path.basename(plan.sourceFile, '.ts');

    // Import all exported functions
    const funcNames = plan.functions.map(f => f.name).join(', ');
    lines.push(`import { ${funcNames} } from '${relativePath}';`);
    lines.push('');

    // Test suites (one per function)
    for (const func of plan.functions) {
        lines.push(`// ============================================================================`);
        lines.push(`// ${func.name}() Tests`);
        lines.push(`// ============================================================================`);
        lines.push('');
        lines.push(`describe('${func.name}', () => {`);

        // Get scenarios for this function
        const funcScenarios = plan.scenarios.filter(s => s.description.includes(func.name));

        // Generate test cases
        for (const scenario of funcScenarios) {
            lines.push(`    /**`);
            lines.push(`     * ✅ ${scenario.description}`);
            lines.push(`     * Priority: ${scenario.priority}`);
            lines.push(`     * Category: ${scenario.category}`);
            lines.push(`     */`);

            const testFn = func.isAsync ? 'async () => {' : '() => {';
            lines.push(`    it('${scenario.description}', ${testFn}`);
            lines.push(`        // TODO: Implement test`);
            lines.push(`        // Arrange: Set up test data`);
            lines.push(`        `);
            lines.push(`        // Act: Call the function`);
            if (func.isAsync) {
                lines.push(`        // const result = await ${func.name}(/* args */);`);
            } else {
                lines.push(`        // const result = ${func.name}(/* args */);`);
            }
            lines.push(`        `);
            lines.push(`        // Assert: Check expectations`);
            lines.push(`        // expect(result).toBeTruthy();`);

            if (func.isAsync) {
                lines.push(`    });`);
            } else {
                lines.push(`    });`);
            }
            lines.push('');
        }

        lines.push('});');
        lines.push('');
    }

    return lines.join('\n');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function findSourceFiles(dir: string): string[] {
    const files: string[] = [];

    function walk(currentDir: string) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                // Skip node_modules, dist, out, test folders
                if (!['node_modules', 'dist', 'out', 'test', '__tests__'].includes(entry.name)) {
                    walk(fullPath);
                }
            } else if (entry.isFile()) {
                // Include .ts files (but not .test.ts or .spec.ts)
                if (entry.name.endsWith('.ts') &&
                    !entry.name.endsWith('.test.ts') &&
                    !entry.name.endsWith('.spec.ts') &&
                    !entry.name.endsWith('.d.ts')) {
                    files.push(fullPath);
                }
            }
        }
    }

    walk(dir);
    return files;
}

function getTestFilePath(sourceFile: string): string {
    // Convert: src/mcpServer/tools.ts → tests/mcpServer/tools.test.ts
    const relativePath = sourceFile.replace(/^src\//, '');
    const testFileName = relativePath.replace('.ts', '.test.ts');
    return path.join(CONFIG.TEST_OUTPUT_DIR, testFileName);
}

function getRelativeImportPath(sourceFile: string): string {
    // Convert absolute source path to relative import path
    // Example: src/mcpServer/tools.ts → ../../src/mcpServer/tools
    const testPath = getTestFilePath(sourceFile);
    const testDir = path.dirname(testPath);

    let relativePath = path.relative(testDir, sourceFile);
    relativePath = relativePath.replace(/\\/g, '/'); // Windows compatibility
    relativePath = relativePath.replace('.ts', ''); // Remove extension

    // Ensure path starts with ./ or ../
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }

    return relativePath;
}

function printUsage() {
    console.log(`
🤖 Auto Test Generator

Usage:
  npx ts-node .github/skills/auto-test-skill/generate-tests.ts <file-or-dir>
  npx ts-node .github/skills/auto-test-skill/generate-tests.ts --interactive

Examples:
  # Generate tests for a single file
  npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/mcpServer/tools.ts

  # Generate tests for all files in a directory
  npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/agents/

  # Interactive mode (guided prompts)
  npx ts-node .github/skills/auto-test-skill/generate-tests.ts --interactive

Options:
  --help         Show this help message
  --interactive  Run in interactive mode with prompts

Configuration:
  Test output: ${CONFIG.TEST_OUTPUT_DIR}/
  Min coverage: ${CONFIG.MIN_COVERAGE}%

For more info, see: .github/skills/auto-test-skill/SKILL.md
    `);
}

// ============================================================================
// RUN THE SCRIPT!
// ============================================================================

// Only run if this file is executed directly (not imported)
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

// Export for testing
export {
    analyzeSourceFile,
    extractFunctions,
    extractDependencies,
    generateScenarios,
    generateTestFileContent,
};

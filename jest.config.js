/**
 * 🧪 Jest Testing Configuration (For Noobs!)
 * 
 * This file tells Jest (our testing tool) how to find and run tests.
 * Jest is like a robot that checks if your code works correctly by running tests.
 * 
 * Think of tests like this:
 * - You write code that does something (e.g., "add 2 + 2")
 * - You write a test that checks if it's correct (e.g., "expect(2+2).toBe(4)")
 * - Jest runs the test and tells you "PASS ✅" or "FAIL ❌"
 */

module.exports = {
    // 🎯 preset: 'ts-jest'
    // This tells Jest to understand TypeScript files (.ts)
    // Without this, Jest only understands JavaScript (.js)
    preset: 'ts-jest',

    // 🌍 testEnvironment: 'node'
    // This says "run tests in Node.js environment" (not in a browser)
    // Our extension runs in VS Code (which uses Node.js), so we test in Node.js too
    testEnvironment: 'node',

    // 📂 roots: Where to look for test files
    // Jest will search in 'src/' and 'tests/' folders for any test files
    roots: ['<rootDir>/src', '<rootDir>/tests'],

    // 🔍 testMatch: Which files are test files?
    // Jest looks for files with these patterns:
    // - **/__tests__/**/*.ts  → Any .ts file inside a __tests__ folder
    // - **/*.test.ts          → Any file ending with .test.ts (e.g., example.test.ts)
    // - **/*.spec.ts          → Any file ending with .spec.ts (e.g., example.spec.ts)
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],

    // 🚫 testPathIgnorePatterns: Which folders to SKIP when looking for tests
    // We exclude 'src/test/' because those are VS Code E2E tests that use Mocha (not Jest)
    // We exclude 'node_modules/' (default) to avoid running tests from installed packages
    testPathIgnorePatterns: [
        '/node_modules/',  // Don't run tests from installed packages
        '/src/test/',      // Don't run VS Code E2E tests (they use Mocha, not Jest)
    ],

    // 🔄 transform: How to convert TypeScript to JavaScript
    // Jest needs to convert .ts files to .js before running them
    // 'ts-jest' is the tool that does this conversion
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },

    // ⚙️ setupFilesAfterEnv: Setup files to run before tests
    // Runs jest.setup.js to mock VS Code module and other dependencies
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // 📊 collectCoverageFrom: Which files to measure test coverage for
    // Coverage = "What % of your code is tested?"
    // We measure all .ts files in src/, EXCEPT:
    // - .d.ts files (type definitions - no logic to test)
    // - src/test/** (these are VS Code extension tests, not unit tests)
    // - src/**/__tests__/** (these are the test files themselves!)
    collectCoverageFrom: [
        'src/**/*.ts',           // ✅ Include all .ts files in src/
        '!src/**/*.d.ts',        // ❌ Exclude type definition files
        '!src/test/**',          // ❌ Exclude VS Code extension tests (uses Mocha)
        '!src/**/__tests__/**',  // ❌ Exclude the test files themselves
    ],

    // 🚫 coveragePathIgnorePatterns: Extra files to exclude from coverage metrics
    // These patterns are applied in addition to collectCoverageFrom
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/out/',
        '\\.d\\.ts$',
        '<rootDir>/src/extension.ts',
    ],

    // 🎯 coverageThreshold: Minimum test coverage required
    // If coverage drops below these numbers, Jest will fail
    // - branches: 70% of if/else paths must be tested
    // - functions: 70% of functions must be tested
    // - lines: 70% of lines must be tested
    // - statements: 70% of statements must be tested
    // (These are quality gates - they force us to write good tests!)
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },

    // 📦 moduleFileExtensions: File types Jest should recognize
    // Jest will look for .ts, .js, and .json files when running tests
    moduleFileExtensions: ['ts', 'js', 'json'],

    // 🗂️ moduleDirectories: Folders to search for modules
    // By default Jest searches in node_modules, but we add __mocks__ to make
    // manual mocks in __mocks__/vscode.ts automatically discoverable
    moduleDirectories: ['<rootDir>/__mocks__', 'node_modules'],

    // 🎭 moduleNameMapper: Explicitly map vscode to manual mock for Jest resolution
    moduleNameMapper: {
        '^vscode$': '<rootDir>/__mocks__/vscode.ts',
    },

    // �🗣️ verbose: true
    // This makes Jest print detailed information about each test
    // (Helpful for debugging when tests fail!)
    verbose: true,
};

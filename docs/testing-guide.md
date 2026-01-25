# Testing Guide for COE Project

**Comprehensive guide to testing in the Copilot Orchestration Extension** 🧪

> **💡 New!** Check out the [Auto Test Generator Skill](./.github/skills/auto-test-skill/) for AI-powered test generation!

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Testing Framework](#testing-framework)
3. [Writing Tests](#writing-tests)
4. [Auto Test Generation](#auto-test-generation)
5. [Running Tests](#running-tests)
6. [Coverage Requirements](#coverage-requirements)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

---

## Quick Start

### Running Tests

```bash
# 🎯 DEFAULT: Run all unit tests with watch mode + coverage (auto-reruns on changes)
npm run test:unit

# 📋 Single run with coverage report (for CI/non-watch environments)
npm run test:once

# 👁️ Watch mode only (no coverage per-run, faster iteration)
npm run test:watch

# 📊 Coverage report (single run)
npm run test:coverage

# 🧩 E2E tests (Mocha - VS Code extension)
npm run test
```

### Test Defaults (2026-01-24 Update)

**Default behavior changed!** Now `npm run test:unit` runs with:
- ✅ **Watch mode** (`--watch`) — Tests auto-rerun when code changes
- ✅ **Coverage enabled** (`--coverage`) — Real-time coverage metrics
- ✅ **Open handles detection** (`--detectOpenHandles`) — Detects resource leaks

This means **you get live test feedback + coverage in one command**! Perfect for development.

### Generating Tests Automatically

```bash
# Use the Auto Test Generator skill
npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/mcpServer/tools.ts

# Or ask Copilot
"Generate tests for src/mcpServer/tools.ts"
```

---

## Testing Framework

### Jest (Unit & Integration Tests)

**What**: JavaScript testing framework with great TypeScript support  
**Used for**: Testing individual functions, classes, and modules  
**Config**: `jest.config.js`  
**Tests location**: `tests/` and `src/**/__tests__/`

**Key Features**:
- ✅ Fast parallel test execution
- ✅ Built-in mocking and assertions
- ✅ Code coverage reporting
- ✅ Watch mode for development
- ✅ Snapshot testing support

### Mocha (E2E Tests)

**What**: VS Code extension testing framework  
**Used for**: End-to-end extension tests in real VS Code environment  
**Tests location**: `src/test/`

**Key Features**:
- ✅ Runs in actual VS Code instance
- ✅ Tests extension activation, commands, UI
- ✅ Integration with `@vscode/test-electron`

---

## Writing Tests

### Basic Test Structure

```typescript
describe('Feature Name', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset state, create mocks
  });

  // Teardown after each test
  afterEach(() => {
    // Clean up resources
  });

  it('should do something specific', () => {
    // Arrange: Set up test data
    const input = { value: 42 };

    // Act: Run the code
    const result = myFunction(input);

    // Assert: Check expectations
    expect(result).toBe(expected);
  });
});
```

### Testing Async Functions

```typescript
it('should fetch data asynchronously', async () => {
  const result = await fetchData();
  expect(result).toBeTruthy();
});
```

### Mocking Dependencies

```typescript
// Mock entire module
jest.mock('../../src/utils/logger');

// Mock VS Code API
jest.mock('vscode', () => ({
  window: { showInformationMessage: jest.fn() },
  commands: { registerCommand: jest.fn() },
}), { virtual: true });

// Spy on function
const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
```

---

## Auto Test Generation

The COE project includes an **AI-powered auto test generator** that creates comprehensive tests automatically!

### Features

✅ **Code Analysis** - Examines functions, parameters, and control flow  
✅ **Scenario Generation** - Creates critical, edge case, and error tests  
✅ **Smart Mocking** - Automatically generates mocks for dependencies  
✅ **MCP Integration** - Uses `askQuestion` tool for ambiguous cases  
✅ **Coverage Focus** - Ensures ≥75% coverage for new code  

### Usage

**Option 1: Use Script**

```bash
# Generate tests for a single file
npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/mcpServer/tools.ts

# Generate tests for a directory
npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/agents/
```

**Option 2: Ask Copilot**

```
"Generate tests for src/mcpServer/tools.ts with critical and edge cases"
```

Copilot will:
1. Analyze the code
2. Suggest test scenarios
3. Generate complete test file
4. Run tests and check coverage

### Example Output

```typescript
/**
 * 🧪 Auto-Generated Test File
 * Source: src/mcpServer/tools.ts
 * Generated: 2026-01-24T12:00:00Z
 */

describe('getNextTask', () => {
  /**
   * ✅ should return highest priority P1 task
   * Priority: P1
   * Category: critical
   */
  it('should return highest priority P1 task', async () => {
    // TODO: Implement test
    // Arrange: Set up test data
    
    // Act: Call the function
    // const result = await getNextTask(/* args */);
    
    // Assert: Check expectations
    // expect(result).toBeTruthy();
  });
});
```

**Learn more**: See [Auto Test Generator Skill](./.github/skills/auto-test-skill/SKILL.md) for complete documentation.

---

## Running Tests

### npm Scripts

```bash
# 🎯 DEFAULT: Jest tests with watch mode + coverage (live feedback + metrics)
npm run test:unit           # Watch mode + Coverage (recommended for dev!)

# 📋 Single-run tests with coverage (for CI/non-watch)
npm run test:once           # No watch, just coverage report

# 👁️ Watch mode only (faster iteration, no coverage overhead)
npm run test:watch          # Auto-rerun tests on changes

# 📊 Coverage report (single run, detailed metrics)
npm run test:coverage       # Generate coverage report

# 🧩 Mocha tests (E2E extension tests)
npm run test                # Full extension test suite

# 🔍 Pre-test checks
npm run pretest             # Compile + lint + run tests
```

### Command Details

| Command | Mode | Coverage | Open Handles | Use Case |
|---------|------|----------|--------------|----------|
| `test:unit` | ✅ Watch | ✅ Yes | ✅ Detect | **Dev default** - Live feedback + leaks |
| `test:once` | ❌ Single | ✅ Yes | ❌ None | **CI/CD** - Just coverage metrics |
| `test:watch` | ✅ Watch | ❌ No | ❌ None | **Quick iteration** - Fastest feedback |
| `test:coverage` | ❌ Single | ✅ Yes | ❌ None | **Report generation** - Detailed metrics |
| `test` | ❌ Single | N/A | N/A | **E2E tests** - Extension integration |

### Running Specific Tests

```bash
# Run single test file
npm run test:unit -- tests/example.test.ts

# Run tests matching pattern
npm run test:unit -- --testNamePattern="getNextTask"

# Run tests for specific folder
npm run test:unit -- src/mcpServer/
```

### Watch Mode (Development)

```bash
# Auto-rerun tests on file changes
npm run test:watch

# Focus on specific files
npm run test:watch -- src/mcpServer/
```

---

## Coverage Requirements

### Minimum Thresholds

Configured in `jest.config.js`:

| Metric | Standard | P1 (Critical) |
|--------|----------|---------------|
| **Branches** | ≥70% | ≥90% |
| **Functions** | ≥70% | ≥90% |
| **Lines** | ≥70% | ≥90% |
| **Statements** | ≥70% | ≥90% |

### Checking Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report in browser
# coverage/index.html
```

**Coverage Report Shows**:
- ✅ Green = Covered lines
- 🟡 Yellow = Partially covered
- ❌ Red = Uncovered lines

### Improving Coverage

If coverage is below threshold:

1. **Identify uncovered code**:
   ```bash
   npm run test:coverage
   # Open coverage/index.html
   # Look for red/yellow lines
   ```

2. **Write tests for uncovered lines**:
   - Focus on red lines first
   - Add tests for missed branches (if/else paths)
   - Test error handling (try/catch blocks)

3. **Use Auto Test Generator**:
   ```bash
   npx ts-node .github/skills/auto-test-skill/generate-tests.ts <file>
   ```

---

## Best Practices

### ✅ DO

- **Write tests first** (TDD approach when possible)
- **Test behavior, not implementation** (test what it does, not how)
- **Use descriptive test names** (`should return P1 task when queue not empty`)
- **Keep tests focused** (one assertion per test ideally)
- **Mock external dependencies** (VS Code, file system, network)
- **Clean up after tests** (use `afterEach` to reset state)
- **Add comments** explaining complex test logic
- **Test edge cases** (null, undefined, empty arrays, boundary values)
- **Test error scenarios** (invalid input, network failures)

### ❌ DON'T

- **Test trivial code** (simple getters/setters)
- **Test library code** (Jest, VS Code are already tested)
- **Ignore failing tests** (fix them or file issues)
- **Hardcode test data** (use variables for clarity)
- **Skip cleanup** (leaking state causes flaky tests)
- **Test implementation details** (test public API only)
- **Write slow tests** (mock slow operations)

---

## Examples

### Example 1: Testing MCP Tool

```typescript
describe('getNextTask MCP Tool', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
  });

  it('should return highest priority P1 task', async () => {
    // Arrange
    taskQueue.addTask({ id: '1', priority: 'P1', status: 'ready' });
    taskQueue.addTask({ id: '2', priority: 'P2', status: 'ready' });

    // Act
    const result = await getNextTask('plan-1');

    // Assert
    expect(result.task.id).toBe('1');
    expect(result.task.priority).toBe('P1');
  });

  it('should return null when queue is empty', async () => {
    // Act
    const result = await getNextTask('plan-1');

    // Assert
    expect(result.task).toBeNull();
  });
});
```

### Example 2: Testing with Mocks

```typescript
import { MCPServer } from '../../src/mcpServer/server';

describe('MCP Server', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer();
  });

  it('should handle request and call tool', async () => {
    // Arrange
    const mockHandler = jest.fn().mockResolvedValue({ success: true });
    server.registerTool('testTool', mockHandler);

    // Act
    const response = await server.handleRequest({
      jsonrpc: '2.0',
      method: 'testTool',
      params: { input: 'test' },
      id: 1
    });

    // Assert
    expect(mockHandler).toHaveBeenCalledWith({ input: 'test' });
    expect(response.result.success).toBe(true);
  });
});
```

### Example 3: Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { VerificationPanel } from '../../src/ui/VerificationPanel';

describe('VerificationPanel', () => {
  it('should render task details', () => {
    const task = {
      id: 'TASK-001',
      title: 'Implement feature',
      status: 'verification-pending'
    };

    render(<VerificationPanel task={task} />);

    expect(screen.getByText('TASK-001')).toBeInTheDocument();
    expect(screen.getByText('Implement feature')).toBeInTheDocument();
  });

  it('should call onApprove when approve button clicked', () => {
    const mockOnApprove = jest.fn();
    const task = { id: 'TASK-001', title: 'Test' };

    render(<VerificationPanel task={task} onApprove={mockOnApprove} />);

    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledWith('TASK-001');
  });
});
```

---

## Resources

### Documentation

- **Jest Docs**: https://jestjs.io/docs/getting-started
- **TypeScript + Jest**: https://kulshekhar.github.io/ts-jest/
- **Testing Library**: https://testing-library.com/docs/
- **VS Code Testing**: https://code.visualstudio.com/api/working-with-extensions/testing-extension

### Project-Specific

- **Example Tests**: `tests/example.test.ts` - Beginner-friendly examples
- **Auto Test Skill**: `.github/skills/auto-test-skill/SKILL.md` - AI test generation
- **Jest Config**: `jest.config.js` - Configuration with comments
- **Tests Folder**: `tests/README.md` - Quick start guide

### Tools

- **Jest Cheat Sheet**: See `tests/example.test.ts` for 20+ common matchers
- **Coverage Reports**: Open `coverage/index.html` after running `npm run test:coverage`
- **Auto Generator**: `.github/skills/auto-test-skill/generate-tests.ts`

---

## Troubleshooting

### Common Issues

**"Cannot find module 'vscode'"**
```typescript
// Add at top of test file:
jest.mock('vscode', () => ({
  window: { showInformationMessage: jest.fn() },
  commands: { registerCommand: jest.fn() },
}), { virtual: true });
```

**"Test timeout after 5000ms"**
```typescript
// Increase timeout:
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

**"Coverage below threshold"**
```bash
# 1. See what's uncovered
npm run test:coverage
# Open coverage/index.html

# 2. Generate tests for uncovered code
npx ts-node .github/skills/auto-test-skill/generate-tests.ts <file>
```

**"ReferenceError: X is not defined"**
```typescript
// Ensure imports are correct:
import { X } from '../src/module';

// Or mock if external:
jest.mock('../src/module');
```

---

**Happy Testing! 🎉**

Questions? Use the MCP `askQuestion` tool or check the [Auto Test Generator Skill](./.github/skills/auto-test-skill/) for help!

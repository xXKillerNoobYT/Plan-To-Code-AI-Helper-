---
name: testing-skill
description: Run Jest tests with focus on new code coverage >75%, generate coverage reports, and enforce quality gates for task completion
tags: [testing, jest, coverage, quality-gates, tdd]
---

# Testing Skill

Automatically run Jest tests, measure coverage for new code, and enforce 75% minimum coverage requirement for task completion.

## When to Use This Skill

- After implementing new features or functions
- Before marking tasks as completed
- During code review and verification
- When test failures are reported
- As part of CI/CD quality gates

## What This Skill Does

1. **Run Tests**: Executes Jest test suites for modified code
2. **Measure Coverage**: Calculates code coverage (lines, branches, functions)
3. **Focus on New Code**: Isolates coverage metrics for new/changed code only
4. **Enforce Gates**: Requires ≥75% coverage for new code before task completion
5. **Generate Reports**: Creates detailed coverage reports (HTML, JSON, terminal)
6. **Identify Gaps**: Highlights uncovered lines and missing test cases

## Step-by-Step Procedure

### Phase 1: Test Detection

```
1. Identify modified source files (src/**/*.ts)
2. Find corresponding test files:
   - src/foo/bar.ts → src/foo/__tests__/bar.test.ts
   - OR src/test/foo/bar.test.ts

3. Check if tests exist:
   IF no tests found:
     → Create test file template
     → Report observation via MCP
   ELSE:
     → Proceed to execution
```

### Phase 2: Test Execution

```
1. Run Jest on specific test files:
   npm test -- <test-file-pattern>

2. Capture results:
   - Tests passed/failed
   - Test duration
   - Error messages
   - Code coverage metrics

3. Generate coverage report:
   npm test -- --coverage --coveragePathIgnorePatterns=<unchanged-files>
```

### Phase 3: Coverage Analysis

```
1. Parse coverage report (coverage/coverage-summary.json)

2. Extract metrics for NEW code only:
   - Lines covered %
   - Branches covered %
   - Functions covered %
   - Statements covered %

3. Calculate weighted score:
   Score = (lines * 0.4) + (branches * 0.3) + (functions * 0.2) + (statements * 0.1)

4. Apply quality gate:
   IF score < 75%:
     ❌ FAIL: "New code coverage below 75% threshold"
     → Block task completion
   ELSE:
     ✅ PASS: "Coverage requirements met"
```

### Phase 4: Gap Identification

```
1. Parse uncovered lines from coverage report

2. Generate focused test recommendations:
   FOR each uncovered function/branch:
     - Suggest test case name
     - Identify input scenarios
     - Describe expected behavior

3. Use askQuestion MCP tool if unclear:
   "How should I test this edge case: <uncovered-code-snippet>?"
```

### Phase 5: Reporting

```
Generate coverage summary:
---
🧪 Test Results
Tests run: <count>
Passed: <count> ✅
Failed: <count> ❌
Duration: <seconds>s

📊 Coverage (New Code)
Lines: <percent>% (<covered>/<total>)
Branches: <percent>% (<covered>/<total>)
Functions: <percent>% (<covered>/<total>)
Status: [✅ PASS ≥75% | ❌ FAIL <75%]

⚠️ Uncovered Lines:
- src/foo.ts:42-45 (handleEdgeCase function)
- src/bar.ts:88 (error handling branch)
---
```

## Usage Examples

### Example 1: Run tests for specific file

```bash
# Run tests for orchestrator.ts
npm test -- orchestrator.test.ts

# Output:
# ✅ All 8 tests passed
# Coverage: 82% (lines), 75% (branches)
```

### Example 2: Check coverage for new code

```bash
# Focus on new code coverage
./.github/skills/testing-skill/check-new-coverage.sh src/mcpServer/tools.ts

# Output:
# 📊 Coverage for new code in src/mcpServer/tools.ts:
# Lines: 78% (42/54) ✅
# Branches: 71% (15/21) ❌
# Functions: 100% (6/6) ✅
# Overall: 76.5% ✅ PASS
```

### Example 3: Generate HTML coverage report

```bash
# Create detailed HTML report
npm test -- --coverage --coverageReporters=html

# Opens in browser:
# file:///.../coverage/index.html
```

## Configuration

### Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/test/**',
    '!**/*.d.ts'
  ],
  coverageThresholds: {
    global: {
      lines: 75,
      branches: 75,
      functions: 75,
      statements: 75
    }
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary']
};
```

### Coverage Quality Gates

```typescript
interface CoverageGate {
  newCodeMinimum: 75;  // New code must have ≥75% coverage
  globalMinimum: 60;   // Total codebase ≥60% (gradual improvement)
  criticalPaths: 90;   // P1 features ≥90% coverage
}

// Example enforcement
async function validateCoverage(taskPriority: string, newCodeCoverage: number) {
  const threshold = taskPriority === 'P1' ? 90 : 75;
  
  if (newCodeCoverage < threshold) {
    throw new Error(
      `Coverage ${newCodeCoverage}% below ${threshold}% threshold for ${taskPriority} task`
    );
  }
}
```

## Integration with COE Workflow

### MCP Tool Integration

Report test results via MCP:

```typescript
// After running tests
await mcpServer.callTool('reportObservation', {
  taskId: task.id,
  observation: `Tests: ${passedCount}/${totalCount} passed, Coverage: ${coverage}%`
});

// If tests fail
await mcpServer.callTool('reportTestFailure', {
  taskId: task.id,
  testName: 'getNextTask should return P1 task',
  error: failureMessage,
  stackTrace: error.stack
});

// If coverage is low, ask for guidance
if (coverage < 75) {
  const answer = await mcpServer.callTool('askQuestion', {
    question: `Coverage is ${coverage}%. What test cases should I add for ${uncoveredLines}?`,
    context: { taskId: task.id, uncoveredCode: snippet }
  });
}
```

### Verification Workflow

```typescript
// Before completing task
async function verifyTaskCompletion(task: Task) {
  // 1. Run tests
  const testResult = await runJestTests(task.modifiedFiles);
  
  if (testResult.failedCount > 0) {
    await reportTestFailure(task.id, testResult.failures);
    return 'BLOCKED';
  }
  
  // 2. Check coverage
  const coverage = await calculateNewCodeCoverage(task.modifiedFiles);
  const threshold = task.priority === 'P1' ? 90 : 75;
  
  if (coverage < threshold) {
    await reportObservation(task.id, `Coverage ${coverage}% below ${threshold}%`);
    return 'BLOCKED';
  }
  
  // 3. Pass verification
  await reportVerificationResult(task.id, 'pass');
  return 'COMPLETE';
}
```

## Scripts Reference

### run-tests.sh

Runs Jest tests with coverage:

```bash
#!/bin/bash
# Run Jest tests for modified files

set -e

echo "🧪 Running Jest tests..."

# Get test files for modified source files
MODIFIED_SRC=$(git diff --name-only --diff-filter=ACMR | grep -E 'src/.*\.ts$' | grep -v '\.test\.ts$' || true)

if [ -z "$MODIFIED_SRC" ]; then
  echo "✅ No source files modified"
  exit 0
fi

# Find corresponding test files
TEST_FILES=""
for file in $MODIFIED_SRC; do
  # Convert src/foo/bar.ts → src/foo/__tests__/bar.test.ts
  TEST_FILE=$(echo "$file" | sed 's/\.ts$/.test.ts/' | sed 's|\(src/[^/]*/\)\(.*\)|\1__tests__/\2|')
  if [ -f "$TEST_FILE" ]; then
    TEST_FILES="$TEST_FILES $TEST_FILE"
  fi
done

if [ -z "$TEST_FILES" ]; then
  echo "⚠️ No test files found for modified sources"
  echo "Consider creating tests in __tests__/ directories"
  exit 1
fi

# Run tests with coverage
npm test -- --coverage --collectCoverageFrom="$MODIFIED_SRC" $TEST_FILES

echo ""
echo "✅ Tests completed!"
```

### check-new-coverage.sh

Validates coverage for new code:

```bash
#!/bin/bash
# Check coverage for new/modified code only

set -e

if [ -z "$1" ]; then
  echo "Usage: check-new-coverage.sh <source-file>"
  exit 1
fi

SOURCE_FILE=$1
TEST_FILE=$(echo "$SOURCE_FILE" | sed 's/\.ts$/.test.ts/' | sed 's|\(src/[^/]*/\)\(.*\)|\1__tests__/\2|')

echo "📊 Checking coverage for: $SOURCE_FILE"
echo ""

# Run tests with coverage for specific file
npm test -- --coverage --collectCoverageFrom="$SOURCE_FILE" "$TEST_FILE"

# Parse coverage from JSON report
COVERAGE_JSON="coverage/coverage-summary.json"

if [ ! -f "$COVERAGE_JSON" ]; then
  echo "❌ Coverage report not found"
  exit 1
fi

# Extract metrics (would use jq in real script)
echo ""
echo "📈 Analyzing coverage requirements..."
node -e "
const coverage = require('./$COVERAGE_JSON');
const fileKey = Object.keys(coverage).find(k => k.includes('$SOURCE_FILE'));
const metrics = coverage[fileKey];

const linesPct = metrics.lines.pct;
const branchesPct = metrics.branches.pct;
const functionsPct = metrics.functions.pct;

const weighted = (linesPct * 0.4) + (branchesPct * 0.3) + (functionsPct * 0.2);

console.log(\`Lines: \${linesPct}%\`);
console.log(\`Branches: \${branchesPct}%\`);
console.log(\`Functions: \${functionsPct}%\`);
console.log(\`Weighted Score: \${weighted.toFixed(1)}%\`);

if (weighted >= 75) {
  console.log('✅ PASS: Coverage meets 75% threshold');
  process.exit(0);
} else {
  console.log('❌ FAIL: Coverage below 75% threshold');
  process.exit(1);
}
"
```

## Test Templates

### Unit Test Template

```typescript
import { functionUnderTest } from '../module';

describe('functionUnderTest', () => {
  // Arrange - setup test data
  const testInput = { /* ... */ };
  
  it('should handle happy path correctly', () => {
    // Act - execute function
    const result = functionUnderTest(testInput);
    
    // Assert - verify behavior
    expect(result).toBe(expectedOutput);
  });
  
  it('should handle edge case: empty input', () => {
    const result = functionUnderTest({});
    expect(result).toBeNull();
  });
  
  it('should throw error for invalid input', () => {
    expect(() => functionUnderTest(null)).toThrow('Invalid input');
  });
});
```

### Integration Test Template

```typescript
import { MCPServer } from '../mcpServer/server';
import { TaskService } from '../tasks/taskService';

describe('MCP Tool Integration: getNextTask', () => {
  let mcpServer: MCPServer;
  let taskService: TaskService;
  
  beforeEach(() => {
    // Setup test environment
    mcpServer = new MCPServer();
    taskService = new TaskService();
  });
  
  afterEach(() => {
    // Cleanup
    taskService.close();
  });
  
  it('should return highest priority task via MCP', async () => {
    // Arrange - create test tasks
    await taskService.createTask({ priority: 'P2', status: 'todo' });
    await taskService.createTask({ priority: 'P1', status: 'todo' });
    
    // Act - call MCP tool
    const response = await mcpServer.callTool('getNextTask', { planId: 'test' });
    
    // Assert - verify P1 task returned
    const task = JSON.parse(response.content[0].resource.text);
    expect(task.priority).toBe('P1');
  });
});
```

## Common Issues & Solutions

### Issue: "Tests are slow"

**Solution**: Use `--testPathPattern` to run specific tests:

```bash
npm test -- --testPathPattern=orchestrator
```

### Issue: "Coverage report is inaccurate"

**Solution**: Ensure coverage paths exclude unchanged files:

```bash
npm test -- --coverage --collectCoverageFrom="src/modified/**/*.ts"
```

### Issue: "Can't reach 75% coverage"

**Solution**: Use `askQuestion` MCP tool for guidance:

```typescript
await mcpServer.callTool('askQuestion', {
  question: 'How can I test this async function with network calls?',
  context: { code: functionCode }
});
```

## Checklist Before Task Completion

- [ ] All tests pass (0 failures)
- [ ] New code coverage ≥75% (≥90% for P1 tasks)
- [ ] Test files created for new source files
- [ ] Edge cases tested (empty input, errors, boundaries)
- [ ] Integration tests for MCP tools and cross-module interactions
- [ ] Coverage report reviewed for gaps

## Related Documentation

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **PRD.md**: Testing requirements and acceptance criteria
- **Verification Team Spec**: `Plans/COE-Master-Plan/02-Agent-Role-Definitions.md`

---

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Owner**: COE Development Team

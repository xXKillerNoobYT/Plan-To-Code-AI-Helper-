---
name: Auto Test Generator
description: AI generates comprehensive Jest tests automatically for COE TypeScript code, similar to q4test but for general-purpose testing
tags: [testing, quality, p1, ai-powered, jest, automation]
---

# Auto Test Generator Skill

**🤖 What This Skill Does (For Noobs!)**

This skill is like having a smart robot that writes tests for you! Instead of manually writing every test, Copilot analyzes your code and automatically generates comprehensive Jest test files with:
- ✅ Test cases for critical functionality (happy paths)
- ✅ Edge cases (null values, empty arrays, boundary conditions)
- ✅ Error scenarios (what happens when things go wrong?)
- ✅ Proper mocks for dependencies (fake versions of VS Code, databases, APIs)

**Think of it like this**: You write code → AI writes tests → You review and tweak → Done! 🎉

---

## When to Use This Skill

**Use this skill when**:
- ✅ Just implemented a new feature (e.g., MCP tool, agent function, UI component)
- ✅ Refactored existing code and need updated tests
- ✅ Coverage is below 75% and you need more test cases
- ✅ Onboarding new code that lacks tests
- ✅ Exploring "what could go wrong" scenarios

**Don't use when**:
- ❌ Tests already exist with good coverage (>75%)
- ❌ Code is too trivial (e.g., simple getter/setter functions)
- ❌ You need VS Code E2E tests (use Mocha framework instead)

---

## What This Skill Does

### 1. **Code Analysis** 📊
Examines the target file and extracts:
- Function signatures (inputs, outputs, types)
- Dependencies (imports, external modules)
- Control flow (if/else, loops, try/catch)
- Business logic patterns

### 2. **Test Scenario Generation** 💡
Suggests test cases categorized by priority:

| Category | Description | Examples |
|----------|-------------|----------|
| **Critical** (P1) | Core functionality, must work | "Returns task when queue not empty" |
| **High** (P2) | Common edge cases | "Handles null input", "Throws on invalid data" |
| **Medium** (P3) | Boundary conditions | "Works with empty array", "Max value handling" |
| **Low** (P4) | Nice-to-have scenarios | "Custom error messages", "Performance edge cases" |

### 3. **Test Code Generation** 🏗️
Creates complete Jest test files with:
- ✅ Proper imports and mocks
- ✅ `describe()` blocks organized by functionality
- ✅ `it()` test cases with Arrange-Act-Assert pattern
- ✅ Beginner-friendly comments explaining what each test does
- ✅ Mock setup for dependencies (VS Code, file system, network)

### 4. **Integration with MCP** 🔗
If analysis is ambiguous:
- Uses `askQuestion` MCP tool to clarify requirements
- Requests design context from Answer Team
- Validates test strategy with user before generating

---

## Step-by-Step Procedure

### Phase 1: Analyze Code and Plan Tests

```
1. Identify target file to test (user specifies or from git diff)
   Example: src/mcpServer/tools.ts

2. Extract code metadata:
   - Function names: getNextTask(), reportTaskStatus()
   - Input parameters: (planId: string), (taskId: string, status: string)
   - Return types: Promise<MCPToolResponse<Task>>
   - Dependencies: TaskQueue, MCPProtocol, vscode

3. Analyze control flow:
   - IF queue.isEmpty() → return null
   - IF task.priority === 'P1' → prioritize
   - TRY-CATCH error handling
   - Async/await patterns

4. Generate test plan (ask user for confirmation):
   ```
   Proposed test scenarios for getNextTask():
   
   Critical (P1):
   - ✅ Returns highest priority P1 task when available
   - ✅ Returns null when queue is empty
   - ✅ Excludes completed tasks
   
   High (P2):
   - ✅ Handles invalid planId (throws error)
   - ✅ Prioritizes critical over high priority
   - ✅ Breaks ties by creation date
   
   Medium (P3):
   - ✅ Filters by status correctly
   - ✅ Returns super-detailed prompt
   
   Generate these tests? (yes/no/customize)
   ```
```

### Phase 2: Generate Test File

```
5. Create test file structure:
   tests/<feature>/<module>.test.ts
   
   Example: tests/mcpServer/tools.test.ts

6. Generate imports and mocks:
   ```typescript
   // Mock VS Code (it doesn't exist in Jest environment)
   jest.mock('vscode', () => ({
     window: { showInformationMessage: jest.fn() },
     commands: { registerCommand: jest.fn() },
   }), { virtual: true });

   // Import module under test
   import { getNextTask } from '../../src/mcpServer/tools';
   import { TaskQueue } from '../../src/tasks/queue';
   ```

7. Generate describe blocks (one per function/class):
   ```typescript
   describe('getNextTask MCP Tool', () => {
     // Tests go here
   });
   ```

8. Generate test cases (Arrange-Act-Assert pattern):
   ```typescript
   it('should return highest priority P1 task when available', async () => {
     // Arrange: Set up test data
     const mockQueue = new TaskQueue();
     mockQueue.addTask({ id: '1', priority: 'P1', status: 'ready' });
     mockQueue.addTask({ id: '2', priority: 'P2', status: 'ready' });
     
     // Act: Run the function
     const result = await getNextTask('test-plan-id');
     
     // Assert: Check if it worked
     expect(result.task.id).toBe('1');
     expect(result.task.priority).toBe('P1');
   });
   ```

9. Add beginner-friendly comments:
   ```typescript
   /**
    * ✅ Test Case: Returns P1 task when available
    * 
    * What this test does:
    * - Creates a queue with 2 tasks (P1 and P2)
    * - Calls getNextTask() to get highest priority
    * - Checks that it returns the P1 task (not P2)
    * 
    * Why it's important:
    * - Ensures critical tasks are worked on first!
    */
   ```
```

### Phase 3: Run and Verify Tests

```
10. Run generated tests:
    npm run test:unit -- tests/mcpServer/tools.test.ts

11. Check results:
    IF all tests pass:
      → Report success ✅
      → Measure coverage
    ELSE:
      → Show failures
      → Offer to fix common issues:
        - Missing mocks
        - Incorrect assertions
        - Async timing issues

12. Measure coverage:
    npm run test:coverage -- tests/mcpServer/tools.test.ts
    
    IF coverage < 75%:
      → Suggest additional test cases
      → Highlight uncovered lines
    ELSE:
      → Report success ✅

13. Update documentation:
    - Add test file to tests/README.md
    - Log to Status/status-log.md
```

---

## Integration with COE Workflow

### Using MCP Tools

When generating tests, this skill may call MCP tools for clarification:

```typescript
// Example: Ask for design context
await mcpServer.callTool('askQuestion', {
  question: 'Should getNextTask throw error or return null when queue is empty?',
  context: {
    taskId: 'current-task-id',
    fileContext: 'src/mcpServer/tools.ts',
    codeSnippet: 'async function getNextTask(planId: string) { ... }'
  }
});

// Example: Report observation
await mcpServer.callTool('reportObservation', {
  taskId: 'task-123',
  observation: 'Generated 15 test cases for getNextTask() - all passing! Coverage: 92%'
});
```

### Backend Testing (MCP Server, Agents, Task Queue)

**Example: Testing `getNextTask()` MCP tool**

```typescript
describe('getNextTask MCP Tool', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    // Reset queue before each test
    taskQueue = new TaskQueue();
  });

  it('should return P1 task over P2 task', async () => {
    // Add tasks in reverse priority order
    taskQueue.addTask({ id: 'low', priority: 'P2', status: 'ready' });
    taskQueue.addTask({ id: 'high', priority: 'P1', status: 'ready' });

    const result = await getNextTask('plan-1');

    expect(result.task.id).toBe('high');
  });

  it('should exclude completed tasks', async () => {
    taskQueue.addTask({ id: 'done', priority: 'P1', status: 'done' });
    taskQueue.addTask({ id: 'ready', priority: 'P2', status: 'ready' });

    const result = await getNextTask('plan-1');

    expect(result.task.id).toBe('ready');
  });
});
```

### Frontend Testing (UI Panels, React Components)

**Example: Testing Verification Panel**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { VerificationPanel } from '../../src/ui/VerificationPanel';

describe('VerificationPanel UI Component', () => {
  it('should render task details', () => {
    const mockTask = {
      id: 'TASK-001',
      title: 'Implement feature X',
      status: 'verification-pending'
    };

    render(<VerificationPanel task={mockTask} />);

    expect(screen.getByText('TASK-001')).toBeInTheDocument();
    expect(screen.getByText('Implement feature X')).toBeInTheDocument();
  });

  it('should trigger approval callback on button click', () => {
    const mockOnApprove = jest.fn();
    const mockTask = { id: 'TASK-001', title: 'Test' };

    render(<VerificationPanel task={mockTask} onApprove={mockOnApprove} />);

    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledWith('TASK-001');
  });
});
```

---

## Using the Optional Script: `generate-tests.ts`

**What it does**: Automates test generation using AI prompts.

### Running the Script

```bash
# Generate tests for a specific file
npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/mcpServer/tools.ts

# Generate tests for all files in a directory
npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/mcpServer/

# Interactive mode (asks for scenarios)
npx ts-node .github/skills/auto-test-skill/generate-tests.ts --interactive
```

### Script Output

```
🤖 Analyzing: src/mcpServer/tools.ts
📊 Found 3 exported functions: getNextTask, reportTaskStatus, askQuestion
💡 Generating test scenarios...

Critical scenarios (P1):
  ✅ getNextTask returns P1 task when queue not empty
  ✅ reportTaskStatus updates task status correctly
  ✅ askQuestion routes to Answer Team

High priority scenarios (P2):
  ✅ getNextTask handles empty queue (returns null)
  ✅ reportTaskStatus throws on invalid status
  ✅ askQuestion includes context in payload

Generate 6 test cases? [y/n]: y

🏗️ Generating test file: tests/mcpServer/tools.test.ts
✅ Test file created! (250 lines)

▶️ Running tests...
 PASS  tests/mcpServer/tools.test.ts (3.45s)
   6 passed, 6 total

📊 Coverage: 89% (above 75% threshold ✅)

✨ Done! Next steps:
  1. Review generated tests
  2. Add custom test cases if needed
  3. Run npm run test:coverage to verify
```

---

## Common Test Patterns

### Pattern 1: Testing Async Functions

```typescript
it('should fetch data asynchronously', async () => {
  // Use async/await in test function
  const result = await fetchData();
  expect(result).toBeTruthy();
});
```

### Pattern 2: Testing Error Handling

```typescript
it('should throw error for invalid input', () => {
  // Use expect().toThrow() for sync functions
  expect(() => myFunction(null)).toThrow('Invalid input');
});

it('should throw error for invalid input (async)', async () => {
  // Use expect().rejects for async functions
  await expect(myAsyncFunction(null)).rejects.toThrow('Invalid input');
});
```

### Pattern 3: Mocking Dependencies

```typescript
// Mock entire module
jest.mock('../../src/utils/logger');

// Mock specific function
const mockFn = jest.fn().mockReturnValue('mocked value');

// Spy on existing function
const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
```

### Pattern 4: Setup and Teardown

```typescript
describe('MyFeature', () => {
  let mockQueue: TaskQueue;

  beforeEach(() => {
    // Runs before EACH test
    mockQueue = new TaskQueue();
  });

  afterEach(() => {
    // Runs after EACH test (cleanup)
    mockQueue.clear();
  });

  beforeAll(() => {
    // Runs ONCE before all tests
  });

  afterAll(() => {
    // Runs ONCE after all tests
  });
});
```

---

## Handling Ambiguous Cases

**When requirements are unclear**, use the `askQuestion` MCP tool:

```typescript
// Example: Unclear error handling behavior
const answer = await mcpServer.callTool('askQuestion', {
  question: `
    When getNextTask() receives an invalid planId:
    Option 1: Throw MCPProtocolError
    Option 2: Return null
    Option 3: Return empty result with error message
    
    Which behavior should I test for?
  `,
  context: {
    taskId: 'current-task',
    fileContext: 'src/mcpServer/tools.ts',
    codeSnippet: `
      export async function getNextTask(planId: string) {
        // What happens if planId is invalid?
      }
    `
  }
});

// Generate tests based on answer
// ...
```

---

## Quality Gates

**Before marking task complete**, ensure:

| Gate | Requirement | How to Check |
|------|-------------|--------------|
| **Tests Pass** | All tests ✅ | `npm run test:unit` |
| **Coverage** | ≥75% for new code | `npm run test:coverage` |
| **No Warnings** | Zero ESLint warnings (P1 tasks) | `npm run lint` |
| **Documentation** | Test file has comments | Manual review |
| **Realistic Mocks** | Mocks match real behavior | Code review |

---

## Examples by Module

### Example 1: MCP Server Tests

```typescript
// tests/mcpServer/server.test.ts
describe('MCP Server', () => {
  it('should start server successfully', async () => {
    const server = new MCPServer();
    await server.start();
    expect(server.isRunning()).toBe(true);
  });

  it('should handle request and return response', async () => {
    const server = new MCPServer();
    server.registerTool('testTool', async () => ({ success: true }));
    
    const response = await server.handleRequest({
      jsonrpc: '2.0',
      method: 'testTool',
      id: 1
    });

    expect(response.result.success).toBe(true);
  });
});
```

### Example 2: Agent Tests

```typescript
// tests/agents/orchestrator.test.ts
describe('Programming Orchestrator', () => {
  it('should route task to correct agent team', async () => {
    const orchestrator = new Orchestrator();
    const task = { type: 'planning', description: 'Create plan' };
    
    const assignedTeam = orchestrator.routeTask(task);
    
    expect(assignedTeam).toBe('Planning Team');
  });
});
```

### Example 3: Task Queue Tests

```typescript
// tests/tasks/queue.test.ts
describe('Task Queue', () => {
  it('should prioritize P1 over P2 tasks', () => {
    const queue = new TaskQueue();
    queue.addTask({ id: '1', priority: 'P2' });
    queue.addTask({ id: '2', priority: 'P1' });
    
    const next = queue.getNext();
    
    expect(next.id).toBe('2');
  });
});
```

---

## Troubleshooting

### Issue: "Cannot find module 'vscode'"
**Solution**: Add VS Code mock at top of test file:
```typescript
jest.mock('vscode', () => ({
  window: { showInformationMessage: jest.fn() },
  commands: { registerCommand: jest.fn() },
}), { virtual: true });
```

### Issue: "Test timeout after 5000ms"
**Solution**: Increase timeout for slow async tests:
```typescript
it('should complete slow operation', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

### Issue: "Coverage below threshold"
**Solution**: Run coverage report to see uncovered lines:
```bash
npm run test:coverage
# Open coverage/index.html in browser
# Look for red/yellow lines = untested code
```

### Issue: "Mock not working"
**Solution**: Ensure mock is defined before imports:
```typescript
// ✅ CORRECT ORDER
jest.mock('./myModule');
import { myFunction } from './myModule';

// ❌ WRONG ORDER
import { myFunction } from './myModule';
jest.mock('./myModule'); // Too late!
```

---

## Integration with Testing Workflow

```
1. Developer implements feature
   ↓
2. Copilot analyzes code
   ↓
3. Skill generates test plan
   ↓
4. User approves/customizes
   ↓
5. Skill generates test file
   ↓
6. Skill runs tests
   ↓
7. IF coverage < 75%:
     → Generate additional tests
   ELSE:
     → Mark task complete ✅
```

---

## Files Created/Updated

When this skill runs, it:

1. **Creates**: `tests/<module>/<file>.test.ts` - Generated test file
2. **Updates**: `tests/README.md` - Documents new test file
3. **Updates**: `Status/status-log.md` - Logs test generation
4. **Creates**: `coverage/` - Coverage reports (if enabled)

---

## Best Practices

✅ **DO**:
- Generate tests for critical P1 functionality first
- Include edge cases (null, empty, boundary values)
- Add comments explaining what each test checks
- Use descriptive test names (`should do X when Y`)
- Mock external dependencies (VS Code, file system, network)

❌ **DON'T**:
- Generate tests for trivial code (getters/setters)
- Test implementation details (test behavior, not code)
- Ignore failing tests (fix them or file investigation tasks)
- Hardcode test data (use variables for clarity)
- Skip cleanup (use afterEach to reset mocks)

---

## Success Metrics

After using this skill, you should see:

| Metric | Before | After |
|--------|--------|-------|
| Test Coverage | <50% | ≥75% |
| Test Creation Time | 2-4 hours | 15-30 min |
| Test Quality | Manual, inconsistent | AI-generated, comprehensive |
| Confidence | Low | High ✅ |

---

**Happy Testing! 🧪✨**

If you need help, use the `askQuestion` MCP tool to clarify requirements before generating tests!

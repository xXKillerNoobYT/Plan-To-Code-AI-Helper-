# Copilot Skills

**What are Copilot Skills?** 

Skills are instruction manuals that teach GitHub Copilot how to perform specialized tasks automatically during development. Each skill provides step-by-step procedures, scripts, and integration patterns for common development workflows.

## 📚 Available Skills

### 1. **Linting Skill** (`linting-skill/`)

**Purpose**: Automatically fix ESLint errors and enforce code quality standards

**Key Features**:
- ✅ Auto-fixes linting errors with `--fix` flag
- ✅ Enforces zero-warning requirement for P1 (critical) tasks  
- ✅ Validates code quality before task completion
- ✅ Provides P1 validation scripts

**Quick Start**:
```bash
# Auto-fix modified files
./linting-skill/eslint-fix.sh

# Validate P1 task (zero warnings required)
./linting-skill/validate-p1.sh src/mcpServer/tools.ts
```

📖 [Full Documentation](linting-skill/SKILL.md)

---

### 2. **Testing Skill** (`testing-skill/`)

**Purpose**: Run Jest tests with coverage analysis for new code

**Key Features**:
- ✅ Runs Jest tests for modified files only
- ✅ Measures coverage for new code (≥75% required, ≥90% for P1)
- ✅ Generates HTML coverage reports
- ✅ Identifies uncovered lines and suggests test cases

**Quick Start**:
```bash
# Run tests for modified files
./testing-skill/run-tests.sh

# Check coverage for specific file
./testing-skill/check-new-coverage.sh src/mcpServer/tools.ts

# Check coverage for P1 task (90% threshold)
./testing-skill/check-new-coverage.sh src/agents/orchestrator.ts 90
```

📖 [Full Documentation](testing-skill/SKILL.md)

---

### 3. **Auto Test Generator Skill** (`auto-test-skill/`) 🆕

**Purpose**: AI-powered automatic test generation for COE TypeScript code (like q4test but general-purpose)

**Key Features**:
- 🤖 **AI-Powered Test Generation** - Automatically creates comprehensive Jest tests
- 🎯 **Smart Scenario Detection** - Identifies critical paths, edge cases, error handling
- 🎭 **Automatic Mocking** - Generates mocks for VS Code, file system, dependencies
- 🔗 **MCP Integration** - Uses `askQuestion` when requirements are unclear
- 📊 **Coverage Focus** - Ensures ≥75% coverage (≥90% for P1 tasks)
- 💬 **Beginner-Friendly** - Generated tests include explanatory comments

**Quick Start**:
```bash
# Option 1: Use script to generate tests
npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/mcpServer/tools.ts

# Option 2: Ask Copilot
"Generate tests for src/mcpServer/tools.ts with critical and edge cases"
```

**What It Does**:
1. Analyzes source code (functions, parameters, control flow)
2. Generates test scenarios (Critical P1, High P2, Medium P3)
3. Creates complete Jest test file with mocks and comments
4. Runs tests and measures coverage

**Example Output**:
```typescript
describe('getNextTask', () => {
  /**
   * ✅ should return highest priority P1 task
   * Priority: P1 | Category: critical
   */
  it('should return highest priority P1 task', async () => {
    // Arrange: Set up test data
    const queue = new TaskQueue();
    queue.addTask({ id: '1', priority: 'P1' });
    
    // Act: Call the function
    const result = await getNextTask('plan-1');
    
    // Assert: Check expectations
    expect(result.task.id).toBe('1');
  });
});
```

📖 [Full Documentation](auto-test-skill/SKILL.md)

---

### 4. **Debug Skill** (`debug-skill/`) 🆕

**Purpose**: AI-powered debugging assistance - analyzes errors, suggests breakpoints, and guides you through fixing bugs

**Key Features**:
- 🔍 **Error Analysis** - Examines error messages and stack traces to identify root causes
- 🎯 **Strategic Breakpoints** - Suggests where to set breakpoints for maximum debugging efficiency
- 📋 **Step-by-Step Guidance** - Provides structured debugging workflow (reproduce → inspect → fix)
- 🐛 **Common Bug Patterns** - Recognizes null references, type mismatches, async issues
- 🔗 **MCP Integration** - Uses `askQuestion` for AI debugging assistance
- 💬 **Beginner-Friendly** - Explains debugging concepts for noobs

**Quick Start**:
```bash
# 1. Set breakpoint (click line number gutter)
# 2. Press F5 to start debugging
# 3. Use debug toolbar:
#    - F10: Step Over
#    - F11: Step Into
#    - Shift+F11: Step Out
#    - F5: Continue

# Or ask Copilot:
"I'm getting TypeError in getNextTask. Where should I set breakpoints?"
```

**Debug Configurations** (in `.vscode/launch.json`):
- 🚀 **Run Extension** - Debug extension code (MCP server, commands, UI)
- 🧪 **Debug Jest Tests** - Debug all unit tests
- 🎯 **Debug Current File** - Debug single test file (faster)
- 🧩 **Extension Tests** - Debug E2E Mocha tests
- 🔗 **Attach to Process** - Debug running Node.js process

**Common Scenarios**:
```typescript
// Scenario 1: Test failing
it('should return P1 task', () => {
  const result = getNextTask('plan-1');  // 🔴 Set breakpoint
  expect(result.priority).toBe('P1');    // ❌ Fails - why?
});

// Scenario 2: Function returns wrong value
function calculatePriority(task: Task) {
  let priority = 0;  // 🔴 Breakpoint 1
  if (task.priority === 'P1') {
    priority = 1;
  }
  return priority;   // 🔴 Breakpoint 2 - inspect value
}

// Scenario 3: Extension won't activate
export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 COE Activated');  // 🔴 Does this run?
  // If not hit → check package.json activationEvents
}
```

**Advanced Techniques**:
- ⚡ **Conditional Breakpoints**: Pause only when `task.priority === 'P1'`
- 📝 **Logpoints**: Log without pausing execution
- 👁️ **Watch Expressions**: Monitor values as you step through
- 💻 **Debug Console**: Evaluate expressions while paused

📖 [Full Documentation](debug-skill/SKILL.md) | 📘 [Debug Tutorial](../docs/debug-guide.md)

---

### 5. **MCP Tool Skill** (`mcp-tool-skill/`)

**Purpose**: Integrate MCP (Model Context Protocol) tools during development for intelligent assistance

**Key Features**:
- ✅ Uses `askQuestion` to get context-aware answers during coding
- ✅ Reports observations via `reportObservation`
- ✅ Handles test failures with `reportTestFailure`
- ✅ Coordinates with Answer Team, Planning Team, Verification Team

**Quick Start**:
```typescript
import { MCPServer } from '../../src/mcpServer/server';

const mcpServer = new MCPServer();

// Ask for clarification
await mcpServer.callTool('askQuestion', {
  question: 'Should getNextTask return null or throw error when queue is empty?',
  context: { taskId, fileContext, codeSnippet }
});

// Report observation
await mcpServer.callTool('reportObservation', {
  taskId: task.id,
  observation: 'Found missing dependency',
  severity: 'warning'
});

// Report test failure
await mcpServer.callTool('reportTestFailure', {
  taskId: task.id,
  testName: 'should return P1 task',
  error: 'Expected P1, got P2'
});
```

📖 [Full Documentation](mcp-tool-skill/SKILL.md)

---

## 🔄 Typical Development Workflow with Skills

### Standard Task Execution

```bash
# 1. Start task - Use MCP Tool Skill
# Ask questions if requirements are unclear

# 2. Implement feature
# Write TypeScript code following COE standards

# 3. Run linting - Linting Skill
./.github/skills/linting-skill/eslint-fix.sh

# 4. Run tests - Testing Skill
./.github/skills/testing-skill/run-tests.sh

# 5. Check coverage - Testing Skill
./.github/skills/testing-skill/check-new-coverage.sh src/myFeature.ts

# 6. Report completion - MCP Tool Skill
# Use reportTaskStatus('completed') via MCP
```

### P1 (Critical Priority) Task Workflow

```bash
# P1 tasks have stricter requirements!

# 1. Implement feature carefully (P1 = launch blocker)

# 2. Validate P1 linting (ZERO warnings required)
./.github/skills/linting-skill/validate-p1.sh src/myP1Feature.ts

# 3. Run tests with 90% coverage threshold
./.github/skills/testing-skill/check-new-coverage.sh src/myP1Feature.ts 90

# 4. Manual review before completion
# P1 tasks should be double-checked!
```

---

## 📋 Skill Usage Rules

### When to Use Each Skill

| Scenario | Skill to Use |
|----------|--------------|
| 🤔 Unclear requirements or implementation approach | **MCP Tool Skill** → `askQuestion` |
| 🐛 Test failing or code has bugs | **Debug Skill** → Set breakpoints, F5 to debug |
| 🧪 Need tests for new code | **Auto Test Generator Skill** → Generate tests automatically |
| ✅ Want to run tests with coverage | **Testing Skill** → Run tests, check coverage |
| 🔧 Code has linting errors | **Linting Skill** → Auto-fix with `--fix` flag |
| 📝 Want to log observation during coding | **MCP Tool Skill** → `reportObservation` |
| ❌ Tests failed and need investigation | **MCP Tool Skill** → `reportTestFailure` |
| 🎯 Need to debug specific functionality | **Debug Skill** → Use appropriate debug config |
| 📝 After modifying TypeScript/JavaScript files | **Linting Skill** → `eslint-fix.sh` |
| ✅ Before marking task as completed | **Testing Skill** → `run-tests.sh` |
| 🧪 Verifying code coverage | **Testing Skill** → `check-new-coverage.sh` |
| ❌ Test failure during development | **MCP Tool Skill** → `reportTestFailure` |
| 📊 Discovered issue or dependency | **MCP Tool Skill** → `reportObservation` |
| 🚨 Working on P1 (critical) task | **Linting Skill** → `validate-p1.sh` (zero warnings!) |

### Quality Gates Enforced by Skills

| Gate | Threshold | Enforced By | P1 Requirement |
|------|-----------|-------------|----------------|
| **ESLint Warnings** | ≤10 warnings | Linting Skill | **0 warnings** (strict!) |
| **Code Coverage** | ≥75% | Testing Skill | **≥90%** (higher bar) |
| **Test Failures** | 0 failures | Testing Skill | 0 failures |
| **TypeScript Errors** | 0 errors | Linting Skill | 0 errors |

---

## 🎯 Integration with COE Workflow

### Skills + MCP Tools = Intelligent Development

Skills work together with MCP (Model Context Protocol) tools to create an intelligent development workflow:

1. **MCP Tool Skill** provides access to:
   - `askQuestion` - Get answers from Answer Team
   - `reportObservation` - Log discoveries
   - `reportTestFailure` - Auto-create investigation tasks
   - `reportTaskStatus` - Update task progress

2. **Linting Skill** ensures:
   - Code quality standards are met
   - P1 tasks have zero warnings
   - Auto-fixable issues are resolved

3. **Testing Skill** validates:
   - All tests pass
   - Coverage requirements met
   - New code is well-tested

### Example: Full Task with Skills

```typescript
// Task: Implement getNextTask MCP tool

// Step 1: Ask clarification (MCP Tool Skill)
await mcpServer.callTool('askQuestion', {
  question: 'Should getNextTask return null or throw when queue is empty?',
  context: { taskId: 'task-123', fileContext: ['src/mcpServer/tools.ts'] }
});

// Step 2: Implement based on answer
export async function getNextTask(planId: string): Promise<Task | null> {
  const task = await taskService.getHighestPriorityTask(planId);
  return task; // Returns null if empty (based on Answer Team response)
}

// Step 3: Run linting (Linting Skill)
// $ ./.github/skills/linting-skill/eslint-fix.sh
// ✅ Fixed 3 issues, 0 warnings remain

// Step 4: Run tests (Testing Skill)
// $ ./.github/skills/testing-skill/run-tests.sh
// ✅ All 8 tests passed

// Step 5: Check coverage (Testing Skill)
// $ ./.github/skills/testing-skill/check-new-coverage.sh src/mcpServer/tools.ts
// Coverage: 82% ✅ (above 75% threshold)

// Step 6: Report completion (MCP Tool Skill)
await mcpServer.callTool('reportTaskStatus', {
  taskId: 'task-123',
  status: 'completed',
  output: 'Implemented getNextTask MCP tool. Tests pass, coverage 82%.'
});
```

---

## 🆕 Creating New Skills

Want to add a new skill? Follow this structure:

### Skill Directory Structure

```
.github/skills/
  <skill-name>/
    SKILL.md              # Main documentation with frontmatter
    script1.sh            # Helper scripts (Bash for Linux/Mac)
    script2.ps1           # PowerShell scripts (for Windows)
    README.md             # Optional quick reference
```

### SKILL.md Template

```markdown
---
name: skill-name
description: Brief description of what the skill does
tags: [tag1, tag2, tag3]
---

# Skill Name

Overview of what this skill does...

## When to Use This Skill

- Scenario 1
- Scenario 2
- Scenario 3

## What This Skill Does

1. Step 1 description
2. Step 2 description
3. Step 3 description

## Step-by-Step Procedure

### Phase 1: <Phase Name>

```
Detailed step-by-step instructions
```

### Phase 2: <Phase Name>

```
More detailed instructions
```

## Usage Examples

### Example 1: <Example Name>

```bash
# Command to run
./script.sh argument
```

## Integration with COE Workflow

How this skill integrates with MCP tools, other skills, etc.

## Scripts Reference

### script-name.sh

Description and usage...

## Common Issues & Solutions

### Issue: "Problem description"

**Solution**: How to fix...

## Checklist

- [ ] Item 1
- [ ] Item 2

## Related Documentation

- Link 1
- Link 2

---

**Version**: 1.0.0  
**Last Updated**: <date>  
**Owner**: COE Development Team
```

### Registering New Skills

After creating a skill, update `.github/copilot-instructions.md`:

1. Add skill to **"Copilot Skills"** section
2. Include quick usage examples
3. Link to SKILL.md documentation
4. Update workflow examples if needed

---

## 📖 Related Documentation

- **Copilot Instructions**: `../.github/copilot-instructions.md` - Global development rules
- **PRD**: `../../PRD.md` - Feature specifications and requirements
- **MCP API Reference**: `../../Plans/COE-Master-Plan/05-MCP-API-Reference.md` - MCP tool contracts
- **Agent Teams**: `../../Plans/COE-Master-Plan/02-Agent-Role-Definitions.md` - Team coordination

---

## 🎓 For Beginners

**New to skills?** Think of each skill as a recipe:

1. **Linting Skill** = Recipe for "clean code" → Automatically fixes messy code
2. **Testing Skill** = Recipe for "quality check" → Makes sure your code works
3. **MCP Tool Skill** = Recipe for "asking for help" → Gets expert answers when stuck

**How to use**:
1. Read the SKILL.md file for the skill you need
2. Run the provided scripts (`.sh` files)
3. Follow the step-by-step procedures
4. Check the examples for guidance

**Golden Rule**: Always run Linting Skill + Testing Skill before marking a task as done!

---

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Maintained By**: COE Development Team

Need help? Use the **MCP Tool Skill** to ask questions! 🚀

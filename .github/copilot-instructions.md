---
name: COE Development Standards
description: Global rules for GitHub Copilot when working on the Copilot Orchestration Extension. Always reference PRD.json/md, use TypeScript, follow modular execution (atomic tasks), respect P1 priorities, and stay under 5000 tokens per context.
---

# 🤖 What Are These Instructions? (For Noobs!)

**Think of this file as Copilot's rulebook!** 📖

Every time GitHub Copilot helps you with code in this project, it automatically reads this file first. These are **global rules** that tell Copilot:
- What coding style to use (TypeScript, not JavaScript)
- How to break down work (small, atomic tasks)
- What documents to check (PRD.json/md)
- What mistakes to avoid (overgeneration, skipping priorities)

**You don't need to repeat these rules** — Copilot remembers them automatically! 🎯

---

## 🎯 Project Context: COE Overview

**Project Name**: Copilot Orchestration Extension (COE)  
**Type**: VS Code Extension for AI-powered project planning & task management  
**Tech Stack**: TypeScript, Node.js, React, SQLite, WebSockets  
**Status**: Phase 4 (UI Implementation) - 54% complete, launching Feb 15, 2026  

### 🚨 PRIMARY SOURCES OF TRUTH (Always Check These!)

Before implementing ANY feature, you MUST read:

1. **`PRD.json`** or **`PRD.md`** — Complete feature specifications (2,225 lines)
   - Contains all 35 features with acceptance criteria
   - Includes agent team definitions, workflows, and priorities
   - Updated daily with current sprint details

2. **`Plans/CONSOLIDATED-MASTER-PLAN.md`** — Architecture & technical specs (1,022 lines)
   - System architecture and component relationships
   - Multi-agent orchestration details
   - Implementation roadmap and status tracking

3. **`Plans/COE-Master-Plan/`** — Detailed technical documentation
   - `02-Agent-Role-Definitions.md` — Complete agent specifications (1,021 lines)
   - `05-MCP-API-Reference.md` — MCP tool contracts (978 lines)
   - Other architecture docs as needed

**💡 Rule**: If you're unsure about a feature, search PRD.json/md first. Don't guess!

---

## 📋 Coding Standards

### 1. **TypeScript Only** (No JavaScript!)
```typescript
// ✅ GOOD: Strong typing with interfaces
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'inProgress' | 'done' | 'blocked';
  priority: 'P1' | 'P2' | 'P3';
  estimatedHours?: number;
}

async function getNextTask(): Promise<Task | null> {
  // Implementation...
}

// ❌ BAD: No types, using 'any'
async function getNextTask() {
  const task: any = await fetch('/api/task');
  return task;
}
```

**Key Rules**:
- **Always** define interfaces for data structures
- Use **strict TypeScript** (`noImplicitAny`, `strictNullChecks`)
- Avoid `any` type — use `unknown` if type is truly unknown
- Use enums or string literal unions for constants
- Document complex types with JSDoc comments

### 2. **Modular Execution: "One Thing at a Time"**

Every code change must be **atomic** — satisfying ALL 5 criteria:

| Criterion | Description | Example |
|-----------|-------------|---------|
| ✅ **Single Responsibility** | Affects one logical concern only | One function, one endpoint, one component |
| ✅ **Atomic Completion** | Can finish, test, commit independently | No "half-done" states |
| ✅ **Time Box** | 15-45 minutes to complete | Split larger tasks further |
| ✅ **Verification Closure** | Clear acceptance criterion, verifiable in <5 min | "Button clicks → modal opens" |
| ✅ **Token Safety** | Full context fits under 5,000 tokens | Keep implementations focused |

**Examples**:

```typescript
// ✅ GOOD: Atomic task — "Add getNextTask MCP tool"
export async function getNextTask(
  planId: string
): Promise<MCPToolResponse<Task>> {
  const task = await taskService.getHighestPriorityTask(planId);
  return {
    content: [{
      type: 'resource',
      resource: {
        uri: `task://${task.id}`,
        mimeType: 'application/json',
        text: JSON.stringify(task)
      }
    }]
  };
}

// ❌ BAD: Multi-concern task — "Add all MCP tools at once"
// (This violates Single Responsibility — should be 6 separate tasks)
export async function getAllMCPTools() {
  // Implements getNextTask, reportStatus, reportObservation,
  // reportTestFailure, reportVerification, askQuestion...
  // TOO MUCH IN ONE TASK!
}
```

**Rejection Rule**: If a task affects >1 logical concern, STOP and decompose it further.

### 3. **File Organization & Naming**

```
src/
  mcpServer/          # MCP protocol implementation
    server.ts         # Main MCP server
    protocol.ts       # JSON-RPC 2.0 protocol
    tools.ts          # Tool definitions
  
  agents/             # Agent team implementations
    orchestrator.ts   # Programming Orchestrator (Boss AI)
    planningTeam.ts   # Planning Team agent
    answerTeam.ts     # Answer Team agent
    verificationTeam.ts # Verification Team agent
  
  tasks/              # Task management
    taskService.ts    # Core task CRUD operations
    taskQueue.ts      # Priority queue with P1/P2/P3
    taskDecomposer.ts # Automatic task splitting
  
  ui/                 # React webview components
    VerificationPanel.tsx
    OrchestratorDashboard.tsx
    PlanBuilder.tsx
```

**Naming Conventions**:
- **Files**: camelCase (e.g., `taskService.ts`, `orchestrator.ts`)
- **Classes/Interfaces**: PascalCase (e.g., `TaskService`, `MCPServer`)
- **Functions/Variables**: camelCase (e.g., `getNextTask`, `currentPlan`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Types**: PascalCase with descriptive names (e.g., `TaskStatus`, `MCPToolRequest`)

### 4. **Error Handling & Validation**

```typescript
// ✅ GOOD: Comprehensive error handling with types
import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  status: z.enum(['todo', 'inProgress', 'done', 'blocked']),
  priority: z.enum(['P1', 'P2', 'P3']),
});

async function createTask(input: unknown): Promise<Task> {
  try {
    // Validate input with Zod
    const validated = TaskSchema.parse(input);
    
    // Business logic
    const task = await db.tasks.insert(validated);
    
    return task;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid task data', error.errors);
    }
    
    // Log and rethrow
    logger.error('Failed to create task', { error, input });
    throw error;
  }
}

// ❌ BAD: Silent failures, no validation
async function createTask(input: any) {
  const task = await db.tasks.insert(input); // What if input is invalid?
  return task;
}
```

**Rules**:
- **Always** validate MCP tool inputs with Zod schemas
- Use try-catch for async operations
- Log errors with context (don't swallow them)
- Return error responses in MCP format (JSON-RPC 2.0)
- Implement retry logic for network calls (max 3 attempts, exponential backoff)

### 5. **Testing Requirements**

**Every new feature MUST include tests:**

```typescript
// ✅ GOOD: Test for getNextTask MCP tool
describe('getNextTask MCP Tool', () => {
  it('returns highest priority P1 task when available', async () => {
    // Arrange
    const planId = 'test-plan-123';
    await createTestTasks([
      { id: '1', priority: 'P2', status: 'todo' },
      { id: '2', priority: 'P1', status: 'todo' },
      { id: '3', priority: 'P1', status: 'done' },
    ]);

    // Act
    const result = await getNextTask(planId);

    // Assert
    expect(result.content[0].resource.text).toContain('"id":"2"');
  });

  it('returns null when no tasks available', async () => {
    const result = await getNextTask('empty-plan');
    expect(result.content[0].resource.text).toBe('null');
  });
});
```

**Coverage Targets**:
- **Unit tests**: ≥80% coverage for all service logic
- **Integration tests**: All MCP tools, agent coordination
- **E2E tests**: Critical user workflows (plan creation → task execution → verification)

**Test Patterns**:
- Use **Jest** for unit/integration tests
- Use **Mocha** for VS Code extension E2E tests
- Mock external dependencies (GitHub API, file system)
- Use test fixtures in `src/test/fixtures/`

---

## 🔄 Workflows: How to Use MCP Tools & PRD

### 1. **Before Starting Any Task**

**Checklist** (in order):
1. ✅ Read the feature spec in **PRD.json** or **PRD.md**
2. ✅ Check if there's a detailed spec in `Plans/COE-Master-Plan/`
3. ✅ Review acceptance criteria for the task
4. ✅ Identify dependencies (what needs to be done first?)
5. ✅ Confirm task is atomic (5 criteria check)
6. ✅ Start implementation (one thing at a time!)

**Example Workflow**:
```bash
# User says: "Implement the getNextTask MCP tool"

# Step 1: Read PRD.md
# Search for "getNextTask" → Find feature F028 (MCP Server)

# Step 2: Check detailed spec
# Open Plans/COE-Master-Plan/05-MCP-API-Reference.md
# Read request/response schema, error codes

# Step 3: Review acceptance criteria
# - Tool returns highest priority P1 task
# - Returns super-detailed prompt with context
# - Handles empty queue (returns null)

# Step 4: Identify dependencies
# - Needs taskService.getHighestPriorityTask()
# - Already implemented? Check src/tasks/taskService.ts

# Step 5: Confirm atomic
# ✅ Single responsibility: One MCP tool
# ✅ Atomic: Can test independently
# ✅ Time box: ~30 minutes
# ✅ Verification: Unit test + manual MCP call
# ✅ Token safety: ~800 tokens for implementation

# Step 6: Implement!
```

### 2. **Using MCP Tools in Your Code**

**MCP Tools** are how agents communicate with the system. When implementing features, you'll often call these tools:

```typescript
import { MCPServer } from './mcpServer/server';

// Initialize MCP server
const mcpServer = new MCPServer();

// Example: Get next task for agent
const taskResponse = await mcpServer.callTool('getNextTask', {
  planId: 'current-plan-id'
});

// Example: Report task status
await mcpServer.callTool('reportTaskStatus', {
  taskId: 'task-123',
  status: 'completed',
  output: 'Successfully implemented feature X'
});

// Example: Ask a question (routes to Answer Team)
const answer = await mcpServer.callTool('askQuestion', {
  question: 'What is the recommended approach for error handling?',
  context: { taskId: 'task-123', fileContext: 'src/tasks/taskService.ts' }
});
```

**Available MCP Tools** (from PRD.md):
1. **`getNextTask`** — Returns highest priority task with super-detailed prompt
2. **`reportTaskStatus`** — Updates task status (inProgress/completed/failed/blocked)
3. **`reportObservation`** — Logs observations during execution
4. **`reportTestFailure`** — Reports test failures, creates investigation tasks
5. **`reportVerificationResult`** — Submits verification results (pass/fail/partial)
6. **`askQuestion`** — Routes questions to Answer Team for context-aware responses

**When to Use Each Tool**:
- Starting a task? → `getNextTask`
- Task done? → `reportTaskStatus` with status='completed'
- Found an issue? → `reportObservation` or `reportTestFailure`
- Need help? → `askQuestion`
- Verification step? → `reportVerificationResult`

### 3. **Agent Team Alignment**

The COE uses **4 specialized agent teams**. As Copilot (Coding AI), you align with:

| Team | Role | When Copilot Is Involved |
|------|------|-------------------------|
| **Programming Orchestrator** | Master coordinator, routes tasks to agents | Copilot receives tasks from Orchestrator |
| **Planning Team** | Generates task breakdowns, estimates effort | Copilot implements tasks created by Planning Team |
| **Answer Team** | Provides context-aware Q&A | Copilot asks questions via `askQuestion` tool |
| **Verification Team** | Tests and verifies completed tasks | Copilot's code is tested by Verification Team |

**Your Role as Copilot (Coding AI)**:
- ✅ Implement tasks handed off by Orchestrator
- ✅ Follow "one thing at a time" modular execution
- ✅ Ask questions when context is unclear (use `askQuestion`)
- ✅ Report status updates after completing work
- ✅ Write tests for your implementations
- ❌ Don't plan tasks (that's Planning Team's job)
- ❌ Don't decide priorities (respect P1/P2/P3 from PRD)
- ❌ Don't skip verification (Verification Team needs to approve)

**Example Agent Coordination**:
```
1. Planning Team creates task: "Implement getNextTask MCP tool (P1)"
2. Orchestrator routes task to Copilot (you!)
3. Copilot (you) implements the tool in src/mcpServer/tools.ts
4. Copilot calls reportTaskStatus('completed')
5. Verification Team runs automated tests
6. If tests pass → Task marked done → Next task unlocked
```

---

## Plan & Documentation Quick Access

**Primary Planning Docs** (read these first):
1. **`Plans/README.md`** — Master index of all planning specifications
2. **`Plans/CONSOLIDATED-MASTER-PLAN.md`** — Complete project plan and structure
3. **`Plans/QUICK-REFERENCE-CARD.md`** — Fast lookup for common patterns
4. **`Plans/MODULAR-EXECUTION-PHILOSOPHY.md`** — "One thing at a time" enforcement rules
5. **`Plans/PROJECT-PLAN-TEMPLATE.md`** — Template for new project planning

**Specialized Specifications**:
- **Planning Wizard**: `Plans/PLANNING-WIZARD-SPECIFICATION.md`
- **Answer Team**: `Plans/ANSWER-AI-TEAM-SPECIFICATION.md`
- **Ticket System**: `Plans/TICKET-SYSTEM-SPECIFICATION.md`
- **Lifecycle Model**: `Plans/PROGRAM-LIFECYCLE-MODEL.md`
- **Evolution Engine**: `Plans/EVOLUTION-PHASE-DEEP-DIVE.md`

**Architecture Details**: `Plans/COE-Master-Plan/` (10 detailed architecture documents)

---

## 🛠️ Copilot Skills: Specialized Tools for Development

**What are Skills?** Think of skills as instruction manuals that teach Copilot how to do specific tasks automatically during coding sessions.

### Available Skills

The COE project includes specialized skills in `.github/skills/` to automate common development tasks:

#### 1. **Linting Skill** (`.github/skills/linting-skill/`)

**Purpose**: Auto-fix ESLint errors and enforce code quality standards

**When to Use**:
- After modifying TypeScript/JavaScript files
- Before committing code
- For P1 tasks (requires zero warnings)

**Key Features**:
- Auto-fixes linting errors with `--fix` flag
- Enforces zero-warning requirement for P1 (critical) tasks
- Validates code quality before task completion
- Integrates with MCP `askQuestion` tool for unfixable errors

**Quick Commands**:
```bash
# Auto-fix modified files
./.github/skills/linting-skill/eslint-fix.sh

# Validate P1 task (zero warnings required)
./.github/skills/linting-skill/validate-p1.sh src/mcpServer/tools.ts
```

**Documentation**: `.github/skills/linting-skill/SKILL.md`

#### 2. **Testing Skill** (`.github/skills/testing-skill/`)

**Purpose**: Run Jest tests with coverage analysis for new code

**When to Use**:
- After implementing new features
- Before marking tasks as completed
- When verifying code quality

**Key Features**:
- Runs Jest tests for modified files
- Measures coverage for new code only
- Enforces ≥75% coverage requirement (≥90% for P1 tasks)
- Generates HTML coverage reports
- Identifies uncovered lines and suggests test cases

**Quick Commands**:
```bash
# Run tests for modified files
./.github/skills/testing-skill/run-tests.sh

# Check coverage for specific file
./.github/skills/testing-skill/check-new-coverage.sh src/mcpServer/tools.ts

# Check coverage for P1 task (90% threshold)
./.github/skills/testing-skill/check-new-coverage.sh src/agents/orchestrator.ts 90
```

**Documentation**: `.github/skills/testing-skill/SKILL.md`

#### 3. **MCP Tool Skill** (`.github/skills/mcp-tool-skill/`)

**Purpose**: Integrate MCP (Model Context Protocol) tools during development

**When to Use**:
- When implementation details are unclear
- After discovering unexpected behavior
- When test failures occur
- For intelligent Q&A during coding

**Key Features**:
- Uses `askQuestion` MCP tool for clarifications
- Reports observations via `reportObservation`
- Handles test failures with `reportTestFailure`
- Coordinates with Answer Team, Planning Team, Verification Team
- Maintains context-aware communication

**Common MCP Tools**:
```typescript
// Ask for clarification
await mcpServer.callTool('askQuestion', {
  question: 'Should getNextTask return null or throw error when queue is empty?',
  context: { taskId, fileContext, codeSnippet }
});

// Report observation
await mcpServer.callTool('reportObservation', {
  taskId: task.id,
  observation: 'Found missing dependency: taskService.getHighestPriorityTask()'
});

// Report test failure
await mcpServer.callTool('reportTestFailure', {
  taskId: task.id,
  testName: 'should return P1 task',
  error: 'Expected P1, got P2'
});
```

**Documentation**: `.github/skills/mcp-tool-skill/SKILL.md`

### How to Use Skills

**During Development**:
1. **Before coding**: Read SKILL.md for relevant skills
2. **While coding**: Use MCP Tool Skill for clarifications
3. **After coding**: Run Linting Skill to fix errors
4. **Before completion**: Run Testing Skill to validate coverage
5. **Report results**: Use MCP tools to update task status

**Skill Workflow Example**:
```bash
# 1. Start task (use MCP Tool Skill)
# Ask questions if requirements unclear

# 2. Implement feature
# Write TypeScript code following standards

# 3. Run linting (Linting Skill)
./.github/skills/linting-skill/eslint-fix.sh

# 4. Run tests (Testing Skill)
./.github/skills/testing-skill/run-tests.sh

# 5. Check coverage
./.github/skills/testing-skill/check-new-coverage.sh src/myFeature.ts

# 6. Report completion (MCP Tool Skill)
# Use reportTaskStatus('completed')
```

### Creating New Skills

**Skill Structure**:
```
.github/skills/<skill-name>/
  SKILL.md          # Frontmatter + instructions
  script1.sh        # Helper scripts (optional)
  script2.ps1       # PowerShell for Windows (optional)
```

**SKILL.md Template**:
```markdown
---
name: skill-name
description: Brief description of what the skill does
tags: [tag1, tag2, tag3]
---

# Skill Name

Brief overview...

## When to Use This Skill
- Scenario 1
- Scenario 2

## What This Skill Does
1. Step 1
2. Step 2

## Step-by-Step Procedure
...

## Integration with COE Workflow
...
```

---

## ⚠️ Common Pitfalls (Avoid These!)

### 1. **Overgeneration** (Big #1 Mistake!)

**Problem**: Implementing too much in one go, violating atomic execution.

```typescript
// ❌ BAD: Generating entire MCP server in one shot
// This is 500+ lines, multiple concerns, NOT atomic!
export class MCPServer {
  // ... 100 lines of setup ...
  
  async getNextTask() { /* ... */ }
  async reportTaskStatus() { /* ... */ }
  async reportObservation() { /* ... */ }
  async reportTestFailure() { /* ... */ }
  async reportVerificationResult() { /* ... */ }
  async askQuestion() { /* ... */ }
  
  // ... 200 more lines ...
}

// ✅ GOOD: One tool at a time
// File 1: src/mcpServer/tools/getNextTask.ts (atomic!)
export async function getNextTask(params: GetNextTaskParams) {
  // Single concern: Get highest priority task
  // ~50 lines, focused, testable
}

// File 2 (separate task): src/mcpServer/tools/reportTaskStatus.ts
export async function reportTaskStatus(params: ReportStatusParams) {
  // Next atomic task after getNextTask is done
}
```

**How to Avoid**:
- If your implementation is >100 lines, STOP and break it down
- Each file should have ONE clear purpose
- Use the 5 atomic criteria as a checklist

### 2. **Ignoring P1 Priorities**

**Problem**: Working on P2/P3 tasks when P1 tasks are blocked.

**Priority Definitions** (from PRD.md):
- **P1** (Critical): Launch blockers, must be done for MVP (Feb 15, 2026)
- **P2** (High): Important but not launch-blocking
- **P3** (Medium): Nice-to-have, post-launch features

**Rules**:
- ✅ Always check task priority before starting
- ✅ P1 tasks block P2/P3 tasks in the same area
- ✅ If you see a P1 blocker, report it immediately
- ❌ Don't work on P3 features if P1 tasks are pending
- ❌ Don't change priorities without approval (that's Planning Team)

**Example**:
```typescript
// ❌ BAD: Implementing P3 feature while P1 is broken
// P1: Fix MCP server crash on invalid input (BLOCKED)
// P3: Add colorful logging to MCP server (YOU'RE HERE)
// → STOP! Fix P1 first!

// ✅ GOOD: Check priority before starting
const currentTask = await getNextTask();
if (currentTask.priority === 'P1' && currentTask.status === 'blocked') {
  // Fix the blocker first!
  await fixBlocker(currentTask);
}
```

### 3. **Skipping PRD/Documentation Checks**

**Problem**: Guessing feature requirements instead of reading PRD.

```typescript
// ❌ BAD: Guessing what getNextTask should return
async function getNextTask() {
  // "I think it should return task ID and title..."
  return { id: '123', title: 'Task' };
}

// ✅ GOOD: Check PRD.md first!
// PRD says: "Returns super-detailed prompt with design references, 
// file contexts, and acceptance criteria"
async function getNextTask(planId: string): Promise<MCPToolResponse<Task>> {
  const task = await taskService.getHighestPriorityTask(planId);
  
  // Include ALL required fields from PRD
  const detailedPrompt = await generateSuperDetailedPrompt(task);
  const designReferences = await getDesignSystemRefs(task);
  const fileContexts = await getRelevantFileContexts(task);
  
  return {
    content: [{
      type: 'resource',
      resource: {
        uri: `task://${task.id}`,
        mimeType: 'application/json',
        text: JSON.stringify({
          ...task,
          detailedPrompt,
          designReferences,
          fileContexts,
        })
      }
    }]
  };
}
```

**How to Avoid**:
- ✅ Search PRD.json/md for feature name before starting
- ✅ Read acceptance criteria (they're specific!)
- ✅ Check `Plans/COE-Master-Plan/` for detailed specs
- ❌ Don't assume you know the requirements

### 4. **Context Bloat** (Token Limit Violations)

**Problem**: Including too much context, exceeding 5,000-token limit.

**Token Budget** (per task):
- **Implementation code**: ~2,000 tokens
- **Test code**: ~1,000 tokens
- **Documentation**: ~500 tokens
- **Context/imports**: ~500 tokens
- **Buffer**: ~1,000 tokens
- **Total**: ~5,000 tokens

**Strategies to Stay Under Limit**:

```typescript
// ❌ BAD: Importing entire codebase
import * as everything from '../index';
import { allUtilities } from '../utils';
import { everyHelper } from '../helpers';

// ✅ GOOD: Specific imports only
import { TaskService } from '../tasks/taskService';
import { MCPToolResponse } from './protocol';
import { logger } from '../utils/logger';

// ❌ BAD: Massive inline implementation
async function getNextTask() {
  // 500 lines of logic all in one function...
}

// ✅ GOOD: Break into focused helpers
async function getNextTask(planId: string): Promise<MCPToolResponse<Task>> {
  const task = await taskRepository.getHighestPriority(planId);
  const prompt = await promptGenerator.generateDetailed(task);
  return formatMCPResponse(task, prompt);
}

// Each helper is ~20-30 lines, in separate files
```

**If Task Exceeds 5,000 Tokens**:
1. ✨ **Stop and decompose** into smaller atomic tasks
2. Extract reusable helpers into `utils/` or `services/`
3. Split implementation across multiple files
4. Use dependency injection to reduce import bloat

### 5. **Skipping Tests**

**Problem**: Marking task "done" without writing tests.

**Rule**: **No tests = Not done!**

```typescript
// ❌ BAD: Implementation only, no tests
// File: src/mcpServer/tools/getNextTask.ts
export async function getNextTask(planId: string) {
  // Implementation...
}
// (No test file = INCOMPLETE)

// ✅ GOOD: Implementation + tests
// File: src/mcpServer/tools/getNextTask.ts
export async function getNextTask(planId: string) {
  // Implementation...
}

// File: src/mcpServer/tools/__tests__/getNextTask.test.ts
describe('getNextTask', () => {
  it('returns P1 task when available', async () => { /* ... */ });
  it('returns P2 task if no P1', async () => { /* ... */ });
  it('returns null when queue empty', async () => { /* ... */ });
  it('throws error for invalid planId', async () => { /* ... */ });
});
```

**Test Checklist**:
- ✅ Happy path (expected input → expected output)
- ✅ Edge cases (empty data, null values, boundary conditions)
- ✅ Error cases (invalid input, network failures, timeouts)
- ✅ Integration (if tool calls other services)

---

## 🧠 Token Limit Management

**Hard Limit**: Keep total context under **5,000 tokens** per task.

### Token Estimation Guide

| Item | Typical Size | Notes |
|------|--------------|-------|
| Simple function | 50-100 tokens | Single responsibility, <20 lines |
| Complex function | 100-300 tokens | Multiple steps, error handling |
| Interface/Type | 20-50 tokens | Data structure definition |
| Unit test | 50-150 tokens | Per test case |
| Import statements | 10-30 tokens | Minimize imports |
| Comments/docs | 20-100 tokens | JSDoc + inline comments |

**Example Token Budget for `getNextTask` Implementation**:

```
Implementation (src/mcpServer/tools/getNextTask.ts):
  - Imports: 30 tokens
  - Interface definitions: 80 tokens
  - Main function: 200 tokens
  - Helper functions: 150 tokens
  - Error handling: 100 tokens
  - JSDoc comments: 50 tokens
  - Total: ~610 tokens ✅

Tests (src/mcpServer/tools/__tests__/getNextTask.test.ts):
  - Test setup: 100 tokens
  - 4 test cases × 100 tokens: 400 tokens
  - Mock setup: 150 tokens
  - Total: ~650 tokens ✅

Grand Total: 610 + 650 = 1,260 tokens ✅ (Well under 5,000!)
```

### Strategies When Approaching Limit

**If you hit 4,000+ tokens**:

1. **Extract helpers** to separate files
   ```typescript
   // Before (bloated):
   async function getNextTask() {
     // 50 lines of task filtering logic
     // 30 lines of prompt generation
     // 40 lines of context bundling
   }

   // After (modular):
   async function getNextTask() {
     const task = await filterHighestPriority(); // → utils/taskFilter.ts
     const prompt = await generatePrompt(task);   // → utils/promptGen.ts
     const context = await bundleContext(task);   // → utils/contextBundle.ts
     return formatResponse(task, prompt, context);
   }
   ```

2. **Use shared types** instead of duplicating
   ```typescript
   // ❌ BAD: Duplicating types in every file (wastes tokens)
   interface Task { id: string; title: string; /* ... */ }
   
   // ✅ GOOD: Import from shared types file
   import { Task } from '../types/task';
   ```

3. **Decompose task further** — if still >5,000 tokens, task is not atomic enough!

---

## 📚 Quick Reference

### Key Commands

```bash
# Run tests
npm test

# Run specific test file
npm test -- getNextTask.test.ts

# Check TypeScript errors
npm run compile

# Start extension in dev mode
code --extensionDevelopmentPath=.

# Run MCP server
npm run mcp-server
```

### Key Files to Reference

| File | Purpose | When to Check |
|------|---------|---------------|
| `PRD.md` / `PRD.json` | Feature specifications | Before starting ANY task |
| `Plans/CONSOLIDATED-MASTER-PLAN.md` | Architecture overview | Understanding system design |
| `Plans/COE-Master-Plan/02-Agent-Role-Definitions.md` | Agent team specs | Implementing agent coordination |
| `Plans/COE-Master-Plan/05-MCP-API-Reference.md` | MCP tool contracts | Implementing MCP tools |
| `Plans/MODULAR-EXECUTION-PHILOSOPHY.md` | Atomic task rules | When breaking down work |
| `src/mcpServer/protocol.ts` | MCP protocol types | Working with MCP |
| `src/types/` | Shared type definitions | Implementing any feature |

### Common MCP Tool Call Patterns

```typescript
// Get next task
const task = await mcpServer.callTool('getNextTask', { planId });

// Mark task in progress
await mcpServer.callTool('reportTaskStatus', {
  taskId: task.id,
  status: 'inProgress'
});

// Ask for help
const answer = await mcpServer.callTool('askQuestion', {
  question: 'How should I handle error X?',
  context: { taskId: task.id }
});

// Report completion
await mcpServer.callTool('reportTaskStatus', {
  taskId: task.id,
  status: 'completed',
  output: 'Implemented feature successfully'
});

// Report test failure
await mcpServer.callTool('reportTestFailure', {
  taskId: task.id,
  testName: 'getNextTask should return P1 task',
  error: 'Expected task with priority P1, got P2'
});
```

### Priority Decision Tree

```
Is this task P1 (launch blocker)?
  YES → Work on it immediately (if no other P1 in progress)
  NO  → Is there a P1 task pending?
          YES → Work on P1 first
          NO  → Is this task P2?
                  YES → Proceed (if no P1 blockers)
                  NO  → This is P3, only work if ALL P1/P2 are done
```

---

## ✅ Pre-Implementation Checklist

Before writing ANY code, check these boxes:

- [ ] Read feature spec in PRD.md/PRD.json
- [ ] Reviewed acceptance criteria
- [ ] Checked for detailed spec in `Plans/COE-Master-Plan/`
- [ ] Confirmed task is atomic (5 criteria: Single responsibility, Atomic completion, Time box, Verification closure, Token safety)
- [ ] Verified no P1 blockers exist
- [ ] Identified dependencies (what must be done first?)
- [ ] Planned test cases (happy path, edge cases, errors)
- [ ] Estimated token budget (<5,000 tokens total)
- [ ] Know which MCP tools to use (if any)
- [ ] Ready to implement ONE thing at a time!

---

## 🎓 Summary for Noobs

**What you need to remember**:

1. 📖 **Always read PRD.md first** — it has all the answers!
2. ✅ **One thing at a time** — atomic tasks only (5 criteria)
3. 🚨 **P1 first** — respect priorities, fix blockers before features
4. 🧪 **No tests = Not done** — always write tests
5. 💬 **Ask questions** — use `askQuestion` MCP tool when stuck
6. 📊 **TypeScript only** — strong typing, no `any`
7. 🎯 **Stay under 5,000 tokens** — keep implementations focused
8. 🤖 **Trust the agent teams** — Planning plans, you code, Verification verifies

**You're not alone!** The PRD and these instructions have your back. When in doubt:
- Check PRD.md
- Read the relevant spec in `Plans/COE-Master-Plan/`
- Ask a question via `askQuestion` MCP tool
- Follow the "one thing at a time" rule

Now go build awesome code! 🚀

---

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Next Review**: February 15, 2026 (at MVP launch)


# MCP Tools Reference

**Complete guide to Model Context Protocol (MCP) tools for COE development**

---

## 🎯 Purpose

MCP tools are how Copilot AI communicates with the COE system during development. Think of them as the "API" for AI-to-system interactions.

**Use MCP tools for**:
- Asking context-aware questions
- Logging discoveries and observations
- Reporting task status and progress
- Handling test failures
- Submitting verification results
- Retrieving next tasks to work on

---

## 📋 Available MCP Tools

| Tool | Purpose | Auto-Creates GitHub Issue? | When to Use |
|------|---------|---------------------------|-------------|
| `askQuestion` | Get context-aware answers from Plans/PRD | ✅ YES (if answer unclear) | Unsure about requirements, design patterns, or approach |
| `reportObservation` | Log discoveries, issues, improvements | ✅ YES (always) | Found something unexpected, discovered pattern, noted improvement |
| `reportTaskStatus` | Update task progress/completion | ❌ NO | Task starts, completes, or gets blocked |
| `reportTestFailure` | Report test failures, create tasks | ✅ YES (creates investigation task) | Tests fail, bugs found during testing |
| `reportVerificationResult` | Submit verification results | ❌ NO | Human verification of completed task |
| `getNextTask` | Retrieve highest priority task | ❌ NO | Start new work, need next atomic task |

---

## 🔧 Tool Details

### 1. `askQuestion` — Context-Aware Q&A

**Purpose**: Get answers from Plans/, PRD.md, and docs/ when uncertain about requirements or implementation details.

**When to Use**:
- "What does the PRD say about [feature]?"
- "How should I implement [pattern] according to Plans?"
- "Which agent team handles [responsibility]?"
- "Is this approach aligned with the architecture?"

**GitHub Issue Integration**: Creates issue if answer is unclear or Plans lack coverage.

**Request Format**:
```typescript
{
  tool: "askQuestion",
  params: {
    question: string,      // The question to answer
    context: {             // Optional: Additional context
      taskId?: string,     // Current task ID
      fileContext?: string,// Relevant file path
      codeSnippet?: string // Code snippet for context
    }
  }
}
```

**Response Format**:
```typescript
{
  answer: string,          // Answer from Plans/PRD/docs
  sources: string[],       // Files/docs used for answer
  confidence: "high" | "medium" | "low",
  githubIssue?: {          // Created if low confidence
    issueNumber: number,
    title: string,
    url: string
  }
}
```

**Example**:
```typescript
// Ask about MCP tool implementation pattern
const response = await mcpServer.callTool('askQuestion', {
  question: 'What is the recommended error handling pattern for MCP tools?',
  context: {
    taskId: 'task-123',
    fileContext: 'src/mcpServer/tools/getNextTask.ts'
  }
});

// Response:
{
  answer: "MCP tools should use try-catch with Zod validation...",
  sources: ["Plans/COE-Master-Plan/05-MCP-API-Reference.md"],
  confidence: "high"
}
```

---

### 2. `reportObservation` — Log Discoveries & Issues

**Purpose**: Track observations, discoveries, issues, and improvement ideas during development. **PRIMARY MEMORY TOOL** for Copilot.

**When to Use**:
- Found unexpected behavior
- Discovered missing dependency
- Noticed code pattern that could be improved
- Detected potential bug
- Learned something important about architecture
- Identified gap in documentation

**GitHub Issue Integration**: **ALWAYS creates GitHub Issue** (stored in `.vscode/github-issues/`).

**Request Format**:
```typescript
{
  tool: "reportObservation",
  params: {
    taskId: string,        // Current task ID
    observation: string,   // What was observed
    severity: "info" | "warning" | "critical",
    suggestedAction?: string, // Optional: What should be done
    relatedFiles?: string[] // Optional: Affected files
  }
}
```

**Response Format**:
```typescript
{
  observationId: string,   // Generated ID
  githubIssue: {
    issueNumber: number,
    title: string,
    url: string,
    filePath: string       // .vscode/github-issues/issue-X.md
  },
  dashboardAlert?: boolean // If critical, shows in dashboard
}
```

**Example**:
```typescript
// Report missing dependency discovered during implementation
await mcpServer.callTool('reportObservation', {
  taskId: 'task-456',
  observation: 'getNextTask() requires taskService.getHighestPriorityTask() which does not exist yet.',
  severity: 'warning',
  suggestedAction: 'Create taskService.getHighestPriorityTask() as prerequisite task',
  relatedFiles: ['src/mcpServer/tools/getNextTask.ts', 'src/tasks/taskService.ts']
});

// Creates: .vscode/github-issues/issue-8.md
```

---

### 3. `reportTaskStatus` — Update Task Progress

**Purpose**: Track task lifecycle (in-progress → completed → blocked → failed).

**When to Use**:
- Starting work on a task
- Completing a task successfully
- Task gets blocked by dependency
- Task fails due to error

**GitHub Issue Integration**: NO (status updates, not issues).

**Request Format**:
```typescript
{
  tool: "reportTaskStatus",
  params: {
    taskId: string,
    status: "inProgress" | "completed" | "blocked" | "failed",
    output?: string,       // Optional: Description of work done
    blockingReason?: string, // Required if status = "blocked"
    error?: string         // Required if status = "failed"
  }
}
```

**Response Format**:
```typescript
{
  taskId: string,
  updatedStatus: string,
  timestamp: string,      // ISO 8601
  nextTaskUnlocked?: {    // If completion unlocked dependency
    taskId: string,
    title: string
  }
}
```

**Example**:
```typescript
// Mark task as complete
await mcpServer.callTool('reportTaskStatus', {
  taskId: 'task-789',
  status: 'completed',
  output: 'Successfully implemented getNextTask MCP tool. All tests passing (3/3).'
});

// Mark task as blocked
await mcpServer.callTool('reportTaskStatus', {
  taskId: 'task-790',
  status: 'blocked',
  blockingReason: 'Waiting for taskService.getHighestPriorityTask() (task-789) to be implemented first.'
});
```

---

### 4. `reportTestFailure` — Log Test Failures

**Purpose**: Report test failures and automatically create investigation tasks.

**When to Use**:
- Unit test fails
- Integration test fails
- E2E test fails
- Unexpected test behavior

**GitHub Issue Integration**: **ALWAYS creates GitHub Issue** + Investigation Task.

**Request Format**:
```typescript
{
  tool: "reportTestFailure",
  params: {
    taskId: string,
    testName: string,      // Name of failing test
    error: string,         // Error message/stack trace
    expectedBehavior: string,
    actualBehavior: string,
    relatedFiles?: string[]
  }
}
```

**Response Format**:
```typescript
{
  failureId: string,
  githubIssue: {
    issueNumber: number,
    title: string,         // e.g., "Test Failure: getNextTask should return P1 task"
    url: string
  },
  investigationTask: {
    taskId: string,
    title: string,
    priority: "P1"         // Test failures are always P1
  }
}
```

**Example**:
```typescript
// Report test failure
await mcpServer.callTool('reportTestFailure', {
  taskId: 'task-101',
  testName: 'getNextTask should return highest priority P1 task',
  error: 'Expected task with priority "P1", got "P2"',
  expectedBehavior: 'Return highest priority P1 task from queue',
  actualBehavior: 'Returned P2 task when P1 task exists',
  relatedFiles: ['src/mcpServer/tools/getNextTask.ts', 'src/tasks/taskQueue.ts']
});

// Creates:
// - GitHub Issue #9: "Test Failure: getNextTask should return P1 task"
// - Investigation Task (P1): "Fix: getNextTask priority sorting"
```

---

### 5. `reportVerificationResult` — Submit Verification

**Purpose**: Submit results after human verification of completed task.

**When to Use**:
- User tests completed feature
- User approves/rejects visual design
- User validates functional requirements

**GitHub Issue Integration**: NO (verification results, not issues).

**Request Format**:
```typescript
{
  tool: "reportVerificationResult",
  params: {
    taskId: string,
    result: "pass" | "fail" | "partial",
    feedback?: string,     // Optional: User comments
    issuesFound?: string[] // If result = "fail" or "partial"
  }
}
```

**Response Format**:
```typescript
{
  taskId: string,
  verificationResult: string,
  nextAction: string,    // What happens next
  followUpTasks?: {      // Created if result = "fail"
    taskId: string,
    title: string
  }[]
}
```

**Example**:
```typescript
// User approves task
await mcpServer.callTool('reportVerificationResult', {
  taskId: 'task-202',
  result: 'pass',
  feedback: 'Verification panel looks great! Matches design mockup.'
});

// User rejects with issues
await mcpServer.callTool('reportVerificationResult', {
  taskId: 'task-203',
  result: 'fail',
  feedback: 'Buttons are misaligned, colors don\'t match design system',
  issuesFound: [
    'Approve button: Wrong color (should be primary-500)',
    'Reject button: 5px misalignment to the left'
  ]
});
// Creates 2 follow-up tasks: Fix approve button color, Fix reject button alignment
```

---

### 6. `getNextTask` — Retrieve Next Task

**Purpose**: Get the highest priority task from the queue to work on.

**When to Use**:
- Starting new work
- Previous task completed, need next task
- Queue refresh needed

**GitHub Issue Integration**: NO (task retrieval, not issues).

**Request Format**:
```typescript
{
  tool: "getNextTask",
  params: {
    planId: string         // Plan/project ID
  }
}
```

**Response Format**:
```typescript
{
  task: {
    id: string,
    title: string,
    description: string,
    priority: "P1" | "P2" | "P3",
    status: string,
    detailedPrompt: string,     // Super-detailed context
    designReferences: string[], // Links to design docs
    fileContexts: string[],     // Relevant file paths
    acceptanceCriteria: string[],
    estimatedMinutes: number
  } | null  // null if queue is empty
}
```

**Example**:
```typescript
// Get next task
const response = await mcpServer.callTool('getNextTask', {
  planId: 'coe-main-plan'
});

// Response:
{
  task: {
    id: 'task-305',
    title: 'Implement reportObservation MCP tool',
    description: 'Create MCP tool that logs observations and creates GitHub Issues',
    priority: 'P1',
    status: 'ready',
    detailedPrompt: '... (super-detailed context with examples) ...',
    designReferences: ['Plans/COE-Master-Plan/05-MCP-API-Reference.md'],
    fileContexts: ['src/mcpServer/tools/', 'src/types/mcp.ts'],
    acceptanceCriteria: [
      'Tool accepts taskId, observation, severity parameters',
      'Creates GitHub Issue in .vscode/github-issues/',
      'Returns observationId and issue details'
    ],
    estimatedMinutes: 20
  }
}
```

---

## 🔗 GitHub Issues Integration

**3 tools auto-create GitHub Issues**:

### 1. `askQuestion` → Issue if Answer Unclear
- **Trigger**: Confidence < "high" OR Plans lack coverage
- **Issue Title**: "Q: [question]"
- **Issue Body**: Question + context + what was searched
- **Labels**: `question`, `documentation-gap`

### 2. `reportObservation` → ALWAYS Creates Issue
- **Trigger**: ALWAYS (every observation)
- **Issue Title**: "[Severity] [Brief observation]"
- **Issue Body**: Full observation + suggested action + related files
- **Labels**: `observation`, severity (`info`/`warning`/`critical`)

### 3. `reportTestFailure` → Creates Issue + Investigation Task
- **Trigger**: ALWAYS (every test failure)
- **Issue Title**: "Test Failure: [testName]"
- **Issue Body**: Error + expected vs actual + stack trace
- **Labels**: `bug`, `test-failure`, `P1`
- **Investigation Task**: Created automatically (P1 priority)

**Where Issues Are Stored**: `.vscode/github-issues/issue-X.md`

**Issue Format** (Markdown):
```markdown
---
id: issue-10
type: observation
severity: warning
created: 2026-01-27T14:32:00Z
taskId: task-456
status: open
---

# [Warning] Missing dependency: taskService.getHighestPriorityTask()

## Observation
getNextTask() requires taskService.getHighestPriorityTask() which does not exist yet.

## Context
- Task: task-456 (Implement getNextTask MCP tool)
- Files: src/mcpServer/tools/getNextTask.ts, src/tasks/taskService.ts

## Suggested Action
Create taskService.getHighestPriorityTask() as prerequisite task

## Related Files
- src/mcpServer/tools/getNextTask.ts
- src/tasks/taskService.ts
```

---

## 🎯 When to Use Which Tool

| Situation | Use This Tool | Example |
|-----------|--------------|---------|
| Don't know how to implement something | `askQuestion` | "How should error handling work for MCP tools?" |
| Found unexpected behavior | `reportObservation` | "getNextTask returns null when P1 tasks exist" |
| Starting a task | `reportTaskStatus` | status: "inProgress" |
| Finishing a task | `reportTaskStatus` | status: "completed" |
| Task blocked by dependency | `reportTaskStatus` | status: "blocked", blockingReason: "..." |
| Test fails | `reportTestFailure` | Expected P1, got P2 |
| User approves/rejects work | `reportVerificationResult` | result: "pass" or "fail" |
| Need next thing to work on | `getNextTask` | Returns highest priority task |

---

## 🧠 MCP Tools as Memory System

**For Noob Programmers**: Think of `reportObservation` as your **AI notebook**.

**Use it liberally**:
- "I noticed X pattern in the code"
- "This might be a future optimization"
- "Documentation could be clearer here"
- "Found a potential edge case"
- "This dependency seems circular"

**Why it's useful**:
- Creates permanent record (GitHub Issue)
- Other developers/AI can see your thinking
- Tracks evolution of codebase understanding
- Helps with code reviews ("Why did I change this?")

**No observation is too small** — Better to over-log than under-log!

---

## 📚 Related Resources

- **MCP Protocol**: [Plans/COE-Master-Plan/05-MCP-API-Reference.md](../Plans/COE-Master-Plan/05-MCP-API-Reference.md) — Complete MCP specification
- **Agent Teams**: [Plans/COE-Master-Plan/02-Agent-Role-Definitions.md](../Plans/COE-Master-Plan/02-Agent-Role-Definitions.md) — Which agent handles what
- **Breakdown Workflow**: [docs/task-breakdown-workflow.md](task-breakdown-workflow.md) — Using tools during multi-step tasks
- **Testing Guide**: [docs/testing-guide.md](testing-guide.md) — When to use reportTestFailure

---

**Version**: 1.0  
**Last Updated**: January 27, 2026  
**Status**: Active MCP tool reference for all COE development

---
name: mcp-tool-skill
description: Integrate MCP (Model Context Protocol) tools during development - use askQuestion for clarifications, reportObservation for logging, and reportTestFailure for issues
tags: [mcp, orchestration, askQuestion, automation, context-aware]
---

# MCP Tool Integration Skill

Use MCP (Model Context Protocol) tools during coding to ask questions, report observations, log test failures, and coordinate with the agent team for intelligent development assistance.

## When to Use This Skill

- When implementation details are unclear or ambiguous
- After discovering unexpected behavior or edge cases
- When test failures occur and investigation is needed
- To report progress and observations during task execution
- Before making architectural decisions
- When stuck on a problem or need expert guidance

## What This Skill Does

1. **Ask Clarifying Questions**: Uses `askQuestion` MCP tool to get context-aware answers
2. **Report Observations**: Logs discoveries, issues, or notable behaviors via `reportObservation`
3. **Handle Test Failures**: Automatically creates investigation tasks via `reportTestFailure`
4. **Coordinate with Teams**: Routes questions to Answer Team, Planning Team, or Verification Team
5. **Maintain Context**: Ensures all queries include relevant file paths, code snippets, and task context
6. **Smart Decision Making**: Gets expert guidance before implementing complex solutions

## Available MCP Tools

### 1. askQuestion

**Purpose**: Get context-aware answers from the Answer Team during development

**When to use**:
- Unclear requirements or acceptance criteria
- Multiple implementation approaches (need recommendation)
- Complex edge cases or error handling scenarios
- Architecture or design pattern questions
- TypeScript type definitions uncertainty

**Request Schema**:
```typescript
interface AskQuestionRequest {
  question: string;           // Clear, specific question
  context: {
    taskId: string;           // Current task ID
    fileContext?: string[];   // Relevant file paths
    codeSnippet?: string;     // Code in question
    attemptedApproaches?: string[];  // What you've tried
    priorDecisions?: string; // Related past decisions
  };
}
```

**Example Usage**:
```typescript
const answer = await mcpServer.callTool('askQuestion', {
  question: 'Should I use async/await or Promises for the MCP server implementation?',
  context: {
    taskId: 'task-123',
    fileContext: ['src/mcpServer/server.ts'],
    codeSnippet: `
      export class MCPServer {
        async handleRequest(request: MCPRequest) {
          // Should this return Promise or use async/await?
        }
      }
    `,
    attemptedApproaches: ['async/await', 'Promise.then()'],
    priorDecisions: 'Used async/await in taskService.ts'
  }
});

console.log('Answer Team says:', answer.response);
```

### 2. reportObservation

**Purpose**: Log notable discoveries, behaviors, or issues during development

**When to use**:
- Found a bug or unexpected behavior
- Discovered missing dependencies or prerequisites
- Noticed performance issues
- Identified technical debt or refactoring opportunities
- Made important implementation decisions

**Request Schema**:
```typescript
interface ReportObservationRequest {
  taskId: string;
  observation: string;      // What you observed
  severity?: 'info' | 'warning' | 'critical';
  context?: {
    fileContext?: string[];
    relatedIssues?: string[];
    suggestedAction?: string;
  };
}
```

**Example Usage**:
```typescript
await mcpServer.callTool('reportObservation', {
  taskId: 'task-123',
  observation: 'getNextTask MCP tool requires taskService.getHighestPriorityTask() which is not yet implemented',
  severity: 'warning',
  context: {
    fileContext: ['src/mcpServer/tools.ts', 'src/tasks/taskService.ts'],
    suggestedAction: 'Create task: Implement taskService.getHighestPriorityTask() as prerequisite'
  }
});
```

### 3. reportTestFailure

**Purpose**: Report test failures and automatically create investigation tasks

**When to use**:
- Unit tests fail unexpectedly
- Integration tests reveal issues
- Coverage requirements not met
- Linting errors prevent task completion

**Request Schema**:
```typescript
interface ReportTestFailureRequest {
  taskId: string;
  testName: string;
  error: string;
  stackTrace?: string;
  context?: {
    testFile?: string;
    sourceFile?: string;
    attemptedFixes?: string[];
  };
}
```

**Example Usage**:
```typescript
await mcpServer.callTool('reportTestFailure', {
  taskId: 'task-123',
  testName: 'getNextTask should return highest priority P1 task',
  error: 'Expected task with priority "P1", received "P2"',
  stackTrace: error.stack,
  context: {
    testFile: 'src/mcpServer/__tests__/tools.test.ts',
    sourceFile: 'src/mcpServer/tools.ts',
    attemptedFixes: [
      'Checked priority sorting logic',
      'Verified test data setup'
    ]
  }
});

// This automatically creates a P1 investigation task:
// "Investigate test failure: getNextTask should return highest priority P1 task"
```

### 4. reportTaskStatus

**Purpose**: Update task status during execution

**When to use**:
- Starting work on a task (status: 'inProgress')
- Completing a task (status: 'completed')
- Blocking on dependencies (status: 'blocked')
- Discovering task cannot be completed (status: 'failed')

**Request Schema**:
```typescript
interface ReportTaskStatusRequest {
  taskId: string;
  status: 'inProgress' | 'completed' | 'blocked' | 'failed';
  output?: string;      // Summary of work done
  blockedReason?: string;  // If status='blocked'
}
```

**Example Usage**:
```typescript
// Starting task
await mcpServer.callTool('reportTaskStatus', {
  taskId: 'task-123',
  status: 'inProgress'
});

// Completing task
await mcpServer.callTool('reportTaskStatus', {
  taskId: 'task-123',
  status: 'completed',
  output: 'Implemented getNextTask MCP tool with super-detailed prompts. Tests pass, coverage 82%.'
});

// Blocking on dependency
await mcpServer.callTool('reportTaskStatus', {
  taskId: 'task-123',
  status: 'blocked',
  blockedReason: 'Requires taskService.getHighestPriorityTask() to be implemented first (task-122)'
});
```

### 5. reportVerificationResult

**Purpose**: Submit verification results after completing a task

**When to use**:
- After running all tests and checks
- Before marking task as fully complete
- When verification reveals issues

**Request Schema**:
```typescript
interface ReportVerificationResultRequest {
  taskId: string;
  result: 'pass' | 'fail' | 'partial';
  details: string;
  testResults?: {
    passed: number;
    failed: number;
    coverage: number;
  };
}
```

**Example Usage**:
```typescript
await mcpServer.callTool('reportVerificationResult', {
  taskId: 'task-123',
  result: 'pass',
  details: 'All acceptance criteria met',
  testResults: {
    passed: 8,
    failed: 0,
    coverage: 82
  }
});
```

## Step-by-Step Procedure

### Phase 1: Setup MCP Client

```typescript
import { MCPServer } from '../mcpServer/server';

// Initialize MCP server connection
const mcpServer = new MCPServer();

// Verify connection
await mcpServer.initialize();
```

### Phase 2: Use During Development

```
1. Start task:
   await mcpServer.callTool('reportTaskStatus', {
     taskId: task.id,
     status: 'inProgress'
   });

2. When unclear about implementation:
   const answer = await mcpServer.callTool('askQuestion', {
     question: '<specific question>',
     context: { taskId, fileContext, codeSnippet }
   });

3. When discovering issues:
   await mcpServer.callTool('reportObservation', {
     taskId: task.id,
     observation: '<what you found>',
     severity: 'warning'
   });

4. When tests fail:
   await mcpServer.callTool('reportTestFailure', {
     taskId: task.id,
     testName: '<test name>',
     error: '<error message>'
   });

5. Complete task:
   await mcpServer.callTool('reportTaskStatus', {
     taskId: task.id,
     status: 'completed',
     output: '<summary>'
   });
```

### Phase 3: Question Best Practices

**Good Questions** (specific, context-rich):
```typescript
// ✅ GOOD
await mcpServer.callTool('askQuestion', {
  question: 'Should getNextTask return null or throw an error when the task queue is empty?',
  context: {
    taskId: 'task-123',
    fileContext: ['src/mcpServer/tools.ts'],
    codeSnippet: 'async function getNextTask(planId: string): Promise<Task | null>',
    attemptedApproaches: [
      'Returning null (but PR mentions throwing errors)',
      'Throwing MCPError with code QUEUE_EMPTY'
    ],
    priorDecisions: 'Other MCP tools return null for "not found" (e.g., getPlan)'
  }
});
```

**Bad Questions** (vague, no context):
```typescript
// ❌ BAD
await mcpServer.callTool('askQuestion', {
  question: 'What should I do here?',
  context: { taskId: 'task-123' }
});
// Too vague - Answer Team cannot help without specifics!
```

### Phase 4: Integration Patterns

**Pattern 1: Pre-implementation clarification**:
```typescript
async function implementFeature(task: Task) {
  // Ask before implementing if requirements unclear
  if (hasAmbiguity(task.description)) {
    const answer = await mcpServer.callTool('askQuestion', {
      question: `Task description says "${task.description}". Does this mean X or Y?`,
      context: { taskId: task.id, fileContext: task.files }
    });
    
    // Use answer to guide implementation
    const approach = parseApproach(answer.response);
    implementBasedOn(approach);
  }
}
```

**Pattern 2: Mid-implementation observation**:
```typescript
async function implementMCPTool(tool: string) {
  // Discover dependency during work
  const dependency = checkDependencies(tool);
  
  if (!dependency.exists) {
    await mcpServer.callTool('reportObservation', {
      taskId: currentTask.id,
      observation: `MCP tool ${tool} requires ${dependency.name} to be implemented first`,
      severity: 'warning',
      context: {
        suggestedAction: `Create prerequisite task: Implement ${dependency.name}`
      }
    });
    
    // Block current task
    await mcpServer.callTool('reportTaskStatus', {
      taskId: currentTask.id,
      status: 'blocked',
      blockedReason: `Missing dependency: ${dependency.name}`
    });
  }
}
```

**Pattern 3: Test-driven question**:
```typescript
async function runTests(task: Task) {
  const results = await jest.run(task.testFiles);
  
  if (results.failedCount > 0) {
    const failure = results.failures[0];
    
    // Report failure
    await mcpServer.callTool('reportTestFailure', {
      taskId: task.id,
      testName: failure.testName,
      error: failure.message,
      stackTrace: failure.stack
    });
    
    // Ask how to fix
    const answer = await mcpServer.callTool('askQuestion', {
      question: `Test "${failure.testName}" is failing with error: ${failure.message}. How should I fix this?`,
      context: {
        taskId: task.id,
        testFile: failure.file,
        codeSnippet: failure.sourceCode
      }
    });
    
    // Apply suggested fix
    applyFix(answer.response);
  }
}
```

## Integration with Other Skills

### With Linting Skill

```typescript
// After linting fails for P1 task
const lintResult = await runESLint(files);

if (isPriorityOne && lintResult.warningCount > 0) {
  // Ask how to fix warnings
  const answer = await mcpServer.callTool('askQuestion', {
    question: `P1 task has ${lintResult.warningCount} ESLint warnings. How should I fix: ${lintResult.warnings[0].message}?`,
    context: {
      taskId: task.id,
      fileContext: [lintResult.warnings[0].file],
      codeSnippet: getCodeAtLine(lintResult.warnings[0].line)
    }
  });
}
```

### With Testing Skill

```typescript
// After coverage check fails
const coverage = await calculateCoverage(task.modifiedFiles);

if (coverage < 75) {
  // Ask for test case suggestions
  const answer = await mcpServer.callTool('askQuestion', {
    question: `Coverage is ${coverage}% (need 75%). What test cases should I add for these uncovered lines?`,
    context: {
      taskId: task.id,
      fileContext: task.modifiedFiles,
      codeSnippet: getUncoveredLines(coverage.report)
    }
  });
  
  // Implement suggested tests
  generateTests(answer.response);
}
```

## Configuration

### MCP Server Setup

```typescript
// src/mcpServer/server.ts
export class MCPServer {
  private transport: Transport;
  private client: Client;
  
  async initialize() {
    this.transport = new StdioTransport();
    this.client = new Client({
      name: 'COE-Copilot',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });
    
    await this.client.connect(this.transport);
  }
  
  async callTool(name: string, params: any): Promise<any> {
    return await this.client.callTool(name, params);
  }
}
```

### Environment Variables

```env
# .env
MCP_SERVER_URL=http://localhost:3000
MCP_TIMEOUT=30000
MCP_RETRY_COUNT=3
```

## Common Questions & Answers

### Q: When should I use askQuestion vs just implementing?

**A**: Use `askQuestion` when:
- ✅ Requirements are ambiguous or have multiple valid interpretations
- ✅ You're unsure which approach aligns with project architecture
- ✅ Decision impacts other components or future work
- ✅ Edge case handling is unclear

Don't use when:
- ❌ Implementation is straightforward and matches acceptance criteria
- ❌ Question is answered in PRD.md or copilot-instructions.md
- ❌ Standard TypeScript pattern applies

### Q: Should I ask multiple questions in one request?

**A**: No! One question per `askQuestion` call:

```typescript
// ❌ BAD: Multiple questions
await mcpServer.callTool('askQuestion', {
  question: 'Should I use async/await? Also what type should I use? And how to handle errors?'
});

// ✅ GOOD: Separate focused questions
await mcpServer.callTool('askQuestion', {
  question: 'Should getNextTask use async/await or Promises?'
});

await mcpServer.callTool('askQuestion', {
  question: 'What TypeScript return type for getNextTask when queue is empty?'
});
```

### Q: What if askQuestion doesn't give a clear answer?

**A**: Follow up with more context:

```typescript
const answer1 = await mcpServer.callTool('askQuestion', {
  question: 'Should I use approach A or B?'
});

// If answer is unclear, provide more context
const answer2 = await mcpServer.callTool('askQuestion', {
  question: `Previous answer suggested "${answer1.response}". Can you clarify how this applies to ${specificScenario}?`,
  context: {
    priorAnswer: answer1.response,
    codeSnippet: detailedExample
  }
});
```

## Checklist for MCP Tool Usage

- [ ] MCP server initialized at start of coding session
- [ ] `reportTaskStatus('inProgress')` called when starting task
- [ ] `askQuestion` used for any ambiguous requirements
- [ ] `reportObservation` logged for discovered issues or dependencies
- [ ] `reportTestFailure` called for any test failures
- [ ] `reportVerificationResult` submitted after testing
- [ ] `reportTaskStatus('completed')` called when task done
- [ ] All MCP calls include proper context (taskId, fileContext)

## Related Documentation

- **MCP API Reference**: `Plans/COE-Master-Plan/05-MCP-API-Reference.md`
- **askQuestion Payloads**: `Plans/COE-Master-Plan/06-MCP-askQuestion-Payloads.md`
- **Agent Teams**: `Plans/COE-Master-Plan/02-Agent-Role-Definitions.md`
- **Answer Team Spec**: `Plans/ANSWER-AI-TEAM-SPECIFICATION.md`

---

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Owner**: COE Development Team

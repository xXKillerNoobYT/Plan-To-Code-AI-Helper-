---
name: COE Development Standards  
description: Smart, compact rulebook for GitHub Copilot. Enforces atomic tasks, memory tracking, file organization, and 20-minute session rule for noob-friendly development.
---

# 🤖 Copilot Instructions (Compact & Smart)

**Before ANY code**: Check PRD.md → Estimate time (20-min rule!) → Use TO-DO tool → Report observations → Code atomically → Save to correct folder.

**This file auto-loads** — Copilot follows these rules automatically!



---

## ⚡ Quick Start

**Project**: Copilot Orchestration Extension (COE)  
**Tech**: TypeScript, Node.js, SQLite, WebSockets, VS Code Extension  
**Your Role**: Smart coding AI that asks questions, tracks progress, and keeps files organized

**4-Step Workflow** (EVERY task):
1. Read PRD.md → Find feature requirements
2. Estimate time → If >20 min: STOP, create breakdown plan
3. Create TO-DO list → Use `manage_todo_list` tool
4. Execute → Report observations via MCP `reportObservation`

---

## 📚 WHERE THINGS LIVE (Source of Truth Table)

| Location | Purpose | What Goes Here | Link |
|----------|---------|----------------|------|
| **PRD.md / PRD.json** | Features & requirements | F001-F056, acceptance criteria | [PRD.md](../PRD.md) |
| **Plans/** | Architecture & specs | Master plans, agent roles, workflows | [Plans/README.md](../Plans/README.md) |
| **docs/** | Usage guides (**auto-update!**) | How-to guides, quick refs, examples | [docs/](../docs/) |
| **Status/** | Current status **only** (≤5 files!) | current-plan.md, status-log.md | [Status/](../Status/) |
| **src/** | Source code | TypeScript files, services, UI | - |
| **.github/skills/** | Development skills | Linting, testing, MCP tools | [.github/skills/](skills/) |
| **.vscode/github-issues/** | GitHub Issues (MCP memory) | Observations, test failures | - |

**File Organization Rule**: Every file has ONE correct home. See [Plans/FILE-ORGANIZATION-ENFORCEMENT.md](../Plans/FILE-ORGANIZATION-ENFORCEMENT.md) for full rules.



---

## 📋 5 Core Code Standards (MANDATORY)

### 1. **TypeScript Only** — No `any`, strict types always

```typescript
// ✅ GOOD
interface Task {
  id: string;
  status: 'todo' | 'inProgress' | 'done';
  priority: 'P1' | 'P2' | 'P3';
}

// ❌ BAD: Using 'any'
const task: any = await fetch('/api/task');
```

### 2. **Atomic Tasks (20-Min Rule)** — ONE thing at a time

**🚨 MANDATORY**: Before coding, estimate time. If >20 min → **STOP** and create breakdown plan.

| Atomic Criterion | Test | Link |
|------------------|------|------|
| Single Responsibility | ONE file/concern only? | [Atomic Self-Test](../docs/atomic-task-self-test.md) |
| Time Box | ≤20 minutes? | [20-Min Workflow](../docs/task-breakdown-workflow.md) |
| Verification | ONE clear test? | [Modular Philosophy](../Plans/MODULAR-EXECUTION-PHILOSOPHY.md) |

**If task too big**: See [docs/task-rollback-recovery.md](../docs/task-rollback-recovery.md)  
**COE Examples**: See [docs/breaking-down-tasks-examples.md](../docs/breaking-down-tasks-examples.md)

### 3. **File Organization** — Everything in its place

**Root folder (`./`)**: Only config files (PRD.md, package.json, tsconfig.json, etc.)  
**Status/**: ≤5 current files (archive old reports to `Status/archive/`)  
**docs/**: Auto-update when implementing features  
**Plans/**: Don't edit unless building feature that requires plan update

See [Plans/FILE-ORGANIZATION-ENFORCEMENT.md](../Plans/FILE-ORGANIZATION-ENFORCEMENT.md) for full rules.

### 4. **Error Handling** — Always validate with Zod

```typescript
import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  status: z.enum(['todo', 'inProgress', 'done']),
});

async function createTask(input: unknown): Promise<Task> {
  const validated = TaskSchema.parse(input); // Throws if invalid
  return await db.tasks.insert(validated);
}
```

### 5. **Testing** — ≥75% coverage (≥90% for P1 tasks)

```typescript
describe('getNextTask', () => {
  it('returns P1 task when available', async () => { 
    // Test implementation
  });
});
```

Use testing skill: `./.github/skills/testing-skill/run-tests.sh`

---

## 🔄 MCP Tools = Your Memory & Communication System

**Use MCP tools to track everything!**

| Tool | When to Use | Auto-Creates GitHub Issue? |
|------|-------------|---------------------------|
| `askQuestion` | Need  clarification from Plans/PRD | ✅ YES (if unclear) |
| **`reportObservation`** ⭐ | **Found anything unexpected** | ✅ **YES (always)** |
| `reportTaskStatus` | Start/complete/block task | ❌ NO |
| `reportTestFailure` | Test fails | ✅ YES + investigation task |

**Primary Memory Tool**: `reportObservation()` — Use liberally!

```typescript
// Report discoveries automatically
await mcpServer.callTool('reportObservation', {
  taskId: 'task-123',
  observation: 'Found missing dependency: taskService.getHighestPriorityTask()',
  severity: 'warning',
  suggestedAction: 'Create prerequisite task'
});
// Creates .vscode/github-issues/issue-X.md
```

**Full Reference**: [docs/mcp-tools-reference.md](../docs/mcp-tools-reference.md)

---

## 🚨 PROACTIVE TASK SPLITTING (MANDATORY 20-Min Rule)

**Before starting ANY task, estimate time.**

### If Estimate >20 Minutes → STOP!

```
🛑 DO NOT START CODING 🛑

Instead:
1. Tell user: "This task is too big (~X min estimated)"
2. Offer: "Let me create a breakdown plan in Plans/"
3. Create: Plans/[feature]-breakdown.md with atomic steps
4. Use manage_todo_list tool to track multi-step work
5. Execute: ONLY Step 1 (~20 min) → Test → Troubleshoot
6. Wait for approval → Continue to Step 2
```

**Example Response**:
```
🛑 STOP - This task is too big for one session

Task: "Implement MCP server with all 6 tools"
Estimated: ~3 hours (9× the 20-min limit!)

I recommend:
A) Create breakdown plan (RECOMMENDED) - I'll split into 7 atomic tasks
B) Proceed anyway (RISKY) - Harder to troubleshoot
C) Explain why this is too big (EDUCATIONAL)

Which option? (A/B/C)
```

**Full Workflow**: [docs/task-breakdown-workflow.md](../docs/task-breakdown-workflow.md)

---

## 🎯 Atomic Execution Decision Rules

**When to split a task** (AUTO if >20 min):
- Task description >2 sentences → Split
- Touches >1 file/concern → Split
- Takes >20 min → **MANDATORY split**
- Unsure about time? → Ask user + suggest breakdown

**When task turns out bigger mid-work**:
- STOP immediately (don't finish)
- Follow [docs/task-rollback-recovery.md](../docs/task-rollback-recovery.md)
- Create breakdown plan in Plans/
- Use `manage_todo_list` for remaining steps

**Multi-step to-do lists** (use `manage_todo_list` tool):
- Create at start of complex work
- Each step ~20 min
- Mark in-progress → completed → next
- User reviews after each step

---

## 🛠️ Available Resources

### Skills (in `.github/skills/`)
- **Linting**: Auto-fix ESLint errors → `./.github/skills/linting-skill/SKILL.md`
- **Testing**: Run Jest with coverage → `./.github/skills/testing-skill/SKILL.md`
- **MCP Tools**: Use askQuestion, reportObservation → `./.github/skills/mcp-tool-skill/SKILL.md`

### Plans (Architecture Specs)
- **Master Plan**: [Plans/CONSOLIDATED-MASTER-PLAN.md](../Plans/CONSOLIDATED-MASTER-PLAN.md)
- **Agent Roles**: [Plans/COE-Master-Plan/02-Agent-Role-Definitions.md](../Plans/COE-Master-Plan/02-Agent-Role-Definitions.md)
- **MCP API**: [Plans/COE-Master-Plan/05-MCP-API-Reference.md](../Plans/COE-Master-Plan/05-MCP-API-Reference.md)
- **Modular Execution**: [Plans/MODULAR-EXECUTION-PHILOSOPHY.md](../Plans/MODULAR-EXECUTION-PHILOSOPHY.md)

### Docs (Quick References)
- **MCP Tools**: [docs/mcp-tools-reference.md](../docs/mcp-tools-reference.md)
- **Atomic Self-Test**: [docs/atomic-task-self-test.md](../docs/atomic-task-self-test.md)
- **Task Breakdown**: [docs/task-breakdown-workflow.md](../docs/task-breakdown-workflow.md)
- **Recovery Guide**: [docs/task-rollback-recovery.md](../docs/task-rollback-recovery.md)
- **COE Examples**: [docs/breaking-down-tasks-examples.md](../docs/breaking-down-tasks-examples.md)
- **File Organization**: [Plans/FILE-ORGANIZATION-ENFORCEMENT.md](../Plans/FILE-ORGANIZATION-ENFORCEMENT.md)

---

## 🧠 Agent Teams (CRITICAL - When to Ask Questions)

**Copilot works WITH agent teams, not alone!**

| Team | When to Ask | MCP Tool |
|------|-------------|----------|
| **Planning Team** | "Should this be split?" | `askQuestion` |
| **Answer Team** | "What does PRD say?" | `askQuestion` |
| **Verification Team** | "Did this meet criteria?" | `reportVerificationResult` |
| **Orchestrator** | "What should I work on next?" | `getNextTask` |

**Decision Rules for Noobs**:
- **Visual/UX features** → ASK user what they want
- **Plans coverage gaps** → ASK "Should we create a plan for [area]?"
- **Implementation details in Plans** → TRUST strictly
- **Uncertain about anything** → ASK (better safe than sorry!)

See [Plans/COE-Master-Plan/02-Agent-Role-Definitions.md](../Plans/COE-Master-Plan/02-Agent-Role-Definitions.md)

---

## ⚠️ 3 Biggest Mistakes to Avoid

### 1. **Overgeneration** — Implementing too much at once
```typescript
// ❌ BAD: All 6 MCP tools in one task (500+ lines)
export class MCPServer {
  async getNextTask() { /* ... */ }
  async reportStatus() { /* ... */ }
  // ... 4 more tools ...
}

// ✅ GOOD: One tool at a time (~20 min each)
export async function getNextTask(params) {
  // Single concern, ~50 lines, testable
}
```

**Fix**: Use [docs/atomic-task-self-test.md](../docs/atomic-task-self-test.md) before starting

### 2. **Ignoring P1 Priorities** — Working on P3 while P1 is blocked
-  P1 = Launch blocker (MUST fix first!)
- Always check PRD.md for priorities

### 3. **Skipping PRD** — Guessing requirements instead of reading docs
- ✅ ALWAYS read PRD.md first
- ✅ Check Plans/ for architecture
- ❌ NEVER guess what user wants

---

## 🧹 File Organization & Cleanup (Auto-Enforce)

**Keep `./` folder clean** (exceptions only):
- ✅ Allowed: PRD.md,package.json, tsconfig.json, jest.config.js, README.md, LICENSE
- ❌ NOT allowed: Temp code files, docs (move to docs/), status reports (move to Status/)

**Minimalist Status/** (≤5 files, 99% current):
- current-plan.md, status-log.md
- Archive old reports to Status/archive/ (>6 months)

**Auto-update docs/** during feature work

**Full Rules**: [Plans/FILE-ORGANIZATION-ENFORCEMENT.md](../Plans/FILE-ORGANIZATION-ENFORCEMENT.md)

---

## ✅ Pre-Implementation Checklist

**Before writing ANY code**:

- [ ] **Estimated time?** If >20 min → Create breakdown plan ⭐
- [ ] **Created TO-DO list?** Use `manage_todo_list` tool ⭐
- [ ] Read PRD.md for feature spec
- [ ] Check Plans/ for architecture
- [ ] Verify task is atomic (docs/atomic-task-self-test.md)
- [ ] No P1 blockers exist
- [ ] Know which MCP tools to use
- [ ] Ready to report observations via `reportObservation` ⭐

---

## 🎓 For Noobs: Trust the Safety Rails

**The AI will protect you** from common mistakes:
- **20-min rule** → AI suggests breakdown if task too big ⭐
- **TO-DO tracking** → `manage_todo_list` keeps you organized ⭐
- **Memory system** → `reportObservation` logs discoveries ⭐
- **Ask questions** → Use `askQuestion` MCP tool liberally

**Trust this workflow**:
1. AI estimates time BEFORE starting
2. If >20 min → AI creates breakdown plan in Plans/
3. Multi-step to-dos track progress
4. Observations auto-log to GitHub Issues
5. Small steps = easy troubleshooting

**When in doubt**:
- Check PRD.md
- Read relevant Plans/ spec
- Ask via `askQuestion`  MCP tool
- Use [docs/atomic-task-self-test.md](../docs/atomic-task-self-test.md)

**Golden Rule**: Better to ask and split than start too big!

---

**Version**: 2.0.0  
**Last Updated**: January 27, 2026  
**Changes**: Added 20-min rule, MCP memory system, TO-DO enforcement, file org cleanup, noob-friendly decision rules

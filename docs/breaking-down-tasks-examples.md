# Breaking Down Tasks: COE-Specific Examples

**Real-world decomposition patterns for the Copilot Orchestration Extension**

---

## 🎯 Purpose

This guide shows **actual COE tasks** and how to break them into atomic ~20-minute steps. Use these patterns when facing similar work.

---

## Pattern 1: MCP Tool Implementation

### ❌ TOO BIG (Original)
```
Task: "Implement MCP server with all tools"
Estimated: 3+ hours
Files: 7+ files (server.ts, protocol.ts, 6 tool files)
Concerns: Server setup, protocol, 6 different tools
```

### ✅ ATOMIC BREAKDOWN (6 Tasks)

**Task 1: Setup MCP server structure** (~20 min)
- File: `src/mcpServer/server.ts`
- Concern: Initialize JSON-RPC 2.0 server
- Test: Server starts, responds to ping
- Acceptance: `npm run mcp-server` runs without error

**Task 2: Implement getNextTask tool** (~20 min)
- File: `src/mcpServer/tools/getNextTask.ts`
- Concern: Return highest priority task from queue
- Test: Call tool, verify P1 task returned
- Acceptance: Returns task object with all required fields

**Task 3: Implement reportObservation tool** (~20 min)
- File: `src/mcpServer/tools/reportObservation.ts`
- Concern: Log observation and create GitHub Issue
- Test: Call tool, verify GitHub Issue created
- Acceptance: Issue appears in `.vscode/github-issues/`

**Tasks 4-6**: Repeat for remaining tools (askQuestion, reportTaskStatus, reportVerificationResult)

---

## Pattern 2: UI Component Creation

### ❌ TOO BIG (Original)
```
Task: "Build verification panel with styling and interactions"
Estimated: 2 hours
Files: Component.tsx, styles.css, types.ts, hooks.ts
Concerns: UI, styling, state management, API integration
```

### ✅ ATOMIC BREAKDOWN (4 Tasks)

**Task 1: Create basic VerificationPanel component** (~20 min)
- File: `src/ui/VerificationPanel.tsx`
- Concern: Render task title and description
- Test: Component renders with mock data
- Acceptance: Displays task.title and task.description

**Task 2: Add checklist UI** (~20 min)
- File: `src/ui/VerificationPanel.tsx` (extend)
- Concern: Render acceptance criteria as checkboxes
- Test: Checkboxes render from task.acceptanceCriteria array
- Acceptance: User can check/uncheck items

**Task 3: Add approve/reject buttons** (~20 min)
- File: `src/ui/VerificationPanel.tsx` (extend)
- Concern: Button click handlers
- Test: onClick fires with correct status
- Acceptance: Buttons call onApprove/onReject props

**Task 4: Style with design system** (~20 min)
- File: `src/ui/VerificationPanel.tsx` (styling only)
- Concern: Apply COE design tokens
- Test: Visual regression test
- Acceptance: Matches design mockup

---

## Pattern 3: Agent Team Coordination

### ❌ TOO BIG (Original)
```
Task: "Integrate Planning Team with Orchestrator"
Estimated: 90 min
Files: orchestrator.ts, planningTeam.ts, types.ts, queue.ts
Concerns: Agent communication, task decomposition, queue management
```

### ✅ ATOMIC BREAKDOWN (3 Tasks)

**Task 1: Define Planning Team request/response types** (~15 min)
- File: `src/types/agents.ts`
- Concern: TypeScript interfaces for Planning Team API
- Test: Types compile without errors
- Acceptance: PlanningRequest and PlanningResponse interfaces defined

**Task 2: Implement Orchestrator → Planning Team call** (~20 min)
- File: `src/orchestrator/programmingOrchestrator.ts`
- Concern: Send decomposition request to Planning Team
- Test: Mock Planning Team response, verify call works
- Acceptance: Orchestrator.requestTaskDecomposition() returns tasks

**Task 3: Update task queue with Planning Team results** (~20 min)
- File: `src/tasks/taskQueue.ts`
- Concern: Add decomposed tasks to queue
- Test: Queue updates with P1/P2/P3 tasks
- Acceptance: Tasks appear in TreeView UI

---

## Pattern 4: Database Schema Changes

### ❌ TOO BIG (Original)
```
Task: "Add task history tracking to database"
Estimated: 60 min
Files: schema.sql, migration.ts, taskService.ts, types.ts, tests
Concerns: Schema, migration, service layer, tests
```

### ✅ ATOMIC BREAKDOWN (4 Tasks)

**Task 1: Define task_history table schema** (~15 min)
- File: `src/db/schema.sql`
- Concern: CREATE TABLE statement only
- Test: SQL validates (no syntax errors)
- Acceptance: Table has columns: id, task_id, status, timestamp

**Task 2: Create migration script** (~20 min)
- File: `src/db/migrations/003_task_history.ts`
- Concern: Run schema change on existing DB
- Test: Migration runs without error on test DB
- Acceptance: task_history table exists after migration

**Task 3: Add TaskHistoryService methods** (~20 min)
- File: `src/services/taskHistoryService.ts`
- Concern: CRUD operations for task history
- Test: Unit tests for insert/query
- Acceptance: Can log task status change

**Task 4: Integrate with TaskService** (~15 min)
- File: `src/tasks/taskService.ts` (extend)
- Concern: Call TaskHistoryService.log() on status change
- Test: Status change triggers history log
- Acceptance: History entry created in DB

---

## Pattern 5: Configuration Changes

### ❌ TOO BIG (Original)
```
Task: "Add LLM timeout configuration with validation and UI"
Estimated: 45 min
Files: config.ts, types.ts, configPanel.tsx, validation.ts
Concerns: Type definition, validation, UI, persistence
```

### ✅ ATOMIC BREAKDOWN (3 Tasks)

**Task 1: Add timeoutSeconds to LLM config type** (~10 min)
- File: `src/types/config.ts`
- Concern: Extend LLMConfig interface
- Test: Types compile
- Acceptance: LLMConfig.timeoutSeconds: number defined

**Task 2: Add validation for timeout range** (~15 min)
- File: `src/utils/fileConfig.ts`
- Concern: Zod schema validation (30-600 seconds)
- Test: Validate with valid/invalid values
- Acceptance: Throws error for timeout <30 or >600

**Task 3: Add timeout field to config UI** (~20 min)
- File: `src/ui/ConfigPanel.tsx`
- Concern: Number input for timeoutSeconds
- Test: User can type value, save config
- Acceptance: Value persists to .coe/config.json

---

## Pattern 6: File Organization Cleanup

### ❌ TOO BIG (Original)
```
Task: "Clean up project structure and organize files"
Estimated: Unclear (could be hours!)
Files: Entire project
Concerns: Moving files, updating imports, testing
```

### ✅ ATOMIC BREAKDOWN (By Area)

**Task 1: Move orphaned utils to src/utils/** (~15 min)
- Files: Find files in `./` that should be in `src/utils/`
- Concern: File relocation only (no logic changes)
- Test: All imports still resolve
- Acceptance: No orphaned .ts files in root

**Task 2: Archive old status reports** (~10 min)
- Files: `Status/*.md` older than 6 months
- Concern: Move to `Status/archive/`
- Test: Active reports still in Status/
- Acceptance: Status/ has ≤5 current files (minimalist)

**Task 3: Update import paths in affected files** (~20 min)
- Files: Search for old import paths
- Concern: Fix broken imports from Task 1
- Test: `npm run compile` succeeds
- Acceptance: Zero TypeScript errors

---

## 🧠 Decomposition Decision Tree

```
Is this task truly atomic?
│
├─ YES: ONE file/concern, <20 min
│   └─ Execute → Test → Commit
│
└─ NO: Multiple concerns OR >20 min
    │
    ├─ Multiple files?
    │   └─ Split by file (one task per file)
    │
    ├─ Multiple features?
    │   └─ Split by feature (one task per feature)
    │
    ├─ UI + Logic?
    │   └─ Split by layer (Task 1: Logic, Task 2: UI)
    │
    ├─ Database + API?
    │   └─ Split by layer (Task 1: Schema, Task 2: Service, Task 3: API)
    │
    └─ Unclear scope?
        └─ Ask Copilot: "How would you break this down?"
```

---

## 🎯 COE-Specific Decomposition Heuristics

| Task Type | Typical Split Points | Avg Steps |
|-----------|---------------------|-----------|
| **MCP Tool** | 1 tool = 1 task | 1 task × 20 min |
| **Agent Integration** | 1 agent role = 1 task | 3-4 tasks (types, call, queue, UI) |
| **UI Component** | Logic → UI → Styling → Integration | 4 tasks × 15-20 min |
| **Database Change** | Schema → Migration → Service → Integration | 4 tasks × 15-20 min |
| **Configuration** | Type → Validation → UI → Persistence | 3-4 tasks × 10-20 min |
| **Testing** | 1 feature = 1 test file | 1 task × 20 min |
| **Documentation** | 1 doc file = 1 task | 1 task × 15 min |

---

## 📚 Related Resources

- **Self-Test**: [docs/atomic-task-self-test.md](atomic-task-self-test.md) — Quick atomicity check
- **Breakdown Workflow**: [docs/task-breakdown-workflow.md](task-breakdown-workflow.md) — Proactive splitting
- **Recovery Guide**: [docs/task-rollback-recovery.md](task-rollback-recovery.md) — When task gets too big mid-work
- **Modular Philosophy**: [Plans/MODULAR-EXECUTION-PHILOSOPHY.md](../Plans/MODULAR-EXECUTION-PHILOSOPHY.md) — Why atomic tasks work

---

**Version**: 1.0  
**Last Updated**: January 27, 2026  
**Status**: Active decomposition patterns for COE development

# Task Breakdown Workflow (Proactive 20-Minute Rule)

**MANDATORY workflow when AI detects a task will take >20 minutes**

---

## 🎯 Purpose

This is the **proactive split-before-you-start** workflow that protects noob programmers from taking on tasks that are too big. When Copilot estimates >20 minutes for a task, this workflow kicks in AUTOMATICALLY.

---

## 🚨 The 20-Minute Rule (MANDATORY)

**Before starting ANY task, Copilot MUST estimate time.**

### If Estimate ≤20 Minutes
✅ **Proceed normally**
- Task is atomic enough
- Execute → Test → Commit
- Report completion

### If Estimate >20 Minutes
🛑 **STOP - Trigger breakdown workflow**
- Do NOT start implementation
- Do NOT skip this step
- Follow workflow below

---

## 📋 Breakdown Workflow (Step-by-Step)

### Step 1: AI Detects Oversized Task

**Copilot analyzes task and determines**:
- Touches multiple files? → Likely >20 min
- Multiple concerns listed? → Likely >20 min
- Vague scope (e.g., "refactor module")? → Likely >20 min
- Token count estimate >3,000? → Likely >20 min

**Estimation Methods**:
1. Count files/concerns (>1 = likely >20 min)
2. Estimate token count needed (~500 tokens = ~10 min)
3. Check if task description has "and" conjunctions
4. Compare to similar completed tasks

---

### Step 2: AI STOPS and Reports to User

**Copilot responds with**:

```
🛑 STOP - This task is too big for one session

Task: "[task-name]"
Estimated time: ~[X] minutes
Estimated complexity: [Y] files, [Z] concerns

This violates the 20-minute rule. Here's what I recommend:

OPTION A: Create breakdown plan (RECOMMENDED)
  - I'll create Plans/[feature]-breakdown.md
  - Split into ~[N] atomic tasks (~20 min each)
  - Use multi-step to-do list
  - Execute step-by-step with troubleshooting

OPTION B: Proceed anyway (RISKY)
  - Continue with oversized task
  - Warning: Harder to troubleshoot
  - Warning: May exceed context limits
  - Warning: Lower success rate

OPTION C: Explain why this is too big (EDUCATIONAL)
  - I'll explain what makes this complex
  - Show examples of similar tasks split properly
  - Help you understand atomic task criteria

Which option would you prefer? (A/B/C)
```

---

### Step 3: User Chooses Option

#### Option A Response (RECOMMENDED) ✅

**Copilot creates**:

1. **Breakdown Plan** (`Plans/[feature]-breakdown.md`):
```markdown
# [Feature Name] Implementation Breakdown

**Original Task**: [description]
**Estimated**: ~[X] minutes (too big!)
**Split Into**: [N] atomic tasks

## Atomic Tasks (~20 min each)

### Task 1: [Specific atomic step]
- **Time**: ~20 min
- **File**: src/[file].ts
- **Concern**: ONE thing only
- **Test**: [Acceptance criterion]
- **Dependencies**: None (can start immediately)

### Task 2: [Next atomic step]
- **Time**: ~20 min
- **File**: src/[file].ts
- **Concern**: ONE thing only
- **Test**: [Acceptance criterion]
- **Dependencies**: Task 1 must be complete

[... continue for all tasks ...]

## Execution Order
1. Task 1 → Test → Commit
2. Task 2 → Test → Commit
3. Task 3 → Test → Commit
```

2. **Multi-Step To-Do List** (using `manage_todo_list` tool):
```typescript
manage_todo_list([
  { 
    id: 1, 
    title: "Implement [Task 1]", 
    status: "in-progress",
    description: "File: src/X.ts. Concern: Y. Test: Z."
  },
  { 
    id: 2, 
    title: "Implement [Task 2]", 
    status: "not-started",
    description: "File: src/A.ts. Concern: B. Test: C."
  },
  // ... remaining tasks
]);
```

3. **Confirmation Message**:
```
✅ Breakdown plan created!

📁 Plans/[feature]-breakdown.md
📋 Multi-step to-do list (use 'View To-Do List' to track)

Ready to start Task 1 (~20 min):
- [Brief description]
- File: src/[file].ts
- Test: [Acceptance criterion]

Shall I proceed with Task 1?
```

---

#### Option B Response (RISKY) ⚠️

**Copilot warns**:
```
⚠️ Warning: Proceeding without breakdown

Risks:
- May exceed context window (>5,000 tokens)
- Harder to troubleshoot if issues arise
- More likely to create bugs
- Difficult to review/test atomically

I recommend creating a checkpoint commit every 20 minutes.
You can still STOP and split if it gets too complex.

Use [docs/task-rollback-recovery.md] if you need to rollback.

Proceeding with implementation...
```

**Then executes with caution** (creates checkpoint commits every ~20 min)

---

#### Option C Response (EDUCATIONAL) 📚

**Copilot explains**:
```
📚 Why This Task Is Too Big

Task: "[task-name]"

Analysis:
1. **Multiple Concerns**
   - Concern A: [description]
   - Concern B: [description]
   - Concern C: [description]
   → Violates "Single Responsibility" criterion

2. **Estimated Time: ~[X] minutes**
   - Breakdown:
     - Concern A: ~20 min
     - Concern B: ~25 min
     - Concern C: ~15 min
   - Total: ~60 min (3× the 20-min limit)

3. **Complexity Indicators**
   - Touches [N] files
   - Requires [M] test cases
   - Token estimate: ~[K] tokens (close to limit)

Similar COE tasks that were split properly:
- [Example 1]: See docs/breaking-down-tasks-examples.md#pattern-1
- [Example 2]: See docs/breaking-down-tasks-examples.md#pattern-3

Would you like me to:
A) Create breakdown plan now
B) Show more examples
C) Proceed anyway (with warnings)
```

---

### Step 4: Execute Task 1 (Atomic Step)

**Copilot implements ONLY the first task**:
1. Marks Task 1 as "in-progress" (to-do list)
2. Implements solution (~20 min)
3. Writes tests
4. Reports completion

**Completion message**:
```
✅ Task 1 Complete: [description]

Changes:
- File: src/[file].ts
- Lines added: [N]
- Tests: [M] passing

Ready for review/troubleshooting.

Next: Task 2 - [brief description]
Would you like me to continue with Task 2?
```

---

### Step 5: User Reviews & Approves

**User options**:
- ✅ "Looks good, continue" → Copilot starts Task 2
- 🔄 "Need changes" → User provides feedback, Copilot adjusts Task 1
- ⏸️ "Pause for now" → Mark Task 1 complete, save state for later
- 🛑 "Stop, re-plan" → Create new breakdown if approach isn't working

---

### Step 6: Repeat for Remaining Tasks

**Copilot continues**:
1. Mark Task 2 as "in-progress"
2. Implement (~20 min)
3. Test
4. Report completion
5. Wait for approval
6. Continue to Task 3...

**Until all tasks complete** ✅

---

## 📊 Example Workflow (Real COE Task)

### Original Request
```
User: "Implement the MCP server with all 6 tools"
```

### AI Detection
```
🛑 STOP - Estimated: ~3 hours (9× the limit!)

This task includes:
- 7 files (server.ts + 6 tool files)
- 6 different concerns (one per tool)
- ~4,500 tokens of code

Recommendation: Split into 7 atomic tasks (~20-30 min each)
```

### User Chooses Option A
```
User: "A - Create breakdown plan"
```

### AI Creates Plan
```markdown
Plans/mcp-server-implementation-breakdown.md

## Atomic Tasks

### Task 1: Setup MCP server structure (~20 min)
- File: src/mcpServer/server.ts
- Concern: Initialize JSON-RPC 2.0 server
- Test: Server starts without error

### Task 2: Implement getNextTask tool (~20 min)
- File: src/mcpServer/tools/getNextTask.ts
- Concern: Return highest priority task
- Test: Returns P1 task from queue

[... 5 more tasks ...]
```

### AI Creates To-Do List
```
✅ Multi-step to-do created (7 tasks)
📋 View with: 'Show To-Do List'
```

### AI Executes Task 1
```
✅ Task 1 Complete: MCP server structure

- Created src/mcpServer/server.ts
- Implements JSON-RPC 2.0 protocol
- Server starts on port 3000
- Tests: 2/2 passing

Ready to review. Shall I continue with Task 2?
```

### User Approves
```
User: "Looks good, continue"
```

### AI Executes Task 2
```
✅ Task 2 Complete: getNextTask tool

- Created src/mcpServer/tools/getNextTask.ts
- Returns highest priority P1 task
- Tests: 3/3 passing

2/7 tasks complete. Continue with Task 3?
```

**Process repeats until all 7 tasks done** ✅

---

## 🧠 When Breakdown Workflow is MANDATORY

| Scenario | Mandatory? | Why |
|----------|-----------|-----|
| Task estimated >20 min | ✅ YES | Violates atomic time box |
| Task touches >2 files | ✅ YES | Likely multiple concerns |
| Task has "and" in description | ✅ YES | Multiple responsibilities |
| User is unsure of scope | ✅ YES | Prevent scope creep |
| P1 critical task | ✅ YES | Extra rigor required |
| Refactoring work | ✅ YES | Unclear boundaries |
| New feature (no existing code) | ⚠️ RECOMMENDED | Helps plan architecture |
| Bug fix (single file, clear issue) | ❌ NO | Usually atomic already |

---

## 🎓 For Noobs: Trust the Process

**This workflow protects you** from:
- Context overload (too much to track)
- Debugging nightmares (too much code to isolate issues)
- Overwhelm (feeling lost mid-task)
- Wasted time (starting over after realizing task is too big)

**Benefits**:
- **Learn incrementally** — Each 20-min task teaches one concept
- **Easy troubleshooting** — Small changes = easy to debug
- **Clear progress** — See completion after each step
- **Escape hatch** — Can stop after any step without wasting work

**Trust Copilot's estimates** — It's analyzing:
- File count
- Token complexity
- Similar past tasks
- COE-specific patterns

**Your job**: Just approve/review after each step. Let AI handle the breakdown!

---

## 📚 Related Resources

- **Self-Test**: [docs/atomic-task-self-test.md](atomic-task-self-test.md) — Manual atomicity check
- **Recovery Guide**: [docs/task-rollback-recovery.md](task-rollback-recovery.md) — If task gets big mid-work
- **COE Examples**: [docs/breaking-down-tasks-examples.md](breaking-down-tasks-examples.md) — Project-specific patterns
- **Modular Philosophy**: [Plans/MODULAR-EXECUTION-PHILOSOPHY.md](../Plans/MODULAR-EXECUTION-PHILOSOPHY.md) — Why atomic tasks work

---

**Version**: 1.0  
**Last Updated**: January 27, 2026  
**Status**: MANDATORY workflow for all tasks >20 min

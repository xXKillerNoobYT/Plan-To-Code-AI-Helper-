# Task Rollback & Recovery Guide

**What to do when a task turns out bigger than expected (mid-work)**

---

## 🚨 Immediate Actions: STOP Protocol

**If you're in the middle of a task and realize it's too big**:

### Step 1: STOP Immediately ⛔
- **Don't finish** the current implementation
- **Don't commit** partial work (unless it's a clean checkpoint)
- **Don't continue** hoping to "just finish this part"

### Step 2: Save Current State
```bash
# Create a WIP branch to preserve work
git checkout -b wip/[task-name]-partial
git add .
git commit -m "WIP: Partial work on [task-name] - Too big, needs split"
```

### Step 3: Report to Copilot
Use MCP tool to log the observation:
```
"Task '[task-name]' turned out bigger than expected. 
Estimated: 20 min → Actual: ~X min remaining.
Need to split into smaller tasks."
```

---

## 🔄 Recovery Workflow

### Option A: Split and Continue (Recommended)

**When**: Task is partially done, can be cleanly split

1. **Identify what's already complete**
   - What works and is testable?
   - Can this be committed as a standalone piece?

2. **Ask Copilot to create breakdown plan**
   ```
   "I've completed [X]. This task needs splitting. Please:
   1. Create breakdown plan in Plans/[task-name]-recovery.md
   2. Use manage_todo_list for remaining steps
   3. Help me commit what's done so far"
   ```

3. **Commit completed portion** (if atomic)
   ```bash
   git checkout main
   git cherry-pick <commit-hash>  # Pick the good parts
   git commit -m "Part 1: Implement [completed-piece] (#issue)"
   ```

4. **Execute remaining steps** one at a time (~20 min each)

---

### Option B: Full Rollback (Clean Slate)

**When**: Task is tangled, no clean split points

1. **Stash or branch WIP work**
   ```bash
   # Preserve work (don't lose it!)
   git checkout -b wip/[task-name]-rollback
   git add .
   git commit -m "WIP: Rolling back oversized task"
   
   # Return to clean state
   git checkout main
   ```

2. **Ask Copilot for full breakdown**
   ```
   "Task '[task-name]' needs complete re-decomposition.
   Please create Plans/[task-name]-breakdown.md with atomic steps."
   ```

3. **Start fresh with Step 1**
   - Use lessons learned from WIP attempt
   - Reference WIP branch for code snippets (but don't copy-paste wholesale)

---

### Option C: Checkpoint and Pause (Investigation Needed)

**When**: Unsure how to split, need to research

1. **Commit as checkpoint** (mark as draft/WIP)
   ```bash
   git add .
   git commit -m "CHECKPOINT: [task-name] - Paused for re-planning"
   git push origin [branch-name]
   ```

2. **Create investigation task**
   ```
   Ask Copilot: "I need help understanding how to split this. 
   Can you research [specific confusion] and suggest approaches?"
   ```

3. **Copilot creates research doc** in Plans/
   - Analyzes task complexity
   - Suggests split points
   - Estimates new atomic tasks

4. **Resume with clear plan** after research

---

## 📋 Recovery Checklist

**Before resuming work, verify**:
- [ ] Original task split into ~20 min atomic steps
- [ ] Each step has ONE clear outcome
- [ ] Dependencies identified (execution order clear)
- [ ] Breakdown plan created in Plans/ folder
- [ ] Multi-step to-do list created (manage_todo_list)
- [ ] WIP work preserved (not lost)
- [ ] Learned from mistake (why was estimate wrong?)

---

## 🎯 Common Recovery Scenarios (COE-Specific)

### Scenario 1: "Implement MCP Server" (Too Big)

**Problem**: Started implementing all 6 MCP tools, realized it's 3 hours of work

**Recovery**:
1. STOP after completing getNextTask tool
2. Commit getNextTask as standalone: `git commit -m "Add getNextTask MCP tool"`
3. Ask Copilot: "Split remaining 5 tools into separate tasks"
4. Copilot creates:
   - Plans/mcp-tools-breakdown.md (detailed plan)
   - Multi-step to-do (5 tasks × 20 min)
5. Execute one tool at a time

---

### Scenario 2: "Add User Authentication" (Unclear Scope)

**Problem**: Halfway through, realized auth needs database schema + API + UI

**Recovery**:
1. STOP immediately (haven't touched DB yet)
2. Stash current work: `git stash save "Auth WIP - needs split"`
3. Ask Copilot: "Auth is actually 3 parts (DB, API, UI). Create breakdown"
4. Copilot creates Plans/auth-implementation-breakdown.md:
   - Part 1: Database schema for users (~20 min)
   - Part 2: POST /auth/register API (~20 min)
   - Part 3: Login UI component (~20 min)
5. Start fresh with Part 1, reference stashed code for ideas

---

### Scenario 3: "Refactor Task Service" (Spiraling Complexity)

**Problem**: Started refactoring, now touching 8 files, unclear end state

**Recovery**:
1. STOP and checkpoint: `git commit -m "CHECKPOINT: Task service refactor in progress"`
2. Ask Copilot: "This refactor is too big. What's the smallest atomic step?"
3. Copilot suggests: "Just extract TaskRepository class (1 file, 20 min)"
4. Rollback to main: `git reset --hard origin/main`
5. Execute only TaskRepository extraction
6. Plan remaining refactor steps after first success

---

## 🧠 Prevention Tips (Learn from Recovery)

**After recovering, ask**:
1. **Why did I underestimate?**
   - Didn't read PRD carefully enough?
   - Didn't check dependencies?
   - Assumed implementation was simple?

2. **What warning signs did I miss?**
   - Task description had "and" conjunction? (multiple things)
   - Multiple files listed in acceptance criteria?
   - Vague verbs like "refactor," "improve," "fix all"?

3. **How can I prevent this next time?**
   - Use atomic-task-self-test.md BEFORE starting
   - Ask Copilot to estimate time upfront
   - Create breakdown plan for anything uncertain

---

## 🎓 For Noobs: Don't Feel Bad!

**Underestimating task size is NORMAL** — even experienced devs do it.

**The key difference**:
- ❌ Bad: Keep going, commit messy code, create bugs
- ✅ Good: STOP early, ask for help, split properly

**What makes you GOOD at this**:
- Recognizing when you're stuck (self-awareness)
- Stopping before it gets worse (discipline)
- Asking for breakdown help (smart delegation)
- Learning from each recovery (growth mindset)

**Copilot is here to help** — use the tools:
- `reportObservation()` → Log when task gets big
- `askQuestion()` → "How should I split this?"
- `manage_todo_list` → Track multi-step recovery

---

## 📚 Related Resources

- **Self-Test**: [docs/atomic-task-self-test.md](atomic-task-self-test.md) — Prevent oversized tasks
- **Breakdown Workflow**: [docs/task-breakdown-workflow.md](task-breakdown-workflow.md) — Proactive split before starting
- **COE Examples**: [docs/breaking-down-tasks-examples.md](breaking-down-tasks-examples.md) — Project-specific patterns
- **Modular Philosophy**: [Plans/MODULAR-EXECUTION-PHILOSOPHY.md](../Plans/MODULAR-EXECUTION-PHILOSOPHY.md) — Why atomic tasks matter

---

**Version**: 1.0  
**Last Updated**: January 27, 2026  
**Status**: Active recovery guidance

# Atomic Task Self-Test

**Quick checklist to test if your task is atomic enough for one session**

---

## ✅ The 5-Second Test

**Can you describe the task in ONE sentence?**
- ✅ YES → Likely atomic
- ❌ NO (needs 2+ sentences) → Too big, split it

---

## 📋 The 5 Atomic Criteria Checklist

Before starting ANY task, check all 5:

| # | Criterion | Test Question | ✅ Pass | ❌ Fail → Action |
|---|-----------|---------------|---------|------------------|
| 1 | **Single Responsibility** | Does this change ONE thing only? (one endpoint, one component, one field, one tool) | One concern only | Touches multiple concerns → Split by concern |
| 2 | **Atomic Completion** | Can I finish, test, and commit this independently? | No dependencies on unfinished work | Depends on other work → Split dependencies |
| 3 | **Time Box** | Can I complete this in 15-20 minutes? | ≤20 min estimated | >20 min → **MANDATORY SPLIT** |
| 4 | **Verification Closure** | Is there ONE clear acceptance criterion I can test in <5 min? | Single testable outcome | Multiple outcomes → Split by outcome |
| 5 | **Token Safety** | Will the full context fit comfortably (<3,000 tokens)? | Fits in one context window | Too much context → Split to reduce scope |

---

## 🚨 MANDATORY: 20-Minute Rule

**If you estimate >20 minutes → STOP immediately!**

1. 🛑 Don't start coding
2. Ask Copilot: "This is too big, help me split it"
3. Copilot will create a breakdown plan in `Plans/`
4. Execute step-by-step with troubleshooting

[See: docs/task-breakdown-workflow.md for the full workflow]

---

## 🎯 Quick Examples (COE-Specific)

### ✅ GOOD (Atomic)

```
Task: "Implement getNextTask MCP tool"
- ONE thing: Single MCP tool endpoint
- ONE file: src/mcpServer/tools/getNextTask.ts
- Time: ~20 minutes (implementation + basic test)
- Test: Call tool, verify it returns highest P1 task
- Context: ~800 tokens (tool code + test)
```

### ❌ BAD (Too Big)

```
Task: "Implement MCP server with all 6 tools"
- SIX things: Multiple tools
- SIX files: One per tool
- Time: ~3 hours
- Test: 6 different acceptance criteria
- Context: ~5,000+ tokens
→ FAIL: Violates criteria 1, 3, 4, 5
→ ACTION: Split into 6 separate tasks (one per tool)
```

---

## 🔍 Common Patterns That Need Splitting

| Pattern | Why Too Big | How to Split |
|---------|-------------|--------------|
| "Implement [feature] with [A], [B], and [C]" | Multiple concerns (A, B, C) | 3 tasks: Implement A, Implement B, Implement C |
| "Add [X] and update [Y]" | Two responsibilities | 2 tasks: Add X, Update Y |
| "Refactor [module]" | Vague scope, likely >20 min | Break by file/function: Refactor X.ts, Refactor Y.ts |
| "Fix all bugs in [area]" | Multiple bugs = multiple tasks | 1 task per bug |
| "Create [component] with styling" | UI + styling = separate concerns | 2 tasks: Create component logic, Add styling |

---

## 🧠 When You're Unsure

**Ask these questions**:

1. **"How many files will I change?"**
   - 1 file → Likely atomic ✅
   - 2+ files → Check if single concern spans files (e.g., interface + implementation = OK)
   - 3+ files → Likely too big ❌

2. **"How many test cases will I write?"**
   - 1-3 tests → Atomic ✅
   - 4+ tests → Likely multiple concerns ❌

3. **"Can I explain what I'm doing in <10 words?"**
   - YES → Atomic ✅
   - NO → Too complex, split ❌

4. **"If this breaks, is the fix obvious?"**
   - YES → Atomic ✅
   - NO → Too many moving parts, split ❌

---

## 🎓 For Noobs: Just Ask

**When in doubt, ask Copilot**:
- "Is this task atomic enough?"
- "Should I split this?"
- "How would you break this down?"

**Copilot will**:
- Estimate time
- Suggest splits if >20 min
- Create breakdown plan in Plans/
- Guide you step-by-step

**Golden Rule**: Better to ask and split than start too big!

---

## 📚 Related Resources

- **Full Philosophy**: [Plans/MODULAR-EXECUTION-PHILOSOPHY.md](../Plans/MODULAR-EXECUTION-PHILOSOPHY.md) — Complete atomic execution rules
- **Breakdown Workflow**: [docs/task-breakdown-workflow.md](task-breakdown-workflow.md) — What happens when task is too big
- **Recovery Guide**: [docs/task-rollback-recovery.md](task-rollback-recovery.md) — What to do mid-task if it gets too big
- **COE Examples**: [docs/breaking-down-tasks-examples.md](breaking-down-tasks-examples.md) — Project-specific decomposition patterns

---

**Version**: 1.0  
**Last Updated**: January 27, 2026  
**Status**: Active guidance for all development

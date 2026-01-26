# Phase 0 Manual Testing Checklist

**Purpose**: Verify Phase 0 implementation works correctly and existing features still function

**Duration**: ~15-20 minutes  
**Prerequisites**: 
- VS Code extension running
- COE Orchestrator initialized
- `.coe/config.json` configured with working LLM endpoint

---

## ✅ Pre-Test Setup

- [ ] Extension is running in debug mode (or installed)
- [ ] Output channel "COE Orchestrator" is visible
- [ ] Planning task tree is visible in sidebar
- [ ] Status bar shows "COE: X tasks ready" or similar
- [ ] Plans/ folder has at least 3 .md files

---

## 🧪 Test 1: Manual PRD Generation

**Goal**: Verify "Regenerate PRD from Plans" command works

**Steps**:
1. [ ] Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. [ ] Type: "COE: Regenerate PRD"
3. [ ] Press Enter or click
4. [ ] Observe: Progress notification appears
5. [ ] Watch output channel for steps:
   - [ ] "Reading Plans/ folder..."
   - [ ] "Found X plan files"
   - [ ] "Bundling content..."
   - [ ] "Calling LLM..."
   - [ ] "Validating PRD..."
   - [ ] "Writing PRD.md and PRD.json..."
6. [ ] Notification shows: "✅ PRD regenerated successfully"
7. [ ] Verify workspace now has:
   - [ ] PRD.md (human-readable)
   - [ ] PRD.json (machine-readable)
   - [ ] PRD.backup-[timestamp].md (backup of previous)

**Check Output Quality**:
- [ ] PRD.md has frontmatter comment (Generated from Plans on [date])
- [ ] PRD.md has sections: Overview, Features, Architecture, Testing, Deployment, Priorities
- [ ] PRD.json has metadata + sections object
- [ ] Both files contain synthesized content from Plans (not template text)

**Expected Duration**: 5-10 minutes (depending on LLM response time)

**Pass Criteria**: ✅ PRD.md and PRD.json created with required sections

---

## 🧪 Test 2: Token Limit Handling

**Goal**: Verify token limiting + file prioritization works

**Setup**:
1. [ ] Create 3 large test files in Plans/:
   ```
   Plans/TEST-LARGE-1.md (fill with ~2000 chars of text)
   Plans/TEST-LARGE-2.md (fill with ~2000 chars of text)
   Plans/TEST-LARGE-3.md (fill with ~2000 chars of text)
   ```
2. [ ] Set `llm.inputTokenLimit` to 1000 in `.coe/config.json`
3. [ ] Save config

**Steps**:
1. [ ] Run "COE: Regenerate PRD" command again
2. [ ] Watch output for: "Token limit exceeded. X files truncated, Y excluded."
3. [ ] Check output channel for warnings
4. [ ] Verify CONSOLIDATED-MASTER-PLAN.md was included (if exists)
5. [ ] Verify large test files were truncated or excluded

**Check Output**:
- [ ] Bundle info shows correct truncation counts
- [ ] PRD still generated (partial content is OK)
- [ ] Priority files included first

**Pass Criteria**: ✅ Token limit respected, priority files included, warning shown

---

## 🧪 Test 3: File Watcher Auto-Regeneration

**Goal**: Verify Plans/ changes trigger auto-regeneration

**Setup**:
1. [ ] Delete test files from previous test (or leave them)
2. [ ] Open Plans/CONSOLIDATED-MASTER-PLAN.md
3. [ ] Make a small edit (add a comment, change a word)
4. [ ] Save the file

**Steps**:
1. [ ] Observe output channel for: "🔄 Plans/ change detected: change CONSOLIDATED-MASTER-PLAN.md"
2. [ ] Wait 5-10 seconds for debounce
3. [ ] Observe: "🔄 Auto-Regenerating PRD from Plans..."
4. [ ] PRD regenerates automatically
5. [ ] Notification: "✅ PRD auto-regenerated successfully!"

**Check Timing**:
- [ ] Initial detection: <1 second after save
- [ ] Debounce delay: 5 seconds
- [ ] Full generation: 30-60 seconds (depends on LLM)
- [ ] Total: <2 min from save to update

**Pass Criteria**: ✅ File change detected, debounce applied, PRD auto-regenerated

---

## 🧪 Test 4: Validation & Retry Logic

**Goal**: Verify bad LLM output is rejected and retry works

**Setup**:
1. [ ] This test requires either:
   - Option A: Mock a bad LLM response (advanced)
   - Option B: Trust validation is working (reasonable)

**Manual Approach** (Option B):
1. [ ] Run "COE: Regenerate PRD" normally
2. [ ] If validation passes, PRD.md contains all sections
3. [ ] Check logs: validation successful

**Automated Approach** (if LLM unreliable):
1. [ ] Manually edit PRD.md to remove one section (e.g., ## Features)
2. [ ] Run command again
3. [ ] Validation should: "⚠️ Validation failed: Missing sections: Features"
4. [ ] Retry should trigger
5. [ ] Final PRD should have all sections restored

**Pass Criteria**: ✅ Validation works, bad output detected, retry succeeds (or manual fix applied)

---

## 🧪 Test 5: Error Scenarios

### Test 5a: Plans/ Folder Missing

**Steps**:
1. [ ] Rename Plans/ to Plans_backup temporarily
2. [ ] Run "COE: Regenerate PRD"
3. [ ] Observe: Error message "❌ Plans directory not found"
4. [ ] Restore Plans/

**Pass Criteria**: ✅ Graceful error, no crash

### Test 5b: LLM Timeout

**Steps**:
1. [ ] Stop LLM service (if local)
2. [ ] Run "COE: Regenerate PRD"
3. [ ] Wait for timeout (~5 min with default settings, or sooner with lower timeout)
4. [ ] Observe: Error message about timeout
5. [ ] Restart LLM service

**Pass Criteria**: ✅ Timeout handled, error shown, extension responsive

### Test 5c: Permission Denied

**Steps**:
1. [ ] Make workspace read-only (advanced)
   - Windows: Right-click folder → Properties → Read-only (advanced)
   - Mac/Linux: `chmod 555 /workspace`
2. [ ] Run "COE: Regenerate PRD"
3. [ ] Observe: Error about file write permissions
4. [ ] Restore write permissions

**Pass Criteria**: ✅ Permission error shown, no crash

---

## 🧪 Test 6: Existing Features Unaffected

**Goal**: Verify task queue, sidebar, status bar still work

**Steps**:
1. [ ] **Task Queue**: Click status bar → observe "Refreshing queue"
2. [ ] **Sidebar**: Expand "COE Tasks" tree → see ready tasks
3. [ ] **Status Bar**: Observe updates as tasks are added/removed
4. [ ] **Commands**: Verify other commands still work (e.g., test orchestrator)
5. [ ] **MCP Server**: Verify language model still accessible (if applicable)

**Pass Criteria**: ✅ No regressions, all existing features work

---

## 📊 Test Results Summary

### Pass/Fail Table

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Test 1: Manual Generation | PRD.md + PRD.json created | | ⬜ |
| Test 2: Token Limits | Truncation warning shown | | ⬜ |
| Test 3: File Watcher | Auto-regeneration on change | | ⬜ |
| Test 4: Validation | Bad output detected + retry | | ⬜ |
| Test 5a: Plans Missing | Graceful error | | ⬜ |
| Test 5b: LLM Timeout | Timeout handled | | ⬜ |
| Test 5c: Permissions | Permission error shown | | ⬜ |
| Test 6: Existing Features | No regressions | | ⬜ |

### Overall Result

- **All Passed**: ✅ Phase 0 ready for launch
- **1-2 Failed**: ⚠️ Review failed tests, may need fixes
- **3+ Failed**: ❌ Phase 0 not ready, needs debugging

---

## 🐛 Debugging Tips

### Check Logs

1. Open output channel: "COE Orchestrator"
2. Search for:
   - `PRD` → all PRD-related logs
   - `Error` → any errors
   - `Warning` → warnings

### Enable Debug Logging

Add console.log statements in:
- `src/services/prdGenerator.ts` - generate() flow
- `src/services/plansWatcher.ts` - watcher events
- `src/services/contextBundler.ts` - bundling details

### Test LLM Endpoint Directly

```bash
curl -X POST http://192.168.1.205:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/ministral-3-14b-reasoning",
    "messages": [{"role": "user", "content": "Hello"}],
    "temperature": 0.3,
    "stream": true
  }'
```

### Verify File Paths

```bash
# Windows PowerShell
dir Plans | ForEach-Object { $_.Name }

# Mac/Linux
ls -la Plans/
```

---

## 📝 Notes

- **Duration**: Times are estimates; LLM response time varies
- **Config**: All tests use `.coe/config.json` settings
- **Cleanup**: Remember to revert temp files (Plans/TEST-*.md, etc.)
- **Version**: These tests assume Phase 0 as implemented
- **Regression**: Run all 6 tests to ensure nothing breaks

---

**Testing Date**: ___________  
**Tester Name**: ___________  
**Result**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL  

**Notes**:
[Space for tester notes]

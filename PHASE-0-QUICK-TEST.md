# 🚀 Phase 0: Quick Manual Test Guide

**Goal**: Verify PRD generation command works end-to-end  
**Time**: ~5 minutes  
**Prerequisite**: VS Code with COE extension loaded

---

## ✅ Step-by-Step Test

### Step 1: Compile Code (1 min)

```bash
npm run compile
```

**Expected**: No errors

**Actual Result**: _______________

---

### Step 2: Start Extension (2 min)

```
1. Press F5 (VS Code Debug)
2. Wait for extension to load
3. Check "COE Orchestrator" output channel
4. Look for: ✅ Programming Orchestrator initialized
```

**Expected**: Extension starts without errors

**Actual Result**: _______________

---

### Step 3: Run PRD Generation Command (1 min)

```
1. Press Ctrl+Shift+P (Command Palette)
2. Type: "Regenerate PRD"
3. Select: "COE: Regenerate PRD from Plans"
4. Press Enter
```

**Watch Output Channel For**:
- 📂 Reading Plans/ folder...
- ✅ Found X plan files
- 📦 Bundling content...
- 🤖 Calling LLM...
- ✅ Validating PRD...
- 💾 Writing to PRD.md and PRD.json...
- ✅ PRD regenerated successfully!

**Expected**: All steps logged, success message shown

**Actual Result**: _______________

---

### Step 4: Verify Files Created (1 min)

```
Open workspace root folder and check:
1. PRD.md exists ..................... [ ] YES [ ] NO
2. PRD.json exists ................... [ ] YES [ ] NO
3. PRD.backup-*.md exists ............ [ ] YES [ ] NO
```

**Open PRD.md and verify**:
- Contains: ## Overview ............... [ ] YES [ ] NO
- Contains: ## Features ............... [ ] YES [ ] NO
- Contains: ## Architecture ........... [ ] YES [ ] NO
- Contains: ## Testing ................ [ ] YES [ ] NO
- File size > 500 bytes ............... [ ] YES [ ] NO

**Expected**: All files created with required sections

**Actual Result**: _______________

---

### Step 5: Test Auto-Watch (1 min)

```
1. Open: Plans/CONSOLIDATED-MASTER-PLAN.md
2. Scroll to bottom
3. Add comment: "<!-- Test change -->"
4. Save file
5. Watch output channel for 10 seconds
```

**Expected**: 
- "🔄 Plans/ change detected"
- 5 second wait
- "🔄 Auto-Regenerating PRD"
- PRD updated

**Actual Result**: _______________

---

### Step 6: Verify Existing Features Still Work (1 min)

```
1. Check sidebar: "COE Tasks" tab visible .... [ ] YES [ ] NO
2. Click status bar "COE: X tasks ready" .... [ ] WORKS [ ] BROKEN
3. Check console: No new errors ............ [ ] CLEAN [ ] ERRORS
```

**Expected**: All existing features work unchanged

**Actual Result**: _______________

---

## 📊 Test Summary

### Overall Result

Mark one:
- [ ] ✅ ALL TESTS PASSED - Phase 0 is working!
- [ ] ⚠️  PARTIAL - Some tests passed, some failed
- [ ] ❌ FAILED - Command not working

### If Tests Passed ✅

**Phase 0 is production ready!**

The command `coe.regeneratePRD`:
- ✅ Reads Plans/ folder
- ✅ Bundles files with token limits
- ✅ Calls LLM
- ✅ Generates PRD.md + PRD.json
- ✅ Auto-watches for changes
- ✅ Handles errors gracefully
- ✅ Doesn't break existing features

**Next**: Can proceed to Phase 1 (P2 features)

### If Tests Failed ❌

Check output channel for errors:

**Error: "No workspace folder found"**
- Solution: Make sure VS Code has a workspace/folder open

**Error: "Plans directory not found"**
- Solution: Ensure Plans/ folder exists in workspace root
- Create test Plans/ folder if needed

**Error: "No plan files found"**
- Solution: Ensure Plans/*.md files exist
- Copy some .md files to Plans/ folder

**Error: "LLM not responding"**
- Solution: Check LLM endpoint is running
- Verify .coe/config.json has correct URL
- Check LLM logs for connection issues

**Error: "HTTP 404" or "Connection refused"**
- Solution: Start Mistral/LLM Studio/Ollama
- Test endpoint directly: `curl http://localhost:1234/v1/chat/completions`

**Sidebar/Task Queue broken**
- Solution: Should not happen (completely separate)
- Check console for specific errors
- Restart extension (F5 to stop, F5 to start)

---

## 📝 Test Results

**Tester Name**: ___________________________

**Date**: ___________________________

**Environment**: 
- OS: [ ] Windows [ ] Mac [ ] Linux
- VS Code Version: _______________
- LLM: [ ] LM Studio [ ] Ollama [ ] OpenAI [ ] Other: ________

**Test Results**:

| Test | Passed | Notes |
|------|--------|-------|
| Code compiles | [ ] | _____________ |
| Extension loads | [ ] | _____________ |
| Command runs | [ ] | _____________ |
| PRD.md created | [ ] | _____________ |
| PRD.json created | [ ] | _____________ |
| Auto-watch works | [ ] | _____________ |
| Existing features OK | [ ] | _____________ |

**Overall**: [ ] ✅ PASS [ ] ⚠️  PARTIAL [ ] ❌ FAIL

**Notes** (optional):
___________________________________________
___________________________________________
___________________________________________

---

## 🎉 If All Tests Pass

Congratulations! Phase 0 is complete and working.

**Phase 0 Features**: ✅ ALL WORKING
- ✅ "COE: Regenerate PRD from Plans" command
- ✅ Auto-watch with 5s debounce
- ✅ Token-aware bundling (4000 token limit)
- ✅ LLM integration (Mistral/OpenAI-compatible)
- ✅ Output validation & retry
- ✅ File writing (PRD.md + PRD.json)
- ✅ Error handling
- ✅ Zero regressions

**Ready for**: Code review, merged, production deployment!

---

## ❌ If Tests Fail

Please check:

1. **Logs**: View → Output → "COE Orchestrator"
2. **Console**: View → Debug Console
3. **Network**: Verify LLM endpoint is reachable
4. **Config**: Check .coe/config.json settings
5. **Workspace**: Ensure Plans/ folder exists

For debugging help:
- Check: `PHASE-0-VALIDATION-COMPLETE.md` (full validation guide)
- Read: `docs/phase-0-prd-generation.md` (implementation guide)
- Check: `docs/phase-0-testing-checklist.md` (manual test guide)

---

**Good Luck! 🚀**

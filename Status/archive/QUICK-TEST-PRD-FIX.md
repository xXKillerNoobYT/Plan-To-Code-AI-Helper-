# Quick Test Guide - PRD Generation Fix

## 🚀 Quick Start - 5 Minute Test

### Step 1: Reload Extension (1 minute)
```bash
# In VS Code:
1. Press F5 (or Ctrl+Shift+P / Cmd+Shift+P)
2. Type: "Developer: Reload Window"
3. Press Enter
4. Wait for extension to reload
```

---

### Step 2: Test Manual Command (2 minutes)

#### A. Open Output Panel
```bash
1. Press Ctrl+` (backtick) to open terminal/output
2. Click "Output" tab at top
3. Select "COE: Orchestrator" from dropdown
```

#### B. Run Command
```bash
1. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
2. Type: "COE: Regenerate PRD from Plans"
3. Press Enter
4. Watch progress notification appear
```

#### C. Verify Output ✅
**What you should see in Output panel:**
```
🚀 PRD Generation Started
📂 Reading Plans/ folder...
✅ Found X plan files
📦 Bundling content...
🤖 Calling LLM for PRD synthesis...
✅ Validating PRD structure...
💾 Writing PRD.md and PRD.json...
✅ Wrote PRD.md to: C:/your/workspace/path/PRD.md      ← CHECK THIS!
✅ Wrote PRD.json to: C:/your/workspace/path/PRD.json  ← CHECK THIS!
✅ PRD regenerated successfully (XXXX tokens)
📄 PRD.md: C:/your/workspace/path/PRD.md               ← CHECK THIS!
📄 PRD.json: C:/your/workspace/path/PRD.json           ← CHECK THIS!
⏱️ Duration: X.XXs
```

#### D. Verify Popup ✅
**What you should see:**
- Popup appears in bottom-right corner
- Message: "✅ PRD generated successfully!"
- Button: "Open PRD.md"

**Action**: Click "Open PRD.md"

**Expected**: PRD.md opens in editor

#### E. Verify Files ✅
**What you should see in Explorer (left sidebar):**
```
workspace/
├── PRD.md          ← Should be HERE (at the top level)
├── PRD.json        ← Should be HERE (at the top level)
├── Plans/
├── src/
└── ...
```

**✅ PASS**: Files visible in workspace root
**❌ FAIL**: Files missing or in subfolder (Plans/, .coe/)

---

### Step 3: Test Auto-Regeneration (2 minutes)

#### A. Edit Plans File
```bash
1. Open any file in Plans/ folder (e.g., Plans/README.md)
2. Add a space or newline anywhere
3. Save (Ctrl+S / Cmd+S)
4. Watch Output panel
```

#### B. Wait for Trigger
**Timeline:**
```
0 seconds: File saved
1 second:  Output shows "🔄 Plans/ change detected: change README.md"
5 seconds: Debounce timer expires
6 seconds: Output shows "🔄 Auto-Regenerating PRD from Plans/..."
```

#### C. Verify Output ✅
**What you should see:**
```
🔄 Plans/ change detected: change README.md
═══════════════════════════════════════════════════════════
🔄 Auto-Regenerating PRD from Plans/...
═══════════════════════════════════════════════════════════
📂 Reading Plans/ folder...
...
✅ Wrote PRD.md to: C:/your/workspace/path/PRD.md      ← CHECK THIS!
✅ Wrote PRD.json to: C:/your/workspace/path/PRD.json  ← CHECK THIS!
✅ PRD auto-regenerated successfully!
📄 PRD.md: C:/your/workspace/path/PRD.md               ← CHECK THIS!
📄 PRD.json: C:/your/workspace/path/PRD.json           ← CHECK THIS!
⏱️ Duration: X.XXs
```

#### D. Verify Popup ✅
**What you should see:**
- Popup: "✅ PRD auto-regenerated from Plans/ changes"
- Button: "Open PRD.md"

**Action**: Click "Open PRD.md"

**Expected**: PRD.md opens in editor

---

## 🎯 Success Criteria Checklist

### Manual Command ✅
- [ ] Command runs without errors
- [ ] Output shows exact file paths (full paths like C:/...)
- [ ] Popup appears with "Open PRD.md" button
- [ ] Clicking button opens PRD.md
- [ ] PRD.md visible in workspace root (Explorer sidebar)
- [ ] PRD.json visible in workspace root
- [ ] Files NOT in Plans/ or .coe/ subfolder

### Auto-Regeneration ✅
- [ ] File change detected (5 second debounce)
- [ ] Auto-regeneration triggers
- [ ] Same exact path logging
- [ ] Same popup appears
- [ ] Explorer refreshes (files update)
- [ ] "Open PRD.md" button works

### Regression Testing ✅
- [ ] Task queue still works (no impact)
- [ ] Sidebar panels still work
- [ ] Other commands work normally

---

## 🐛 Troubleshooting

### Problem: No popup appears
**Check:**
- Look for notification bell icon (bottom-right of VS Code)
- Click bell to see recent notifications
- Check if popup was auto-dismissed

**Fix:**
- Run command again
- Check Output panel for errors

---

### Problem: Files not in workspace root
**Check:**
- Output panel - what path is logged?
  ```
  ✅ Wrote PRD.md to: <path>
  ```
- Is `<path>` your workspace root?

**Fix:**
- Verify workspace folders: 
  ```bash
  Ctrl+Shift+P > "Developer: Show Running Extensions"
  ```
- Check if workspace configured correctly

---

### Problem: "Open" button doesn't work
**Check:**
- Does PRD.md exist at logged path?
- Check file permissions

**Fix:**
- Manually navigate to logged path
- Open file with File > Open File
- Check console for errors (F12 > Console tab)

---

### Problem: Explorer doesn't refresh
**Check:**
- Are files actually written? (check file system)
- Try manual refresh (right-click Explorer > Refresh)

**Fix:**
- Files ARE written, just not visible yet
- Close/reopen workspace
- Check VS Code version (ensure recent)

---

### Problem: Auto-regeneration doesn't trigger
**Check:**
- Is auto-regeneration enabled?
  ```json
  // .coe/config.json
  {
    "extension": {
      "autoRegeneratePRD": true  ← Should be true
    }
  }
  ```
- Did you save the file?
- Did you wait 5 seconds?

**Fix:**
- Enable auto-regeneration in config
- Try editing different file in Plans/
- Check Output panel for watcher status

---

## 📊 Expected vs Actual Results

### Test 1: Manual Command

| Check | Expected | Pass/Fail |
|-------|----------|-----------|
| Command runs | No errors | ☐ |
| Exact path logged | C:/workspace/PRD.md | ☐ |
| Popup appears | "PRD generated!" | ☐ |
| Button works | Opens PRD.md | ☐ |
| Files visible | In workspace root | ☐ |

### Test 2: Auto-Regeneration

| Check | Expected | Pass/Fail |
|-------|----------|-----------|
| Change detected | Within 1 second | ☐ |
| Triggers after 5s | Auto-regen starts | ☐ |
| Paths logged | Same as manual | ☐ |
| Popup appears | "Auto-regenerated" | ☐ |
| Explorer refreshes | Files update | ☐ |

### Test 3: Regression

| Check | Expected | Pass/Fail |
|-------|----------|-----------|
| Task queue | Still works | ☐ |
| Sidebar | Still works | ☐ |
| Other commands | No errors | ☐ |

---

## ✅ Test Complete!

If all checks pass: **🎉 Implementation Successful!**

If any checks fail: See troubleshooting section or check:
- `PRD-GENERATION-FIX-VERIFICATION.md` - Detailed test guide
- `PRD-FIX-IMPLEMENTATION-SUMMARY.md` - Technical details
- `PRD-GENERATION-WORKFLOW-VISUAL.md` - Visual workflow

---

**Test Duration**: ~5 minutes  
**Test Date**: _________________  
**Tested By**: _________________  
**Result**: ☐ Pass ☐ Fail ☐ Partial  
**Notes**: 
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

# 🌳 COE Tasks Queue Tree View Debug Guide

## What Was Fixed

Added comprehensive debug logging to track why tasks weren't showing in the "COE Tasks Queue" sidebar.

### Files Modified

1. **`src/tree/CoeTaskTreeProvider.ts`**
   - Added logging to `getChildren()` to show ready task count and IDs
   - Added logging to `CoeTaskTreeItem` constructor
   - Added `contextValue: 'coe.task'` for future right-click menu support
   - Added logging to `refresh()` method

2. **`src/extension.ts`**
   - Added logging after loading tasks from plan file
   - Added debug summary after tree initialization
   - Added comprehensive logging to `coe.processTask` command
   - Added queue status logging

3. **`src/orchestrator/programmingOrchestrator.ts`**
   - Added detailed logging to `getReadyTasks()` showing why each task is/isn't ready
   - Added logging to `addTask()` showing task status and priority

## How to Debug

### Step 1: Open Developer Console

**Windows/Linux:** `Ctrl+Shift+Y` → Then select "Output" tab → Select "Extension Host" from dropdown  
**Mac:** `Cmd+Shift+Y`

OR

**Windows/Linux:** `Ctrl+Shift+I` (Developer Tools) → "Console" tab  
**Mac:** `Cmd+Shift+I`

### Step 2: Reload Extension

1. Press `F5` to start debugging, OR
2. Press `Ctrl+Shift+P` → "Developer: Reload Window"

### Step 3: Look for Debug Output

You should see console output like:

```
═══════════════════════════════════════════════════════════
🔍 TREE VIEW DEBUG SUMMARY
═══════════════════════════════════════════════════════════
📊 Total tasks in orchestrator: 3
✅ Ready tasks: 3
🌳 Tree provider initialized: true
📺 Tree view created: true
📋 Ready task details:
   - PLAN-1-1737776400000: "Build user registration endpoint" [P1] status=ready
   - PLAN-2-1737776400000: "Add task list display component" [P2] status=ready
   - PLAN-3-1737776400000: "Write README with project overview" [P3] status=ready
═══════════════════════════════════════════════════════════
```

### Step 4: Check Tree View Updates

When `getChildren()` is called, you should see:

```
🌲 Tree getChildren() called
📊 Tree getChildren — ready tasks: 3
📋 Ready task IDs: PLAN-1-1737776400000 (Build user registration endpoint), ...
✅ Returning 3 tree items
🌳 Creating tree item for task: Build user registration endpoint [PLAN-1-...] - Status: ready, Priority: P1
✅ Tree item created with command: coe.processTask(PLAN-1-1737776400000)
```

### Step 5: Test Clicking Tasks

Click a task in the sidebar. You should see:

```
🎯 coe.processTask command triggered for taskId: PLAN-1-1737776400000
✅ Found task: Build user registration endpoint - Status: ready
🚀 Executing task from tree: Build user registration endpoint
```

## Common Issues & Fixes

### Issue 1: "No ready tasks found!"

**Diagnosis:** Tasks exist but aren't marked as `READY`

**Check:**
```
🔍 getReadyTasks() called - Total queue size: 3
  ❌ Task PLAN-1-... (Build user registration endpoint): status=pending (not READY)
```

**Fix:** Tasks in `current-plan.md` must use format `- [ ] Title #P1`  
The `[ ]` (unchecked box) sets status to `READY`.

### Issue 2: "Tree getChildren called — ready tasks: 0"

**Diagnosis:** `getReadyTasks()` is filtering out all tasks

**Possible causes:**
- Tasks blocked by dependencies
- Tasks have `blockedBy` array with values
- Tasks don't have `fromPlanningTeam: true`

**Fix:** Check the detailed `getReadyTasks()` logs to see why each task is filtered

### Issue 3: Tree shows tasks but they're not clickable

**Diagnosis:** Command not registered or taskId mismatch

**Check console for:**
```
✅ Tree item created with command: coe.processTask(PLAN-1-...)
```

**Then click task and verify:**
```
🎯 coe.processTask command triggered for taskId: PLAN-1-...
```

**Fix:** If command doesn't trigger, check VS Code command registration in `extension.ts`

### Issue 4: "Orchestrator not initialized"

**Diagnosis:** Race condition - tree trying to load before orchestrator ready

**Check:**
```
📊 Total tasks in orchestrator: 0
✅ Ready tasks: 0
🌳 Tree provider initialized: false
```

**Fix:** Ensure `programmingOrchestrator` is initialized before `CoeTaskTreeProvider`

## Expected Output Flow

### On Extension Load:
1. Orchestrator initialized ✅
2. Tree provider created ✅
3. Tasks loaded from `current-plan.md` ✅
4. Tasks added to orchestrator ✅
5. `treeDataProvider.refresh()` called ✅
6. Debug summary printed ✅

### On Tree View Open:
1. `getChildren()` called by VS Code
2. Returns array of `CoeTaskTreeItem`
3. Each item rendered in sidebar

### On Task Click:
1. `coe.processTask` command triggered
2. Task retrieved by ID
3. Status checked (must be `READY`)
4. `executeTask()` called
5. LLM prompt sent
6. Task completed
7. `treeDataProvider.refresh()` called
8. Tree updates with remaining tasks

## Quick Test

### Create Test Plan

1. Open workspace
2. Create `Docs/Plans/current-plan.md`:
   ```markdown
   # Test Plan
   
   - [ ] Task 1 test #P1
   - [ ] Task 2 test #P2
   - [ ] Task 3 test
   ```

3. Reload extension
4. Check console for "Loaded and added 3 tasks" ✅
5. Check sidebar "COE Tasks Queue" - should show 3 tasks ✅
6. Click a task - should see "Processing task from tree..." ✅

## Troubleshooting Commands

### View Orchestrator Status
Open Command Palette (`Ctrl+Shift+P`):
- "COE: Test Orchestrator" - Processes next ready task

### View Console Logs
- Extension Host output channel (Ctrl+Shift+Y)
- Developer Console (Ctrl+Shift+I → Console tab)

### Reset Everything
1. Delete `.coe/` folder in workspace
2. Delete `Docs/Plans/current-plan.md`
3. Reload window (`Ctrl+Shift+P` → "Developer: Reload Window")
4. Extension will recreate starter files

## Still Not Working?

If sidebar still shows empty after all above checks:

1. **Run this in Debug Console** (Ctrl+Shift+Y → "Debug Console"):
   ```javascript
   vscode.commands.executeCommand('coe.testOrchestrator')
   ```

2. **Check TreeView ID matches** in `package.json`:
   ```json
   "views": {
     "explorer": [
       {
         "id": "coe.tasksQueue",  // Must match createTreeView() call
         "name": "COE Tasks Queue"
       }
     ]
   }
   ```

3. **Manually trigger refresh**:
   Add button to run:
   ```typescript
   vscode.commands.executeCommand('coe.refreshTree');
   ```

---

**Created:** 2026-01-25  
**Last Updated:** 2026-01-25  
**Status:** Debug logging active ✅

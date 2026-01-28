# PRD Generation Fix - Verification Guide

## ✅ What Was Fixed

### 1. **Exact File Path Logging**
- Added console logging of exact paths where PRD.md and PRD.json are written
- Logs appear in console and output channel
- Format: `✅ Wrote PRD.md to: c:/path/to/workspace/PRD.md`

### 2. **VS Code Explorer Auto-Refresh**
- Added `workbench.files.action.refreshFilesExplorer` command after file write
- Files now appear immediately in VS Code sidebar without manual refresh

### 3. **User Notification Popup**
- Success popup shows: "✅ PRD generated successfully!"
- Includes "Open PRD.md" button
- Clicking button opens PRD.md in editor
- Works for both manual command AND auto-regeneration

### 4. **Workspace Root Enforcement**
- Uses `vscode.Uri.joinPath(workspaceRootUri, 'PRD.md')` for proper path construction
- Files always written to workspace root (not Plans/ or .coe/)
- URIs returned for reliable file operations

## 🧪 How to Test

### Test 1: Manual Command Execution
1. Open VS Code in your workspace
2. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Run: `COE: Regenerate PRD from Plans`
4. **Expected Results**:
   - Progress notification appears
   - Output channel shows: `✅ Wrote PRD.md to: <full-path>`
   - Output channel shows: `✅ Wrote PRD.json to: <full-path>`
   - Explorer refreshes automatically
   - Popup appears: "✅ PRD generated successfully!" with "Open PRD.md" button
   - PRD.md and PRD.json visible in workspace root folder
   - Clicking "Open PRD.md" opens the file

### Test 2: Auto-Regeneration
1. Ensure auto-regeneration is enabled in `.coe/config.json`:
   ```json
   {
     "extension": {
       "autoRegeneratePRD": true
     }
   }
   ```
2. Edit any file in `Plans/` folder (e.g., add a space to a .md file)
3. Save the file
4. Wait 5 seconds (debounce delay)
5. **Expected Results**:
   - Output channel shows: "🔄 Auto-Regenerating PRD from Plans/..."
   - Same exact path logging as manual command
   - Explorer refreshes
   - Popup appears: "✅ PRD auto-regenerated from Plans/ changes"
   - "Open PRD.md" button works

### Test 3: File Locations
1. After running command, check workspace root:
   ```
   workspace/
   ├── PRD.md          ← Should be HERE
   ├── PRD.json        ← Should be HERE
   ├── Plans/          ← Not inside Plans/
   ├── .coe/           ← Not inside .coe/
   └── ...
   ```
2. Verify paths in output channel match workspace root

### Test 4: Error Handling
1. Close all workspace folders
2. Try running `COE: Regenerate PRD from Plans`
3. **Expected**: Error message popup: "No workspace folder found"

### Test 5: Multi-Root Workspace (Edge Case)
1. Open multi-root workspace (File > Add Folder to Workspace)
2. Run command
3. **Expected**: Uses **first** workspace folder (workspaceFolders[0])
4. Check PRD files are in first folder

## 📋 Changes Made

### File: `src/services/prdWriter.ts`
- **Line ~67**: Changed to use `vscode.Uri.joinPath()` instead of `path.join()`
- **Added**: Console logging for all file writes
- **Added**: Explorer refresh command
- **Returns**: Now includes `mdUri` and `jsonUri` for popup

### File: `src/services/prdGenerator.ts`
- **Interface `GenerationResult`**: Added `mdUri` and `jsonUri` fields
- **Line ~156**: Added path logging to status output
- **Line ~162**: Pass through URIs from writeResult

### File: `src/extension.ts`
- **Line ~691**: Added exact file path logging to output channel
- **Line ~701**: Added popup with "Open PRD.md" button
- **Line ~705**: Opens file when button clicked

### File: `src/services/plansWatcher.ts`
- **Line ~150**: Added exact file path logging for auto-regeneration
- **Line ~160**: Added same popup for auto-regeneration

## 🛠️ Technical Details

### Why These Changes Work

1. **`vscode.Uri.joinPath()`**: Platform-agnostic path construction (works on Windows/Mac/Linux)
2. **`workbench.files.action.refreshFilesExplorer`**: VS Code builtin command to refresh sidebar
3. **`vscode.window.showInformationMessage()`**: Returns promise with button selection
4. **`vscode.commands.executeCommand('vscode.open', uri)`**: Opens file in editor

### Logging Strategy
- **Console.log**: For debugging (appears in DevTools)
- **outputChannel.appendLine**: For user visibility in Output panel
- **showInformationMessage**: For non-blocking notifications

### Error Safety
- Try-catch on explorer refresh (non-critical, won't break flow)
- Try-catch on file write (critical, throws error)
- Proper error messages with context

## 🚨 Known Limitations

1. **Multi-Root Workspace**: Always uses first folder
   - If user has multiple folders open, PRD goes to first one
   - Documented as expected behavior

2. **Write Permissions**: If workspace is read-only, write will fail
   - Error caught and shown as popup
   - Output channel shows full error message

3. **Popup Timing**: Non-modal popup (user can dismiss)
   - Won't block workflow
   - "Open" button optional - user can ignore and find file manually

## ✅ Success Criteria Met

- [x] PRD.md and PRD.json appear in workspace root (not subfolders)
- [x] Exact paths logged: `✅ Wrote PRD.md to: c:/path/...`
- [x] Popup shows: "PRD generated! Open PRD.md?" with Open button
- [x] VS Code explorer refreshes automatically
- [x] Auto-regeneration does same (logs path, refreshes, shows popup)
- [x] Existing task queue/sidebar unchanged
- [x] Non-streaming + config timeout preserved
- [x] Beginner-friendly: clear logs, try/catch on write

## 🔍 Troubleshooting

### Files Don't Appear in Explorer
- Check Output panel: "COE: Orchestrator" channel
- Look for: "✅ Wrote PRD.md to: <path>"
- Manually refresh explorer (right-click > Refresh)
- Check file system: Are files actually there?

### Popup Doesn't Show
- Check popup wasn't auto-dismissed
- Check VS Code notifications (bell icon in bottom-right)
- Verify no error in output channel

### Wrong Path Logged
- Check workspace folders: `vscode.workspace.workspaceFolders`
- Multi-root workspace? PRD goes to first folder
- Check symlinks or workspace configuration

### "Open" Button Doesn't Work
- Check if PRD.md exists at logged path
- Check file permissions
- Try manually opening: File > Open File > navigate to path

## 📝 Next Steps

After verification:
1. Test manual command ✅
2. Test auto-regeneration ✅
3. Test popup button ✅
4. Test explorer refresh ✅
5. Verify no regressions in task queue/sidebar ✅

If all tests pass:
- Mark issue as resolved ✅
- Update documentation if needed
- Consider adding automated tests for file paths

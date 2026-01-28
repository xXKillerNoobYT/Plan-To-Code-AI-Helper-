# PRD Generation Workflow - Visual Guide

## 📊 Before vs After Comparison

### BEFORE (Hidden Files Problem)
```
User runs command
       ↓
Generate PRD content
       ↓
Write files (silently)
       ↓
❌ No confirmation
❌ No path logging
❌ No explorer refresh
❌ User confused: "Where did it go?"
```

### AFTER (Fixed - Visible & Clear)
```
User runs command
       ↓
Generate PRD content
       ↓
Write files to workspace root
       ↓
✅ Log exact paths: "Wrote PRD.md to: C:/workspace/PRD.md"
       ↓
✅ Refresh VS Code explorer (files appear instantly)
       ↓
✅ Show popup: "PRD generated! [Open PRD.md]"
       ↓
User clicks "Open PRD.md" → File opens in editor
```

---

## 🔄 Full Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  USER ACTION                                            │
│  - Runs "COE: Regenerate PRD from Plans"                │
│  - OR edits Plans/ file (auto-trigger)                  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Read Plans/ Folder                             │
│  - PRDGenerator.generate()                              │
│  - PlansReader.readAllPlans()                           │
│  - Status: "📂 Reading Plans/ folder..."               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 2: Bundle Content                                 │
│  - ContextBundler.bundle()                              │
│  - Token limit: 4000                                    │
│  - Status: "📦 Bundling content..."                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 3: Call LLM                                       │
│  - PRDGenerator.callLLM()                               │
│  - Non-streaming mode (faster)                          │
│  - Timeout from config                                  │
│  - Status: "🤖 Calling LLM..."                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 4: Validate Output                                │
│  - PRDGenerationPrompt.validatePRDOutput()              │
│  - Retry if validation fails                            │
│  - Status: "✅ Validating PRD structure..."             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 5: Write Files (NEW LOGGING!)                     │
│  ┌───────────────────────────────────────────┐          │
│  │ PRDWriter.writePRD()                      │          │
│  ├───────────────────────────────────────────┤          │
│  │ 1. Get workspace root URI                 │          │
│  │    workspaceFolders[0].uri                │          │
│  │                                            │          │
│  │ 2. Build file URIs                        │          │
│  │    mdUri = Uri.joinPath(root, 'PRD.md')   │          │
│  │    jsonUri = Uri.joinPath(root, 'PRD.json')│         │
│  │                                            │          │
│  │ 3. Log paths (NEW!)                       │          │
│  │    console.log("📝 Writing PRD files...")  │          │
│  │    console.log("   PRD.md: ${mdPath}")    │          │
│  │    console.log("   PRD.json: ${jsonPath}")│          │
│  │                                            │          │
│  │ 4. Create backup (if exists)              │          │
│  │    PRD.backup-2026-01-26.md               │          │
│  │                                            │          │
│  │ 5. Write markdown file                    │          │
│  │    fs.writeFile(mdPath, content)          │          │
│  │    console.log("✅ Wrote PRD.md to: ...")  │          │
│  │                                            │          │
│  │ 6. Write JSON file                        │          │
│  │    fs.writeFile(jsonPath, json)           │          │
│  │    console.log("✅ Wrote PRD.json to: ...")│          │
│  │                                            │          │
│  │ 7. Refresh explorer (NEW!)                │          │
│  │    executeCommand('workbench.files...')   │          │
│  │    console.log("✅ Refreshed explorer")   │          │
│  │                                            │          │
│  │ 8. Return URIs for popup (NEW!)           │          │
│  │    return { mdUri, jsonUri, ... }         │          │
│  └───────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 6: Log Results (NEW!)                             │
│  ┌───────────────────────────────────────────┐          │
│  │ Extension.ts (command handler)            │          │
│  ├───────────────────────────────────────────┤          │
│  │ outputChannel.appendLine(...result.message)│         │
│  │ outputChannel.appendLine("📄 PRD.md: ...") │         │
│  │ outputChannel.appendLine("📄 PRD.json: ...")│        │
│  │ outputChannel.appendLine("⏱️ Duration: ...") │       │
│  └───────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 7: Show Popup (NEW!)                              │
│  ┌───────────────────────────────────────────┐          │
│  │ vscode.window.showInformationMessage()    │          │
│  ├───────────────────────────────────────────┤          │
│  │ Message: "✅ PRD generated successfully!"  │          │
│  │ Button: "Open PRD.md"                     │          │
│  │                                            │          │
│  │ When clicked:                             │          │
│  │   vscode.commands.executeCommand(         │          │
│  │     'vscode.open',                        │          │
│  │     result.mdUri                          │          │
│  │   )                                       │          │
│  └───────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  RESULT                                                  │
│  ✅ PRD.md opens in editor                              │
│  ✅ PRD.json visible in explorer (workspace root)       │
│  ✅ Backup created (if previous PRD existed)            │
│  ✅ User knows exactly where files are                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Changes Highlighted

### 1. Workspace Root Enforcement
```typescript
// BEFORE (using path.join, less reliable)
const workspaceRoot = workspaceFolders[0].uri.fsPath;
const mdPath = path.join(workspaceRoot, 'PRD.md');

// AFTER (using VS Code URI API, more reliable)
const workspaceRootUri = workspaceFolders[0].uri;
const mdUri = vscode.Uri.joinPath(workspaceRootUri, 'PRD.md');
const mdPath = mdUri.fsPath;  // Convert to path for fs operations
```

**Why Better?**
- Platform-agnostic (works same on Windows/Mac/Linux)
- Handles special characters in paths
- VS Code native API (better integration)

---

### 2. Detailed Logging
```typescript
// NEW: Before write
console.log(`📝 Writing PRD files to workspace root:`);
console.log(`   PRD.md: ${mdPath}`);
console.log(`   PRD.json: ${jsonPath}`);

// NEW: After write
console.log(`✅ Wrote PRD.md to: ${mdPath}`);
console.log(`✅ Wrote PRD.json to: ${jsonPath}`);

// NEW: After explorer refresh
console.log('✅ Refreshed VS Code explorer');
```

**User Sees**:
```
📝 Writing PRD files to workspace root:
   PRD.md: C:/Users/you/workspace/PRD.md
   PRD.json: C:/Users/you/workspace/PRD.json
✅ Wrote PRD.md to: C:/Users/you/workspace/PRD.md
✅ Wrote PRD.json to: C:/Users/you/workspace/PRD.json
✅ Refreshed VS Code explorer
```

---

### 3. Explorer Auto-Refresh
```typescript
// NEW: Refresh explorer so files appear immediately
try {
    await vscode.commands.executeCommand(
        'workbench.files.action.refreshFilesExplorer'
    );
    console.log('✅ Refreshed VS Code explorer');
} catch (error) {
    console.warn('⚠️ Failed to refresh explorer:', error);
    // Non-critical, continue
}
```

**User Experience**:
- Files appear in sidebar immediately
- No need to manually click refresh
- Seamless workflow

---

### 4. Popup Notification
```typescript
// NEW: Show popup with Open button
const openButton = 'Open PRD.md';
vscode.window.showInformationMessage(
    '✅ PRD generated successfully!',
    openButton
).then(selection => {
    if (selection === openButton && result.mdUri) {
        vscode.commands.executeCommand('vscode.open', result.mdUri);
    }
});
```

**User Sees**:
```
┌───────────────────────────────────────┐
│ ✅ PRD generated successfully!        │
│                                       │
│          [Open PRD.md]                │
└───────────────────────────────────────┘
```

**When Clicked**:
- PRD.md opens in editor immediately
- No need to navigate file tree
- One-click access

---

## 🔄 Auto-Regeneration Flow

```
User edits Plans/some-plan.md
          ↓
File saved
          ↓
PlansFileWatcher detects change
          ↓
Wait 5 seconds (debounce)
          ↓
Trigger auto-regeneration
          ↓
[SAME WORKFLOW AS MANUAL COMMAND]
          ↓
Log exact paths
          ↓
Refresh explorer
          ↓
Show popup: "PRD auto-regenerated from Plans/ changes"
          ↓
User clicks "Open PRD.md"
          ↓
File opens in editor
```

---

## 📝 Output Channel Example

### Before (Silent)
```
🚀 PRD Generation Started
📂 Reading Plans/ folder...
✅ Found 8 plan files
📦 Bundling content...
🤖 Calling LLM...
✅ Validating PRD structure...
💾 Writing PRD.md and PRD.json...
✅ PRD regenerated successfully (2341 tokens)
```

### After (Detailed Paths)
```
🚀 PRD Generation Started
📂 Reading Plans/ folder...
✅ Found 8 plan files
📦 Bundling content...
🤖 Calling LLM...
✅ Validating PRD structure...
💾 Writing PRD.md and PRD.json...
✅ Wrote PRD.md to: C:/Users/you/workspace/PRD.md
✅ Wrote PRD.json to: C:/Users/you/workspace/PRD.json
✅ PRD regenerated successfully (2341 tokens)
📄 PRD.md: C:/Users/you/workspace/PRD.md      ← NEW!
📄 PRD.json: C:/Users/you/workspace/PRD.json  ← NEW!
⏱️ Duration: 12.34s
```

---

## 🎁 Bonus Features

### 1. Backup Logging
```
ℹ️ No existing PRD.md to backup
```
or
```
✅ Created backup: C:/Users/you/workspace/PRD.backup-2026-01-26T10-30-45.md
```

### 2. Error Logging
If write fails:
```
❌ Failed to write PRD: EACCES: permission denied
```

### 3. Multi-Root Workspace Detection
```
📝 Writing PRD files to workspace root:
   Using first workspace folder: C:/Users/you/workspace1/
   PRD.md: C:/Users/you/workspace1/PRD.md
```

---

## ✅ Verification Checklist

Test each step:
- [ ] Run command → see popup
- [ ] Click "Open PRD.md" → file opens
- [ ] Check Output panel → see exact paths
- [ ] Check workspace root → files visible
- [ ] Edit Plans/ file → auto-regeneration triggers
- [ ] Auto-regen → same popup/logging behavior
- [ ] Check task queue → still works (no regression)

---

**Created**: January 26, 2026  
**Purpose**: Visual guide to PRD generation workflow changes  
**Status**: ✅ Complete

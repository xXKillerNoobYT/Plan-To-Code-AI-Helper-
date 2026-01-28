# 🚀 Quick Start - COE Extension After Fixes

## What's New ✨

### 1. **Sidebar Task Queue** (Works Now!)
The "COE Tasks Queue" in the Explorer sidebar now displays all your pending tasks, sorted by priority.

### 2. **Click-to-Process Tasks** (Works Now!)
Click any task in the sidebar to start processing it immediately - same as clicking the status bar.

### 3. **Plain Text Responses** (Works Now!)
The extension no longer crashes when the LM Studio model returns plain text - it handles both JSON and text gracefully.

---

## How to Use

### 1️⃣ Create Your Tasks
Edit `Docs/Plans/current-plan.md`:
```markdown
# COE Project Plan

- [ ] Implement user login #P1
- [ ] Update dashboard UI #P2  
- [ ] Add help documentation
```

**Priority Syntax**:
- `#P1` = Critical (shows first in sidebar)
- `#P2` = High (shows second)
- `#P3` or no priority = Medium (shows last)

### 2️⃣ View Tasks in Sidebar
Open VS Code Explorer → "COE Tasks Queue"

**Expected Display**:
```
📋 COE Tasks Queue
  ├─ ☑️  Implement user login (P1 - High)
  └─ ◯ Update dashboard UI (P2 - Medium)
```

### 3️⃣ Process a Task
**Option A: Click in Sidebar**
- Click any task → starts processing

**Option B: Use Status Bar**
- Click `$(list-tree) COE: 2 tasks ready` → processes next task

**Option C: Command Palette**
- Press `Ctrl+Shift+P`
- Type "COE: Process" → pick option

### 4️⃣ Watch the Processing

**Output Channel shows**:
```
════════════════════════════════════════════════════════
🚀 Processing task PLAN-1-1706253618842...
📋 Task: Implement user login
🎯 Priority: P1

🔄 Generating routing directive...
📊 Estimated input tokens: 1245 / 4000

🤖 Sending prompt to mistralai/ministral-3-14b-reasoning (timeout: 300s)...
$(sync~spin) Receiving from mistralai/ministral-3-14b-reasoning...

✅ Received response in 2341ms
────────────────────────────────────────────
🧠 Model Reply:
────────────────────────────────────────────
I'll help implement the user login feature.

Here's my approach:
1. Create authentication service
2. Add login form component
3. Integrate with database

Let me start by...
────────────────────────────────────────────

✅ Task marked complete
```

### 5️⃣ Verify in Sidebar
- ✅ Completed task disappears from queue
- ✅ Next task automatically shows
- ✅ Status bar updates to show remaining tasks

---

## Common Tasks

### ✅ Add a New Task
1. Edit `Docs/Plans/current-plan.md`
2. Add line: `- [ ] Your task title #P1`
3. Save file (Ctrl+S)
4. Sidebar refreshes automatically ✨

### ✅ Change Task Priority
1. Edit `Docs/Plans/current-plan.md`
2. Change `#P1` to `#P2` (or `#P3`)
3. Save file
4. Sidebar reorders automatically ✨

### ✅ View Model's Full Response
1. In output channel, scroll up after task completes
2. Look for "🧠 Model Reply:" section
3. Full response shown between separator lines

### ✅ Check Queue Status
1. Look at status bar (bottom left)
2. Shows: `$(list-tree) COE: 2 tasks ready`
3. Shows: `$(play) COE: Working on [task name]...` (while processing)
4. Shows: `$(check-all) COE: All tasks complete — edit plan!` (when done)

### ✅ Process Tasks in Order
- P1 tasks always process first
- Within same priority, top-to-bottom order
- Click any task to process it out of sequence

---

## What Works Now ✅

| Feature | Status | Notes |
|---------|--------|-------|
| **Sidebar Display** | ✅ | Shows all tasks, sorted by priority |
| **Click to Process** | ✅ | Click any task in sidebar |
| **Status Bar** | ✅ | Shows queue status, click to process next |
| **Plain Text Responses** | ✅ | No more JSON errors! |
| **Task Completion** | ✅ | Marks done → sidebar refreshes |
| **Auto-Refresh** | ✅ | Sidebar updates when file saved |
| **Priority Sorting** | ✅ | P1 → P2 → P3 order |
| **Output Logging** | ✅ | Full response logged cleanly |

---

## Troubleshooting

### ❓ Sidebar shows "No tasks — edit Docs/Plans/current-plan.md"
**Solution**: 
1. Create file: `Docs/Plans/current-plan.md`
2. Add tasks with format: `- [ ] Task title #P1`
3. Save file (Ctrl+S)
4. Sidebar updates automatically

### ❓ Sidebar doesn't show my new tasks
**Solution**:
1. Make sure file is saved (Ctrl+S)
2. Check format: `- [ ] (space) Task title (space) #P1`
3. Priority `#P1`, `#P2`, `#P3` must be exact
4. If still not working, run "COE: Test Orchestrator" command

### ❓ Error: "No workspace folder found"
**Solution**:
1. Open a folder in VS Code (File → Open Folder)
2. Re-activate extension (reload window: F1 → "Developer: Reload Window")
3. COE will create `Docs/Plans/` structure automatically

### ❓ Task stuck in "in-progress"
**Solution** (rare):
1. Wait 5 minutes or stop LM Studio
2. If persists: Run "COE: Test Orchestrator" to reset
3. Or manually edit status in output log (advanced)

### ❓ "Cannot read property of undefined" error
**Solution**:
1. Make sure LM Studio is running on `192.168.1.205:1234`
2. Check LM Studio settings → check API is enabled
3. Update URL in COE settings if different

### ❓ Very slow response / timeout
**Solution**:
1. Check LM Studio is not overloaded
2. Check network connectivity
3. Increase timeout in settings (default: 300s)
4. Reduce max output tokens (default: 2000)

---

## Settings (COE Configuration)

Open VS Code Settings → Search "coe" to adjust:

```json
{
    "coe.llm.url": "http://192.168.1.205:1234/v1/chat/completions",
    "coe.llm.model": "mistralai/ministral-3-14b-reasoning",
    "coe.llm.maxOutputTokens": 2000,
    "coe.llm.inputTokenLimit": 4000,
    "coe.llm.timeoutSeconds": 300
}
```

### 🔧 Key Settings

| Setting | Default | Use Case |
|---------|---------|----------|
| `url` | `http://192.168.1.205:1234/v1/chat/completions` | LM Studio API endpoint |
| `model` | `mistralai/ministral-3-14b-reasoning` | Which model to use |
| `maxOutputTokens` | `2000` | Max response length |
| `inputTokenLimit` | `4000` | Max prompt size |
| `timeoutSeconds` | `300` | Response timeout (5 min) |

**⚠️ Note**: Currently, these settings must be in VS Code settings. Use `.coe/config.json` in workspace root for per-project overrides.

---

## Example Workflow

### 👨‍💻 Use Case: Build a Feature

**Step 1**: Create plan
```markdown
# Build User Dashboard

- [ ] Create database schema for user profiles #P1
- [ ] Build React profile component #P1
- [ ] Add data sync service #P2
- [ ] Write unit tests #P2
- [ ] Add documentation
```

**Step 2**: View in sidebar
- All 5 tasks appear in "COE Tasks Queue" panel
- Sorted: 2x P1 at top, 2x P2 in middle, 1x P3 at bottom

**Step 3**: Process one by one
- Click first P1 task ("Create database schema...") → model responds
- Task marked done → disappears
- Next P1 task appears at top
- Continue until all done

**Step 4**: Edit if plan changes
- Edit plan file → add new task
- Sidebar updates automatically
- Queue reorganizes by priority

**Step 5**: Review responses
- Check output channel for each model response
- Links to code, architecture, hints all logged
- Copy-paste ideas into your editor

---

## Tips & Tricks 💡

### 💡 Use Detailed Task Titles
✅ Good: "Implement user authentication with JWT tokens"  
❌ Bad: "Fix bug"

### 💡 Group Related Tasks
✅ Good: All "Setup" tasks use `#P1`, all "Testing" use `#P2`  
❌ Bad: Random priorities

### 💡 One Task = One Click
✅ Good: Each task takes <5 minutes to complete  
❌ Bad: Each task takes 2 hours (break down!)

### 💡 Check Output Channel Often
✅ Good: Review model response after each task  
❌ Bad: Ignore output, assume it worked

### 💡 Use Status Bar for Quick Check
✅ Look at status bar to see:
  - How many tasks remain
  - Which task is currently processing
  - When last task completes

---

## Feature Roadmap 🗺️

### ✅ Just Fixed
- **Sidebar task display with priority sorting**
- **Click-to-process tasks**
- **Plain text response handling**

### 🔜 Coming Soon (Phase 2-3)
- MCP Tool integration (`askQuestion` parsing)
- Smart routing (questions → Answer Team)
- Advanced response analysis
- Streaming token counting

### 📅 Future (Phase 4+)
- Multi-turn conversations
- Agent coordination UI
- Real-time progress tracking
- Integration with GitHub Issues

---

## Get Help

### 📖 Documentation
- Full spec: `Plans/CONSOLIDATED-MASTER-PLAN.md`
- Technical details: `docs/response-streaming-fix.md`
- Architecture: `Plans/COE-Master-Plan/01-Architecture-Document.md`

### 🐛 Found a Bug?
1. Check console (F12 → Console tab)
2. Check output channel (View → Output → COE Orchestrator)
3. Create GitHub issue with error message + steps to reproduce

### 💬 Questions?
- Check this guide first (search keywords)
- Read PRD.md for feature explanations
- Ask in GitHub Discussions

---

## Version & Credits

- **Version**: 0.1.0 (MVP)
- **Last Updated**: January 26, 2026
- **Status**: ✅ Stable
- **LLM**: LM Studio (local, any OpenAI-compatible model)
- **VS Code**: 1.85.0+

**Built with ❤️ for developers who want AI assistance without losing control.**

---

⭐ **Enjoy COE! Happy coding!** 🚀

# Debug Skill

**AI-powered debugging assistance for the COE project** 🐛🔍

---

## Quick Start

### Using the Debug Skill

**Option 1: AI-Powered Analysis**

Just ask Copilot when you're stuck:
```
"I'm getting 'TypeError: Cannot read property 'id' of null' in getNextTask. 
Where should I set breakpoints to debug this?"
```

Copilot will:
1. Analyze the error message
2. Suggest strategic breakpoint locations
3. Guide you through the debugging process
4. Identify likely root causes

**Option 2: Manual Debugging**

1. **Set breakpoint** (click line number)
2. **Press F5** to start debugging
3. **Inspect variables** in Variables panel
4. **Step through code** (F10, F11, Shift+F11)
5. **Find and fix bug**

---

## What This Skill Provides

### 1. **Error Analysis** 🔍

Examines error messages to identify root causes:

```
❌ TypeError: Cannot read property 'id' of null

🤖 AI Analysis:
- Problem: Accessing 'id' on null/undefined object
- Location: getNextTask function
- Root Cause: Queue is empty, no null check
- Fix: Add null guard before accessing properties
```

### 2. **Breakpoint Suggestions** 🎯

Recommends where to set breakpoints:

```typescript
async function getNextTask(planId: string) {
  // 🔴 BREAKPOINT 1: Verify planId is correct
  const tasks = await taskQueue.getAllTasks(planId);
  
  // 🔴 BREAKPOINT 2: Check if tasks loaded
  const sorted = tasks.sort(...);
  
  // 🔴 BREAKPOINT 3: Verify sorting
  return sorted[0];
  // 🔴 BREAKPOINT 4: Inspect result
}
```

### 3. **Debugging Workflow** 📋

Provides step-by-step guidance:

```
Step 1: Reproduce the bug
Step 2: Set strategic breakpoints
Step 3: Run debugger (F5)
Step 4: Inspect variables
Step 5: Step through code
Step 6: Find the bug
Step 7: Fix and verify
```

### 4. **Common Bug Patterns** 🎓

Recognizes typical coding mistakes:
- Null/undefined references
- Type mismatches
- Async timing issues
- Off-by-one errors
- Infinite loops

---

## Debug Configurations

All configurations are in `.vscode/launch.json`:

### 🚀 Run Extension (Debug Mode)
**For**: Extension code (src/extension.ts, MCP server, commands)
```
F5 → Opens Extension Development Host window
Pauses at breakpoints in extension code
```

### 🧪 Debug Jest Tests (All)
**For**: Unit tests in tests/ or src/__tests__/
```
Runs all Jest tests with debugging
Pauses at breakpoints in test code
```

### 🎯 Debug Current Test File
**For**: Single failing test (faster)
```
Open test file → F5
Runs only that test file
```

### 🧩 Extension Tests (Mocha)
**For**: E2E tests in src/test/
```
Runs Mocha tests in VS Code window
Tests extension activation, UI, commands
```

### 🔗 Attach to Node Process
**For**: Running Node.js processes
```
Start: node --inspect src/file.js
Then: Select this config → F5
```

---

## Common Scenarios

### "Test is Failing"

```typescript
it('should return P1 task', () => {
  // 🔴 Set breakpoint here
  const result = getNextTask('plan-1');
  expect(result.priority).toBe('P1');  // ❌ Fails
});

Debug Steps:
1. Set breakpoint before expect()
2. F5 to start debugging
3. Inspect 'result' variable
4. See actual priority value
5. Find why it's not P1
```

### "Extension Won't Activate"

```typescript
export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 COE Activated');  // 🔴 Does this run?
  // If breakpoint not hit → check package.json activationEvents
}

Debug Steps:
1. Set breakpoint at first line
2. F5 → "🚀 Run Extension"
3. If not hit → activation issue
4. Check Output > Log (Extension Host)
```

### "Function Returns Wrong Value"

```typescript
function calculatePriority(task: Task): number {
  let priority = 0;  // 🔴 Start here
  
  if (task.priority === 'P1') {
    priority = 1;
  }
  
  return priority;  // 🔴 End here - check value
}

Debug Steps:
1. Breakpoints at entry and return
2. F10 to step through
3. Watch 'priority' variable
4. See which branch executes
```

---

## Debug Toolbar

```
▶️ Continue (F5)        - Run until next breakpoint
⤵️ Step Over (F10)      - Run current line
⬇️ Step Into (F11)      - Go inside function
⬆️ Step Out (Shift+F11) - Exit function  
🔄 Restart              - Start over
⏹️ Stop (Shift+F5)      - End debugging
```

---

## Advanced Techniques

### Conditional Breakpoints

Only pause when condition is true:
```
Right-click breakpoint → Edit Breakpoint → Expression
Condition: task.priority === 'P1'
Now pauses only for P1 tasks!
```

### Logpoints

Log without pausing:
```
Right-click line → Add Logpoint
Message: Task {task.id} priority {task.priority}
Logs to console, doesn't stop execution
```

### Watch Expressions

Monitor values continuously:
```
Debug panel → WATCH → + icon
Add: task.priority
Updates automatically as you step!
```

### Debug Console

Interactive console while paused:
```
> task
{ id: '123', priority: 'P1' }

> task.priority
'P1'

> calculatePriority(task)
1
```

---

## MCP Integration

Use MCP tools for debugging assistance:

```typescript
// Ask for help when stuck
await mcpServer.callTool('askQuestion', {
  question: 'getNextTask returns undefined, queue seems empty. Why?',
  context: {
    fileContext: 'src/mcpServer/tools.ts:67',
    debugInfo: {
      variables: { task: undefined, queue: { tasks: [] } }
    }
  }
});

// Report debugging insights
await mcpServer.callTool('reportObservation', {
  taskId: 'debug-session',
  observation: 'Found null reference bug in getNextTask. Added null check. Test now passes.',
  severity: 'info'
});
```

---

## Resources

### Documentation
- **Full Skill Guide**: `.github/skills/debug-skill/SKILL.md` (1000+ lines)
- **Debug Tutorial**: `docs/debug-guide.md` (beginner-friendly)
- **Launch Configs**: `.vscode/launch.json` (all configurations)

### External Links
- **VS Code Debugging**: https://code.visualstudio.com/docs/editor/debugging
- **Node.js Debugging**: https://nodejs.org/en/docs/guides/debugging-getting-started
- **Jest Debugging**: https://jestjs.io/docs/troubleshooting

---

## Troubleshooting

**Breakpoint won't hit?**
```bash
# 1. Compile TypeScript
npm run compile

# 2. Select correct config
# Extension: "🚀 Run Extension"
# Tests: "🧪 Debug Jest Tests"
```

**Variables show <unavailable>?**
```typescript
// Declare explicitly
const myValue = expression();
console.log('myValue:', myValue);
```

**Extension won't activate?**
```bash
# Check Output > Log (Extension Host)
# Verify activationEvents in package.json
```

---

**Happy Debugging! 🐛→🎉**

Remember: Every bug you fix makes you a better developer!

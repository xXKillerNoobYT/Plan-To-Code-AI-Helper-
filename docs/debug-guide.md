# Debugging Guide for COE Project

**🐛 Learn to Debug Like a Pro!** (Beginner-Friendly Tutorial)

> **What is debugging?** Debugging is like being a detective for your code! When something goes wrong (a "bug"), debugging helps you pause your program, inspect what's happening, and find the problem.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Understanding Debugging](#understanding-debugging)
3. [Setting Up Your First Debug Session](#setting-up-your-first-debug-session)
4. [Debug Toolbar & Controls](#debug-toolbar--controls)
5. [Common Debugging Scenarios](#common-debugging-scenarios)
6. [Advanced Techniques](#advanced-techniques)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Set a Breakpoint

**What's a breakpoint?** A spot where your code will pause so you can inspect it.

1. Open a file (e.g., `src/extension.ts`)
2. **Click in the gutter** (space left of line numbers)
3. A **red dot** appears ← That's your breakpoint!

```typescript
export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 COE Activated');  ← Click here to set breakpoint
    
    vscode.window.showInformationMessage('Extension is active!');
}
```

### 2. Start Debugging

**Method 1: Press F5**
- Opens Run & Debug panel
- Starts debugging automatically

**Method 2: Click the Debug Icon**
1. Click bug icon in sidebar (🐛)
2. Select a configuration from dropdown
3. Click green play button ▶️

### 3. Watch It Pause

When code hits your breakpoint:
- ⏸️ **Execution pauses**
- Yellow line highlights where you are
- Debug toolbar appears at top
- You can now inspect everything!

---

## Understanding Debugging

### What Happens When You Debug?

```
Normal Code Execution:
Line 1 → Line 2 → Line 3 → Line 4 → Done
(Runs fast, you can't see what's happening)

With Debugger:
Line 1 → 🔴 PAUSE (set breakpoint here)
         ↓
         You can now:
         - See variable values
         - Step to next line
         - Check if code is working correctly
         ↓
Line 2 → Line 3 → Line 4 → Done
```

### Why Debug Instead of console.log?

| Method | Good For | Bad For |
|--------|----------|---------|
| **console.log** | Quick checks, simple bugs | Complex issues, lots of variables |
| **Debugger** | Stepping through code, inspecting state | Quick fixes (slightly slower to set up) |

**Best Practice**: Start with `console.log`, switch to debugger if problem persists! 🎯

---

## Setting Up Your First Debug Session

### Scenario: Test is Failing

```typescript
// tests/example.test.ts

it('should return highest priority task', async () => {
    const queue = new TaskQueue();
    queue.addTask({ id: '1', priority: 'P2' });
    queue.addTask({ id: '2', priority: 'P1' });
    
    const result = await getNextTask('plan-1');
    
    expect(result.id).toBe('2');  // ❌ Test fails here!
});
```

**Step-by-Step Debugging**:

#### Step 1: Set Breakpoints

Click next to these lines to add breakpoints:
```typescript
it('should return highest priority task', async () => {
    const queue = new TaskQueue();
    queue.addTask({ id: '1', priority: 'P2' });  🔴 Breakpoint 1
    queue.addTask({ id: '2', priority: 'P1' });  🔴 Breakpoint 2
    
    const result = await getNextTask('plan-1');  🔴 Breakpoint 3
    
    expect(result.id).toBe('2');  🔴 Breakpoint 4
});
```

#### Step 2: Select Debug Configuration

1. Click Debug icon (🐛) in sidebar
2. From dropdown, select: **"🎯 Debug Current Test File"**
3. Make sure `example.test.ts` is open in editor

#### Step 3: Start Debugging

Press **F5** (or click green play button)

#### Step 4: Execution Pauses at First Breakpoint

```
⏸️ PAUSED at Breakpoint 1:
queue.addTask({ id: '1', priority: 'P2' });  ← Yellow highlight

Variables Panel shows:
▼ Local
  queue: TaskQueue {tasks: Array(0)}  ← Empty array
```

#### Step 5: Step to Next Line

Press **F10** (Step Over) to execute current line and move to next

```
⏸️ NOW at Breakpoint 2:
queue.addTask({ id: '2', priority: 'P1' });

Variables Panel shows:
▼ Local  
  queue: TaskQueue {tasks: Array(1)}  ← Now has 1 task!
    ▼ tasks: Array(1)
      ► 0: {id: '1', priority: 'P2'}  ← First task added
```

#### Step 6: Continue Stepping

Press **F10** again to add second task

```
Variables Panel shows:
▼ Local
  queue: TaskQueue {tasks: Array(2)}  ← Now has 2 tasks!
    ▼ tasks: Array(2)
      ► 0: {id: '1', priority: 'P2'}
      ► 1: {id: '2', priority: 'P1'}  ← Second task added
```

#### Step 7: Step Into Function

Now at: `const result = await getNextTask('plan-1');`

Press **F11** (Step Into) to go inside `getNextTask` function

```
⏸️ NOW INSIDE getNextTask function:
export async function getNextTask(planId: string) {
    const tasks = await taskQueue.getAllTasks(planId);  ← You're here
    // ...
}

Variables Panel shows:
▼ Local
  planId: "plan-1"  ← Parameter value
```

#### Step 8: Inspect the Bug

Continue stepping (F10) until you reach the sorting code:

```typescript
const sortedTasks = tasks.sort((a, b) => 
    priorityValue(a.priority) - priorityValue(b.priority)
);

// Hover over sortedTasks after this line executes
// You'll see if sorting is correct!
```

**What you might find**: P1 should come before P2, but doesn't!

**Root cause**: `priorityValue` function returns wrong values

**Fix**: Correct the `priorityValue` function to return lower numbers for higher priorities

#### Step 9: Stop Debugging

Press **Shift+F5** or click Stop button ⏹️

---

## Debug Toolbar & Controls

When debugging, a toolbar appears at the top:

```
┌──────────────────────────────────────────────────┐
│ ▶️  ⤵️  ⬇️  ⬆️  🔄  ⏹️                           │
└──────────────────────────────────────────────────┘
```

### Button Guide

| Button | Name | Shortcut | What It Does |
|--------|------|----------|--------------|
| ▶️ | **Continue** | F5 | Run until next breakpoint (or end) |
| ⤵️ | **Step Over** | F10 | Run current line, **don't** go into functions |
| ⬇️ | **Step Into** | F11 | Go **inside** function calls |
| ⬆️ | **Step Out** | Shift+F11 | Exit current function, return to caller |
| 🔄 | **Restart** | Ctrl+Shift+F5 | Start debugging from beginning |
| ⏹️ | **Stop** | Shift+F5 | End debugging session |

### When to Use Each

**Step Over (F10)** - Most common!
```typescript
const result = myFunction();  // Press F10 → Runs line, stays here
console.log(result);          // Next, you're here
```

**Step Into (F11)** - When you need to debug inside a function
```typescript
const result = myFunction();  // Press F11 → Jumps INSIDE myFunction
// Now you're at the first line of myFunction()
```

**Step Out (Shift+F11)** - When you're done debugging a function
```typescript
function myFunction() {
    const x = 5;        // You're here, but done debugging
    return x * 2;       // Press Shift+F11 → Exits function
}
// Now you're back at the calling code
```

---

## Common Debugging Scenarios

### Scenario 1: "Why is my variable undefined?"

**Problem**: Variable should have a value but doesn't

**Solution**:
1. Set breakpoint where variable is created
2. Step through code (F10)
3. Watch variable in Variables panel
4. See where it becomes undefined

**Example**:
```typescript
async function getNextTask(planId: string) {
    const tasks = await getTasks(planId);  🔴 Set breakpoint here
    console.log('tasks:', tasks);  // Check what tasks actually is
    
    const nextTask = tasks[0];  🔴 If tasks is empty, nextTask = undefined!
}
```

**Fix**: Check if array is empty before accessing
```typescript
if (tasks.length === 0) {
    return null;  // Handle empty case
}
const nextTask = tasks[0];  // Now safe!
```

### Scenario 2: "Test says 'Expected X, got Y'"

**Problem**: Test assertion fails

**Solution**:
1. Set breakpoint at `expect()` line
2. Inspect actual vs. expected values
3. Step backwards to see where they diverged

**Example**:
```typescript
expect(result.priority).toBe('P1');  // ❌ Expected P1, got P2

// Set breakpoint here ↑
// Variables panel shows:
// result: { id: '2', priority: 'P2' }  ← Wrong priority!

// Now check where result came from
// Step backwards or set earlier breakpoints
```

### Scenario 3: "Extension won't activate"

**Problem**: Extension doesn't load in Extension Development Host

**Solution**:
1. Open `src/extension.ts`
2. Set breakpoint at first line of `activate()`
3. Run: "🚀 Run Extension (Debug Mode)"
4. Check if breakpoint is hit
   - **If YES**: Step through to find error
   - **If NO**: Check `activationEvents` in package.json

**Example**:
```typescript
export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 COE Activated');  🔴 Does this run?
    
    // If breakpoint is hit, step through (F10)
    // If not hit, extension isn't activating → check package.json
}
```

### Scenario 4: "Function returns wrong value"

**Problem**: Function should return X but returns Y

**Solution**:
1. Set breakpoint at function entry
2. Set breakpoint at `return` statement
3. Step through function line-by-line
4. Watch variable transformations

**Example**:
```typescript
function calculatePriority(task: Task): number {
    let priority = 0;  🔴 Breakpoint 1
    
    if (task.priority === 'P1') {
        priority = 1;
    } else if (task.priority === 'P2') {
        priority = 2;  🔴 Check: Is this line executing?
    }
    
    return priority;  🔴 Breakpoint 2 - What's the value?
}

// Step through (F10) and watch 'priority' variable
// See which if/else branch executes
```

### Scenario 5: "Code runs but nothing happens"

**Problem**: No errors, but expected behavior doesn't occur

**Solution**:
1. Add breakpoints at key checkpoints
2. Verify code path is executed
3. Check if event handlers are registered

**Example**:
```typescript
// Is this button handler even registered?
const button = document.getElementById('approve-btn');
button?.addEventListener('click', handleApprove);  🔴 Set breakpoint
// Check if button exists and handler is attached

function handleApprove() {
    console.log('Approve clicked');  🔴 Set breakpoint
    // Does this run when you click the button?
}
```

---

## Advanced Techniques

### 1. Conditional Breakpoints

**What**: Breakpoint that only pauses when condition is true

**How**:
1. Right-click breakpoint (red dot)
2. Select "Edit Breakpoint"
3. Choose "Expression"
4. Enter condition: e.g., `task.priority === 'P1'`

**Use case**: Loop processing 100 items, only want to pause on specific item

```typescript
for (const task of tasks) {
    // 🟡 Conditional breakpoint: task.id === 'TASK-123'
    processTask(task);
    // Pauses only when task.id is TASK-123!
}
```

### 2. Logpoints

**What**: Logs message without pausing execution

**How**:
1. Right-click line number
2. Select "Add Logpoint"
3. Enter message: `Task {task.id} has priority {task.priority}`

**Use case**: Tracing execution flow without stopping

```typescript
function processTask(task: Task) {
    // 🟠 Logpoint: Processing task {task.id}
    // Logs to console but doesn't pause
    doWork(task);
}
```

### 3. Watch Expressions

**What**: Monitor specific values as you debug

**How**:
1. Debug panel → WATCH section
2. Click + icon
3. Enter expression: `task.priority`

**Use case**: Track how a value changes

```
WATCH panel:
task.priority     → 'P2'
tasks.length      → 5
result?.id        → '123'

(Updates automatically as you step through code!)
```

### 4. Debug Console

**What**: Interactive JavaScript console while paused

**How**: Debug Console panel appears when debugging

**Use**:
```javascript
// Type expressions while paused:
> task
{ id: '123', priority: 'P1', status: 'ready' }

> task.priority
'P1'

> tasks.filter(t => t.status === 'ready')
[{ id: '1', ... }, { id: '2', ... }]

// Call functions:
> calculatePriority(task)
1

// Modify variables (careful!):
> task.priority = 'P2'
```

---

## Debug Configurations Explained

Open `.vscode/launch.json` to see all configurations:

### 🚀 Run Extension (Debug Mode)
**When to use**: Debugging extension code (src/extension.ts, MCP server, commands)

**What it does**:
1. Compiles TypeScript
2. Opens new "[Extension Development Host]" window
3. Loads your extension with debugging enabled

**Start**: Open any file in `src/`, set breakpoint, press F5

### 🧪 Debug Jest Tests (All)
**When to use**: Debugging unit tests in `tests/` or `src/**/__tests__/`

**What it does**:
1. Runs all Jest tests
2. Pauses at breakpoints in test code or source code

**Start**: Set breakpoint in test file, press F5

### 🎯 Debug Current Test File
**When to use**: Debugging a specific failing test (faster than running all tests)

**What it does**:
1. Detects currently open test file
2. Runs only that file with debugging

**Start**: Open test file, set breakpoint, press F5

### 🧩 Extension Tests (Mocha)
**When to use**: Debugging E2E tests in `src/test/`

**What it does**:
1. Runs Mocha tests in real VS Code window
2. Use for testing extension activation, commands, UI

**Start**: Set breakpoint in `src/test/` file, press F5

### 🔗 Attach to Node Process
**When to use**: Debugging already-running Node.js process

**What it does**:
1. Connects to process started with `--inspect` flag
2. Useful for debugging servers, background workers

**Start**:
```bash
# Terminal 1: Start process with debugging
node --inspect src/mcpServer/server.js

# Terminal 2: In VS Code, select this config and press F5
```

---

## Troubleshooting

### Issue: Breakpoint has Gray Dot (Not Red)

**Meaning**: Breakpoint won't be hit

**Causes**:
1. TypeScript not compiled
2. Line is not executable (comment, blank line)
3. Wrong debug configuration selected

**Fixes**:
```bash
# 1. Compile TypeScript
npm run compile

# 2. Move breakpoint to executable line (with code)

# 3. Select correct config:
# - For src/ files: "🚀 Run Extension"
# - For test files: "🧪 Debug Jest Tests"
```

### Issue: Breakpoint Never Hits

**Causes**:
1. Code path not executed (if/else branch not taken)
2. Function not called
3. Async code not awaited

**Fixes**:
```typescript
// 1. Add console.log to verify code runs
console.log('🔍 This line executed');

// 2. Check if function is called
// Set breakpoint at function entry

// 3. Ensure async is awaited
await myFunction();  // ✅ Use await
myFunction();        // ❌ Might not wait
```

### Issue: Variables Show "<unavailable>"

**Cause**: Optimized code or wrong scope

**Fix**:
```typescript
// Declare variables explicitly
const myValue = someExpression();  // Now visible in debugger
console.log('myValue:', myValue);  // Also logs it
```

### Issue: Debug Console Shows Errors

**Example**: `ReferenceError: task is not defined`

**Fix**: Variable not in current scope
```typescript
// Check Call Stack panel to see where you are
// Variables panel shows only variables in current scope
```

---

## Keyboard Shortcuts Cheat Sheet

```
┌──────────────────────────────────────────────────┐
│ DEBUGGING SHORTCUTS                              │
├──────────────────────────────────────────────────┤
│ F5             Start/Continue debugging          │
│ F9             Toggle breakpoint                 │
│ F10            Step Over (run current line)      │
│ F11            Step Into (enter function)        │
│ Shift+F11      Step Out (exit function)          │
│ Ctrl+Shift+F5  Restart debugging                 │
│ Shift+F5       Stop debugging                    │
├──────────────────────────────────────────────────┤
│ PANELS                                           │
├──────────────────────────────────────────────────┤
│ Ctrl+Shift+D   Open Debug panel                  │
│ Ctrl+Shift+Y   Open Debug Console                │
│ Ctrl+`         Open Terminal                     │
└──────────────────────────────────────────────────┘
```

---

## Resources

### Documentation
- **VS Code Debugging**: https://code.visualstudio.com/docs/editor/debugging
- **Node.js Debugging**: https://nodejs.org/en/docs/guides/debugging-getting-started
- **Jest Debugging**: https://jestjs.io/docs/troubleshooting

### COE-Specific
- **Debug Skill**: `.github/skills/debug-skill/SKILL.md` - AI debugging assistance
- **Launch Configs**: `.vscode/launch.json` - All debug configurations explained
- **Testing Guide**: `docs/testing-guide.md` - Debugging tests

### Quick Links
- **Set Breakpoints**: Click line number gutter
- **Start Debugging**: Press F5
- **Debug Console**: Type expressions, call functions
- **Variables Panel**: See all variable values

---

## Practice Exercise

**Try this to learn debugging**:

1. **Create a buggy function**:
```typescript
function addNumbers(a: number, b: number): number {
    return a + b + 1;  // Bug: adds extra 1!
}
```

2. **Write a failing test**:
```typescript
it('should add numbers correctly', () => {
    expect(addNumbers(2, 3)).toBe(5);  // ❌ Fails (returns 6)
});
```

3. **Debug it**:
   - Set breakpoint in `addNumbers`
   - Run "🧪 Debug Jest Tests"
   - Step through, watch variables
   - Find the bug (extra `+ 1`)

4. **Fix it**:
```typescript
function addNumbers(a: number, b: number): number {
    return a + b;  // ✅ Fixed!
}
```

5. **Verify**:
   - Run test again
   - ✅ Test passes!

---

**🎓 You're Now a Debugger!**

Remember: Debugging is a superpower. Every bug you fix makes you better! 🐛→💪

**Pro Tip**: When stuck, use the Debug Skill (`.github/skills/debug-skill/`) for AI-powered debugging assistance! 🤖

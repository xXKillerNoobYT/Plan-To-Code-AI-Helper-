---
name: Debug Skill
description: AI-powered debugging assistance - analyzes errors, suggests breakpoints, and guides you through fixing bugs step-by-step
tags: [debugging, troubleshooting, error-analysis, p1, beginner-friendly]
---

# Debug Skill

**🐛 What is Debugging? (For Noobs!)**

Debugging is like being a detective for your code! When your program doesn't work correctly (has a "bug"), debugging helps you:
- **Pause execution** (freeze the code while it's running)
- **Inspect variables** (see what values your data has at that moment)
- **Step through line-by-line** (run one line at a time to see exactly what happens)
- **Find the problem** (discover where the bug is hiding!)

**Think of it like this**: Your code is a mystery story, and you're Sherlock Holmes using clues (variables, logs, breakpoints) to solve the case! 🔍

---

## When to Use This Skill

**Use this skill when**:
- ✅ Tests are failing and you don't know why
- ✅ Code throws errors or exceptions
- ✅ Results are incorrect but no error message appears
- ✅ Extension doesn't load or crashes
- ✅ MCP server isn't responding correctly
- ✅ UI components render incorrectly
- ✅ Performance is slow and you need to find bottlenecks

**Don't use when**:
- ❌ Code is working perfectly (no need to debug!)
- ❌ Just learning syntax (read docs first)
- ❌ Problem is obvious from error message (fix directly)

---

## What This Skill Does

### 1. **Error Analysis** 🔍
Examines error messages and stack traces to identify root causes:

```
❌ Error Message:
TypeError: Cannot read property 'id' of null
  at getNextTask (src/mcpServer/tools.ts:45)
  at MCPServer.handleRequest (src/mcpServer/server.ts:120)

🤖 AI Analysis:
Problem: Trying to access 'id' property on a null/undefined object
Location: Line 45 in getNextTask function
Root Cause: Task queue is empty, but code doesn't check for null
Fix: Add null check before accessing task.id

Suggested Fix:
const task = await taskQueue.getNext();
if (!task) {
  return null;  // ✅ Safe handling
}
return task.id;  // ✅ Now safe to access
```

### 2. **Breakpoint Suggestions** 🎯
Recommends strategic locations to set breakpoints for maximum debugging efficiency:

```typescript
// Problem: getNextTask returns wrong priority task

async function getNextTask(planId: string) {
  // 🔴 BREAKPOINT 1: Set here to verify planId is correct
  console.log('planId:', planId);
  
  const tasks = await taskQueue.getAllTasks(planId);
  // 🔴 BREAKPOINT 2: Set here to check if tasks were loaded
  console.log('tasks:', tasks);
  
  const sortedTasks = tasks.sort((a, b) => 
    priorityValue(a.priority) - priorityValue(b.priority)
  );
  // 🔴 BREAKPOINT 3: Set here to verify sorting is correct
  console.log('sortedTasks:', sortedTasks);
  
  return sortedTasks[0];
  // 🔴 BREAKPOINT 4: Set here to inspect final result
}
```

### 3. **Step-by-Step Debugging Guidance** 📋
Provides a structured debugging workflow:

```
🐛 Debugging Workflow:

Step 1: Reproduce the bug
  - Run the failing test or trigger the error
  - Note exactly what happens

Step 2: Identify the error location
  - Check the error stack trace
  - Find the file and line number

Step 3: Set breakpoints
  - Click line number to add red dot
  - Start at the error location
  - Add breakpoints before the error too

Step 4: Run in debug mode
  - Press F5 (or click Debug > Start Debugging)
  - Code runs and pauses at first breakpoint

Step 5: Inspect variables
  - Hover over variables to see values
  - Check "Variables" panel on left
  - Look for null, undefined, wrong values

Step 6: Step through code
  - Use Step Over (F10) to run line-by-line
  - Use Step Into (F11) to go inside functions
  - Watch how values change

Step 7: Find the bug
  - Look for where expected ≠ actual
  - Check if/else branches taking wrong path
  - Verify function calls return expected values

Step 8: Fix and verify
  - Make the fix
  - Run again (F5)
  - Verify bug is gone ✅
```

### 4. **Common Bug Patterns** 🎓
Recognizes and explains common coding mistakes:

| Bug Type | Example | How to Debug |
|----------|---------|--------------|
| **Null Reference** | `task.id` when task is null | Set breakpoint before access, check if null |
| **Type Mismatch** | Passing string when number expected | Inspect variable type in debugger |
| **Async Timing** | Using result before `await` completes | Add breakpoint after await, verify it resolves |
| **Off-by-One** | `array[array.length]` (out of bounds) | Inspect array length and index values |
| **Infinite Loop** | Loop never exits | Set breakpoint in loop, check condition |

---

## Step-by-Step Procedure

### Phase 1: Analyze the Error

```
1. Read the error message carefully:
   ❌ "TypeError: Cannot read property 'priority' of undefined"
   
   Key info extracted:
   - Error type: TypeError (type-related problem)
   - Action: Reading property 'priority'
   - Object: undefined (missing object!)

2. Find the stack trace (where error occurred):
   at getNextTask (src/mcpServer/tools.ts:67)
   at MCPServer.handleRequest (src/mcpServer/server.ts:150)
   
   Starting point: Line 67 in tools.ts

3. Ask key questions:
   - What was supposed to be there? (A task object)
   - Why is it undefined? (Queue might be empty)
   - What should happen? (Check for undefined first)
```

### Phase 2: Set Strategic Breakpoints

```
4. Open the file with the error (tools.ts line 67)

5. Identify the "suspect area" (code around the error):
   const task = await taskQueue.getNext();      // Line 65
   const priority = task.priority;               // Line 67 ❌ ERROR HERE
   
6. Set breakpoints at key checkpoints:
   
   🔴 Breakpoint #1: Line 65 (before getNext)
   Why: Verify taskQueue exists and is correct
   
   🔴 Breakpoint #2: Line 66 (after await, before using task)
   Why: Check if task is undefined (the problem!)
   
   🔴 Breakpoint #3: Line 67 (where error occurs)
   Why: Final check before crash

7. Add diagnostic logging (extra clues):
   console.log('task:', task);  // See what task actually is
   console.log('typeof task:', typeof task);  // Verify type
```

### Phase 3: Run Debugger

```
8. Select debug configuration:
   - For extension code: "🚀 Run Extension (Debug Mode)"
   - For Jest tests: "🧪 Debug Jest Tests"
   - For single test: "🎯 Debug Current Jest Test File"

9. Press F5 (or click green play button in Debug panel)

10. Wait for code to pause at first breakpoint
    - Yellow line highlights where execution is paused
    - Debug toolbar appears at top
```

### Phase 4: Inspect Variables

```
11. Check the "Variables" panel (left sidebar):
    - Local variables (function scope)
    - Closure variables (outer scope)
    - Global variables
    
    Example:
    ▼ Local
      planId: "plan-123"
      taskQueue: TaskQueue {tasks: Array(0)}  ⚠️ Empty!
      task: undefined  ❌ This is the problem!

12. Hover over variables in code:
    Hover over "taskQueue" → See it's empty
    Hover over "task" → undefined (explains the error!)

13. Use the Debug Console:
    Type: task
    Output: undefined
    
    Type: taskQueue.tasks
    Output: []  (empty array - no tasks!)
```

### Phase 5: Step Through Code

```
14. Use debug toolbar buttons:
    
    ▶️ Continue (F5): Run until next breakpoint
    ⤵️ Step Over (F10): Run current line, stay at same level
    ⬇️ Step Into (F11): Go inside function calls
    ⬆️ Step Out (Shift+F11): Exit current function
    🔄 Restart: Start debugging from beginning
    ⏹️ Stop: End debugging session

15. Step through suspicious code:
    Click Step Over (F10) after each breakpoint
    Watch how variables change
    Notice when things go wrong

16. Follow the data flow:
    Input → Processing → Output
    Where does the data become unexpected?
```

### Phase 6: Identify Root Cause

```
17. Compare expected vs. actual:
    Expected: task = { id: '123', priority: 'P1', ... }
    Actual: task = undefined
    
    Root cause: taskQueue.getNext() returned undefined
    Why: Queue is empty (no tasks added yet)

18. Trace back to source:
    Why is queue empty?
    - Was it populated correctly?
    - Is the test setup missing addTask()?
    - Is planId wrong, filtering out all tasks?

19. Find the fix:
    Option 1: Add null check
    if (!task) return null;
    
    Option 2: Fix test setup
    taskQueue.addTask({ id: '1', priority: 'P1' });
```

### Phase 7: Fix and Verify

```
20. Make the fix:
    // Before (crashes):
    const task = await taskQueue.getNext();
    const priority = task.priority;  // ❌ Crashes if task is undefined
    
    // After (safe):
    const task = await taskQueue.getNext();
    if (!task) {
      return null;  // ✅ Handle empty queue gracefully
    }
    const priority = task.priority;  // ✅ Safe now

21. Remove breakpoints (or leave for future debugging)

22. Run again (F5):
    - Should no longer hit error
    - Watch execution flow smoothly

23. Run tests to confirm:
    npm run test:unit
    ✅ All tests pass!
```

---

## Integration with COE Workflow

### Using MCP Tools During Debugging

When debugging, you can use MCP tools for assistance:

```typescript
// Example: Ask for help when stuck
await mcpServer.callTool('askQuestion', {
  question: `
    I'm debugging getNextTask and it returns undefined.
    The queue seems empty but I added tasks in the test.
    What could be wrong?
  `,
  context: {
    taskId: 'debug-session',
    fileContext: 'src/mcpServer/tools.ts:67',
    codeSnippet: `
      const task = await taskQueue.getNext();
      console.log('task:', task);  // undefined
    `,
    debugInfo: {
      variables: {
        planId: 'test-plan',
        taskQueue: { tasks: [] },  // Empty!
        task: undefined
      }
    }
  }
});

// AI Answer might say:
// "The queue is empty because you're using a different
//  TaskQueue instance in the test than in the code.
//  Ensure you're testing with the same queue instance."
```

### Reporting Debug Observations

```typescript
// Log debugging insights
await mcpServer.callTool('reportObservation', {
  taskId: 'current-task-id',
  observation: `
    Debug Session: getNextTask returning undefined
    
    Findings:
    - taskQueue.tasks.length = 0 (empty)
    - planId = 'test-plan' (correct)
    - No tasks added in test setup
    
    Root Cause: Test missing taskQueue.addTask() call
    
    Fix Applied: Added taskQueue.addTask() in beforeEach
    Result: ✅ Test now passes
  `,
  severity: 'info'
});
```

---

## Debugging Different Components

### Backend Debugging (MCP Server, Agents, Task Queue)

**Example: Debugging `getNextTask` MCP Tool**

```typescript
// File: src/mcpServer/tools.ts

export async function getNextTask(planId: string) {
  // 🔴 BREAKPOINT 1: Verify planId
  console.log('🔍 Debug - planId:', planId);
  
  const tasks = await taskQueue.getAllTasks(planId);
  // 🔴 BREAKPOINT 2: Check if tasks loaded
  console.log('🔍 Debug - tasks count:', tasks.length);
  console.log('🔍 Debug - tasks:', tasks);
  
  if (tasks.length === 0) {
    // 🔴 BREAKPOINT 3: Catch empty queue case
    console.log('⚠️ Debug - Queue is empty!');
    return null;
  }
  
  const sortedTasks = tasks.sort((a, b) => 
    priorityValue(a.priority) - priorityValue(b.priority)
  );
  // 🔴 BREAKPOINT 4: Verify sorting
  console.log('🔍 Debug - sorted tasks:', sortedTasks);
  
  const nextTask = sortedTasks[0];
  // 🔴 BREAKPOINT 5: Inspect final result
  console.log('✅ Debug - returning:', nextTask);
  
  return nextTask;
}
```

**Debug Configuration**: Use "🚀 Run Extension (Debug Mode)" or "🧪 Debug Jest Tests"

### Frontend Debugging (React Components, UI Panels)

**Example: Debugging React Component Rendering**

```typescript
// File: src/ui/VerificationPanel.tsx

export function VerificationPanel({ task, onApprove }: Props) {
  // 🔴 BREAKPOINT 1: Verify props received
  console.log('🔍 Debug - task:', task);
  console.log('🔍 Debug - onApprove:', onApprove);
  
  const [isLoading, setIsLoading] = React.useState(false);
  
  const handleApprove = async () => {
    // 🔴 BREAKPOINT 2: Check function called
    console.log('🔍 Debug - handleApprove called');
    setIsLoading(true);
    
    try {
      await onApprove(task.id);
      // 🔴 BREAKPOINT 3: Verify success
      console.log('✅ Debug - Approve successful');
    } catch (error) {
      // 🔴 BREAKPOINT 4: Catch errors
      console.error('❌ Debug - Approve failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 🔴 BREAKPOINT 5: Check render output
  console.log('🔍 Debug - Rendering with isLoading:', isLoading);
  
  return (
    <div className="verification-panel">
      {/* UI code */}
    </div>
  );
}
```

**Debug Configuration**: Use "🚀 Run Extension (Debug Mode)"

**Browser DevTools**: For UI issues, also use Chrome DevTools (Ctrl+Shift+I in Extension Host window)

### Test Debugging (Jest Unit Tests)

**Example: Debugging Failing Test**

```typescript
// File: tests/mcpServer/tools.test.ts

describe('getNextTask', () => {
  it('should return P1 task over P2 task', async () => {
    // 🔴 BREAKPOINT 1: Start of test
    console.log('🧪 Test starting...');
    
    const taskQueue = new TaskQueue();
    
    // 🔴 BREAKPOINT 2: After adding tasks
    taskQueue.addTask({ id: 'low', priority: 'P2', status: 'ready' });
    taskQueue.addTask({ id: 'high', priority: 'P1', status: 'ready' });
    console.log('🔍 Tasks added:', taskQueue.getAllTasks());
    
    // 🔴 BREAKPOINT 3: Before calling function
    const result = await getNextTask('plan-1');
    
    // 🔴 BREAKPOINT 4: Check result
    console.log('🔍 Result:', result);
    console.log('🔍 Expected id: high, Actual id:', result?.id);
    
    expect(result.id).toBe('high');  // ❌ Fails if result.id !== 'high'
  });
});
```

**Debug Configuration**: Use "🎯 Debug Current Jest Test File"

---

## Common Debugging Scenarios

### Scenario 1: "Test Fails But No Error Message"

```
Problem: Test fails with no helpful error

Steps:
1. Add console.log statements throughout test
2. Set breakpoint at expect() line
3. Run debug config: "🎯 Debug Current Jest Test File"
4. Inspect actual vs. expected values
5. Step backwards to see where they diverged

Example:
expect(result).toEqual({ id: '1', priority: 'P1' });
// ❌ Fails

Debug:
console.log('result:', result);
// Output: { id: '1', priority: 'P2' }  ← Wrong priority!
// Now we know to check priority logic
```

### Scenario 2: "Extension Crashes on Activation"

```
Problem: Extension doesn't load in Extension Host

Steps:
1. Open src/extension.ts
2. Set breakpoint at first line of activate()
3. Run: "🚀 Run Extension (Debug Mode)"
4. Watch Extension Host window for error messages
5. Check Output panel > "Log (Extension Host)"
6. Step through activation code

Common causes:
- Missing dependency (import fails)
- Syntax error in extension.ts
- Uncaught exception in init code
```

### Scenario 3: "MCP Server Not Responding"

```
Problem: MCP tools don't work, no response

Steps:
1. Check if MCP server is running:
   console.log('MCP Server started:', server.isRunning());
   
2. Set breakpoint in MCP tool handler:
   // In src/mcpServer/tools.ts
   export async function getNextTask(planId: string) {
     console.log('🔍 getNextTask called with:', planId);  🔴 BREAKPOINT
     // ...
   }

3. Run: "🖥️ Debug MCP Server Standalone"

4. Trigger the MCP call and watch debugger pause

5. Check:
   - Is tool registered? server.registeredTools
   - Is request format correct? Inspect params
   - Does handler throw error? Check try-catch

Common causes:
- Tool not registered with server
- Invalid JSON-RPC request format
- Handler throws uncaught exception
```

### Scenario 4: "Infinite Loop"

```
Problem: Code hangs, never finishes

Steps:
1. Pause debugger manually (click Pause button)
2. Check call stack - which function is stuck?
3. Set breakpoint in the loop
4. Restart debug session
5. Step through loop iterations
6. Check loop condition

Example:
let i = 0;
while (i < 10) {
  // 🔴 BREAKPOINT HERE
  console.log('i:', i);
  // ❌ Missing: i++  (infinite loop!)
}

Debug reveals: i never increases!
Fix: Add i++ inside loop
```

### Scenario 5: "Wrong Data Type"

```
Problem: Function receives unexpected type

Steps:
1. Set breakpoint at function entry
2. Inspect parameter type:
   console.log('typeof param:', typeof param);
   
3. Use debugger to check what called the function:
   - Check Call Stack panel
   - Step backward using "Step Out"

Example:
function calculatePriority(priority: string) {
  // 🔴 BREAKPOINT
  console.log('priority:', priority, 'type:', typeof priority);
  // Output: priority: 1 type: number  ❌ Should be string!
  
  // Call stack shows:
  // calculatePriority ← called from getNextTask
  // getNextTask passing task.priority (which is number!)
  
  // Fix: Convert number to string or update type
}
```

---

## Advanced Debugging Techniques

### 1. Conditional Breakpoints

```typescript
// Only pause when specific condition is true

for (const task of tasks) {
  // 🔴 Right-click breakpoint → "Edit Breakpoint" → "Condition"
  // Condition: task.priority === 'P1'
  console.log('Processing task:', task);
  // Now only pauses for P1 tasks!
}
```

### 2. Logpoints (Non-Breaking Logging)

```typescript
// Logs message without pausing execution

function processTask(task: Task) {
  // 🟠 Right-click line → "Add Logpoint"
  // Message: Processing {task.id} with priority {task.priority}
  
  // Logs to console but doesn't stop execution
  // Useful for tracing without interrupting flow
}
```

### 3. Watch Expressions

```
In Debug panel → WATCH section:

Add expressions to monitor:
- task.id
- taskQueue.tasks.length
- result?.priority

These update automatically as you step through code!
```

### 4. Debug Console Commands

```javascript
// Type these in Debug Console while paused:

// Evaluate expressions
> task
{ id: '123', priority: 'P1' }

> task.priority
'P1'

> taskQueue.tasks.length
5

// Call functions
> taskQueue.getAllTasks('plan-1')
[...]

// Modify variables (be careful!)
> task.priority = 'P2'
'P2'
```

---

## Troubleshooting the Debugger

### Issue: Breakpoints Don't Hit

**Causes**:
1. Code path not executed (logic skips that line)
2. TypeScript not compiled (`npm run compile`)
3. Source maps missing
4. Wrong debug configuration selected

**Fixes**:
```bash
# 1. Recompile TypeScript
npm run compile

# 2. Check outFiles in launch.json matches compiled location
"outFiles": ["${workspaceFolder}/out/**/*.js"]

# 3. Ensure breakpoint is on executable line (not blank/comment)

# 4. Use correct config:
- Extension code: "🚀 Run Extension"
- Jest tests: "🧪 Debug Jest Tests"
```

### Issue: Variables Show `<unavailable>`

**Cause**: Optimized code or wrong scope

**Fix**:
```typescript
// Add explicit variable declarations
const myValue = someFunction();  // Now visible in debugger
console.log('myValue:', myValue);  // Also logs it
```

### Issue: Extension Host Window Doesn't Open

**Cause**: Extension not compiling or activation error

**Fix**:
```bash
# 1. Check for TypeScript errors
npm run compile

# 2. Check Output > Log (Extension Host) for errors

# 3. Verify activationEvents in package.json:
"activationEvents": ["onStartupFinished"]
```

---

## Integration with Testing Workflow

```
1. Test fails
   ↓
2. Open test file
   ↓
3. Set breakpoints in test
   ↓
4. Run: "🎯 Debug Current Jest Test File" (F5)
   ↓
5. Debugger pauses at breakpoint
   ↓
6. Inspect variables, step through code
   ↓
7. Find bug location
   ↓
8. Fix code
   ↓
9. Run test again (F5)
   ↓
10. IF test passes ✅:
      → Done!
    ELSE ❌:
      → Repeat from step 5
```

---

## Best Practices

### ✅ DO

- **Start with logging** before breakpoints (faster for simple issues)
- **Set breakpoints strategically** (inputs, outputs, suspicious lines)
- **Use descriptive console.log messages**: `console.log('🔍 [getNextTask] task:', task)`
- **Remove debug code before committing** (clean up console.logs)
- **Document tricky bugs** in comments for future reference
- **Use debugger for complex issues** (saves time vs. guessing)

### ❌ DON'T

- **Don't debug without reproducing first** (must be able to trigger bug)
- **Don't set too many breakpoints** (slows debugging, confusing)
- **Don't modify values in debugger without understanding** (can hide real bug)
- **Don't forget to compile TypeScript** (`npm run compile` before debugging)
- **Don't ignore error messages** (they often tell you exactly what's wrong!)

---

## Quick Reference Card

```
🔴 BREAKPOINT SHORTCUTS
- Set/Remove: Click line number
- Disable All: Debug panel > Breakpoints > Deactivate Breakpoints
- Remove All: Debug panel > Breakpoints > Remove All Breakpoints

⌨️ DEBUG KEYBOARD SHORTCUTS
- F5: Start/Continue debugging
- F9: Toggle breakpoint
- F10: Step Over
- F11: Step Into
- Shift+F11: Step Out
- Ctrl+Shift+F5: Restart
- Shift+F5: Stop

🔧 DEBUG TOOLBAR
▶️ Continue (F5)
⤵️ Step Over (F10)
⬇️ Step Into (F11)
⬆️ Step Out (Shift+F11)
🔄 Restart (Ctrl+Shift+F5)
⏹️ Stop (Shift+F5)

📊 DEBUG PANELS
- Variables: See all variable values
- Watch: Monitor specific expressions
- Call Stack: See function call chain
- Breakpoints: Manage all breakpoints
- Debug Console: Type commands, evaluate expressions
```

---

## Resources

- **VS Code Debugging Docs**: https://code.visualstudio.com/docs/editor/debugging
- **Node.js Debugging**: https://nodejs.org/en/docs/guides/debugging-getting-started
- **Jest Debugging**: https://jestjs.io/docs/troubleshooting
- **COE Debug Guide**: `docs/debug-guide.md` (beginner-friendly tutorial)
- **Launch Configurations**: `.vscode/launch.json` (all debug configs explained)

---

**Happy Debugging! 🐛🔍**

Remember: Every bug you fix makes you a better developer! Debugging is a superpower—embrace it! 💪✨

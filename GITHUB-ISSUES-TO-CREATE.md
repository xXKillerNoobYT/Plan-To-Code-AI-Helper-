# GitHub Issues to Create - Test Failures (Jan 28, 2026)

> **Action**: Create these GitHub issues to track remaining test failures for next sprint

---

## 🎯 Issue Template (Copy & Customize)

```markdown
Title: [TEST] <Issue Title>
Labels: bug, testing, help-wanted
Milestone: [Next Sprint]
Priority: Low (unless marked otherwise)

## Description
[Description from below]

## Test Details
- **Test Suite**: [Suite name]
- **Test File**: [File path]
- **Failing Test**: [Test name]

## Expected Behavior
Tests should pass when run: `npm run test:once`

## Current Behavior
Test fails with specific error message

## Reproduction Steps
1. Run `npm run test:once`
2. Look for failing test in output
3. See error trace

## Root Cause
[Root cause analysis]

## Solution Approach
[Recommended fix]

## Effort Estimate
- **Complexity**: [LOW/MEDIUM/HIGH]
- **Time**: [X min estimate]
- **Priority**: [P1/P2/P3]
```

---

## 📋 Issues to Create (21 Total)

### **Issue #1-6: Command Registration Mock Failures** 🔴 HIGH PRIORITY

#### Issue #1: [TEST] Status Bar command handler not registered
```
Test Suite: tests/extension.statusBar.test.ts
Failing Tests: 6
Complexity: HIGH
Time: 15 min
Reason: vscode.commands.registerCommand mock not capturing callbacks

Description:
The status bar tests expect command handlers to be registered during extension activation,
but the VS Code mock doesn't properly store the registered callbacks. This returns undefined
when tests try to retrieve the handler later.

Affected Tests:
- shows correct remaining count in status bar after task completion
- sends LM Studio request (stream) with prompt body
- filters streaming metadata and logs clean model text
- ignores malformed streaming chunks
- does not complete task when LM Studio unreachable
- displays disabled message for test command

Root Cause:
vscode.commands.registerCommand mock implementation in jest setup is not storing 
the callback functions in a way that test code can retrieve them later.

Solution:
Refactor the command registration mock to use a command registry Map that test code 
can access via a helper function like getRegisteredCommandHandler().

Related Issues: #2
```

#### Issue #2: [TEST] Integration tests can't verify command flow
```
Test Suite: tests/extension.integration.test.ts
Failing Tests: 4
Complexity: HIGH
Time: 15 min (same root cause as #1)
Reason: Callback mocking infrastructure

Description:
Sequential command execution tests fail because command callbacks aren't properly 
captured in the mock infrastructure.

Affected Tests:
- should handle 3 sequential test command runs without throwing
- should support multiple sequential fake tasks without queue blocking
- should update status bar from active to waiting after task completion
- should not leave active task state after test completion

Root Cause:
Same as Issue #1 - vscode.commands.registerCommand not capturing callbacks

Solution:
Share fix from Issue #1 - unified command mock pattern
```

#### Issue #3: [TEST] Status bar test - processNextTask command registration
```
Test Suite: tests/extension.integration.test.ts
Failing Tests: 1
Complexity: MEDIUM
Time: 10 min
Reason: coe.processNextTask command not being registered

Description:
Test expects processNextTask command to be registered but can't verify it in mock.

Affected Tests:
- should register coe.processNextTask command during activation
```

#### Issue #4-6: [TEST] Extension spec deactivation cleanup
```
Test Suite: tests/extension.spec/deactivate.web.spec.ts
Failing Tests: 1
Complexity: LOW
Time: 10 min
Reason: Console.log not being called during deactivation

Description:
Deactivation test expects specific console.log calls but they're not happening.

Affected Tests:
- should stop the PlansFileWatcher, dispose FileConfigManager, and clean up resources

Solution:
Verify that PlansFileWatcher.stopWatching() and FileConfigManager.dispose() 
actually call console.log() at appropriate points.
```

---

### **Issue #7-9: Parameter Validation Testing** 🟡 MEDIUM PRIORITY

#### Issue #7: [TEST] reportTaskStatus parameter validation
```
Test Suite: tests/reportTaskStatus.spec/reportTaskStatus.web.spec.ts
Failing Tests: 3
Complexity: MEDIUM
Time: 10 min
Reason: Parameter validation not being tested

Description:
Tests expect reportTaskStatus to throw MCPProtocolError for invalid parameters,
but the tool may not be validating input parameters currently.

Affected Tests:
- should throw an error if taskId is not found
- should create a verification task for completed tasks with tests passed
- should calculate and return dashboard statistics

Root Cause:
Missing parameter validation or error handling in reportTaskStatus implementation

Solution:
Add Zod schema validation to reportTaskStatus function to validate required parameters.
```

#### Issue #8: [TEST] getNextTask parameter validation
```
Test Suite: tests/getNextTask.spec/getNextTask.web.spec.ts
Failing Tests: 1
Complexity: MEDIUM
Time: 10 min
Reason: Invalid parameter error handling

Description:
Test tries to call getNextTask with invalid parameters expecting MCPProtocolError,
but code throws TypeError instead when trying to access undefined properties.

Affected Tests:
- should throw an error for invalid parameters

Root Cause:
getNextTask doesn't validate parameters before using them. It fails with TypeError
when filter property is undefined.

Solution:
Add validation guard at start of getNextTask to throw MCPProtocolError for missing
required parameters.
```

---

### **Issue #9-11: Edge Case Handling** 🟢 LOW PRIORITY

#### Issue #9: [TEST] BossRouter missing ticket field validation
```
Test Suite: src/services/__tests__/bossRouter.test.ts
Failing Tests: 3
Complexity: LOW
Time: 10 min
Reason: Missing field edge cases

Description:
BossRouter tests expect graceful handling of missing fields but code throws error
for completely invalid tickets.

Affected Tests:
- should escalate ticket with missing ticket_id
- should escalate ticket with missing type
- should escalate ticket with missing priority

Root Cause:
BossRouter.routeTicket() throws error for missing fields instead of returning 
a fallback route or escalation.

Solution:
Add checks for missing fields and return a safe escalation/fallback path instead
of throwing error. Or create separate test stub with partial ticket data.

Note: This may be intended behavior - verify with product owner.
```

---

### **Issue #12: State Management** 🟡 MEDIUM PRIORITY

#### Issue #12: [TEST] ProgrammingOrchestrator duplicate detection
```
Test Suite: tests/programmingOrchestrator.test.ts
Failing Tests: 1
Complexity: LOW
Time: 10 min
Reason: Mock state not properly initialized

Description:
Duplicate detection test expects task1Added to be set but it's undefined.

Affected Tests:
- should log DEBUG message when duplicate ticketId is detected

Root Cause:
Mock task might not be getting added to orchestrator's internal queue due to
incomplete mock setup.

Solution:
Verify that mock task is being added to TaskQueue properly, or 
adjust test expectation for mock's actual behavior.
```

---

### **Issue #13: Code Quality** 🟡 MEDIUM PRIORITY

#### Issue #13: [TEST] Code quality - TODO/FIXME references
```
Test Suite: tests/meta/code-quality.test.ts
Failing Tests: 1 (possibly fixed with console.log removal)
Complexity: LOW-MEDIUM
Time: 5 min
Reason: TODO/FIXME comments without issue references

Description:
Code quality test scans source code for TODO/FIXME comments that don't reference
GitHub issues. This is a metadata check, not a functional test failure.

Affected Tests:
- should have no TODO or FIXME without issue references

Notes:
- This test may pass after console.log fix
- Check if any TODOs in code still lack issue references
- If failing: add issue references to remaining TODO/FIXME comments

Solution:
Either add issue references to TODOs or disable this quality gate if too strict.
```

---

## 🎯 Recommended Priority Order

### Next Sprint (Recommended)
1. **Issue #1** - Command registration mock (HIGH impact: +10 tests)
2. **Issue #2** - Integration tests (HIGH impact: +4 tests, shares fix with #1)
3. **Issue #7** - Parameter validation (MEDIUM impact: +3 tests)

### Following Sprint
4. **Issue #9** - bossRouter edge cases (LOW impact: +3 tests)
5. **Issue #12** - Orchestrator state (LOW impact: +1 test)
6. **Issue #4-6** - Deactivation cleanup (LOW impact: +1 test)

### Review/Optional
7. **Issue #13** - Code quality (Variable: 0-2 tests)

---

## 📊 Impact Summary

| Priority | Issues | Combined Impact | Estimated Effort |
|----------|--------|-----------------|------------------|
| **HIGH** | 2 | +14 tests (84% total) | 30 min |
| **MEDIUM** | 2 | +4 tests (88% total) | 20 min |
| **LOW** | 2 | +4 tests (92% total) | 20 min |
| **TOTAL** | 8 | +22 tests → 399/404 (98.8%!) | 70 min |

---

## 💾 Summary Command

After creating issues, link this planning document to each issue:

```
Reference: TESTING-SESSION-SUMMARY-JAN28.md
See: /memories/FINAL-SESSION-SUMMARY-JAN28.md
Details: Run `npm run test:once` to reproduce
```

---

**Created**: January 28, 2026  
**Session**: Test Optimization Sprint  
**Status**: Ready for next sprint  
**Expected Completion**: ~2 hours at next sprint start (if all issues address)

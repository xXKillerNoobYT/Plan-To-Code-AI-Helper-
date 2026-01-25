---
name: linting-skill
description: Automatically fix ESLint errors in modified files, enforce zero warnings for P1 tasks, and maintain code quality standards
tags: [code-quality, eslint, automation, p1-enforcement]
---

# Linting Skill

Automatically detect and fix ESLint errors in modified files, with strict enforcement for P1 (critical priority) tasks.

## When to Use This Skill

- After modifying TypeScript/JavaScript files
- Before committing code changes
- When verification fails due to linting errors
- During P1 task execution (zero warnings required)
- As part of pre-PR quality checks

## What This Skill Does

1. **Detect Modified Files**: Identifies changed TypeScript/JavaScript files
2. **Run ESLint**: Executes linting on target files
3. **Auto-Fix**: Applies `--fix` flag to automatically correct fixable issues
4. **Validate P1 Tasks**: Enforces zero warnings for critical priority work
5. **Report Results**: Provides summary of fixed/remaining issues
6. **Block on Failure**: Prevents task completion if P1 has warnings

## Step-by-Step Procedure

### Phase 1: File Detection

```
1. Get list of modified files from git status
2. Filter for .ts, .tsx, .js, .jsx extensions
3. Identify task priority (check GitHub issue labels)
4. Determine strictness level:
   - P1 (Critical): max-warnings = 0
   - P2 (High): max-warnings = 5
   - P3 (Medium): max-warnings = 10
```

### Phase 2: Linting Execution

```
1. Run ESLint with --fix flag:
   npm run lint -- --fix <file-list>

2. Capture output:
   - Fixed issues count
   - Remaining errors count
   - Remaining warnings count

3. Re-run without --fix to get final state:
   npm run lint -- <file-list>
```

### Phase 3: Validation

```
For P1 Tasks:
  IF warnings > 0:
    ❌ FAIL: "P1 tasks must have zero warnings"
    → Report unfixed warnings with file:line references
    → Block task completion
  ELSE:
    ✅ PASS: "P1 linting requirements met"

For P2/P3 Tasks:
  IF warnings > threshold:
    ⚠️ WARN: "Consider fixing warnings before completion"
    → List warnings but allow completion
  ELSE:
    ✅ PASS: "Linting acceptable"
```

### Phase 4: Reporting

```
Generate summary:
---
🔍 Linting Results
Files checked: <count>
Fixed automatically: <count> issues
Remaining errors: <count>
Remaining warnings: <count>
Status: [✅ PASS | ❌ FAIL | ⚠️ WARNINGS]
---

For each remaining issue:
  file:line:column - [error/warning] rule-name
  → Description
```

## Usage Examples

### Example 1: Auto-fix before commit

```bash
# Automatically fix all modified files
./.github/skills/linting-skill/eslint-fix.sh

# Output:
# ✅ Fixed 12 issues in 3 files
# ⚠️ 2 warnings remain in src/agents/orchestrator.ts
```

### Example 2: P1 task enforcement

```bash
# Check if P1 task meets zero-warning requirement
./.github/skills/linting-skill/validate-p1.sh src/mcpServer/tools.ts

# Output:
# ❌ FAIL: P1 tasks require zero warnings
# Found 1 warning:
#   src/mcpServer/tools.ts:42:10 - @typescript-eslint/no-explicit-any
#   → Consider using a more specific type
```

### Example 3: Batch fix all source files

```bash
# Fix all source files in src/
npm run lint -- --fix "src/**/*.ts"
```

## Configuration

### ESLint Rules (from .eslintrc.json)

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

### P1 Enforcement Logic

```typescript
// Check if task is P1
const isPriorityOne = githubIssue.labels.some(
  label => label.name === 'priority: critical' || label.name === 'P1'
);

if (isPriorityOne) {
  // Run linting with zero-warning enforcement
  const result = await runESLint(files, { maxWarnings: 0 });
  if (result.warningCount > 0) {
    throw new Error('P1 tasks must have zero warnings');
  }
}
```

## Integration with COE Workflow

### MCP Tool Integration

When linting fails, use `askQuestion` MCP tool:

```typescript
// If auto-fix doesn't resolve all issues
if (lintResult.errorCount > 0) {
  await mcpServer.callTool('askQuestion', {
    question: `How should I fix these ESLint errors?`,
    context: {
      taskId: currentTask.id,
      errors: lintResult.errors,
      fileContext: affectedFiles
    }
  });
}
```

### Task Status Updates

Report linting results via MCP:

```typescript
await mcpServer.callTool('reportObservation', {
  taskId: task.id,
  observation: `Linting complete: ${fixedCount} issues auto-fixed, ${remainingCount} require manual review`
});
```

## Scripts Reference

### eslint-fix.sh

Auto-fixes all modified files:

```bash
#!/bin/bash
# Get modified TypeScript/JavaScript files
MODIFIED_FILES=$(git diff --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx)$')

if [ -z "$MODIFIED_FILES" ]; then
  echo "No modified files to lint"
  exit 0
fi

# Run ESLint with --fix
npm run lint -- --fix $MODIFIED_FILES

# Report results
echo "✅ ESLint auto-fix completed"
npm run lint -- $MODIFIED_FILES
```

### validate-p1.sh

Validates P1 task meets zero-warning requirement:

```bash
#!/bin/bash
FILE_PATH=$1

# Run ESLint with max-warnings=0
npm run lint -- --max-warnings=0 "$FILE_PATH"

if [ $? -eq 0 ]; then
  echo "✅ P1 linting requirements met"
  exit 0
else
  echo "❌ FAIL: P1 tasks require zero warnings"
  exit 1
fi
```

## Common Issues & Solutions

### Issue: "Auto-fix doesn't resolve all errors"

**Solution**: Some issues require manual intervention. Use `askQuestion` MCP tool to get guidance:

```typescript
await mcpServer.callTool('askQuestion', {
  question: 'ESLint error: no-explicit-any at line 42. What type should I use?',
  context: { code: fileContent, line: 42 }
});
```

### Issue: "P1 task blocked by warnings"

**Solution**: Fix warnings manually or request priority exception:

1. Review warning details
2. Fix code to eliminate warnings
3. If unavoidable, document exception reason
4. Request Answer Team review via `askQuestion`

### Issue: "Linting is slow for large changesets"

**Solution**: Run incrementally on modified files only:

```bash
# Only lint changed files
git diff --name-only | grep -E '\.(ts|tsx)$' | xargs npm run lint -- --fix
```

## Checklist Before Task Completion

- [ ] All modified files pass ESLint
- [ ] P1 tasks have zero warnings
- [ ] Auto-fix applied (no trivial fixable errors remain)
- [ ] Remaining issues documented in task notes
- [ ] Code follows TypeScript standards from copilot-instructions.md

## Related Documentation

- **Copilot Instructions**: `.github/copilot-instructions.md` (TypeScript standards)
- **PRD.md**: Feature specifications and acceptance criteria
- **COE Master Plan**: `Plans/CONSOLIDATED-MASTER-PLAN.md`

---

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Owner**: COE Development Team

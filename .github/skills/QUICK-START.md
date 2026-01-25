# 🚀 Copilot Skills - Quick Start Guide

**Created**: January 24, 2026  
**For**: COE Project Build

## What Did We Just Create?

We set up **3 essential Copilot skills** to automate quality checks during development:

1. **Linting Skill** - Auto-fix code quality issues
2. **Testing Skill** - Run tests and check coverage
3. **MCP Tool Skill** - Integrate AI assistance during coding

## 📁 What Was Created

```
.github/skills/
├── README.md                          # Complete skills documentation
│
├── linting-skill/
│   ├── SKILL.md                       # Linting skill documentation
│   ├── eslint-fix.sh                  # Bash: Auto-fix linting errors
│   ├── eslint-fix.ps1                 # PowerShell: Auto-fix linting errors
│   ├── validate-p1.sh                 # Bash: Validate P1 zero-warning requirement
│   └── validate-p1.ps1                # PowerShell: Validate P1 zero-warning requirement
│
├── testing-skill/
│   ├── SKILL.md                       # Testing skill documentation
│   ├── run-tests.sh                   # Bash: Run Jest tests for modified files
│   ├── run-tests.ps1                  # PowerShell: Run Jest tests
│   ├── check-new-coverage.sh          # Bash: Validate coverage ≥75%
│   └── check-new-coverage.ps1         # PowerShell: Validate coverage
│
└── mcp-tool-skill/
    └── SKILL.md                       # MCP tool integration documentation
```

**Also Updated**: `.github/copilot-instructions.md` - Added Copilot Skills section

---

## 🎯 What Are Skills? (Simple Explanation)

Think of skills as **add-on tools for GitHub Copilot**:

- **Linting Skill** = "Code Cleanup Tool" → Fixes messy code automatically
- **Testing Skill** = "Quality Checker" → Makes sure your code works properly
- **MCP Tool Skill** = "AI Assistant" → Asks smart questions when you're stuck

Copilot reads the SKILL.md files and learns how to use these tools during development!

---

## ⚡ Quick Usage (Windows PowerShell)

### 1️⃣ After Writing Code - Fix Linting Issues

```powershell
# Auto-fix ESLint errors in modified files
.\.github\skills\linting-skill\eslint-fix.ps1
```

**What it does**: 
- ✅ Finds all modified TypeScript files
- ✅ Runs ESLint with `--fix` flag
- ✅ Shows final linting report

---

### 2️⃣ Before Committing - Run Tests

```powershell
# Run Jest tests for modified files
.\.github\skills\testing-skill\run-tests.ps1
```

**What it does**:
- ✅ Finds test files for your changed code
- ✅ Runs Jest with coverage reporting
- ✅ Shows pass/fail results

---

### 3️⃣ Check Code Coverage

```powershell
# Check if new code meets 75% coverage requirement
.\.github\skills\testing-skill\check-new-coverage.ps1 src\mcpServer\tools.ts
```

**What it does**:
- ✅ Runs tests for specific file
- ✅ Calculates weighted coverage score
- ✅ Pass/fail based on 75% threshold

---

### 4️⃣ P1 Tasks - Strict Validation (Zero Warnings!)

```powershell
# Validate P1 task has ZERO warnings (launch blocker!)
.\.github\skills\linting-skill\validate-p1.ps1 src\agents\orchestrator.ts

# Check P1 task has ≥90% coverage (higher bar!)
.\.github\skills\testing-skill\check-new-coverage.ps1 src\agents\orchestrator.ts 90
```

**What it does**:
- ✅ Enforces zero-warning rule for P1 (critical) tasks
- ✅ Requires ≥90% coverage for P1 tasks
- ✅ Blocks task completion if requirements not met

---

## 🔄 Recommended Workflow

### Every Time You Code:

```powershell
# 1. Write your TypeScript code
# ... coding ...

# 2. Fix linting errors
.\.github\skills\linting-skill\eslint-fix.ps1

# 3. Run tests
.\.github\skills\testing-skill\run-tests.ps1

# 4. Check coverage
.\.github\skills\testing-skill\check-new-coverage.ps1 src\yourFile.ts

# 5. If everything passes ✅ → Commit!
git add .
git commit -m "Implemented feature X"
```

### For P1 (Critical Priority) Tasks:

```powershell
# Use stricter validation
.\.github\skills\linting-skill\validate-p1.ps1 src\yourP1File.ts
.\.github\skills\testing-skill\check-new-coverage.ps1 src\yourP1File.ts 90
```

---

## 🤖 MCP Tool Skill - AI Integration

The **MCP Tool Skill** teaches Copilot how to use AI assistance during coding:

### When to Use:
- ❓ Requirements are unclear → Ask a question
- 🐛 Found a bug or issue → Report observation
- ❌ Tests are failing → Report test failure
- 📊 Need implementation guidance → Ask for help

### Examples (TypeScript):

```typescript
import { MCPServer } from '../mcpServer/server';
const mcpServer = new MCPServer();

// Ask for clarification
const answer = await mcpServer.callTool('askQuestion', {
  question: 'Should getNextTask return null or throw error when queue is empty?',
  context: {
    taskId: 'task-123',
    fileContext: ['src/mcpServer/tools.ts'],
    codeSnippet: 'async function getNextTask() { ... }'
  }
});

// Report an observation
await mcpServer.callTool('reportObservation', {
  taskId: 'task-123',
  observation: 'Found missing dependency: taskService needs getHighestPriorityTask()',
  severity: 'warning'
});

// Report test failure (auto-creates investigation task!)
await mcpServer.callTool('reportTestFailure', {
  taskId: 'task-123',
  testName: 'should return P1 task',
  error: 'Expected priority "P1", received "P2"'
});
```

**See**: `.github\skills\mcp-tool-skill\SKILL.md` for complete documentation

---

## 📚 Full Documentation

Each skill has detailed SKILL.md files with:
- When to use the skill
- Step-by-step procedures
- Usage examples
- Integration patterns
- Troubleshooting guide

**Read**:
- `.github\skills\linting-skill\SKILL.md`
- `.github\skills\testing-skill\SKILL.md`
- `.github\skills\mcp-tool-skill\SKILL.md`
- `.github\skills\README.md` (master index)

---

## 🎓 How Copilot Uses These Skills

When you're coding, GitHub Copilot automatically:

1. **Reads** the SKILL.md files when it needs to perform quality checks
2. **Runs** the scripts (eslint-fix.ps1, run-tests.ps1, etc.)
3. **Reports** results back to you
4. **Suggests** fixes based on skill documentation

**You don't need to train Copilot!** The SKILL.md files are like instruction manuals that Copilot reads on-demand.

---

## ✅ Quality Gates Summary

| Check | Threshold | Script |
|-------|-----------|--------|
| **ESLint Warnings** | ≤10 (P1: 0) | `validate-p1.ps1` |
| **Code Coverage** | ≥75% (P1: ≥90%) | `check-new-coverage.ps1` |
| **Test Failures** | 0 failures | `run-tests.ps1` |
| **TypeScript Errors** | 0 errors | `eslint-fix.ps1` |

---

## 🚦 Next Steps

1. **Try it out!** Modify a TypeScript file and run the linting skill:
   ```powershell
   .\.github\skills\linting-skill\eslint-fix.ps1
   ```

2. **Read the docs**: Browse the SKILL.md files to learn advanced usage

3. **Integrate into workflow**: Use skills before every commit

4. **Create new skills**: Follow the template in `.github\skills\README.md`

---

## 💡 Pro Tips

### Tip 1: Chain Commands
```powershell
# Run linting + tests + coverage in one go
.\.github\skills\linting-skill\eslint-fix.ps1; `
.\.github\skills\testing-skill\run-tests.ps1; `
.\.github\skills\testing-skill\check-new-coverage.ps1 src\myFile.ts
```

### Tip 2: Create Aliases
```powershell
# Add to your PowerShell profile
Set-Alias lint .\.github\skills\linting-skill\eslint-fix.ps1
Set-Alias test .\.github\skills\testing-skill\run-tests.ps1

# Then use
lint
test
```

### Tip 3: Pre-Commit Hook
Create `.git\hooks\pre-commit.ps1`:
```powershell
.\.github\skills\linting-skill\eslint-fix.ps1
.\.github\skills\testing-skill\run-tests.ps1
```

---

## ❓ FAQ

**Q: Do I need to run these manually every time?**  
A: Copilot can run them automatically when needed, but you can also run them manually for instant feedback.

**Q: What if a script fails?**  
A: Read the error message! The scripts provide actionable feedback on what to fix.

**Q: Can I customize the scripts?**  
A: Yes! They're just PowerShell/Bash scripts. Modify them to fit your needs.

**Q: What about Linux/Mac?**  
A: Use the `.sh` versions of the scripts instead of `.ps1`.

**Q: Are these the only skills?**  
A: No! The project has more skills. See `.github\skills\README.md` for the complete list.

---

## 🎉 Summary

You now have **3 powerful skills** that automate code quality:

✅ **Linting Skill** - Keeps code clean  
✅ **Testing Skill** - Ensures quality  
✅ **MCP Tool Skill** - Provides AI assistance  

**Use them every time you code!** They'll catch issues early and ensure the COE project meets quality standards.

---

**Questions?** Read the SKILL.md files or use the MCP Tool Skill's `askQuestion` to get help! 🚀

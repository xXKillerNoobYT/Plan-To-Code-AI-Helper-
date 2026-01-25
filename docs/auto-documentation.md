# Auto-Documentation System for COE

**📚 How the auto-documentation system works in COE**

---

## Overview

The COE project enforces **mandatory auto-documentation** at every step. Documentation is not an afterthought—it's built into your coding workflow!

**Golden Rule**: 
> **No tests = Not done. No documentation = Not done.**

---

## Three Levels of Documentation

### Level 1: Code-Level Documentation (JSDoc Comments)

**Where**: Inside your TypeScript code  
**Why**: Helps developers understand what your code does instantly  
**Who reads it**: Developers using your code, IDE tooltips

```typescript
/**
 * 🔍 Retrieves the highest priority task from the queue
 * 
 * This function prioritizes P1 (critical) > P2 (high) > P3 (medium).
 * It excludes completed and blocked tasks automatically.
 * 
 * @param {string} planId - The plan ID (e.g., "plan-123")
 * @returns {Promise<Task | null>} Next task or null if queue is empty
 * @throws {Error} If planId is invalid or database fails
 * 
 * @example
 * const task = await getNextTask('plan-123');
 * if (task) {
 *   console.log(`Starting: ${task.title}`);
 * }
 */
export async function getNextTask(planId: string): Promise<Task | null> {
  // Implementation...
}
```

**Mandatory for**:
- ✅ All exported functions
- ✅ All React components
- ✅ All public class methods
- ✅ Complex helper functions
- ✅ Type definitions

### Level 2: Feature-Level Documentation (Usage Guides in docs/)

**Where**: `docs/[feature-name]-guide.md`  
**Why**: Shows how to use the feature in context  
**Who reads it**: Developers implementing or using the feature

**File naming convention**:
```
src/mcpServer/tools.ts        → docs/mcp-tools.md
src/agents/orchestrator.ts    → docs/orchestrator-guide.md
src/ui/VerificationPanel.tsx  → docs/verification-panel-guide.md
src/tasks/queue.ts            → docs/task-queue-guide.md
```

**Template**:
```markdown
# Feature Name Usage Guide

## Overview
[1-2 sentences what this does]

## Quick Start
[5-line code example]

## API Reference
- **Function**: signature and description
- **Parameters**: what goes in
- **Returns**: what comes out

## Common Mistakes
- ❌ Wrong approach
- ✅ Right approach

## Examples
[2-3 real-world examples]

## Troubleshooting
[Common issues]

## Related Docs
[Links to related docs]
```

### Level 3: System-Level Documentation (Plans/, PRD updates)

**Where**: 
- `Plans/COE-Master-Plan/` for architecture
- `PRD.md` for feature specifications
- Updated when behavior changes

**Why**: Shows how features fit into the overall system  
**Who reads it**: Architects, new team members, AI agents

---

## Workflow: Creating a New Feature

### Step 1: Plan
```
Read PRD.md → Check acceptance criteria → Break into atomic tasks
```

### Step 2: Implement
```typescript
// Code with JSDoc comments ✅
/**
 * 🔍 Description of what it does
 * @param inputParams - description
 * @returns description
 * @example code example
 */
export async function myNewFeature(params: Type): ReturnType {}
```

### Step 3: Test
```bash
npm run test:unit  # Write tests that pass ✅
npm run test:coverage  # Maintain ≥75% coverage ✅
```

### Step 4: Document (Required!)

**A. JSDoc Comments** (already added in Step 2) ✅

**B. Create Usage Guide**
```bash
# Create docs/my-new-feature.md with:
# - Overview (what it does)
# - Quick start (5-line example)
# - API reference
# - Examples
# - Troubleshooting
```

**C. Update Related Guides**
```bash
# If relates to testing → Update docs/testing-guide.md
# If relates to debugging → Update docs/debug-guide.md
# If relates to MCP → Update docs/mcp-tools.md
```

**D. Update PRD if Behavior Changed**
```markdown
### Updated from Issue #X: Brief Title

**Date**: 2026-01-24
**Issue**: #X - [Link to issue]
**Change Type**: Feature/Bug Fix/Clarification

**What Changed**:
- Detail 1
- Detail 2

**Why**: [From issue]

**Files Affected**: [List]

**Testing**: [How verified]
```

### Step 5: Verify & Commit

**Before committing, check**:
- [ ] All functions have JSDoc comments
- [ ] Usage guide created in docs/
- [ ] Related guides updated
- [ ] PRD.md updated if needed
- [ ] Status/status-log.md updated
- [ ] Files in correct folders (Plans/, docs/, Status/, src/)
- [ ] Examples in docs are copy-pasteable
- [ ] No broken links

---

## Folder Organization (Strictly Enforced!)

```
📁 Plan-To-Code-AI-Helper-/
│
├── 📁 Plans/                    ← Architecture & Technical Specs
│   ├── CONSOLIDATED-MASTER-PLAN.md
│   ├── README.md
│   ├── QUICK-REFERENCE-CARD.md
│   └── COE-Master-Plan/
│       ├── 01-Architecture-Document.md
│       ├── 02-Agent-Role-Definitions.md
│       ├── 05-MCP-API-Reference.md
│       └── ...
│
├── 📁 docs/                     ← Usage Guides & Tutorials
│   ├── debug-guide.md
│   ├── testing-guide.md
│   ├── mcp-tools.md
│   ├── auto-documentation.md    ← This file!
│   ├── [feature]-guide.md       ← Add new features here!
│   └── ...
│
├── 📁 Status/                   ← Project Status & Logs
│   ├── status-log.md
│   ├── core-features.md
│   ├── implementation.md
│   └── ...
│
├── 📁 src/                      ← Source Code
│   ├── extension.ts             (JSDoc comments ✅)
│   ├── mcpServer/
│   │   ├── tools.ts             (JSDoc comments ✅)
│   │   └── ...
│   └── ...
│
├── PRD.md                       ← Feature Specifications (top-level!)
├── PRD.json                     ← Generated from PRD.ipynb
├── PRD.ipynb                    ← Source notebook (update this!)
└── ...
```

**Rules**:
- ✅ Architecture specs → Plans/
- ✅ Usage guides → docs/
- ✅ Status updates → Status/
- ✅ Source code → src/ (with JSDoc comments)
- ✅ Feature specs → PRD.md (updated from PRD.ipynb)

**Anti-patterns**:
- ❌ Documentation in src/ (except JSDoc)
- ❌ Architecture specs in docs/
- ❌ Implementation details in Plans/
- ❌ Source code in Plans/ or docs/

---

## Example Documentation Flow

### Creating a New MCP Tool

**1. Code with JSDoc** (src/mcpServer/tools/myTool.ts):
```typescript
/**
 * 🔍 My new MCP tool that does important things
 * 
 * This tool is used by agents to [purpose].
 * It returns a super-detailed response with context.
 * 
 * @param {Object} params - Tool parameters
 * @param {string} params.taskId - The task ID
 * @returns {Promise<MCPToolResponse>} Response with resource
 * @throws {MCPProtocolError} If parameters invalid
 * 
 * @example
 * await mcpServer.callTool('myTool', { taskId: 'task-123' });
 */
export async function myTool(params: MyToolParams): Promise<MCPToolResponse> {}
```

**2. Create Usage Guide** (docs/my-tool-guide.md):
```markdown
# My Tool Usage Guide

## Overview
This tool is used by agents to [purpose].

## Quick Start
```typescript
await mcpServer.callTool('myTool', { taskId: 'task-123' });
```

## API Reference
- **Function**: `myTool(params: MyToolParams): Promise<MCPToolResponse>`
- **Parameters**: taskId (string) - task ID
- **Returns**: MCPToolResponse with resource

## Examples
[2-3 examples]

## Troubleshooting
[Common issues]

## Related Docs
- MCP API Reference: Plans/COE-Master-Plan/05-MCP-API-Reference.md
- MCP Server: docs/mcp-tools.md
```

**3. Update Existing Guides**:
- Update `docs/mcp-tools.md` → Add "My Tool" section
- Update `Status/status-log.md` → Log this change

**4. Update PRD if Behavior Changed**:
```markdown
### Updated from Issue #42: Add My Tool

**Date**: 2026-01-24
**Issue**: #42 - Need tool for [purpose]
**Change Type**: Feature

**What Changed**:
- Added myTool MCP tool to handle [purpose]

**Why**: Issue #42 requested functionality for [reason]

**Files Affected**:
- src/mcpServer/tools/myTool.ts
- docs/my-tool-guide.md
- docs/mcp-tools.md
- PRD.md

**Testing**: Tests in src/mcpServer/tools/__tests__/myTool.test.ts
```

---

## Quick Checklist

Before committing code:

```
📋 Documentation Checklist for Every Feature
═══════════════════════════════════════════

☐ Level 1: JSDoc Comments
  ☐ All functions have JSDoc with @param, @returns
  ☐ Examples are copy-pasteable
  ☐ Emoji prefix (🔍, 🎨, 🚀) for visual scanning

☐ Level 2: Usage Guide
  ☐ Created docs/[feature]-guide.md
  ☐ Has Overview, Quick Start, API Reference
  ☐ Has Examples and Troubleshooting
  ☐ No broken links

☐ Level 3: System Documentation
  ☐ Relevant guides updated (testing, debugging, MCP)
  ☐ PRD.md updated if behavior changed
  ☐ Status/status-log.md updated

☐ Folder Organization
  ☐ Code in src/ (with JSDoc)
  ☐ Guides in docs/
  ☐ Architecture specs in Plans/
  ☐ Status updates in Status/

🎯 If all ☐ are checked → Ready to commit! ✅
```

---

## Resources

### Documentation Templates
- Full examples in `.github/copilot-instructions.md` (Section 6)
- JSDoc standards → See code examples above
- Feature guide template → See "Level 2" section above

### Related Documentation
- **Copilot Instructions**: `.github/copilot-instructions.md` (comprehensive rules)
- **Testing Guide**: `docs/testing-guide.md` (how to write tests)
- **Debug Guide**: `docs/debug-guide.md` (how to debug code)
- **MCP Tools**: `docs/mcp-tools.md` (MCP tool examples)

### Tools
- **JSDoc Reference**: https://jsdoc.app
- **Markdown Guide**: https://www.markdownguide.org
- **VS Code JSDoc Snippets**: Built-in (type `/**` in a function)

---

**Remember**: 
> Documentation is not a burden—it's a gift to your future self! 🎁

Every comment, example, and guide you write today is an investment in tomorrow's productivity. 📚✨

---

**Happy Documenting! 📝**

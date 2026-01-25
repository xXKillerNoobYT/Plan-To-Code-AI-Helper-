# COE Extension Setup - Getting Started Guide

## ✅ What We Just Created

Your VS Code extension project is now set up! Here's what we created:

### 📄 Core Files
- **`package.json`** - Extension configuration (like an ID card for your extension)
- **`tsconfig.json`** - TypeScript compiler settings
- **`src/extension.ts`** - Entry point that logs "COE Activated"
- **`.eslintrc.json`** - Code quality rules
- **`.gitignore`** - Files Git should ignore

### 📁 Folders
- **`src/`** - All your TypeScript code goes here
- **`.vscode/`** - VS Code debug/build configurations
- **`Plans/`** - Already exists with architecture docs
- **`Docs/`** - Already exists with documentation

## 🚀 Installation Instructions (Do This Next!)

### Step 1: Install Node.js (if not already installed)
1. Download from [nodejs.org](https://nodejs.org/) (LTS version)
2. Install it
3. Verify: Open PowerShell and type:
   ```powershell
   node --version
   npm --version
   ```
   You should see version numbers.

### Step 2: Install Dependencies
Open PowerShell in this folder and run:
```powershell
npm install
```

**What this does**: Downloads all the libraries listed in `package.json`:
- `vscode` - VS Code extension API
- `@modelcontextprotocol/sdk` - MCP protocol support
- `@octokit/rest` - GitHub API client
- `typescript` - TypeScript compiler
- And others...

This will create a `node_modules/` folder (which Git ignores).

### Step 3: Compile TypeScript
```powershell
npm run compile
```

**What this does**: Converts your `.ts` files (TypeScript) into `.js` files (JavaScript) in the `out/` folder.

**Alternative** - Watch mode (auto-compiles when you save):
```powershell
npm run watch
```

### Step 4: Run the Extension!
1. Open this project in VS Code
2. Press **F5** (or Run → Start Debugging)
3. A new VS Code window opens with "[Extension Development Host]" in the title
4. In the original window, open the **Debug Console** (View → Debug Console)
5. You should see: **"🚀 COE Activated"**

### Step 5: Test the Command
In the Extension Development Host window:
1. Press `Ctrl+Shift+P` (Command Palette)
2. Type "COE: Activate"
3. Select "COE: Activate Orchestration"
4. You should see a popup: "COE: Orchestration system ready!"

## 🎯 What Each Technology Does (Simple Explanations)

### TypeScript
**What**: JavaScript + Types  
**Why**: Catches bugs before you run code  
**Example**:
```typescript
// TypeScript knows this is a number
let age: number = 25;
age = "twenty"; // ❌ ERROR: Can't put text in a number variable!
```

### JSON-RPC
**What**: A way for programs to talk to each other  
**Why**: Your MCP server uses this to communicate with AI agents  
**Example**: "Agent asks: 'What's the next task?' → Server responds: 'Task #42: Fix login bug'"

### MCP (Model Context Protocol)
**What**: A protocol for AI agents to access tools and data  
**Why**: Lets GitHub Copilot and other AI agents get tasks from your extension  
**Think of it as**: A waiter (MCP) taking orders (task requests) between customers (AI agents) and the kitchen (your task system)

### Octokit
**What**: A JavaScript library for the GitHub API  
**Why**: Lets your extension read/write GitHub Issues, create PRs, etc.  
**Example**: `octokit.issues.get()` fetches an issue from GitHub

## 📚 Backend vs Frontend Breakdown

### Backend Components (To Be Built)
These run in the background and handle logic:

1. **MCP Server** (`src/mcpServer/`)
   - Receives requests from AI agents
   - Returns tasks from the queue
   - Reports task completion

2. **GitHub Integration** (`src/github/`)
   - Syncs Issues every 5 minutes
   - Creates/updates Issues
   - Handles OAuth authentication

3. **Task Queue** (`src/tasks/`)
   - Stores pending tasks
   - Manages priorities
   - Tracks dependencies

4. **Agent Teams** (`src/agents/`)
   - Planning Team: Generates tasks
   - Answer Team: Answers questions
   - Verification Team: Tests results

### Frontend Components (To Be Built)
These show information to users:

1. **Task Tree View** (`src/ui/`)
   - Shows list of tasks in sidebar
   - Click to see details
   - Filter by status/priority

2. **Plans Panel** (`src/ui/`)
   - Displays plan.json content
   - Shows cross-references
   - Highlights issues

3. **Status Bar** (`src/ui/`)
   - Shows current task count
   - Displays sync status
   - Quick actions

## 🔍 How It All Connects

```
User clicks "Get Next Task" (Frontend)
    ↓
Extension calls MCP Server (Backend)
    ↓
MCP Server reads task queue (Backend)
    ↓
Returns task to Frontend
    ↓
UI displays task in panel (Frontend)
```

## 📖 Understanding package.json

Key sections explained:

```json
{
  "name": "copilot-orchestration-extension",  // Extension ID
  "displayName": "Copilot Orchestration Extension (COE)",  // Shown in marketplace
  "version": "0.1.0",  // Follows semantic versioning (major.minor.patch)
  
  "engines": {
    "vscode": "^1.85.0"  // Minimum VS Code version required
  },
  
  "activationEvents": [
    "onStartupFinished"  // Extension starts when VS Code finishes loading
  ],
  
  "main": "./out/extension.js",  // Entry point (compiled from src/extension.ts)
  
  "contributes": {
    "commands": [  // Commands users can run
      {
        "command": "coe.activate",  // Internal ID
        "title": "COE: Activate Orchestration"  // What users see
      }
    ]
  }
}
```

## 🐛 Troubleshooting

### "npm: command not found"
→ Install Node.js first (see Step 1)

### "Cannot find module 'vscode'"
→ Run `npm install`

### Extension doesn't activate
1. Check Debug Console for errors
2. Verify `npm run compile` completed without errors
3. Check that `out/extension.js` exists

### Changes not showing up
1. Stop debugging (Shift+F5)
2. Run `npm run compile` again
3. Press F5 to restart

## 🎓 Next Learning Steps

1. **Read `src/extension.ts`** - Understand the entry point
2. **Explore Architecture Docs** - Check `Plans/COE-Master-Plan/01-Architecture-Document.md`
3. **Study MCP API** - Read `Plans/COE-Master-Plan/05-MCP-API-Reference.md`
4. **Build First Feature** - Let's add MCP server next!

## 💡 Pro Tips

- **Use `console.log()`**: Add it everywhere to understand code flow
- **Check Debug Console**: This is where all your logs appear
- **Set Breakpoints**: Click left of line numbers to pause execution
- **Use TypeScript Errors**: Red squiggly lines are your friends!
- **Read Error Messages**: They tell you exactly what's wrong

---

**🎉 Congratulations!** You've set up a VS Code extension project. The foundation is ready—now we can build the MCP server, task system, and UI components!

**Ready for the next step?** Just ask and we'll implement the MCP server or any other component.

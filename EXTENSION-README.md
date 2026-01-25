# Copilot Orchestration Extension (COE)

A VS Code extension that orchestrates AI agents to automate development workflows with plan-driven task management.

## 🚀 Quick Start for Beginners

### What You Need
- **Node.js** (v20 or higher) - Download from [nodejs.org](https://nodejs.org/)
- **VS Code** - You probably already have this!
- **Git** - For version control

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```
   This downloads all the code libraries the extension needs.

2. **Compile the Code**
   ```bash
   npm run compile
   ```
   This converts TypeScript (.ts files) into JavaScript (.js files) that VS Code can run.

3. **Run the Extension**
   - Press `F5` in VS Code
   - A new VS Code window will open with your extension running
   - Look for "🚀 COE Activated" in the Debug Console

4. **Test It**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "COE: Activate Orchestration"
   - You should see a success message!

## 📖 Understanding the Parts

### What is TypeScript?
TypeScript is JavaScript with extra safety features. It's like JavaScript but helps you catch mistakes before running the code.

**Example:**
```typescript
// JavaScript - can cause errors
let age = "twenty";
age = age + 5; // "twenty5" - oops!

// TypeScript - catches the error
let age: number = 20;
age = age + 5; // 25 - works correctly!
```

### Backend vs Frontend

**Backend** (`src/mcpServer/`, `src/github/`, `src/tasks/`):
- The "engine" that does the work
- Processes tasks
- Talks to GitHub
- Manages the MCP server
- You don't see it, but it's working in the background

**Frontend** (`src/ui/`):
- The "dashboard" you interact with
- Shows task lists
- Displays buttons and panels
- Updates when backend finishes work

**Analogy:** Think of a restaurant:
- **Backend** = Kitchen (cooks prepare food, you don't see it)
- **Frontend** = Dining area (you see menus, place orders, receive food)

## 🏗️ Project Structure

```
Plan-To-Code-AI-Helper-/
├── src/                  ← Your TypeScript code (backend + frontend)
├── out/                  ← Compiled JavaScript (created by npm run compile)
├── Plans/                ← Architecture docs & specifications
├── Docs/                 ← Additional documentation
├── .github/              ← Copilot configurations
├── package.json          ← Extension configuration & dependencies
└── tsconfig.json         ← TypeScript compiler settings
```

## 🔧 Development Workflow

1. **Edit Code**: Make changes to `.ts` files in `src/`
2. **Compile**: Run `npm run compile` or `npm run watch` (auto-compiles on save)
3. **Test**: Press `F5` to launch extension in debug mode
4. **Debug**: Use breakpoints and console.log() to find issues
5. **Repeat**: Keep improving!

## 📦 Key Dependencies Explained

From `package.json`:

- **vscode**: The VS Code extension API (lets you build extensions)
- **@modelcontextprotocol/sdk**: MCP protocol for AI agent communication
- **@octokit/rest**: GitHub API client (talks to GitHub)
- **json-rpc-2.0**: JSON-RPC protocol (how MCP server communicates)
- **typescript**: The TypeScript compiler

## 🎯 Next Steps

1. ✅ Basic structure created
2. 🔜 Add MCP server implementation
3. 🔜 Add GitHub Issues sync
4. 🔜 Build task queue system
5. 🔜 Create UI components (tree views, panels)
6. 🔜 Implement agent teams (Planning, Answer, Verification)

## 📚 Learning Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Your Architecture Docs](./Plans/COE-Master-Plan/)

## ❓ Common Issues

**"Cannot find module 'vscode'"**
→ Run `npm install` first

**"tsc: command not found"**
→ Run `npm install -g typescript` or use `npm run compile`

**Extension not activating**
→ Check Debug Console for error messages (View → Debug Console)

## 💡 Tips for Beginners

1. **Start Small**: Understand `extension.ts` first before diving into complex features
2. **Use Console Logs**: Add `console.log()` everywhere to see what's happening
3. **Read Error Messages**: They're scary but helpful! Google them if confused
4. **Ask Questions**: Comment your code with questions and TODOs
5. **Test Often**: Press F5 frequently to catch errors early

---

**Ready to build?** Start by reading `src/extension.ts` and the comments there!

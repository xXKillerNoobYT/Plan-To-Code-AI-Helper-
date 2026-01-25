# 🚀 COE Extension - Quick Start Commands

## 📦 Installation (First Time Only)

```powershell
# Step 1: Install all dependencies
npm install

# Step 2: Compile TypeScript
npm run compile
```

---

## 🔨 Development Commands

### Compile TypeScript
```powershell
# One-time compile
npm run compile

# Watch mode (auto-compile on save) - RECOMMENDED
npm run watch
```

### Run Extension
```
Press F5 in VS Code
- Opens "Extension Development Host" window
- Check Debug Console for "🚀 COE Activated"
```

### Stop Extension
```
Press Shift+F5
- Stops the debug session
```

---

## 🧪 Testing Commands

```powershell
# Run all tests (VS Code integration tests)
npm test

# Run unit tests only (Jest)
npm run test:unit

# Watch mode - auto-run tests on file changes
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## 🔍 Code Quality

```powershell
# Run linter (check code quality)
npm run lint
```

---

## 📁 Project Structure Quick Reference

```
src/
├── extension.ts          ← Entry point (start here!)
├── mcpServer/           ← Backend - MCP protocol
├── github/              ← Backend - GitHub integration  
├── tasks/               ← Backend - Task queue
├── agents/              ← Backend - AI teams
├── ui/                  ← Frontend - User interface
├── plans/               ← Backend - Plan management
├── utils/               ← Shared utilities
└── test/                ← Tests
```

---

## 🎯 Common Workflows

### Make Changes to Code
```powershell
# Terminal 1: Start watch mode
npm run watch

# Terminal 2: Run extension
# Press F5 in VS Code

# Edit files in src/
# Save file → Auto-compiles
# Reload extension: Ctrl+R in Extension Host window
```

### Debug Code
```
1. Add breakpoint (click left of line number)
2. Press F5 to run extension
3. Trigger code (click command, etc.)
4. Code pauses at breakpoint
5. Inspect variables in Debug panel
```

### Add New File
```
1. Create .ts file in src/
2. Import in extension.ts or other files
3. TypeScript will auto-compile
```

---

## ✅ Verify Installation

```powershell
# Check Node.js version
node --version
# Should be v20 or higher

# Check npm version  
npm --version
# Should be v9 or higher

# Check if dependencies installed
ls node_modules
# Should list many packages

# Check if compiled
ls out
# Should show .js files
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'vscode'"
```powershell
npm install
```

### Error: "tsc not found"
```powershell
npm run compile
# or install globally:
npm install -g typescript
```

### Extension doesn't activate
```
1. Check Debug Console for errors
2. Verify: ls out/extension.js exists
3. Run: npm run compile
4. Press F5 again
```

### Changes not showing
```powershell
# Stop extension
Shift+F5

# Recompile
npm run compile

# Start again
F5
```

---

## 📚 Helpful VS Code Commands

```
Ctrl+Shift+P         Command Palette
Ctrl+`               Toggle Terminal
Ctrl+B               Toggle Sidebar
Ctrl+Shift+M         Problems Panel
Ctrl+Shift+U         Output Panel
F5                   Start Debugging
Shift+F5             Stop Debugging
Ctrl+R               Reload Extension Host
```

---

## 🎓 Next Steps

1. **Test Basic Setup**
   ```powershell
   npm install && npm run compile
   # Press F5
   # Look for "🚀 COE Activated"
   ```

2. **Open a File to Edit**
   - Start with: `src/extension.ts`
   - Read comments and placeholders
   - Implement TODOs one at a time

3. **Pick a Component**
   - MCP Server (`src/mcpServer/`)
   - Task Queue (`src/tasks/`)
   - UI Components (`src/ui/`)
   - GitHub Integration (`src/github/`)

4. **Ask for Help**
   - "Implement the task queue"
   - "Add GitHub authentication"
   - "Create the tasks tree view"

---

## 💡 Tips

- **Keep watch mode running** → `npm run watch`
- **Use console.log()** → Outputs to Debug Console
- **Read existing code** → Lots of helpful comments
- **Start small** → One file, one function at a time
- **Test often** → Press F5 frequently

---

**Ready?** Run these commands to start:
```powershell
npm install
npm run watch
```
Then press **F5** and start coding! 🚀

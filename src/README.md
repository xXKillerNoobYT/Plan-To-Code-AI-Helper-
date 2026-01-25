# COE Source Code Structure

This folder contains all the TypeScript code for the Copilot Orchestration Extension.

## 📁 Folder Organization (To Be Created)

```
src/
├── extension.ts          ✅ Entry point (already created)
├── mcpServer/           🔜 Backend - MCP server implementation
│   ├── server.ts        
│   ├── tools.ts         
│   └── protocol.ts      
├── github/              🔜 Backend - GitHub integration
│   ├── api.ts           
│   ├── issuesSync.ts    
│   └── webhooks.ts      
├── tasks/               🔜 Backend - Task queue management
│   ├── queue.ts         
│   ├── taskManager.ts   
│   └── dependencies.ts  
├── agents/              🔜 Backend - AI agent coordination
│   ├── orchestrator.ts  
│   ├── planningTeam.ts  
│   ├── answerTeam.ts    
│   └── verificationTeam.ts
├── ui/                  🔜 Frontend - User interface
│   ├── tasksTreeView.ts 
│   ├── plansPanel.ts    
│   └── statusBar.ts     
├── plans/               🔜 Backend - Plan storage & sync
│   ├── planManager.ts   
│   ├── fileWatcher.ts   
│   └── schemas.ts       
└── utils/               🔜 Shared utilities
    ├── logger.ts        
    └── config.ts        
```

## 🎯 Next Steps

1. Install dependencies: `npm install`
2. Compile TypeScript: `npm run compile`
3. Run the extension: Press F5 in VS Code
4. Look for "COE Activated" in the Debug Console

## 🧠 Key Concepts

**Backend files** (mcpServer/, github/, tasks/, agents/, plans/):
- Handle data processing
- Talk to external services (GitHub, MCP)
- Manage state and workflows
- No direct user interaction

**Frontend files** (ui/):
- Display information to users
- Capture user clicks and commands
- Show tree views, panels, and notifications
- Call backend functions to do the work

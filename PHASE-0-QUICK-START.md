# Phase 0: Quick Start Guide

**TL;DR**: Generate PRD from Plans/ in 30 seconds.

---

## ⚡ 30-Second Quick Start

### 1️⃣ Open Command Palette

```
Windows/Linux: Ctrl + Shift + P
Mac: Cmd + Shift + P
```

### 2️⃣ Find Command

Type: `Regenerate PRD`

Select: **"COE: Regenerate PRD from Plans"**

### 3️⃣ Press Enter

```
✅ Progress notification shows
✅ Output panel logs steps
✅ PRD.md created in 30-60 seconds
```

### 4️⃣ Check Files

```
workspace/
├─ PRD.md ................... New! (human-readable)
├─ PRD.json ................. New! (machine-readable)
└─ PRD.backup-[timestamp].md   Backup
```

---

## 🎯 Common Tasks

### Add a New Plan

```bash
# Copy template
cp Plans/PLAN-TEMPLATE.md Plans/My-Feature.md

# Edit in VS Code
# [Fill sections: Overview, Features, Architecture, etc.]

# Save file
# ⚠️  Auto-watch detects change
# ✅ PRD regenerates automatically (5 second debounce)
```

### Regenerate PRD Manually

```
Command Palette → "Regenerate PRD from Plans" → Enter
```

### Check Generation Status

```
View → Output → Select "COE Orchestrator"
[Watch logs for:
 - Reading Plans/ folder...
 - Found X files
 - Calling LLM...
 - Validating PRD...
 - Writing to PRD.md/PRD.json
 - ✅ Complete!
]
```

### View PRD

```
Open: workspace/PRD.md

Sections:
- ## Overview
- ## Features
- ## Architecture
- ## Testing
- ## Deployment
- ## Priorities
```

### Read Machine Format

```
Open: workspace/PRD.json

Structure:
{
  "metadata": {
    "generatedAt": "ISO-8601 date",
    "tokenCount": 1234,
    "generatedFrom": ["CONSOLIDATED-MASTER-PLAN.md", ...]
  },
  "content": "full PRD markdown",
  "sections": {
    "Overview": "intro text",
    "Features": "feature list",
    ...
  }
}
```

---

## ⚙️ Configuration

### Default LLM Settings

Located: `.coe/config.json`

```json
{
  "llm": {
    "url": "http://192.168.1.205:1234/v1/chat/completions",
    "model": "mistralai/ministral-3-14b-reasoning",
    "inputTokenLimit": 4000,
    "maxOutputTokens": 2000,
    "timeoutSeconds": 300
  }
}
```

### Change LLM Endpoint

Edit `.coe/config.json`:

```json
"url": "http://YOUR-ENDPOINT:PORT/v1/chat/completions"
```

Supported:
- Local: LM Studio, Ollama
- Cloud: OpenAI, Azure OpenAI, Mistral Cloud

### Change Token Limit

```json
"inputTokenLimit": 2000  // Lower = faster, less content
                         // Higher = slower, more content
                         // Default: 4000
```

---

## 📝 Example Workflow

### Scenario: Create Feature Plan

**Step 1**: Copy template

```bash
cd Plans/
cp PLAN-TEMPLATE.md Feature-Authentication.md
```

**Step 2**: Edit plan (VS Code)

```markdown
# Feature: Authentication System

## Overview
Add secure authentication to the COE extension.

## Features

### Feature 1: JWT Token Support
- Status: ⏳ Planned
- Priority: P1
- Acceptance Criteria:
  - [ ] JWT tokens generated with RS256
  - [ ] Tokens expire after 24 hours
  - [ ] Tokens verified before API calls

### Feature 2: OAuth2 Integration
- Status: ⏳ Planned
- Priority: P2
...
```

**Step 3**: Save file

```
VS Code saves → Watcher detects → PRD auto-regenerates
```

**Step 4**: Review PRD

```
PRD.md now includes:
- ## Features
  - Feature 1: JWT Token Support (P1, ⏳ Planned)
  - Feature 2: OAuth2 Integration (P2, ⏳ Planned)
- ## Architecture
  - [Auto-synthesized from plan]
- ## Testing Strategy
  - [Auto-synthesized from plan]
```

---

## 🆘 Troubleshooting

### Issue: "No plan files found"

**Cause**: Plans/ folder is empty  
**Fix**: Add `.md` files to `Plans/` folder

```bash
cp Plans/PLAN-TEMPLATE.md Plans/My-Plan.md
```

### Issue: "HTTP 504" or "Timeout"

**Cause**: LLM endpoint not responding  
**Fix**: Check LLM is running (LM Studio, Ollama, etc.)

```bash
# Test endpoint
curl http://192.168.1.205:1234/v1/chat/completions
```

### Issue: PRD.md not updated

**Cause**: Auto-watch disabled or debounce pending  
**Fix**: Manually run "Regenerate PRD from Plans" command

### Issue: Command not found

**Cause**: VS Code not recognizing command  
**Fix**: Reload extension (Command Palette → "Reload")

---

## 📊 What You Get

### PRD.md (Human-Readable)

```markdown
<!-- Generated from Plans/ on 2026-01-25T22:35:00.000Z -->

## Overview
[Project overview auto-synthesized from plans]

## Features
- F001: MCP Server (P1) ✅ Complete
- F002: Task Queue (P1) ✅ Complete
- F003: GitHub Issues Sync (P2) 🔨 In Progress
...

## Architecture
[Architecture auto-synthesized from plans]

## Testing
[Testing strategy auto-synthesized from plans]
...
```

### PRD.json (Machine-Readable)

```json
{
  "metadata": {
    "generatedAt": "2026-01-25T22:35:00.000Z",
    "version": "1.0.0",
    "generatedFrom": ["CONSOLIDATED-MASTER-PLAN.md", ...],
    "tokenCount": 2847
  },
  "content": "[full markdown]",
  "sections": {
    "Overview": "[intro]",
    "Features": "[feature list]",
    "Architecture": "[design]",
    ...
  }
}
```

---

## 🚀 Advanced Usage

### Monitor Auto-Watch

Open output channel:

```
View → Output → Select "COE Orchestrator"
```

Watch for messages:

```
🔄 Plans/ change detected: change CONSOLIDATED-MASTER-PLAN.md
[5 second debounce...]
🔄 Auto-Regenerating PRD from Plans...
📂 Reading Plans/ folder...
✅ Found 23 plan files
📦 Bundling content (2847 tokens)
🤖 Calling LLM...
✅ Validating PRD...
💾 Writing PRD.md and PRD.json...
✅ PRD auto-regenerated successfully!
```

### Combine Multiple Plans

New file: `Plans/Security-Sprint-Plan.md`

```markdown
# Security Sprint Plan

## Overview
This sprint focuses on authentication and data protection.

## Features

### Feature 1: JWT Tokens
[Details from Feature-Authentication.md merged here]

### Feature 2: Data Encryption
[Details from Feature-Encryption.md merged here]
```

Save → Auto-regenerate → PRD includes all features

### Use Generated PRD for Agents

Agents can read `PRD.json`:

```typescript
const fs = require('fs');
const prd = JSON.parse(fs.readFileSync('PRD.json'));

// Agent sees
prd.metadata.generatedAt ........ when PRD was created
prd.metadata.tokenCount ......... how much data used
prd.sections.Features ........... feature requirements
prd.sections.Architecture ....... system design
prd.sections.Testing ............ test strategy
```

---

## 📚 More Information

### Full Documentation

- **Implementation Guide**: `docs/phase-0-prd-generation.md`
- **Testing Checklist**: `docs/phase-0-testing-checklist.md`
- **Completion Summary**: `PHASE-0-COMPLETION-SUMMARY.md`

### Plan Template

- **Location**: `Plans/PLAN-TEMPLATE.md`
- **Copy it**: `cp Plans/PLAN-TEMPLATE.md Plans/Your-Plan.md`
- **Edit sections**: Overview, Features, Architecture, Testing, etc.

### Configuration

- **Location**: `.coe/config.json`
- Edit to change LLM endpoint, model, token limit

---

## ✅ That's It!

You now have automated PRD generation from planning documents.

```
┌─────────────────────────────────────┐
│  Edit Plans/*.md                    │
│          ↓                          │
│  Auto-watched (5s debounce)         │
│          ↓                          │
│  Sent to LLM (Mistral/OpenAI)       │
│          ↓                          │
│  PRD.md + PRD.json generated        │
│          ↓                          │
│  Ready for use!                     │
└─────────────────────────────────────┘
```

---

## 🎯 Next Steps

1. **Generate PRD**: Open Command Palette → "Regenerate PRD from Plans"
2. **Review Output**: Open `PRD.md` in editor
3. **Update Plans**: Edit Plans/ files and watch auto-regeneration
4. **Use PRD**: Reference for development, agents, stakeholders
5. **Iterate**: Plans → PRD → Development → Verification loop

---

**Ready to synthesize your plans? Run the command now!** 🚀

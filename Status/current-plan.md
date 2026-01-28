<!-- Planning update 2026-01-27 - AI Use System Planning Complete & Ready for Implementation -->
<!-- Status: Phase 0 - LLM PRD Generation + Phase 3 - Multi-Agent Orchestration Planning Complete -->
<!-- Current Focus: AI Use System - 8 Atomic Implementation Tasks (P1/P2/P3) Ready for Development -->
<!-- MVP Target: February 15, 2026 - All 6 AI Use System Features (F023-F028) Complete -->

# COE Current Plan: AI Use System Implementation Phase

**Project**: Copilot Orchestration Extension (COE)  
**Scope**: VS Code extension with multi-agent orchestration (Planning Brain + Ticket System + Agent Coordination)  
**Target Launch**: February 15, 2026 (AI Use System MVP)  
**Current Status**: 58% complete (20/35 features complete), AI Use System planning ready for development, 97.2% test coverage

---

## 🎯 Current Focus: AI Use System (PHASE 3 - Multi-Agent Orchestration)

### Status Update (Jan 27, 2026)

✅ **Planning Complete** - All AI Use System documentation ready  
📋 **4 comprehensive guides** created (23 pages total):
- AI-USE-SYSTEM-QUICK-REFERENCE.md (2 pages, P1 tasks)
- AI-USE-SYSTEM-INCREMENTAL-PLAN.md (15 pages, full implementation)
- AI-USE-SYSTEM-DIAGRAMS.md (3 pages, architecture + workflows)
- AI-USE-SYSTEM-PLANNING-INDEX.md (3 pages, navigation + overview)

✅ **PROJECT-BREAKDOWN.md updated** with 6 new features:
- F023: Ticket Database & Communication Layer (P1, 4-6 hours)
- F024: Programming Orchestrator Task Routing (P1, 3-4 hours)
- F025: Agents Sidebar Tab (P2, 3-4 hours)
- F026: Tickets Sidebar Tab (P2, 3-4 hours)
- F027: Streaming LLM Mode with Inactivity Timeout (P2, 2-3 hours)
- F028: Verification Panel UI (P3, 2-3 hours)

✅ **Plans/ folder reorganized**:
- Added AI-TEAMS-DOCUMENTATION-INDEX.md (bridging strategic ↔ tactical)
- Updated Plans/README.md with AI Use System entry points
- All 18 planning documents cross-referenced

### What's Next: Implementation (Feb 5 - Feb 15)

**3 Phases, 10 Days**:
- **Phase 1 (Feb 5)**: P1 tasks - Ticket DB + Orchestrator Routing (7-10 days, 2 developers)
- **Phase 2 (Feb 10)**: P2 tasks - UI tabs + Streaming (5-7 days)
- **Phase 3 (Feb 15)**: P3 tasks - Verification panel + Testing (2-3 days)

**Deliverables**:
- ✅ Ticket database (SQLite + in-memory fallback)
- ✅ Programming Orchestrator routing (task assignment + blocker detection)
- ✅ Agents sidebar tab (5 teams status display)
- ✅ Tickets sidebar tab (all tickets grouped by status)
- ✅ Streaming LLM with config-driven inactivity timeout
- ✅ Verification panel (test results + re-run/approve buttons)

---

## 📘 Project Architecture & Core Philosophy

### What COE IS

A VS Code extension that acts as your project's **"intelligent memory and organizer"**—a planning, tracking, verification, and orchestration layer that works WITH 3rd party coding agents (like GitHub Copilot), not instead of them.

### The "Planning Brain" + "Agent Orchestration" Function

**Planning Brain**:
- 🧠 **Reads Plans/** → Analyzes 23+ planning documents (200K+ words: architecture, agent specs, workflows, philosophy)
- 🤖 **Uses LLM** → Synthesizes planning docs into coherent, structured PRD.md (Product Requirements Document)
- 📊 **Tracks Progress** → Compares planned features (from PRD) vs. actual code files (in src/)
- 🔍 **Detects Drift** → Identifies outdated plans, missing dependencies, incomplete implementations

**Agent Orchestration** (NEW - via AI Use System):
- 🎫 **Ticket System** → SQLite-backed communication between agents and users (async conversations)
- 🤖 **Orchestrator** → Routes tasks to Copilot, monitors progress, detects blockers (>30s inactivity)
- 👥 **Agent Tabs** → Shows live status of 5 agent teams (Planning, Orchestrator, Answer, Verification, Clarity)
- 💬 **Clarity Agent** → Auto-scores ticket replies, ensures quality communication
- ✅ **Verification Panel** → Shows test results, allows re-run/approve/escalate
- ⏱️ **Streaming LLM** → Config-driven timeout prevents hangs

### What COE Does NOT Do

- ❌ **Does NOT write TypeScript/JavaScript code** — That's GitHub Copilot's job
- ❌ **Does NOT run unit tests** — It triggers Jest/Mocha and reports results
- ❌ **Does NOT make architectural decisions** — It synthesizes plans and tracks user choices

### Core Philosophy

> "Plans are the source of truth. Code is the implementation. COE keeps them aligned AND orchestrates agents to implement plans efficiently."

---

## ✅ Already Implemented Foundation (Phase 0-2)

**These features are WORKING and form our solid base** (20/35 features complete, 97.2% test coverage, zero TypeScript errors):

| Feature | Status | Details |
|---------|--------|---------|
| **Task Queue System** | ✅ Complete | In-memory + SQLite, P1/P2/P3 priority, atomic enforcement, dependency graph |
| **VS Code Sidebar & Status Bar** | ✅ Complete | Tree view, real-time queue display, commands (refresh, clear) |
| **LLM Configuration Panel** | ✅ Complete | 7-tab UI, OpenAI/LM Studio/Ollama/Azure support, 4000 token default, 95 tests |
| **GitHub Issues Bi-Directional Sync** | ✅ Complete | 99%+ accuracy, 16 tests, batching, caching, exponential backoff |
| **MCP Server with 6 Tools** | ✅ Complete | getNextTask, reportTaskStatus, reportObservation, reportTestFailure, reportVerificationResult, askQuestion |
| **Agent Communication Protocol** | ✅ Complete | WebSocket JSON-RPC 2.0, audit logging, health monitoring |
| **File System APIs** | ✅ Complete | File read/write, watchers, directory monitoring, plan parsing |
| **PRD Generation** | ✅ Complete | Python notebook (PRD.ipynb) reads Plans/, outputs PRD.md/PRD.json |
| **Settings Panel** | ✅ Complete | 7 tabs, 95 tests, dark/light theme, settings export/import |
| **GitHub Sync** | ✅ Complete | Bi-directional, 99%+ accuracy, 16 tests (existing - F028) |
| **Plan Decomposition** | ✅ Complete | AI-powered breakdown with dependency detection (F002) |
| **Context Bundle Builder** | ✅ Complete | Token tracking, file references, design system refs (F010) |

---

## 🆕 In Development: AI Use System (PHASE 3 - Ready to Start)

### F023: Ticket Database & Communication Layer (P1 - 4-6 hours)
**Purpose**: SQLite-backed async communication between agents and users (replaces ad-hoc chat)

**What It Does**:
- Create SQLite database at `.coe/tickets.db` with tickets + replies tables
- Implement CRUD operations (createTicket, getTicket, getTickets, updateTicketStatus, addReply)
- In-memory fallback (Map<string, Ticket>) if SQLite unavailable
- Tickets track agent-to-user questions (type='ai_to_human') and user-to-agent responses

**Blockers**: None  
**Timeline**: 4-6 hours  
**Test Coverage**: ≥80%

---

### F024: Programming Orchestrator Task Routing (P1 - 3-4 hours)
**Purpose**: Route Copilot tasks from queue, detect blockers (>30s no-token), auto-escalate

**What It Does**:
1. `getNextTask()` → pull highest P1 from existing queue
2. Send to Copilot with super-detailed prompt (design refs, file contexts, AC)
3. Track `currentTask` in state
4. If blocked >30s (no LLM token): auto-create P1 ticket + call MCP `askQuestion()`
5. Log all routing decisions (audit trail)

**Blockers**: F023 (Ticket DB)  
**Timeline**: 3-4 hours  
**Test Coverage**: ≥75%

---

### F025: Agents Sidebar Tab (P2 - 3-4 hours)
**Purpose**: Live status display of 5 agent teams

**Shows**:
- Planning Team (status, uptime)
- Programming Orchestrator (current task, queue depth)
- Answer Team (response time)
- Verification Team (last check time)
- Clarity Agent (queued tickets)

**Timeline**: 3-4 hours  
**Test Coverage**: Manual E2E (VS Code tree views hard to unit test)

---

### F026: Tickets Sidebar Tab (P2 - 3-4 hours)
**Purpose**: View all tickets grouped by status with click-to-detail

**Shows**:
- 📋 Open (count & list)
- ✅ Resolved (count)
- 🚨 Escalated (count)
- 📋 In Review (count)

**Click ticket** → webview opens with full details, thread replies, reply input

**Timeline**: 3-4 hours  
**Test Coverage**: Manual E2E

---

### F027: Streaming LLM Mode with Inactivity Timeout (P2 - 2-3 hours)
**Purpose**: Stream LLM responses with config-driven timeout (prevents hangs)

**What It Does**:
- Attach streaming listener to all LLM calls
- Track time since last token received
- Exit gracefully if no token for `config.llm.timeoutSeconds` (default 300s)
- Never write to config (read-only, critical!)
- Log warning if inactivity detected

**Timeline**: 2-3 hours  
**Test Coverage**: ≥70%

---

### F028: Verification Panel UI (P3 - 2-3 hours)
**Purpose**: Show test results post-execution, allow re-run/approve/escalate

**Shows**:
- Test output (passed/failed counts, stack traces)
- Clickable file links (jump to editor)
- Buttons: Re-Run, Approve, Escalate

**Timeline**: 2-3 hours  
**Test Coverage**: Manual E2E

---

## 📋 Phase 0: LLM PRD Generator (Existing - Keep Running)

> **Note**: This is the core "Planning Brain" feature. It's already working via the Python notebook. Keeping as reference for Phase 0.

**Purpose**: LLM-powered PRD generation from Plans/ folder

**Features**:
- ✅ Reads 23+ planning documents recursively
- ✅ Bundles with token limiting (respects config.llm.inputTokenLimit)
- ✅ Calls configured LLM (LM Studio, Ollama, OpenAI, Azure)
- ✅ Generates PRD.md + PRD.json
- ✅ Updates on Plans/ file changes (watcher integration)

**Command**: "COE: Regenerate PRD from Plans"  
**Status**: Working via Python notebook + existing MCP server  
**Next**: Wrap in TypeScript for seamless VS Code integration (Phase 2)

---

## 🧪 Testing & Quality Standards

### Coverage Targets
- **New code**: ≥75% (≥80% for P1 tasks)
- **Critical services**: (Ticket DB, Orchestrator, Streaming) ≥80%
- **UI components**: Manual E2E (VS Code tree views)
- **Integration**: All MCP tools + agent coordination

### Manual Test Checklist (After P1)
```
1. Create ticket via MCP tool → appears in Tickets tab
2. Refresh sidebar → ticket persists
3. Click ticket → webview opens with full details
4. Add reply → Clarity Agent scores it
5. Close extension → restart → ticket still there (persistence verified)
6. Simulate LLM inactivity (>30s no token) → blocker ticket created automatically
7. No SQLite? → in-memory mode activates, warning logged
8. Config unchanged? → verify never written to
```

---

## 📊 Feature Complete Status (35 Total)

| Phase | Features | Status | Count |
|-------|----------|--------|-------|
| **Phase 1** (Foundation) | Unified Agent, Background Worker, Planning Framework | ✅ Complete | 3 |
| **Phase 2** (Extension UI) | Settings Panel, GitHub Sync, Plan Decomposition | ✅ Complete | 3 |
| **Phase 3a** (MCP Core) | MCP Server, Agent Orchestration draft, Context Bundle | ✅ Complete | 3 |
| **Phase 3b** (AI Use System) | Ticket DB, Orchestrator Routing, Agents Tab, Tickets Tab, Streaming, Verification Panel | 🔄 Ready | 6 |
| **Phase 4+** | Visual Tools, Real-time Collaboration, Analytics, Plugin Architecture, etc. | 📅 Queued | 20 |

**Overall**: 20/35 features complete (58%), 6 ready for development, 9 more in planning phase

---

## 🚀 Timeline & Milestones

| Date | Phase | Deliverables | Status |
|------|-------|--------------|--------|
| **Jan 27** | Planning Complete | AI Use System 4 guides + PROJECT-BREAKDOWN updated | ✅ DONE |
| **Feb 5** | Phase 1 (P1 Tasks) | Ticket DB + Orchestrator Routing (7-10 days) | 📅 Starting |
| **Feb 10** | Phase 2 (P2 Tasks) | Agents/Tickets Tabs + Streaming (5-7 days) | 📅 Next |
| **Feb 15** | MVP Launch | All P1/P2/P3 complete, testing done | 🎯 Target |

---

## 📚 Documentation & References

### AI Use System Planning Guides
- **AI-USE-SYSTEM-PLANNING-INDEX.md** - Navigation + overview (START HERE)
- **AI-USE-SYSTEM-QUICK-REFERENCE.md** - 2-page quick start for developers
- **AI-USE-SYSTEM-INCREMENTAL-PLAN.md** - Full implementation plan (8 atomic tasks)
- **AI-USE-SYSTEM-DIAGRAMS.md** - Architecture + workflows

### Knowledge Base
- **Plans/README.md** - Planning suite overview
- **Plans/CONSOLIDATED-MASTER-PLAN.md** - Master plan + project structure
- **Plans/PROJECT-BREAKDOWN.md** - All 35 features tracked
- **Plans/COE-Master-Plan/** - 10 architecture documents (agent specs, MCP API, workflows)

### Current Work
- **Status/current-plan.md** - This file (project status + current phase)
- **Status/status-log.md** - Chronological log of all changes
- **Status/agent-status-report.md** - Agent team status (if active)
- **Status/archive/** - 96 historical files

---

## 🎯 Success Criteria

### For AI Use System Phase (Feb 5-15)
- ✅ All 6 features (F023-F028) working end-to-end
- ✅ Ticket DB persisting across extension restart
- ✅ Orchestrator routing + blocker detection functioning
- ✅ Agents Sidebar showing live status (5 teams)
- ✅ Tickets Sidebar showing all tickets grouped by status
- ✅ Streaming LLM respecting inactivity timeout from config
- ✅ Verification Panel showing test results
- ✅ No TypeScript errors
- ✅ ≥75% test coverage (≥80% for P1)
- ✅ Config.json NEVER written to (read-only verified)

### Overall Quality Target
- Zero TypeScript errors
- ≥97% test coverage (existing standard)
- All existing features still working (no regressions)
- Ready for Feb 15 MVP launch

---

## 📞 Key Decisions & Trade-offs

| Decision | Why | Impact |
|----------|-----|--------|
| Ticket DB = SQLite | Lightweight, embedded, deterministic | `.coe/tickets.db` in workspace |
| In-memory fallback | Ensures no crashes if DB missing | Loses tickets on restart if DB unavailable |
| Config read-only | Prevents accidental overwrites | Must hardcode defaults, cannot auto-tune |
| Simple sidebar tabs | Fast to ship, reuses existing patterns | Limited to status display initially |
| 30s blocker timeout | Prevents hangs, auto-escalates blockers | May create tickets for slow responses |

---

## ✅ Quick Setup Checklist (Before Feb 5)

- [ ] All developers have read AI-USE-SYSTEM-QUICK-REFERENCE.md
- [ ] GitHub Issues created from 8 atomic P1/P2/P3 tasks
- [ ] Task assignments confirmed (2 devs for P1, 2 for P2)
- [ ] LLM config working (tested endpoint connectivity)
- [ ] Existing tests passing 100%
- [ ] Fresh DB not created yet (will be first in P1-Task-1)

---

**Last Updated**: January 27, 2026  
**Status**: AI Use System planning complete, ready for implementation  
**Next Review**: After Feb 5 Phase 1 completion  
**Owner**: COE Team

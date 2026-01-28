# Project Breakdown - Plan-To-Code AI Helper
**Comprehensive Task Hierarchy**  
**Last Updated**: January 27, 2026  
**Status**: Development in Progress (58% Complete)
**Major Update**: AI Use System planning integrated (Multi-Agent Orchestration Phase)

---

## 📋 How to Use This Document

This is your **master to-do list** breaking down the entire project into:
- **Phases** - Major development stages
- **Features** - Big ticket items (35 total features)
- **Sub-Tasks** - Detailed implementation steps under each feature

**No timelines** - just the hierarchical work structure to track through completion.

---

## PHASE 1: Foundation & Core Infrastructure ✅ COMPLETE

### 1.1 Unified Agent System ✅
- [x] Create unified_agent.py with five-role architecture
- [x] Implement Planner role (requirement analysis, vagueness detection)
- [x] Implement Architect role (system design, component specs)
- [x] Implement Coder role (code generation, documentation)
- [x] Implement Reviewer role (quality checks, standards compliance)
- [x] Implement Executor role (test execution, validation)
- [x] Add Context management across roles
- [x] Add SmartPlan vagueness detection
- [x] Add ZenTasks workflow management
- [x] Add Tasksync feedback loops
- [x] Create Overseer orchestration engine
- [x] Add role switching mechanism
- [x] Create comprehensive test suite (10 tests)
- [x] Document all public APIs

### 1.2 Background Worker Delegation ✅
- [x] Create background_worker.py module
- [x] Implement BackgroundWorker class with thread pool
- [x] Add thread-safe task queue operations
- [x] Implement task status tracking (QUEUED/RUNNING/COMPLETED/FAILED/CANCELLED)
- [x] Add task submission API
- [x] Add task cancellation support
- [x] Add result retrieval with timeout
- [x] Implement shutdown handling
- [x] Add global worker singleton pattern
- [x] Create delegate_to_background convenience function
- [x] Add 5 comprehensive tests
- [x] Fix shutdown edge cases

### 1.3 Planning Framework ✅
- [x] Create Plans/ directory structure
- [x] Write CONSOLIDATED-MASTER-PLAN.md (1,088 lines)
- [x] Create COE-Master-Plan/ architecture docs
  - [x] 01-Architecture-Document.md
  - [x] 02-Agent-Role-Definitions.md (1,021 lines)
  - [x] 03-Workflow-Orchestration.md
  - [x] 04-Data-Flow-State-Management.md
  - [x] 05-MCP-API-Reference.md (978 lines)
- [x] Write QUICK-REFERENCE-CARD.md
- [x] Write MODULAR-EXECUTION-PHILOSOPHY.md
- [x] Create PROJECT-PLAN-TEMPLATE.md
- [x] Document all 35 features with acceptance criteria
- [x] Create visual documentation maps

---

## PHASE 2: VS Code Extension Foundation 🔄 IN PROGRESS (75% Complete)

### F034: VS Code Extension UI - Settings Panel ✅ COMPLETE
- [x] Create extension activation logic
- [x] Implement settings panel with 7 tabs
  - [x] General settings
  - [x] Agent configuration
  - [x] GitHub integration
  - [x] MCP server settings
  - [x] Context limits
  - [x] Visual verification
  - [x] Advanced options
- [x] Add secure credential storage
- [x] Create 95 comprehensive tests
- [x] Implement dark/light theme support
- [x] Add settings validation
- [x] Add settings export/import

### F028: GitHub Issues Bi-Directional Sync ✅ COMPLETE
- [x] Implement GitHub API OAuth flow
- [x] Create issue creation from tasks
- [x] Implement bi-directional sync engine
- [x] Add sub-issue linking
- [x] Add batching for rate limit optimization
- [x] Implement caching layer
- [x] Add exponential backoff retry logic
- [x] Create 16 comprehensive tests
- [x] Achieve 99%+ sync accuracy
- [x] Add 5-minute sync interval
- [x] Handle rate limit scenarios
- [x] Add conflict resolution

## PHASE 3: MCP Server & Agent Coordination 🔄 IN PROGRESS (75% Complete)

**This phase implements the complete AI Use System** - multi-agent orchestration, ticket-based communication between agents and users, and streaming LLM integration with inactivity timeout.

### 📊 Phase 3 Progress Tracker

#### ✅ Foundation Complete (3/10 features)
- [x] **F002**: Plan Decomposition Engine (20 tests, AI-powered breakdown)
- [x] **F022**: MCP Server with 6 Core Tools (WebSocket + SQLite, comprehensive tests)
- [x] **F010**: Context Bundle Builder (token tracking, overflow prevention)

#### 🔄 In Progress (2/10 features)
- [ ] **F001**: Interactive Plan Builder (visual UI, on hold pending AI Use System)
- [ ] **F016**: Multi-Agent Orchestration (5 agents total: Programming Orchestrator, Planning Team, Answer Team, Verification Team, Task Decomposition; ALL use ticket system F023 for communication)

#### 🎯 AI Use System - Ready to Implement (6/10 features)

**📚 Detailed Planning**: See `Plans/AI-USE-SYSTEM-PLANNING-INDEX.md` for 4 comprehensive implementation guides

**🔴 P1 Core Features (NEXT UP - Start Immediately)**
- [ ] **F023**: Ticket Database & Communication Layer (4-6 hrs, no blockers) ⭐ **START HERE**
  - SQLite schema at `.coe/tickets.db`
  - CRUD operations + MCP tools integration
  - In-memory fallback for resilience
- [ ] **F024**: Programming Orchestrator Task Routing (3-4 hrs, depends on F023)
  - Task-by-task Copilot direction
  - Blocker detection with auto-escalation
  - Config-driven inactivity timeout

**🟡 P2 UI Features (Blocked by P1)**
- [ ] **F025**: Agents Sidebar Tab (3-4 hrs, blocked by F024)
  - Live status for 5 agent teams
  - Real-time metrics display
- [ ] **F026**: Tickets Sidebar Tab (3-4 hrs, blocked by F023)
  - Ticket grouping by status
  - Reply thread UI with Clarity scoring
- [ ] **F027**: Streaming LLM Mode (2-3 hrs, no dependencies)
  - Config-driven inactivity timeout
  - Graceful degradation on timeout

**🟢 P3 Polish Features (Blocked by P1 + P2)**
- [ ] **F028**: Verification Panel UI (2-3 hrs, blocked by F023 + F024)
  - Test results display
  - Re-run, approve, escalate actions

**📅 Timeline to AI Use System MVP**: ~15-20 hours total → Feb 15, 2026 target

**🎫 Central Principle**: All agents (Planning, Orchestrator, Answer, Verification, Clarity) communicate with users and each other via the **Ticket System** (F023). No ad-hoc chat, no separate channels.

---

### F001: Interactive Plan Builder 🔄 IN PROGRESS/On Hold
- [ ] Design visual drag-and-drop UI
  - [ ] Task card components
  - [ ] Dependency arrow rendering
  - [ ] Timeline visualization
  - [ ] Resource allocation display
- [ ] Implement 10-question design workflow
  - [ ] Project type selection
  - [ ] Complexity assessment
  - [ ] Timeline estimation
  - [ ] Team size configuration
  - [ ] Design system integration
  - [ ] Testing strategy selection
  - [ ] Deployment preferences
  - [ ] Monitoring setup
  - [ ] Documentation requirements
  - [ ] Success criteria definition
- [ ] Add 3 user journey paths
  - [ ] Quick (15 min)
  - [ ] Standard (30 min)
  - [ ] Comprehensive (60 min)
- [ ] Implement circular dependency detection
- [ ] Add critical path highlighting
- [ ] Create template library (5+ templates)
  - [ ] Microservice template
  - [ ] API template
  - [ ] UI component template
  - [ ] Data pipeline template
  - [ ] Full-stack app template
- [ ] Add real-time dependency linking
- [ ] Implement DAG validation
- [ ] Add auto-save functionality
- [ ] Create comprehensive tests

### F002: Plan Decomposition Engine ✅ COMPLETE
- [x] Create AI-powered task breakdown algorithm
- [x] Implement dependency detection
- [x] Add effort estimation
- [x] Create sub-task generation (3-5 per parent)
- [x] Add acceptance criteria generation
- [x] Implement parent-child relationship tracking
- [x] Add notification system for decomposition
- [x] Create 20 comprehensive tests
- [x] Add user review workflow (Accept/Reject/Edit)

---

### F022: MCP Server with 6 Core Tools ✅ COMPLETE
- [x] Set up Node.js MCP server
- [x] Implement WebSocket server
- [x] Create SQLite database with WAL mode
- [x] Tool 1: getNextTask
  - [x] Priority-based task selection
  - [x] Dependency resolution
  - [x] Agent preference matching
- [x] Tool 2: reportTaskStatus
  - [x] Status transitions
  - [x] Timestamp tracking
  - [x] Event emissions
- [x] Tool 3: reportObservation
  - [x] Note attachment
  - [x] File linking
  - [x] Priority tagging
- [x] Tool 4: reportTestFailure
  - [x] Auto investigation task creation
  - [x] Stack trace capture
  - [x] File impact tracking
- [x] Tool 5: reportVerificationResult
  - [x] Pass/fail/partial results
  - [x] Issue tracking
  - [x] Screenshot support
  - [x] Checklist scoring
- [x] Tool 6: askQuestion
  - [x] Answer Team routing
  - [x] Confidence scoring
  - [x] Source citation
  - [x] Escalation logic
- [x] Add comprehensive error handling
- [x] Create integration tests

### F016: Multi-Agent Orchestration 🔄 IN PROGRESS
**🎫 Uses Ticket System**: All 4 agent teams communicate via F023 (Ticket DB). Agents create ai_to_human tickets when blocked; users reply via Tickets Tab.

#### Programming Orchestrator
- [x] Create orchestrator base class
- [ ] Implement task routing algorithm
  - [ ] Route by estimated hours (>1hr → Decomposition)
  - [ ] Route by status (done → Verification)
  - [ ] Route questions to Answer Team
  - [ ] Default route to Planning Team
- [ ] Add agent health monitoring
  - [ ] Response time tracking
  - [ ] Failure rate metrics
  - [ ] Velocity calculation
- [ ] Implement fallback strategies
  - [ ] 30-second timeout handling
  - [ ] Agent unavailability handling
  - [ ] Load balancing
- [ ] Create metrics aggregation
  - [ ] Dashboard data preparation
  - [ ] Real-time WebSocket updates
  - [ ] Historical data tracking
- [ ] Add coordination dashboard UI
  - [ ] Agent status cards
  - [ ] Live metrics display
  - [ ] Configuration toggles
  - [ ] Plan selector
- [ ] Create comprehensive tests

#### Planning Team Agent
- [x] Design agent interface
- [ ] Implement plan generation from requirements
  - [ ] Natural language processing
  - [ ] Task extraction
  - [ ] Dependency inference
- [ ] Add dependency-aware task breakdown
  - [ ] DAG validation
  - [ ] Circular dependency prevention
  - [ ] Critical path analysis
- [ ] Create effort estimation engine
  - [ ] Historical data analysis
  - [ ] Complexity scoring
  - [ ] Resource availability
- [ ] Implement plan adaptation
  - [ ] Execution feedback integration
  - [ ] Progress-based updates
  - [ ] Risk mitigation
- [ ] Add output generation
  - [ ] plan.json creation
  - [ ] metadata.json versioning
  - [ ] design-system.json references
- [ ] Create comprehensive tests

#### Answer Team Agent
- [x] Design Q&A interface
- [ ] Implement context-aware search
  - [ ] Semantic search over plan
  - [ ] Code file indexing
  - [ ] Architecture doc parsing
- [ ] Add technical question answering
  - [ ] Confidence scoring (threshold: 0.7)
  - [ ] Source citation
  - [ ] Multi-source synthesis
- [ ] Create escalation logic
  - [ ] Low confidence detection
  - [ ] Human handoff workflow
  - [ ] Follow-up tracking
- [ ] Add response caching
  - [ ] Similar question detection
  - [ ] Cache invalidation
  - [ ] Performance optimization
- [ ] Create comprehensive tests

#### Task Decomposition Agent
- [x] Design decomposition interface
- [ ] Implement complexity monitoring
  - [ ] Estimated hours threshold (>60 min)
  - [ ] Acceptance criteria count
  - [ ] Dependency complexity
- [ ] Add AI-assisted subtask generation
  - [ ] 3-5 subtasks per parent
  - [ ] Atomic task validation
  - [ ] Balanced effort distribution
- [ ] Create parent-child preservation
  - [ ] Relationship tracking
  - [ ] Hierarchy visualization
  - [ ] Dependency propagation
- [ ] Implement notification system
  - [ ] Decomposition summary
  - [ ] User review workflow
  - [ ] Auto-application option
- [ ] Create comprehensive tests

#### Verification Team
- [x] Design verification interface
- [ ] Implement automated testing
  - [ ] Test execution
  - [ ] Result collection
  - [ ] Coverage analysis
- [ ] Add visual verification workflow
  - [ ] Dev server launch
  - [ ] Checklist generation
  - [ ] Design system reference
  - [ ] Screenshot capture
- [ ] Create investigation task generation
  - [ ] Failure detection
  - [ ] Impact analysis
  - [ ] Priority assignment
- [ ] Add result reporting
  - [ ] Pass/fail/partial status
  - [ ] Issue documentation
  - [ ] Screenshot attachment
- [ ] Create comprehensive tests

### F010: Context Bundle Builder ✅ COMPLETE
- [x] Create context bundling engine
- [x] Implement file list generation
- [x] Add design system references
- [x] Create acceptance criteria extraction
- [x] Add token limit tracking
- [x] Implement context overflow prevention
- [x] Add caching layer
- [x] Create comprehensive tests

### F023: AI Use System - Ticket Database & Communication Layer 🔄 P1 PRIORITY
**Purpose**: Central communication hub for ALL agents. Replaces ad-hoc chat with structured tickets. **SEPARATED DATABASES**: active tickets + completed task history.
- [x] Create SQLite schema at `.coe/tickets.db` with SEPARATED TABLES:
  - [x] **ACTIVE**: Tickets table (id, type, status, priority, creator, assignee, task_id, title, description, timestamps)
  - [x] **HISTORY**: Completed_tasks table (task_id, original_ticket_id, title, status, priority, completed_at, duration_minutes, outcome, created_at) ← NEW for P1.1
  - [ ] Ticket replies table (id, ticket_id, author, content, clarity_score, needs_followup, timestamp)
  - [x] Indexes for fast status/assignee lookups
  - [x] Schema versioning (db_version table) for migrations (P1.2 completed)
- [x] Implement HISTORY operations on COMPLETED tasks (P1.1)
  - [x] archiveTask(taskId) → move to completed_tasks, delete from active
  - [x] getAllCompleted(filters?) → retrieve completed task history
  - [ ] Auto-cleanup tasks >taskRetentionDays (default 30, from config.json)
  - [x] Indexed queries on status and completion date
- [ ] Implement CRUD operations on ACTIVE tickets
  - [ ] createTicket(type, title, description, priority, creator) → ticket ID
  - [ ] getTicket(id) → full ticket + thread
  - [ ] getTickets(filters) → paginated list (active only)
  - [ ] updateTicketStatus(id, newStatus) → updates timestamp
  - [ ] addReply(ticketId, author, content) → reply ID
  - [ ] Soft delete via status='archived'
- [ ] Implement in-memory fallback
  - [ ] Use Map<string, Ticket> if SQLite init fails
  - [ ] Log warning to user ("DB unavailable; tickets won't persist")
  - [ ] Still provide full UI/API (no crashes)
- [ ] Add new MCP tools for ticket interaction
  - [ ] createTicket MCP tool
  - [ ] replyToTicket MCP tool
  - [ ] getTickets MCP tool
  - [ ] getTicket MCP tool
- [ ] Create comprehensive tests (≥80% coverage)
  - [x] CRUD on completed_tasks (P1.1)
  - [x] archiveTask() and getAllCompleted() (P1.1)
  - [x] Data integrity with separated tables (P1.1)
  - [x] Schema migration v0→v1 (P1.2)
  - [ ] CRUD on active tickets, in-memory fallback, concurrency, MCP tools

**Timeline**: 4–6 hours | **Blockers**: None | **Integration**: .coe/tickets.db (P1.2 migration v0→v1 done), MCP tools | **Config**: taskRetentionDays in .coe/config.json | **Status**: P1.1 (completed tasks) + P1.2 (schema versioning) COMPLETE, P1.0 (active tickets CRUD) IN PROGRESS

### F024: AI Use System - Programming Orchestrator Task Routing 🔄 P1 PRIORITY
**Purpose**: Direct Copilot task-by-task; auto-escalate via **ticket creation** (F023) if blocked >30s (no token from LLM).
- [ ] Implement task assignment workflow
  - [ ] getNextTask() → pull highest P1 from queue
  - [ ] Send task to Copilot via MCP with super-detailed prompt
  - [ ] Track currentTask in Orchestrator state
  - [ ] reportTaskStatus('completed') → update queue
- [ ] Implement blocker detection logic
  - [ ] Monitor LLM token inactivity (timeout from config.llm.timeoutSeconds)
  - [ ] If no token for >30s:
    - [ ] Auto-create ticket (type='ai_to_human', priority=P1)
    - [ ] Call MCP askQuestion() with task context
    - [ ] Log warning to console
- [ ] Add config integration
  - [ ] Read config.llm.timeoutSeconds (default 60s)
  - [ ] **Never write to config** (read-only)
  - [ ] Use for inactivity timeout, not total request timeout
- [ ] Create routing audit trail
  - [ ] Log all routing decisions (JSON format)
  - [ ] Track task → agent assignments
  - [ ] Record escalations with reasons
- [ ] Create comprehensive tests (≥75% coverage)
  - [ ] Task assignment + priority ordering
  - [ ] Blocker detection after timeout
  - [ ] Config read-only verification
  - [ ] Ticket creation on escalation

**Timeline**: 3–4 hours | **Blockers**: F023 (Ticket DB) | **Integration**: Reuses MCP tools + existing task queue

### F025: AI Use System - Agents Sidebar Tab 🔄 P2 PRIORITY
**Purpose**: Display live status of 5 agent teams (Planning, Orchestrator, Answer, Verification, Clarity). All agents log to shared system; all use ticket system (F023) for communication.

- [ ] Implement agent logging infrastructure
  - [ ] Create logger utility (JSON lines format to `agents.log`)
  - [ ] Log all agent actions (task assignment, ticket creation, responses)
  - [ ] Track metrics per agent (response time, task count, uptime)
  - [ ] Implement log rotation (max 10 MB, keep 5 old files)
  - [ ] Ensure ALL agents (Planning, Orchestrator, Answer, Verification, Clarity) use same logger
- [ ] Create AgentsTreeProvider (extends TreeDataProvider<AgentItem>)
  - [ ] Display 5 agents: Planning Team, Programming Orchestrator, Answer Team, Verification Team, Clarity Agent
  - [ ] Status indicator per agent (Idle / Working / Waiting / Error)
  - [ ] Show current task/activity for active agents
  - [ ] Display uptime + last activity timestamp
  - [ ] Show ticket count per agent (how many tickets each created/resolved)
- [ ] Implement tree view UI
  - [ ] Use emoji for quick scanning (🤖 for agents, 🟢/🟡/🔴 for status)
  - [ ] Refresh every 5 seconds (configurable)
  - [ ] Click agent → open webview with logs/stats
  - [ ] Right-click menu: View logs, Reset agent, Escalate to user
- [ ] Add agent webview panel
  - [ ] Display last 20 log entries (JSON lines format)
  - [ ] Show metrics (avg response time, tasks completed, uptime)
  - [ ] Color-coded status (green=Idle, blue=Working, yellow=Waiting, red=Error)
  - [ ] Show agent's ticket history (created/resolved tickets from F023)
- [ ] Create comprehensive tests
  - [ ] Tree renders all 5 agents
  - [ ] Status updates in real-time
  - [ ] Click opens correct webview
  - [ ] Menu actions trigger correctly
  - [ ] Logging infrastructure works for all agents

**Timeline**: 3–4 hours | **Blockers**: F024 (Orchestrator routing) | **Integration**: Extends tasksTreeView pattern; reads from agents.log

### F026: AI Use System - Tickets Sidebar Tab 🔄 P2 PRIORITY
**Purpose**: Display ALL agent-created tickets (from Planning, Orchestrator, Answer, Verification, Clarity teams) grouped by status; click to open details + reply thread.
- [ ] Create TicketsTreeProvider (extends TreeDataProvider<TicketItem>)
  - [ ] Group tickets by status (Open / In Review / Resolved / Escalated)
  - [ ] Show ticket ID, title, priority badge (P1/P2/P3), assignee
  - [ ] Display count for each group
  - [ ] Filter by priority (P1 / P2 / P3 / All)
  - [ ] Refresh every 5 seconds
- [ ] Implement tree view UI
  - [ ] Use emoji for quick scanning (🎫=ticket, 📋=open, ✅=resolved, 🚨=escalated)
  - [ ] Click ticket → open webview with full details
  - [ ] Right-click menu: Mark as reviewed, Escalate, Archive
  - [ ] Show "X new" badge on tab if unreviewed tickets
- [ ] Add ticket details webview
  - [ ] Display header (ID, status, priority, creator, assignee)
  - [ ] Show description
  - [ ] Display full thread (replies with author, content, clarity score, timestamp)
  - [ ] Reply input box at bottom
  - [ ] Send reply → calls addReply() → auto-score with Clarity Agent
  - [ ] Buttons: Send, Close & Resolve, Escalate
- [ ] Create comprehensive tests
  - [ ] Tree groups tickets by status
  - [ ] Click opens correct webview
  - [ ] Filter works (P1 only shows P1)
  - [ ] Counts match DB

**Timeline**: 3–4 hours | **Blockers**: F023 (Ticket DB) | **Integration**: Extends tasksTreeView pattern; queries ticket DB

### F027: AI Use System - Streaming LLM Mode with Inactivity Timeout 🔄 P2 PRIORITY
**Purpose**: Stream LLM responses with config-driven inactivity timeout (graceful close if no tokens).
- [ ] Attach streaming listener to LLM calls
  - [ ] LLM clients (OpenAI, Mistral) support stream: true
  - [ ] Streaming listener records last token timestamp
  - [ ] Loop: while (now - last_token_time < config.timeoutSeconds)
    - [ ] Read next token
    - [ ] Append to response buffer
    - [ ] Update last_token_time
- [ ] Implement graceful timeout handling
  - [ ] If no token for config.timeoutSeconds: exit loop (don't retry)
  - [ ] Return accumulated response buffer (partial OK)
  - [ ] Log warning: "LLM inactivity detected; used partial response"
  - [ ] Don't throw exception (graceful degradation)
- [ ] Add config integration
  - [ ] Read config.llm.timeoutSeconds on startup (default 60s)
  - [ ] Use for max inactivity between tokens
  - [ ] **Never write to config**
  - [ ] Fallback to 60s if config missing
- [ ] Create comprehensive tests (≥70% coverage)
  - [ ] Stream starts and receives tokens
  - [ ] Token time tracked correctly
  - [ ] Timeout triggers after N seconds no-token
  - [ ] Buffer accumulated (partial response OK)
  - [ ] Config not modified
  - [ ] Warning logged to console/output
  - [ ] No crashes on timeout

**Timeline**: 2–3 hours | **Blockers**: None | **Integration**: LLM service + config manager (read-only)

### F028: AI Use System - Verification Panel UI (Test Results Display) 🔄 P3 PRIORITY
**Purpose**: Show Verification Team test results; allow re-run, approve, or escalate.
- [ ] Create verification webview panel
  - [ ] Display test output (failed/passed counts, statistics)
  - [ ] Show stack traces for failures
  - [ ] Clickable file links (jump to editor)
  - [ ] Coverage summary if available
- [ ] Implement result actions
  - [ ] **Re-Run Tests** button → triggers test execution
  - [ ] **Approve Changes** button → calls reportVerificationResult('passed')
  - [ ] **Escalate** button → creates investigation ticket
  - [ ] **Dismiss** button → hides panel
- [ ] Add auto-dismiss logic
  - [ ] If all tests pass: auto-dismiss after 10s (configurable)
  - [ ] If failures: stays visible until user acts
  - [ ] Manual dismiss always works
- [ ] Integrate with Verification Team
  - [ ] Triggered automatically 60s after file changes
  - [ ] Reads test results from reportVerificationResult calls
  - [ ] Calls MCP tools for user actions
- [ ] Create comprehensive tests
  - [ ] Panel loads test output correctly
  - [ ] File links clickable
  - [ ] Button actions call correct MCP tools
  - [ ] Auto-hide timer works

**Timeline**: 2–3 hours | **Blockers**: F023, F024 (for integration) | **Integration**: Verification Team + MCP tools

---

## PHASE 4: Visual Tools & UI Components (Advanced) 📅 QUEUED

### F029: Review Tool with Annotation System
- [ ] Design annotation UI
- [ ] Implement file diff viewer
  - [ ] Side-by-side comparison
  - [ ] Inline highlighting
  - [ ] Syntax highlighting
- [ ] Add 6 annotation types
  - [ ] Suggestion
  - [ ] Question
  - [ ] Praise
  - [ ] Issue
  - [ ] Security concern
  - [ ] Performance note
- [ ] Create comment threading
  - [ ] Reply support
  - [ ] Resolution tracking
  - [ ] User tagging
- [ ] Add batch annotation
  - [ ] Multi-file selection
  - [ ] Template comments
  - [ ] Bulk resolution
- [ ] Implement integration with GitHub PR reviews
- [ ] Create comprehensive tests

### F030: Plan Adjustment Wizard
- [ ] Design wizard UI flow
- [ ] Implement change detection
  - [ ] Diff computation
  - [ ] Affected task identification
  - [ ] Dependency impact analysis
- [ ] Add impact visualization
  - [ ] Affected task tree
  - [ ] Timeline shift preview
  - [ ] Resource reallocation
- [ ] Create task regeneration
  - [ ] Preserve completed work
  - [ ] Update in-progress tasks
  - [ ] Regenerate pending tasks
- [ ] Add approval workflow
  - [ ] Change summary
  - [ ] Impact report
  - [ ] Confirm/cancel
- [ ] Implement rollback capability
  - [ ] Plan versioning
  - [ ] Restore previous version
  - [ ] Rollback confirmation
- [ ] Create comprehensive tests

---

## PHASE 5: AI Integration & Intelligence 📅 QUEUED

### Stage 1: Core AI Functionality

#### F031: Boss AI Team - Basic Coordination
- [ ] Design Boss AI architecture
- [ ] Implement task routing to agent teams
  - [ ] Team capability matching
  - [ ] Workload balancing
  - [ ] Priority enforcement
- [ ] Add team status monitoring
  - [ ] Health checks
  - [ ] Availability tracking
  - [ ] Performance metrics
- [ ] Create conflict detection
  - [ ] Plan vs. execution drift (>20%)
  - [ ] Resource conflicts
  - [ ] Dependency violations
- [ ] Implement metrics aggregation
  - [ ] Cross-team statistics
  - [ ] Dashboard data feed
  - [ ] Trend analysis
- [ ] Add team lifecycle management
  - [ ] Team startup/shutdown
  - [ ] State transitions
  - [ ] Error recovery
- [ ] Create comprehensive tests

#### F037: Context Limiting - Basic Overflow Prevention
- [ ] Implement global context limit (default: 5,000 tokens)
- [ ] Add minimum floor (3,500 tokens)
- [ ] Create basic summarization
  - [ ] Detect >80% threshold
  - [ ] Trigger summarization
  - [ ] Preserve critical context
- [ ] Add auto-recovery on overflow
  - [ ] Fresh start with handover
  - [ ] State preservation
  - [ ] Continuity guarantee
- [ ] Create sidebar status indicator
  - [ ] Current token count
  - [ ] Percentage used
  - [ ] Warning indicators
- [ ] Add configuration UI
- [ ] Create comprehensive tests

#### F038: Basic Task Routing Algorithm
- [ ] Implement routing rules
  - [ ] Estimated hours >1hr → Task Decomposition
  - [ ] Status = 'done' → Verification Team
  - [ ] Has open questions → Answer Team
  - [ ] Default → Planning Team
- [ ] Add routing validation
  - [ ] 100% test task coverage
  - [ ] Edge case handling
  - [ ] Fallback logic
- [ ] Create routing metrics
  - [ ] Decision tracking
  - [ ] Accuracy measurement
  - [ ] Performance monitoring
- [ ] Add routing configuration
  - [ ] Threshold adjustments
  - [ ] Rule customization
  - [ ] Override options
- [ ] Create comprehensive tests

### Stage 2: Advanced AI Features

#### F039: LangGraph Integration - Advanced Workflows
- [ ] Integrate LangGraph library
- [ ] Implement conditional edges
  - [ ] Drift >0.2 → Verification
  - [ ] Error → Investigation
  - [ ] Complexity >60min → Decomposition
- [ ] Add loop support
  - [ ] Retry loops (max 3)
  - [ ] Review cycles
  - [ ] Refinement iterations
- [ ] Create state checkpoints
  - [ ] Automatic snapshots
  - [ ] Recovery points
  - [ ] State restoration
- [ ] Implement supervisor pattern
  - [ ] Boss oversees sub-graphs
  - [ ] Nested workflow support
  - [ ] Cross-graph coordination
- [ ] Add workflow visualization
  - [ ] Graph rendering
  - [ ] State highlighting
  - [ ] Execution trace
- [ ] Create comprehensive tests

#### F040: AutoGen Framework - Agent Communication
- [ ] Integrate AutoGen library
- [ ] Implement group chats
  - [ ] Multi-agent conversations
  - [ ] Turn-taking logic
  - [ ] Consensus building
- [ ] Add human-in-loop escalation
  - [ ] Escalation triggers
  - [ ] Human approval workflow
  - [ ] Handoff protocol
- [ ] Create message compression
  - [ ] Optimize for 14B models
  - [ ] Context pruning
  - [ ] Summary generation
- [ ] Implement tool chaining
  - [ ] Agents call MCP tools
  - [ ] Tool result propagation
  - [ ] Error handling
- [ ] Add chat history tracking
  - [ ] Conversation persistence
  - [ ] History retrieval
  - [ ] Context reconstruction
- [ ] Create comprehensive tests

#### F041: Loop Detection & Recovery
- [ ] Implement LangGraph cycle detection
  - [ ] Track repeated nodes
  - [ ] Detect >3 repeats
  - [ ] Break and escalate
- [ ] Add AutoGen pattern matching
  - [ ] Message similarity scoring (>0.8)
  - [ ] Repetition detection
  - [ ] Auto-break logic
- [ ] Create metrics-based detection
  - [ ] No progress in 5 cycles
  - [ ] Task velocity drop
  - [ ] Resource exhaustion
- [ ] Implement auto-recovery
  - [ ] Escalate to Researcher
  - [ ] Boss intervention
  - [ ] Alternative path selection
- [ ] Add sidebar alerts
  - [ ] Loop warnings
  - [ ] Recovery status
  - [ ] Manual override
- [ ] Create comprehensive tests

#### F042: Agent Evolution - UV Tasks & Updating Tool
- [ ] Design evolution framework
- [ ] Implement pattern detection (Critic)
  - [ ] Linting misses >3
  - [ ] Test failures pattern
  - [ ] Code quality trends
- [ ] Create UV (Update Verification) task generation
  - [ ] Auto-create UV tasks
  - [ ] Link to pattern source
  - [ ] Priority assignment
- [ ] Add updateTemplate MCP tool
  - [ ] YAML-only changes
  - [ ] Safe update validation
  - [ ] Rollback support
- [ ] Implement evolution tracking
  - [ ] Template version history
  - [ ] Success metrics
  - [ ] Improvement trends
- [ ] Create 3+ evolution examples
  - [ ] Linting improvement
  - [ ] Test coverage boost
  - [ ] Code quality enhancement
- [ ] Add comprehensive tests

#### F043: Advanced Context Breaking Strategies
- [ ] Implement Summarize Old strategy
  - [ ] Temporal compression
  - [ ] Key point extraction
  - [ ] Chronological pruning
- [ ] Add Prioritize Recent strategy
  - [ ] Relevance scoring
  - [ ] Recency weighting
  - [ ] Smart pruning
- [ ] Create Content-Type Chunking
  - [ ] Code vs. text separation
  - [ ] Priority by type
  - [ ] Balanced distribution
- [ ] Implement Discard Low-Relevance
  - [ ] Aggressive pruning
  - [ ] Critical preservation
  - [ ] Confidence thresholds
- [ ] Add Hybrid strategy chaining
  - [ ] Multi-strategy composition
  - [ ] Adaptive selection
  - [ ] Performance optimization
- [ ] Target <5% overflow rate
- [ ] Create comprehensive tests

#### F044: Researcher Team Agent
- [ ] Design Researcher agent architecture
- [ ] Implement web search integration
  - [ ] Search API connection
  - [ ] Query generation
  - [ ] Result filtering
- [ ] Add documentation scraping
  - [ ] browse_page tool integration
  - [ ] Content extraction
  - [ ] Relevance scoring
- [ ] Create solution generation
  - [ ] Ambiguity resolution
  - [ ] Issue diagnosis
  - [ ] Alternative approaches
- [ ] Add Coding AI integration
  - [ ] Feed solutions to prompts
  - [ ] Context enrichment
  - [ ] Guidance injection
- [ ] Target 80%+ autonomous resolution
- [ ] Create comprehensive tests

#### F045: Critic Team Agent
- [ ] Design Critic agent architecture
- [ ] Implement output review
  - [ ] Plan quality assessment
  - [ ] Code review automation
  - [ ] Documentation analysis
- [ ] Add agent rating system
  - [ ] 1-10 scale scoring
  - [ ] Performance tracking
  - [ ] Comparative analysis
- [ ] Create improvement suggestions
  - [ ] Pattern identification
  - [ ] Recommendation generation
  - [ ] Prioritization logic
- [ ] Add RL training data generation
  - [ ] Reward/penalty signals
  - [ ] Feature extraction
  - [ ] Dataset curation
- [ ] Implement evolution triggers
  - [ ] Pattern detection for F042
  - [ ] UV task creation
  - [ ] Feedback loops
- [ ] Create comprehensive tests

#### F046: Scraper Team Agent
- [ ] Design Scraper agent architecture
- [ ] Implement Coding AI output scraping
  - [ ] Document parsing
  - [ ] Code extraction
  - [ ] Artifact collection
- [ ] Add on-task verification
  - [ ] Task alignment check
  - [ ] Scope validation
  - [ ] Deviation detection
- [ ] Create communication checking
  - [ ] MCP protocol compliance
  - [ ] Message validation
  - [ ] Response quality
- [ ] Add reporting to Boss/Critic
  - [ ] Status updates
  - [ ] Issue escalation
  - [ ] Metrics reporting
- [ ] Implement miscommunication escalation
  - [ ] Error detection
  - [ ] Human notification
  - [ ] Resolution tracking
- [ ] Create comprehensive tests

#### F047: Updater Agent
- [ ] Design Updater agent architecture
- [ ] Implement junk file cleanup
  - [ ] Identify temporary files
  - [ ] Safe deletion
  - [ ] Post-use cleanup
- [ ] Add documentation organization
  - [ ] Folder structure enforcement
  - [ ] File categorization
  - [ ] Naming conventions
- [ ] Create conflict resolution
  - [ ] Duplicate detection
  - [ ] Smart merging
  - [ ] User approval
- [ ] Add File Tree integration
  - [ ] Structure visualization
  - [ ] Change tracking
  - [ ] Integrity validation
- [ ] Implement background operation
  - [ ] Non-blocking execution
  - [ ] Progress notifications
  - [ ] Error handling
- [ ] Create comprehensive tests

### Stage 3: AI Optimization

#### F048: Customizable Context Limiting per LLM
- [ ] Implement per-LLM limits
  - [ ] Local 14B: 3,500 tokens
  - [ ] Grok: 8,000 tokens
  - [ ] GPT-4: 16,000 tokens
  - [ ] Claude: 100,000 tokens
- [ ] Add user-specified minimum floor
  - [ ] UI input field
  - [ ] Validation logic
  - [ ] Default fallback
- [ ] Create 'Follow Default' checkbox
  - [ ] Per-LLM toggle
  - [ ] Cascade logic
  - [ ] Inheritance rules
- [ ] Implement per-agent overrides
  - [ ] Agent-specific settings
  - [ ] Priority resolution
  - [ ] Conflict handling
- [ ] Add sidebar configuration UI
  - [ ] LLM selection
  - [ ] Limit adjustment
  - [ ] Visual indicators
- [ ] Create comprehensive tests

#### F049: Token Estimator with Tiktoken
- [ ] Integrate tiktoken JavaScript library
- [ ] Add HuggingFace tokenizer fallback
  - [ ] Model-specific tokenizers
  - [ ] Automatic selection
  - [ ] Error handling
- [ ] Implement batch optimization
  - [ ] Encoding caching
  - [ ] Batch processing
  - [ ] Performance tuning
- [ ] Target ±5% accuracy
- [ ] Replace all placeholder estimateTokens calls
- [ ] Create comprehensive tests

#### F050: Embedding Service for Relevance Scoring
- [ ] Integrate MiniLM (sentence-transformers)
- [ ] Implement cosine similarity scoring
  - [ ] Embedding generation
  - [ ] Similarity computation
  - [ ] Threshold tuning
- [ ] Add batch embedding generation
  - [ ] Parallel processing
  - [ ] Caching layer
  - [ ] Performance optimization
- [ ] Create GloVe fallback
  - [ ] Latency monitoring (<100ms)
  - [ ] Automatic switching
  - [ ] Quality comparison
- [ ] Target 15%+ coherence improvement
- [ ] Create comprehensive tests

#### F051: RL Reward System for Breaking Outcomes
- [ ] Design reward function
  - [ ] Success rewards (+10)
  - [ ] Overflow penalties (-5)
  - [ ] Quality bonuses
- [ ] Implement strategy tracking
  - [ ] Performance logging
  - [ ] Success rate calculation
  - [ ] Trend analysis
- [ ] Add Critic integration
  - [ ] Feedback collection
  - [ ] Rating incorporation
  - [ ] Continuous learning
- [ ] Create policy improvement
  - [ ] Strategy selection optimization
  - [ ] Parameter tuning
  - [ ] A/B testing
- [ ] Target 10%+ success rate improvement
- [ ] Create comprehensive tests

#### F052: User-Defined Prioritization for Context
- [ ] Design prioritization UI
- [ ] Implement file importance marking
  - [ ] Star/unstar functionality
  - [ ] Bulk selection
  - [ ] Priority levels (high/medium/low)
- [ ] Add section locking
  - [ ] Lock toggle per section
  - [ ] Protected content handling
  - [ ] Override options
- [ ] Create priority preservation in strategies
  - [ ] High-priority retention
  - [ ] Locked section protection
  - [ ] Weighted scoring
- [ ] Add UI integration
  - [ ] Context panel controls
  - [ ] Visual indicators
  - [ ] Keyboard shortcuts
- [ ] Create comprehensive tests

#### F053: Plan Drift Detection & Enforcement
- [ ] Implement plan tracking
  - [ ] Baseline plan snapshot
  - [ ] Continuous comparison
  - [ ] Drift calculation
- [ ] Add drift detection
  - [ ] Threshold monitoring (>20%)
  - [ ] Change categorization
  - [ ] Impact assessment
- [ ] Create enforcement actions
  - [ ] Automatic alerts
  - [ ] Approval requirements
  - [ ] Rollback options
- [ ] Add notification system
  - [ ] Drift warnings
  - [ ] Approval requests
  - [ ] Status updates
- [ ] Implement audit logging
  - [ ] Change history
  - [ ] Decision tracking
  - [ ] Compliance reporting
- [ ] Create comprehensive tests

#### F054: PRD Auto-Generation from Plan
- [ ] Design PRD template
  - [ ] Standard sections
  - [ ] Format specifications
  - [ ] Customization options
- [ ] Implement auto-generation
  - [ ] Plan parsing
  - [ ] Content extraction
  - [ ] Template filling
- [ ] Add feature specification generation
  - [ ] Acceptance criteria
  - [ ] User stories
  - [ ] Technical details
- [ ] Create success criteria mapping
  - [ ] Metric identification
  - [ ] Target setting
  - [ ] Tracking setup
- [ ] Add export functionality
  - [ ] Markdown output
  - [ ] PDF generation
  - [ ] Version control
- [ ] Create comprehensive tests

---

## PHASE 6: Integration & Collaboration 📅 QUEUED

### F029: Real-time Collaboration
- [ ] Design collaboration architecture
- [ ] Implement WebSocket integration
  - [ ] Connection management
  - [ ] Event broadcasting
  - [ ] State synchronization
- [ ] Add live cursors
  - [ ] Position tracking
  - [ ] User identification
  - [ ] Color coding
- [ ] Create change broadcasting
  - [ ] Operational transformation
  - [ ] Conflict resolution
  - [ ] Undo/redo support
- [ ] Add presence indicators
  - [ ] Online/offline status
  - [ ] Active section highlighting
  - [ ] User list display
- [ ] Implement conflict detection
  - [ ] Concurrent edit detection
  - [ ] Merge strategies
  - [ ] User notification
- [ ] Create comprehensive tests

### F030: Comment System
- [ ] Design comment UI
- [ ] Implement comment threads
  - [ ] Reply support
  - [ ] Nested threading
  - [ ] Mention support (@username)
- [ ] Add task linking
  - [ ] Comment-to-task association
  - [ ] Cross-reference creation
  - [ ] Backlink tracking
- [ ] Create notification system
  - [ ] Mention notifications
  - [ ] Reply alerts
  - [ ] Resolution updates
- [ ] Add comment resolution tracking
  - [ ] Resolve/unresolve toggle
  - [ ] Resolution history
  - [ ] Status indicators
- [ ] Implement comment filtering
  - [ ] By user
  - [ ] By task
  - [ ] By resolution status
- [ ] Create comprehensive tests

### F031: Slack/Teams Integration
- [ ] Design integration architecture
- [ ] Implement Slack connector
  - [ ] OAuth setup
  - [ ] Channel selection
  - [ ] Message formatting
- [ ] Add Teams connector
  - [ ] OAuth setup
  - [ ] Team/channel selection
  - [ ] Adaptive card support
- [ ] Create task assignment notifications
  - [ ] Real-time delivery
  - [ ] Rich formatting
  - [ ] Action buttons
- [ ] Add status update broadcasting
  - [ ] Progress notifications
  - [ ] Completion alerts
  - [ ] Blocker warnings
- [ ] Implement interactive buttons
  - [ ] Mark as 'In Progress'
  - [ ] Complete task
  - [ ] Request help
- [ ] Add configuration UI
  - [ ] Notification preferences
  - [ ] Channel selection
  - [ ] User mapping
- [ ] Create comprehensive tests

### F032: Jira Integration
- [ ] Design Jira sync architecture
- [ ] Implement Jira API connector
  - [ ] OAuth authentication
  - [ ] Project selection
  - [ ] Issue type mapping
- [ ] Add bi-directional sync
  - [ ] COE task → Jira issue
  - [ ] Jira issue → COE task
  - [ ] Status synchronization
- [ ] Create field mapping
  - [ ] Title/summary
  - [ ] Description
  - [ ] Priority
  - [ ] Status
  - [ ] Assignee
  - [ ] Custom fields
- [ ] Add conflict resolution
  - [ ] Last-write-wins
  - [ ] User approval
  - [ ] Merge strategies
- [ ] Implement sync scheduling
  - [ ] Interval configuration
  - [ ] Manual trigger
  - [ ] Real-time webhook
- [ ] Create comprehensive tests

---

## PHASE 7: Advanced Features & Analytics 📅 QUEUED

### F003: Roadmap Visualization
- [ ] Design roadmap UI
- [ ] Implement timeline view
  - [ ] Gantt chart rendering
  - [ ] Feature blocks
  - [ ] Milestone markers
- [ ] Add dependency visualization
  - [ ] Dependency arrows
  - [ ] Critical path highlighting
  - [ ] Blocker indicators
- [ ] Create completion percentage display
  - [ ] Per-feature progress
  - [ ] Overall project progress
  - [ ] Historical trends
- [ ] Add filtering capabilities
  - [ ] By status
  - [ ] By priority
  - [ ] By team/assignee
  - [ ] By category
- [ ] Implement drill-down
  - [ ] Feature → Task view
  - [ ] Task detail panel
  - [ ] Dependency explorer
- [ ] Create export functionality
  - [ ] PDF report generation
  - [ ] Presentation slides
  - [ ] Stakeholder summaries
- [ ] Add comprehensive tests

### F004: Template Library
- [ ] Design template system
- [ ] Create template storage
  - [ ] JSON schema
  - [ ] Versioning
  - [ ] Categorization
- [ ] Implement 5+ default templates
  - [ ] Microservice template
  - [ ] API development template
  - [ ] UI component template
  - [ ] Data pipeline template
  - [ ] Full-stack app template
- [ ] Add template preview
  - [ ] Visual mockup
  - [ ] Task structure preview
  - [ ] Estimated timeline
- [ ] Create wizard workflow
  - [ ] Parameter prompts
  - [ ] Dynamic questions
  - [ ] Validation
- [ ] Implement customization
  - [ ] Pre-save editing
  - [ ] Parameter overrides
  - [ ] Template mixing
- [ ] Add template sharing
  - [ ] Export/import
  - [ ] Team library
  - [ ] Version control
- [ ] Create comprehensive tests

### F007: Bulk Task Operations
- [ ] Design bulk operation UI
- [ ] Implement multi-select
  - [ ] Checkbox selection
  - [ ] Keyboard shortcuts
  - [ ] Select all/none
- [ ] Add status change operations
  - [ ] Batch status update
  - [ ] Validation
  - [ ] Confirmation dialog
- [ ] Create priority updates
  - [ ] Batch priority change
  - [ ] Conflict detection
  - [ ] Impact warning
- [ ] Implement assignment operations
  - [ ] Bulk reassignment
  - [ ] Workload balancing
  - [ ] Notification batch
- [ ] Add deletion with safeguards
  - [ ] Dependency check
  - [ ] Confirmation dialog
  - [ ] Undo support
- [ ] Create comprehensive tests

### F008: Search & Filter System
- [ ] Design search UI
- [ ] Implement full-text search
  - [ ] Title search
  - [ ] Description search
  - [ ] Tag search
- [ ] Add advanced filters
  - [ ] By status
  - [ ] By priority
  - [ ] By assignee
  - [ ] By date range
  - [ ] By dependency status
- [ ] Create saved filters
  - [ ] Filter presets
  - [ ] Custom filters
  - [ ] Quick access
- [ ] Implement search highlighting
  - [ ] Match highlighting
  - [ ] Result count
  - [ ] Navigation
- [ ] Add search history
  - [ ] Recent searches
  - [ ] Popular searches
  - [ ] Suggestions
- [ ] Create comprehensive tests

### F009: Performance Analytics Dashboard
- [ ] Design analytics UI
- [ ] Implement metric collection
  - [ ] Task completion rate
  - [ ] Average task duration
  - [ ] Agent success rate
  - [ ] Velocity trends
- [ ] Add visualization
  - [ ] Line charts (trends)
  - [ ] Bar charts (comparisons)
  - [ ] Pie charts (distribution)
  - [ ] Heatmaps (patterns)
- [ ] Create team performance tracking
  - [ ] Individual metrics
  - [ ] Team metrics
  - [ ] Comparative analysis
- [ ] Add bottleneck identification
  - [ ] Slow task detection
  - [ ] Resource constraints
  - [ ] Process inefficiencies
- [ ] Implement export functionality
  - [ ] CSV export
  - [ ] PDF reports
  - [ ] Scheduled reports
- [ ] Create comprehensive tests

### F013: Metrics & KPI Tracking
- [ ] Design KPI tracking system
- [ ] Implement 15 core KPIs
  - User Adoption (3 metrics)
    - [ ] User Adoption Rate (target: 80%)
    - [ ] Visual Verification Usage (target: 90%)
    - [ ] Developer Satisfaction (target: 4.0/5.0)
  - Performance (7 metrics)
    - [ ] Planning Time Reduction (target: 50%)
    - [ ] Agent Task Success Rate (target: 70%)
    - [ ] Average Task Decomposition Depth (target: 2-3)
    - [ ] Time to First Task (target: <5 min)
    - [ ] MCP Tool Response Time (target: <200ms p95)
    - [ ] Agent Question Resolution (target: 80%)
    - [ ] Task completion velocity
  - Quality (5 metrics)
    - [ ] Task Completion Rate (target: 85%)
    - [ ] GitHub Sync Accuracy (target: 99%)
    - [ ] Plan Validation Pass Rate (target: 75%)
    - [ ] Test Coverage Increase (target: +15%)
    - [ ] Issue Investigation Rate (target: <10%)
  - Business (1 metric)
    - [ ] Business Value Delivered (target: $50K/year)
- [ ] Add real-time dashboard
  - [ ] Live metric updates
  - [ ] Trend visualization
  - [ ] Target progress
- [ ] Create historical tracking
  - [ ] Time-series data
  - [ ] Trend analysis
  - [ ] Anomaly detection
- [ ] Implement alerting
  - [ ] Threshold violations
  - [ ] Degradation warnings
  - [ ] Achievement notifications
- [ ] Add export/reporting
  - [ ] Executive summaries
  - [ ] Detailed reports
  - [ ] Custom date ranges
- [ ] Create comprehensive tests

---

## PHASE 8: Extended Capabilities 📅 QUEUED

### F012: Task Dependencies Visualization (Advanced)
- [ ] Design dependency graph UI
- [ ] Implement graph rendering
  - [ ] Node positioning algorithm
  - [ ] Arrow path calculation
  - [ ] Layout optimization
- [ ] Add interactive features
  - [ ] Zoom/pan controls
  - [ ] Node selection
  - [ ] Edge highlighting
- [ ] Create critical path calculation
  - [ ] Path identification
  - [ ] Duration calculation
  - [ ] Visual highlighting
- [ ] Add impact analysis
  - [ ] Upstream/downstream effects
  - [ ] Completion time impact
  - [ ] Resource impact
- [ ] Implement export functionality
  - [ ] Image export (PNG/SVG)
  - [ ] Graph data export
  - [ ] Print-friendly version
- [ ] Create comprehensive tests

### F014: Audit Log & History
- [ ] Design audit system
- [ ] Implement event tracking
  - [ ] Task creation/modification
  - [ ] Status changes
  - [ ] Assignment changes
  - [ ] Deletions
  - [ ] Agent actions
- [ ] Add user attribution
  - [ ] User tracking
  - [ ] Agent identification
  - [ ] Timestamp recording
- [ ] Create detailed logging
  - [ ] Before/after states
  - [ ] Change reasons
  - [ ] Context capture
- [ ] Implement history viewer
  - [ ] Timeline display
  - [ ] Filter by entity
  - [ ] Filter by action
  - [ ] Filter by user/agent
- [ ] Add restore functionality
  - [ ] Point-in-time restoration
  - [ ] Selective undo
  - [ ] Change preview
- [ ] Create compliance reporting
  - [ ] Activity reports
  - [ ] Access logs
  - [ ] Change summaries
- [ ] Add comprehensive tests

### F015: Export/Import Capabilities
- [ ] Design export/import system
- [ ] Implement JSON export
  - [ ] Full plan export
  - [ ] Selective export
  - [ ] Metadata inclusion
- [ ] Add Markdown export
  - [ ] Formatted output
  - [ ] Table generation
  - [ ] Link preservation
- [ ] Create CSV export
  - [ ] Flat task list
  - [ ] Configurable columns
  - [ ] Excel compatibility
- [ ] Implement import functionality
  - [ ] JSON import
  - [ ] CSV import
  - [ ] Validation
  - [ ] Conflict detection
- [ ] Add format conversion
  - [ ] Cross-format support
  - [ ] Data mapping
  - [ ] Loss prevention
- [ ] Create comprehensive tests

### F017: Task Priority Queue Management
- [ ] Design queue management system
- [ ] Implement priority algorithms
  - [ ] Weighted scoring
  - [ ] Dependency-aware prioritization
  - [ ] Due date integration
- [ ] Add manual priority override
  - [ ] Drag-and-drop reordering
  - [ ] Manual pinning
  - [ ] Priority locks
- [ ] Create queue visualization
  - [ ] List view with priorities
  - [ ] Color coding
  - [ ] Sorting options
- [ ] Implement agent claiming logic
  - [ ] Fair distribution
  - [ ] Skill matching
  - [ ] Workload balancing
- [ ] Add queue metrics
  - [ ] Queue depth
  - [ ] Average wait time
  - [ ] Throughput rate
- [ ] Create comprehensive tests

### F018: Context-Aware Code References
- [ ] Design code reference system
- [ ] Implement file indexing
  - [ ] Code parsing
  - [ ] Symbol extraction
  - [ ] Cross-reference building
- [ ] Add intelligent linking
  - [ ] Automatic task-to-code mapping
  - [ ] Symbol-based association
  - [ ] Change tracking
- [ ] Create reference display
  - [ ] Inline code snippets
  - [ ] File path display
  - [ ] Line number tracking
- [ ] Implement change detection
  - [ ] File modification tracking
  - [ ] Outdated reference warnings
  - [ ] Auto-update suggestions
- [ ] Add navigation features
  - [ ] Jump to definition
  - [ ] Find all references
  - [ ] Peek preview
- [ ] Create comprehensive tests

### F019: Automated Testing Integration
- [ ] Design test integration system
- [ ] Implement test runner integration
  - [ ] Jest support
  - [ ] Mocha support
  - [ ] Custom runner support
- [ ] Add test execution
  - [ ] Automated trigger on task completion
  - [ ] Manual trigger option
  - [ ] Selective test execution
- [ ] Create result collection
  - [ ] Pass/fail status
  - [ ] Coverage data
  - [ ] Performance metrics
  - [ ] Error details
- [ ] Implement result reporting
  - [ ] reportTestFailure MCP calls
  - [ ] Investigation task creation
  - [ ] Notification delivery
- [ ] Add test coverage tracking
  - [ ] Coverage percentage
  - [ ] Coverage trends
  - [ ] Gap identification
- [ ] Create comprehensive tests

### F020: Performance Benchmarking
- [ ] Design benchmarking system
- [ ] Implement performance tracking
  - [ ] Task execution time
  - [ ] Agent response time
  - [ ] MCP tool latency
  - [ ] Database query performance
- [ ] Add baseline establishment
  - [ ] Initial measurements
  - [ ] Target setting
  - [ ] Threshold configuration
- [ ] Create regression detection
  - [ ] Performance degradation alerts
  - [ ] Trend analysis
  - [ ] Anomaly detection
- [ ] Implement optimization suggestions
  - [ ] Bottleneck identification
  - [ ] Improvement recommendations
  - [ ] Priority ranking
- [ ] Add reporting dashboard
  - [ ] Real-time metrics
  - [ ] Historical trends
  - [ ] Comparison views
- [ ] Create comprehensive tests

### F021: Resource Usage Monitoring
- [ ] Design resource monitoring system
- [ ] Implement CPU tracking
  - [ ] Process-level monitoring
  - [ ] Thread utilization
  - [ ] Peak detection
- [ ] Add memory tracking
  - [ ] Heap usage
  - [ ] Memory leaks detection
  - [ ] Garbage collection metrics
- [ ] Create disk I/O monitoring
  - [ ] Read/write operations
  - [ ] Database performance
  - [ ] File system activity
- [ ] Implement alerting system
  - [ ] Threshold violations
  - [ ] Resource exhaustion warnings
  - [ ] Performance degradation alerts
- [ ] Add optimization recommendations
  - [ ] Resource-saving suggestions
  - [ ] Configuration adjustments
  - [ ] Capacity planning
- [ ] Create comprehensive tests

---

## PHASE 9: Extension Ecosystem 📅 QUEUED

### F025: Plugin Architecture
- [ ] Design plugin system
- [ ] Implement plugin API
  - [ ] Extension points
  - [ ] Event hooks
  - [ ] Data access API
- [ ] Add plugin loader
  - [ ] Dynamic loading
  - [ ] Dependency resolution
  - [ ] Version compatibility
- [ ] Create plugin registry
  - [ ] Plugin discovery
  - [ ] Metadata management
  - [ ] Installation tracking
- [ ] Implement security sandbox
  - [ ] Permission system
  - [ ] Resource limits
  - [ ] API whitelisting
- [ ] Add plugin marketplace (future)
  - [ ] Plugin browsing
  - [ ] Ratings/reviews
  - [ ] Installation UI
- [ ] Create comprehensive tests

### F026: Custom Agent Templates
- [ ] Design template system
- [ ] Implement YAML template editor
  - [ ] Syntax highlighting
  - [ ] Validation
  - [ ] Preview
- [ ] Add template library
  - [ ] Built-in templates
  - [ ] User templates
  - [ ] Team sharing
- [ ] Create template testing
  - [ ] Dry run capability
  - [ ] Validation checks
  - [ ] Performance testing
- [ ] Implement deployment workflow
  - [ ] Template activation
  - [ ] Version management
  - [ ] Rollback support
- [ ] Add template sharing
  - [ ] Export/import
  - [ ] Marketplace integration
  - [ ] Version control
- [ ] Create comprehensive tests

### F027: Workflow Customization
- [ ] Design workflow editor
- [ ] Implement visual workflow builder
  - [ ] Drag-and-drop interface
  - [ ] Step configuration
  - [ ] Conditional branching
- [ ] Add custom approval gates
  - [ ] Approval rules
  - [ ] Approver assignment
  - [ ] Notification configuration
- [ ] Create custom notifications
  - [ ] Event triggers
  - [ ] Message templates
  - [ ] Channel configuration
- [ ] Implement workflow versioning
  - [ ] Version tracking
  - [ ] Change history
  - [ ] Rollback capability
- [ ] Add workflow testing
  - [ ] Simulation mode
  - [ ] Test scenarios
  - [ ] Validation
- [ ] Create comprehensive tests

### F033: API & Webhook Support
- [ ] Design REST API
- [ ] Implement API endpoints
  - [ ] Task CRUD operations
  - [ ] Plan management
  - [ ] Agent control
  - [ ] Metrics retrieval
- [ ] Add authentication/authorization
  - [ ] API key generation
  - [ ] OAuth support
  - [ ] Permission scopes
- [ ] Create webhook system
  - [ ] Event subscriptions
  - [ ] Payload delivery
  - [ ] Retry logic
- [ ] Implement rate limiting
  - [ ] Request throttling
  - [ ] Quota management
  - [ ] Fair usage policy
- [ ] Add API documentation
  - [ ] OpenAPI spec
  - [ ] Interactive docs
  - [ ] Code examples
- [ ] Create comprehensive tests

### F035: Multi-Language Support
- [ ] Design i18n system
- [ ] Implement translation framework
  - [ ] Resource bundles
  - [ ] Locale detection
  - [ ] Fallback logic
- [ ] Add initial language support
  - [ ] English (en-US)
  - [ ] Spanish (es-ES)
  - [ ] French (fr-FR)
  - [ ] German (de-DE)
  - [ ] Japanese (ja-JP)
- [ ] Create translation workflow
  - [ ] String extraction
  - [ ] Translation management
  - [ ] Quality assurance
- [ ] Implement dynamic language switching
  - [ ] Runtime switching
  - [ ] Preference persistence
  - [ ] No reload required
- [ ] Add RTL support
  - [ ] Layout mirroring
  - [ ] Text direction
  - [ ] Icon flipping
- [ ] Create comprehensive tests

---

## PHASE 10: Testing & Quality Assurance 📅 QUEUED

### F055: Comprehensive Testing Suite
- [ ] Design test strategy
- [ ] Implement unit tests
  - [ ] Component isolation
  - [ ] Mock dependencies
  - [ ] Edge case coverage
  - [ ] Target: 80%+ coverage
- [ ] Add integration tests
  - [ ] Multi-component flows
  - [ ] API integration
  - [ ] Database integration
  - [ ] Target: 60%+ coverage
- [ ] Create E2E tests
  - [ ] User journey scenarios
  - [ ] Cross-browser testing
  - [ ] Performance validation
  - [ ] Target: Critical paths 100%
- [ ] Implement performance tests
  - [ ] Load testing
  - [ ] Stress testing
  - [ ] Endurance testing
  - [ ] Benchmark validation
- [ ] Add accessibility tests
  - [ ] WCAG 2.1 AA compliance
  - [ ] Screen reader testing
  - [ ] Keyboard navigation
  - [ ] Color contrast
- [ ] Create security tests
  - [ ] Vulnerability scanning
  - [ ] Penetration testing
  - [ ] Dependency audits
  - [ ] OWASP compliance
- [ ] Implement test automation
  - [ ] CI/CD integration
  - [ ] Automated test runs
  - [ ] Failure notifications
  - [ ] Coverage reporting
- [ ] Target overall: 96.8% coverage

### F056: UI Polish & Accessibility
- [ ] Conduct UX review
- [ ] Implement design refinements
  - [ ] Visual consistency
  - [ ] Spacing adjustments
  - [ ] Typography improvements
  - [ ] Color refinements
- [ ] Add animations/transitions
  - [ ] Smooth state changes
  - [ ] Loading indicators
  - [ ] Success/error animations
  - [ ] Reduced motion support
- [ ] Create accessibility improvements
  - [ ] ARIA labels
  - [ ] Keyboard shortcuts
  - [ ] Focus management
  - [ ] Screen reader optimization
- [ ] Implement responsive design
  - [ ] Mobile optimization
  - [ ] Tablet support
  - [ ] Adaptive layouts
  - [ ] Touch interactions
- [ ] Add dark mode polish
  - [ ] Contrast validation
  - [ ] Color consistency
  - [ ] Theme switching
  - [ ] Preference persistence
- [ ] Create style guide documentation
  - [ ] Component library
  - [ ] Usage guidelines
  - [ ] Code examples
  - [ ] Best practices
- [ ] Conduct usability testing
  - [ ] User feedback collection
  - [ ] Iteration based on findings
  - [ ] A/B testing
  - [ ] Final validation

---

## PHASE 11: Documentation & Launch Preparation 📅 QUEUED

### Documentation Deliverables
- [ ] User Documentation
  - [ ] Getting Started Guide
    - [ ] Installation instructions
    - [ ] Initial setup
    - [ ] First project creation
    - [ ] Quick wins
  - [ ] User Guide
    - [ ] Feature overview
    - [ ] Common workflows
    - [ ] Best practices
    - [ ] Troubleshooting
  - [ ] Tutorial Videos
    - [ ] Introduction (5 min)
    - [ ] Creating your first plan (10 min)
    - [ ] Agent coordination (15 min)
    - [ ] Visual verification (10 min)
    - [ ] Advanced features (20 min)
  - [ ] FAQ Document
    - [ ] Common questions
    - [ ] Known limitations
    - [ ] Workarounds
    - [ ] Support channels

- [ ] Developer Documentation
  - [ ] Architecture Overview
    - [ ] System diagram
    - [ ] Component descriptions
    - [ ] Data flow
    - [ ] Technology stack
  - [ ] API Reference
    - [ ] REST API endpoints
    - [ ] WebSocket events
    - [ ] MCP tools
    - [ ] Plugin API
  - [ ] Contributing Guide
    - [ ] Code standards
    - [ ] Testing requirements
    - [ ] PR process
    - [ ] Development setup
  - [ ] Plugin Development Guide
    - [ ] Plugin architecture
    - [ ] API usage
    - [ ] Example plugins
    - [ ] Publishing process

- [ ] Operations Documentation
  - [ ] Deployment Guide
    - [ ] Extension packaging
    - [ ] Marketplace publishing
    - [ ] Update process
    - [ ] Rollback procedures
  - [ ] Configuration Guide
    - [ ] Environment variables
    - [ ] Database setup
    - [ ] GitHub integration
    - [ ] Agent configuration
  - [ ] Monitoring & Alerting
    - [ ] Metrics to track
    - [ ] Alert thresholds
    - [ ] Dashboard setup
    - [ ] Incident response
  - [ ] Backup & Recovery
    - [ ] Backup procedures
    - [ ] Disaster recovery
    - [ ] Data migration
    - [ ] Version upgrades

### Launch Preparation
- [ ] Beta Testing Program
  - [ ] Recruit beta testers (target: 20-30)
  - [ ] Create feedback collection form
  - [ ] Set up support channel
  - [ ] Monitor usage metrics
  - [ ] Iterate based on feedback
  - [ ] Final release candidate

- [ ] Marketing Materials
  - [ ] Product announcement blog post
  - [ ] Feature highlight videos
  - [ ] Case studies (if available)
  - [ ] Social media content
  - [ ] Press kit
  - [ ] Demo environment

- [ ] Legal & Compliance
  - [ ] Terms of Service
  - [ ] Privacy Policy
  - [ ] Open source licenses
  - [ ] Security disclosure policy
  - [ ] GDPR compliance
  - [ ] Accessibility statement

- [ ] Launch Checklist
  - [ ] All P0 features complete and tested
  - [ ] Documentation complete
  - [ ] Security audit passed
  - [ ] Performance benchmarks met
  - [ ] Accessibility validated
  - [ ] Beta feedback addressed
  - [ ] Marketplace listing approved
  - [ ] Support processes ready
  - [ ] Monitoring in place
  - [ ] Rollback plan documented

---

## 📊 Current Status Summary

### Completed Items (Foundation)
- ✅ Unified Agent System (5 roles, 10 tests)
- ✅ Background Worker (async delegation, 5 tests)
- ✅ Planning Framework (1,000+ pages of specs)
- ✅ Settings Panel (7 tabs, 95 tests)
- ✅ GitHub Sync (bi-directional, 16 tests, 99% accuracy)
- ✅ Plan Decomposition Engine (20 tests)
- ✅ MCP Server (6 tools, comprehensive tests)
- ✅ Context Bundle Builder (token tracking)

### In Progress (Active Development - PHASE 2-3)
- 🔄 **PHASE 2**: Interactive Plan Builder (visual UI, templates)
- 🔄 **PHASE 3: AI Use System** ([See AI-USE-SYSTEM-PLANNING-INDEX.md](AI-USE-SYSTEM-PLANNING-INDEX.md))
  - 🔴 **P1 Tasks** (Start immediately, 7-10 days):
    - [ ] F023: Ticket Database & Communication Layer
    - [ ] F024: Programming Orchestrator Task Routing
  - 🟡 **P2 Tasks** (Follow P1, 5-7 days):
    - [ ] F025: Agents Sidebar Tab
    - [ ] F026: Tickets Sidebar Tab
    - [ ] F027: Streaming LLM Mode with Inactivity Timeout
  - 🟢 **P3 Tasks** (Follow P2, 2-3 days):
    - [ ] F028: Verification Panel UI
- 🔄 Multi-Agent Orchestration (Planning Team, Answer Team, Verification Team)

### Queued (Not Started)
- 📅 **PHASE 4**: Visual Tools & Advanced UI (F029-F030)
  - 📅 Review Tool with Annotation System
  - 📅 Plan Adjustment Wizard
- 📅 **PHASE 5+**: AI Intelligence & Extension Ecosystem
  - 📅 LangGraph Integration & Advanced Workflows
  - 📅 AutoGen Framework & Agent Communication
  - 📅 Agent Evolution System & Loop Detection
  - 📅 Context Breaking & Advanced Strategies
  - 📅 Researcher/Critic/Scraper/Updater Agents
  - 📅 Real-time Collaboration
  - 📅 Analytics Dashboard & KPI Tracking
  - 📅 Plugin Architecture & Custom Extensions
  - 📅 Comprehensive Testing Suite
  - 📅 Documentation & Launch Preparation

### Overall Progress
**Total Features**: 35  
**Completed (✅)**: 8 (23%)  
**In Progress/Planned (🔄)**: 6 (17%)  
  - P1 Priority: 2 features (F023-F024)
  - P2 Priority: 3 features (F025-F027)
  - P3 Priority: 1 feature (F028)
**Queued (📅)**: 21 (60%)

**Project Completion**: ~58% (up from 54% with detailed AI Use System planning)

**Key Milestone**: AI Use System MVP = Feb 15, 2026 (all P1/P2/P3 complete)

---

## 🎯 Priority Legend

- **P0** - Critical for MVP launch (System integrity)
- **P1** - High priority, needed for MVP (Feb 15, 2026) → AI Use System core
- **P2** - Medium priority, follows P1 → AI Use System UI
- **P3** - Lower priority, polish & features → AI Use System results panel

---

## 📝 Notes

- This is a **living document** - update as work progresses
- **AI Use System Phase**: Detailed planning complete [See AI-USE-SYSTEM-* docs](AI-USE-SYSTEM-PLANNING-INDEX.md)
- Check off items as completed
- Add notes/blockers inline as needed
- Reference GitHub Issues for detailed task tracking
- Maintain minimum 3 open issues at all times (P1 first!)
- Follow atomic task philosophy (5 criteria)
- Ensure 80%+ test coverage for all new code
- Document all public APIs inline
- **NEW**: Config-driven inactivity timeout (never write to .coe/config.json)

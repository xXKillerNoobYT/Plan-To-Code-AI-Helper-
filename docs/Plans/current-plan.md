<!-- Planning update 2026-01-25 - COE Scope Clarification & Implementation Strategy -->
<!-- Core focus: Planning/orchestration layer with LLM-powered PRD generation -->
<!-- Starting point: Read Plans/ folder → LLM synthesis → PRD.md output -->
<!-- Hybrid approach: Keep Python notebook, add TypeScript native capability -->

# COE Current Plan: Planning Brain & Agent Orchestration

**Project**: Copilot Orchestration Extension (COE)  
**Scope**: VS Code extension that acts as a planning/orchestration layer for 3rd-party coding agents (GitHub Copilot)  
**Target Launch**: February 15, 2026  
**Current Status**: 54% complete (19/35 features), 97.2% test coverage

---

## 📘 Project Role & Philosophy

### What COE IS

A VS Code extension that acts as your project's **"intelligent memory and organizer"**—a planning, tracking, verification, and orchestration layer that works WITH 3rd party coding agents (like GitHub Copilot), not instead of them.

### The "Planning Brain" Function

- 🧠 **Reads Plans/** → Analyzes 23+ planning documents (150K+ words: architecture, agent specs, workflows, philosophy)
- 🤖 **Uses LLM** → Synthesizes planning docs into coherent, structured PRD.md (Product Requirements Document)
- 📊 **Tracks Progress** → Compares planned features (from PRD) vs. actual code files (in src/)
- 🔍 **Detects Drift** → Identifies outdated plans, missing dependencies, incomplete implementations
- 💬 **Answers Questions** → Provides context-aware responses when coding agents ask "How should I implement X?"
- 📤 **Prepares Context** → Bundles relevant files, design references, task details for coding agents
- ✅ **Verifies Work** → Tracks verification states (checked/unchecked/needs-re-check), triggers re-validation
- 🛠️ **Self-Maintains** → Auto-creates tasks/issues when plans drift or become stale

### What COE Does NOT Do

- ❌ **Does NOT write TypeScript/JavaScript code** — That's GitHub Copilot's job
- ❌ **Does NOT run unit tests** — It triggers Jest/Mocha and reports results
- ❌ **Does NOT make architectural decisions** — It synthesizes plans and tracks user choices

### Core Philosophy

> "Plans are the source of truth. Code is the implementation. COE keeps them aligned."

Every feature starts as a plan document → gets synthesized into PRD.md by LLM → decomposes into atomic tasks → gets tracked against actual implementation files. Coding agents never guess—they always have fresh, accurate context.

---

## ✅ Already Implemented Foundation

**These features are WORKING and form our solid base** (54% complete, 97.2% test coverage, zero TypeScript errors):

| Feature | Status | Details |
|---------|--------|---------|
| **Task Queue System** | ✅ Complete | In-memory + SQLite, P1/P2/P3 priority, atomic enforcement, dependency graph |
| **VS Code Sidebar & Status Bar** | ✅ Complete | Tree view, real-time queue display, commands (refresh, clear) |
| **LLM Configuration Panel** | ✅ Complete | 7-tab UI, OpenAI/LM Studio/Ollama/Azure support, 4000 token default limit, 95 tests |
| **GitHub Issues Bi-Directional Sync** | ✅ Complete | 99%+ accuracy, 16 tests, batching, caching, exponential backoff |
| **MCP Server with 6 Tools** | ✅ Complete | getNextTask, reportTaskStatus, reportObservation, reportTestFailure, reportVerificationResult, askQuestion |
| **Agent Communication Protocol** | ✅ Complete | WebSocket JSON-RPC 2.0, audit logging, health monitoring |
| **File System APIs** | ✅ Complete | File read/write, watchers, directory monitoring, plan parsing |
| **Existing PRD Generation** | ✅ Complete | Python notebook (PRD.ipynb) reads Plans/, outputs PRD.md/PRD.json |

**Execution Engine**: The LLM call loop + task queue is our "orchestration engine"—future self-tasks (verification, maintenance, plan updates) go into the SAME queue identically. No workflow rebuilding needed!

---

## 🎯 Core Scope & Features (Clarified Vision)

### Primary Capability (P1): LLM-Powered PRD Generation from Plans/

**Why First?**
- ✅ Uses existing LLM infrastructure (config, endpoints, token limiting already working!)
- ✅ Leverages rich Plans/ folder (23+ docs, complete project vision)
- ✅ Creates "planning brain" immediately (COE's core differentiator)
- ✅ Low risk (file reading + LLM call + file writing—proven VS Code APIs)
- ✅ High value (fresh PRD = foundation for all tracking/verification)
- ✅ Hybrid approach (keeps Python notebook working, adds TypeScript native)

**What It Does**:
1. Reads Plans/ folder recursively (all .md files, prioritizes CONSOLIDATED-MASTER-PLAN.md, agent specs, MCP reference)
2. Bundles content with token limiting (respects llm.inputTokenLimit from config—critical for local models!)
3. Creates system prompt: "Synthesize these planning documents into a structured PRD with features F001-F056, acceptance criteria, priorities P1/P2/P3"
4. Calls configured LLM endpoint (LM Studio/Ollama/OpenAI) with streaming response
5. Parses LLM output into sections (Features, Architecture, Testing, Priorities)
6. Writes PRD.md (markdown for humans) + PRD.json (JSON for AI agents)
7. Updates timestamp, shows notification: "PRD regenerated from 23 planning documents ✅"
8. Auto-refreshes when Plans/ files change (file watcher integration)

**Acceptance Criteria**:
- [ ] Reads all .md files from Plans/ and COE-Master-Plan/ recursively
- [ ] Respects token limit from llm.inputTokenLimit (truncates if needed, prioritizes key files)
- [ ] Calls configured LLM with proper request format (OpenAI-compatible JSON)
- [ ] Streams response and parses into PRD sections
- [ ] Writes PRD.md with proper markdown formatting
- [ ] Writes PRD.json with machine-readable structure
- [ ] Command: "COE: Regenerate PRD from Plans" available
- [ ] Shows progress notifications during generation
- [ ] Handles errors gracefully (timeout, token overflow, file write errors)

---

## 📝 P1: Core Implementation Tasks (Next 0–2 Weeks)

### ✅ Phase -1: Config Migration (COMPLETED)

**[T-001] Migrate Config: VS Code Settings → `.coe/config.json`** ✅ DONE

This was completed as a prerequisite to make COE tool-agnostic.

**What was done:**
- ✅ Created `.coe/config.json` with default LLM settings
- ✅ Built `src/utils/fileConfig.ts` (FileConfigManager class)
  - Auto-creates config.json if missing
  - Watches for file changes and reloads config
  - Supports getting/updating LLM config
  - Notifies subscribers on config changes
- ✅ Updated `src/extension.ts` to use FileConfigManager
  - Initializes config on extension activate
  - Subscribes to config changes
  - Disposes properly on deactivate
- ✅ Added comprehensive tests: `src/utils/__tests__/fileConfig.test.ts`
  - 13 test cases covering init, get, update, watch, error handling

**Why this matters:**
- 🎯 **Tool-agnostic**: Config lives in workspace (not VS Code settings)
- 📝 **Easy to edit**: Open `.coe/config.json` in editor, change values, COE reloads automatically
- 🤖 **Agent-compatible**: Any coding tool (Copilot, other editors) can read/modify config
- 🔄 **No disruption**: Existing VS Code settings still work as fallback

**Benefits for Phase 0+:**
- Config system is now portable and flexible
- Perfect foundation for LLM PRD generator (which will read config)
- Ready for 3rd-party agent integration

---

### Phase 1: File Reading Infrastructure

**[T-101] Create Plans Folder Reader Service** (15–20 min)
- Reads Plans/ and COE-Master-Plan/ recursively
- Returns: `{ path, content, size, category }[]` (architecture/agent-spec/workflow)
- Uses `vscode.workspace.findFiles('Plans/**/*.md')`
- Filters: `old-*`, `*.ipynb`, `temp-*`
- **Test**: Read real Plans/, verify 23+ files with correct paths
- **Files**: `src/services/plansReader.ts`

**[T-102] Implement Token-Aware Context Bundler** (20–25 min)
- Takes Plans file array, bundles into context string
- Tokens: rough `content.length / 4` (English)
- Truncates if exceeds `llmConfig.inputTokenLimit` (≤4000)
- Prioritizes: CONSOLIDATED-MASTER-PLAN.md → agent specs → others
- Returns: `{ prompt, includedFiles, truncatedFiles, totalTokens }`
- **Test**: Bundle with 3000 limit, verify truncation works
- **Files**: `src/services/contextBundler.ts`

### Phase 2: LLM Integration

**[T-103] Create PRD Generation Prompt Template** (15–20 min)
- System prompt with output format (markdown with ## headers)
- Example: "### F022: MCP Server with 6 Tools"
- Includes sections: Features, Architecture, Testing, Priorities
- **Test**: Verify template renders with sample content
- **Files**: `src/prompts/prdGenerationPrompt.ts`

**[T-104] Build LLM Call Wrapper with Streaming** (25–30 min)
- Reads LLM config (url, model, timeoutSeconds)
- POST request with streaming support
- Handles both `data: {...}` and direct JSON chunks
- Timeout from `llmConfig.timeoutSeconds` (default 300s)
- Returns: streamed content + metadata (tokens, duration)
- **Test**: Mock LLM endpoint, verify request/response parsing
- **Files**: `src/agents/llmClient.ts`

### Phase 3: Output Writing & Commands

**[T-105] Implement PRD Writer Service** (15–20 min)
- LLM response → formatted markdown
- Frontmatter: `<!-- Generated from Plans/ on [ISO date] -->`
- Writes PRD.md + PRD.json to workspace root
- Backup previous: `PRD.backup-[timestamp].md`
- **Test**: Write sample PRD, verify formatting and JSON
- **Files**: `src/services/prdWriter.ts`

**[T-106] Add Extension Command: "Regenerate PRD from Plans"** (20–25 min)
- Registers: `coe-extension.regeneratePRD`
- Flow: plansReader → contextBundler → llmClient → prdWriter
- Notifications: progress + success + error handling
- Logs: output channel with step-by-step details
- **Test**: Run end-to-end, verify PRD.md accuracy
- **Files**: Update `src/extension.ts`

### Phase 4: Auto-Refresh

**[T-107] Add File Watcher for Plans/ Auto-Update** (15–20 min)
- `vscode.workspace.createFileSystemWatcher('Plans/**/*.md')`
- Debounce 5 seconds (prevent rapid re-gen during multi-file edits)
- Auto-trigger PRD regeneration on file change
- Config: `coe-extension.autoRegeneratePRD` (default: true)
- **Test**: Modify Plans/.md, verify refresh within 10s
- **Files**: Update `src/plans/fileWatcher.ts`

**Estimated Time**: 7 tasks × ~22 min avg = 2.5 hours for complete feature  
**Risk**: Low (uses existing VS Code + LLM patterns)  
**Test Coverage Target**: ≥75% for new code

---

## 📊 Secondary Features (P2–P3: Important but Lower Priority)

### P2: Plan Updating Feature (Simple, Quick Updates)

**Purpose**: Allow users to make targeted, LLM-assisted updates to existing plans without full regeneration

**What It Does**:
1. User opens "Quick Plan Update" dialog
2. Select which section to update (dropdown: Features / Architecture / Testing / Priorities)
3. Provide update suggestion/text: "Add new security requirement: All API endpoints must have rate limiting"
4. Click "Suggest Update" → LLM refines suggestion and applies it to that PRD section only
5. Review + confirm before writing back to file
6. Quick 30–60 second workflow (vs. full 2–3 min PRD regeneration)

**Use Cases**:
- "We realized F023 Visual Verification Panel also needs dark mode support—add that requirement"
- "Update P1 priority list: Move F037 Context Limiting to P0 (launch blocker)"
- "Add new feature F057: Real-time Verification Dashboard"

**Acceptance Criteria**:
- [ ] Dialog shows section selector (Features, Architecture, Testing, Priorities)
- [ ] Text input for update suggestion
- [ ] "Suggest Update" calls LLM with focused prompt (not full regeneration)
- [ ] Shows preview of change before applying
- [ ] Updates specific PRD.md section (not overwriting entire file)
- [ ] Completion within 60 seconds
- [ ] Accessible via command: "COE: Quick Plan Update"

**Implementation Sketch** (3–4 tasks):
- `[T-201]` Create update dialog webview (~30 min)
- `[T-202]` Build focused LLM prompt for section updates (~20 min)
- `[T-203]` Implement targeted PRD section replacement (~25 min)
- `[T-204]` Add preview + confirmation UI (~20 min)

**Estimated Total**: ~1.5 hours (when ready)

---

### P2–P3: Design/Layout System (Notion-like Hierarchical Planning)

**Purpose**: Allow users to design the complete project structure with drag-and-drop hierarchy, layering, and organization—like Notion's filing system

**What It Does** (end vision):
- **Base Plan**: Header with project title, vision, metadata
- **Main Pages**: Top-level sections (Requirements, Architecture, Team Roles, Workflows)
- **Sub-Pages**: Pages within pages (e.g., Requirements → Features → F022 MCP Server)
- **Layering/Drag-Drop**: Organize elements visually, set hierarchy
- **Visual Layout Builder**: "Drag Features section here", "Nest Agent Specs under Architecture"
- **Export as PRD**: System automatically generates consistent PRD.md from visual layout

**Why This Matters**:
- User has visual control over entire project structure
- Plans folder stays organized and predictable
- PRD generation respects user's chosen hierarchy/emphasis
- Easy for new team members to understand project layout at a glance

**Starting Scope** (MVP):
1. Web view UI showing current Plan structure (text-based tree initially)
2. Drag-and-drop to reorder sections
3. "Add Sub-Section" button for nesting
4. Save layout to `plan-layout.json`
5. PRD generator reads layout to structure output

**Example Layout** (JSON):
```json
{
  "baseTitle": "Copilot Orchestration Extension (COE)",
  "sections": [
    {
      "id": "requirements",
      "title": "Requirements & Features",
      "pages": [
        { "id": "f001-f020", "title": "Core Features (F001-F020)", "source": "Plans/CONSOLIDATED-MASTER-PLAN.md" },
        { "id": "f021-f035", "title": "Agent Features (F021-F035)", "source": "Plans/COE-Master-Plan/02-Agent-Role-Definitions.md" }
      ]
    },
    {
      "id": "architecture",
      "title": "Architecture & Workflows",
      "pages": [
        { "id": "mcp-api", "title": "MCP API Reference", "source": "Plans/COE-Master-Plan/05-MCP-API-Reference.md" },
        { "id": "workflows", "title": "Orchestration Workflows", "source": "Plans/COE-Master-Plan/03-Workflow-Orchestration.md" }
      ]
    }
  ]
}
```

**Acceptance Criteria** (MVP):
- [ ] Web view displays current Plans/ structure
- [ ] Drag-and-drop reordering works
- [ ] "Add Sub-Section" creates nesting
- [ ] Save layout to plan-layout.json
- [ ] PRD generator respects layout when structuring output
- [ ] Visual layout matches resulting PRD hierarchy

**Implementation Sketch** (5–6 tasks, phased):
- `[T-301]` Create plan layout data model (~25 min)
- `[T-302]` Build React/Vue web view for layout editor (~45 min)
- `[T-303]` Implement drag-and-drop interaction (~45 min)
- `[T-304]` Add save/load layout persistence (~30 min)
- `[T-305]` Update PRD generator to read layout (~30 min)
- `[T-306]` Add layout validation and export (~30 min)

**Estimated Total**: ~3 hours (when ready)

**Long-Term Vision** (Phase 2):
- Visual blocks for each section (cards with title, description, drag handles)
- Layering panel (set z-index, grouping)
- Templates: "Predefined layouts" (Agile, Waterfall, Research, etc.)
- Collaborative layout: Multiple users can propose layout changes

---

### P3: Status/Issue Reporting Feature (Quick Bug/Issue Logging)

**Purpose**: Simple, easy way for developers to report things that aren't working—creates quick issues/tasks without leaving VS Code

**What It Does**:
1. User encounters issue: "Test T-101 failed—plansReader doesn't handle unicode filenames"
2. Opens "Report Issue" dialog (quick command)
3. Fills in: **Issue Type** (Bug/Task/Question), **Severity** (blocking/high/low), **Description** (what's wrong)
4. Optional: Attach file context, error screenshot
5. Click "Create Task" → Auto-creates GitHub Issue + local task in queue
6. Task automatically tagged with component (e.g., "plansReader", "LLM", "PRD-generation")

**Use Cases**:
- "LLM timeout on Plans/ > 3500 tokens"
- "Plan watcher not detecting file changes on network drives"
- "PRD.json structure doesn't match PRD.md content"
- "Question: Should we support .md.template files?"

**Acceptance Criteria**:
- [ ] Dialog with Type/Severity/Description fields
- [ ] Creates GitHub Issue or local task
- [ ] Auto-tags with component
- [ ] Accessible via command: "COE: Report Issue/Status"
- [ ] Shows confirmation with issue number
- [ ] Completion <30 seconds

**Implementation Sketch** (2–3 tasks):
- `[T-401]` Create issue reporting dialog (~25 min)
- `[T-402]` Implement GitHub Issue creation (~20 min)
- `[T-403]` Add local task queue fallback (~15 min)

**Estimated Total**: ~1 hour (when ready)

---

## 🧪 Implementation Strategy & Testing

### Phase Roadmap

| Phase | Features | Timeline | Priority |
|-------|----------|----------|----------|
| **Phase 0 (NOW)** | LLM PRD Generator (T-101 to T-107) | Week 1 | P1 ⭐ |
| **Phase 1** | Progress Tracker, Drift Detection | Week 2 | P1 |
| **Phase 2** | Plan Update Widget, Layout System | Week 3–4 | P2 |
| **Phase 3** | Status Reporting, Verification Tracking | Week 4–5 | P2–P3 |

### Testing Plan (Post-Implementation)

**For LLM PRD Generator**:
1. Test Plans Reader end-to-end with real Plans/ folder
2. Verify token counting accuracy (≤10% error)
3. Test LLM endpoint with sample context
4. Validate generated PRD.md structure (all sections present)
5. Verify file watcher triggers within 10s
6. Test error handling (LLM timeout, token overflow, file write)

**For Plan Updating Feature**:
1. Test dialog opens/closes correctly
2. Verify LLM suggestion applies to correct section only
3. Validate PRD.md still valid JSON after update
4. Test undo (can revert to previous PRD)

**For Design/Layout System**:
1. Test drag-and-drop reordering
2. Verify nesting (sub-pages create correct hierarchy)
3. Validate plan-layout.json structure
4. Test PRD generation respects layout order

**For Status Reporting**:
1. Test issue creation (both GitHub + local)
2. Verify auto-tagging works
3. Test with various error types (code, network, config)

**Overall**:
- Zero TypeScript errors
- ≥75% test coverage for new code
- No regressions to existing queue/sidebar
- All extension commands present and functional

---

## 🔗 Reference Information

| Resource | URL | Purpose |
|----------|-----|---------|
| PRD Best Practices | [Atlassian PRD Template](https://www.atlassian.com/software/confluence/templates/product-requirements) | Structured requirements docs |
| LLM Prompts | [OpenAI Best Practices](https://platform.openai.com/docs/guides/prompt-engineering) | Effective system prompts |
| VS Code File APIs | [workspace.fs](https://code.visualstudio.com/api/references/vscode-api#workspace.fs) | File system operations |
| Token Counting | [tiktoken](https://github.com/openai/tiktoken) | Accurate token estimation |
| Markdown Parsing | [Marked.js](https://marked.js.org/) | Markdown to structured data |
| Notion-Like UI | [React DnD](https://react-dnd.github.io/react-dnd/) | Drag-and-drop library |
| Layout State | [Zustand](https://github.com/pmndrs/zustand) | Lightweight state management |

---

## 📋 File Structure & Locations

```
docs/Plans/
├── current-plan.md                 ← YOU ARE HERE

src/
├── services/
│   ├── plansReader.ts              ← [T-101] NEW
│   ├── contextBundler.ts           ← [T-102] NEW
│   ├── prdWriter.ts                ← [T-105] NEW
│   └── ...
├── agents/
│   ├── llmClient.ts                ← [T-104] NEW
│   └── ...
├── prompts/
│   ├── prdGenerationPrompt.ts       ← [T-103] NEW
│   └── ...
├── plans/
│   ├── fileWatcher.ts              ← [T-107] MODIFY
│   └── ...
└── extension.ts                    ← [T-106] MODIFY

docs/
├── llm-configuration-guide.md      ← Existing
├── debug-guide.md                  ← Existing
├── testing-guide.md                ← Existing
└── Plans/
    └── current-plan.md             ← This file
```

---

## ✅ Quick Setup & Next Steps

### To Get Started (Phase 0):

1. **Review existing foundation** (10 min)
   - Verify LLM config works: `coe-extension.llm.url` endpoint responding
   - Check Plans/ folder has 23+ .md files
   - Confirm PRD.md exists (or run Python notebook once)

2. **Start with T-101** (Plans Folder Reader)
   - Create `src/services/plansReader.ts`
   - Implement recursive Plans/ reading
   - Write unit tests with real Plans/ folder
   - Verify 23+ files discovered correctly

3. **Progress to T-102** (Context Bundler)
   - Build token counting (rough length/4 formula)
   - Implement file prioritization
   - Test with various token limits (1000, 2000, 4000)

4. **Then LLM integration** (T-103, T-104)
   - Create prompt template
   - Build LLM call with error handling

5. **Expose as command** (T-106)
   - Register "COE: Regenerate PRD from Plans"
   - Wire up orchestration
   - Add progress/error notifications

### Success Criteria After Phase 0:

- [ ] Command exists: "COE: Regenerate PRD from Plans"
- [ ] PRD.md generated from 23+ planning docs
- [ ] Token limit respected (no LLM context overflow)
- [ ] File watcher auto-generates PRD on Plans/ changes
- [ ] Zero TypeScript errors
- [ ] Existing queue/sidebar still works (verified manually)

---

## 📞 Notes & Q&A

**Q: Should we replace the Python notebook?**  
A: Not yet. Keep both during Phase 0 (hybrid). Python notebook handles scheduled batch updates; TypeScript extension handles on-demand. Transition to extension-only in Phase 2.

**Q: What LLM temperature for PRD generation?**  
A: Use 0.3 (deterministic but natural language). Too low (0.1) = robotic, too high (0.7) = unpredictable for technical specs.

**Q: How to handle token overflow?**  
A: Prioritize files (CONSOLIDATED-MASTER-PLAN.md → agent specs → others). Truncate if needed. Future: split into multiple LLM calls and merge.

**Q: Can we validate LLM output quality?**  
A: Check for required sections (## Features, ## Architecture, ## Testing). Verify feature IDs (F001-F056). Add manual review: show diff before overwriting PRD.md.

**Q: Timeline for Secondary Features (Plan Update, Layout System, Status Reporting)?**  
A: These are **P2–P3 and lower priority**. Focus on Phase 0 (LLM PRD Generator) first. Add secondary features in Weeks 2–4 after core foundation is solid.

---

**Document Created**: 2026-01-25  
**Status**: Ready for Phase 0 implementation  
**Next Review**: After T-107 completion

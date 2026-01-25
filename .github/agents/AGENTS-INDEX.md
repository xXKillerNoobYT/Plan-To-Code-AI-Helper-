# Copilot Agent Personas - Quick Index

**Last Updated**: January 24, 2026  
**Purpose**: Quick reference for all available Copilot agent personas

---

## 🎭 Available Agents

| Agent | File | Invoke With | Best For |
|-------|------|-------------|----------|
| **Coding Agent** | `coding-agent.yml` | `@coding-agent` | Implementing features, writing code |
| **Verification Agent** | `verification-agent.yml` | `@verification-agent` | Testing, quality checks, plan comparison |
| **Answer Agent** | `answer-agent.yml` | `@answer-agent` | Quick questions, clarifications |

---

## ⚡ Quick Decision Tree

```
What do you need to do?

├─ Implement a feature
│  └─ Use: @coding-agent
│     Example: "@coding-agent implement getNextTask MCP tool"
│
├─ Check if code matches plan
│  └─ Use: @verification-agent
│     Example: "@verification-agent verify MCP server implementation"
│
├─ Ask a question
│  └─ Use: @answer-agent
│     Example: "@answer-agent what is the return type of getNextTask?"
│
└─ Complex architectural decision
   └─ Use: @answer-agent (will escalate to Planning Team)
      Example: "@answer-agent should we use event sourcing or state machines?"
```

---

## 📊 Agent Comparison Matrix

| Feature | Coding Agent | Verification Agent | Answer Agent |
|---------|--------------|-------------------|--------------|
| **Primary Role** | Builder | Quality Checker | Knowledge Assistant |
| **Response Time** | Variable (15-45 min) | ~3 min (+ 60s wait) | <5 seconds |
| **Modifies Code** | ✅ Yes | ❌ No | ❌ No |
| **Runs Tests** | ✅ Yes | ✅ Yes | ❌ No |
| **Asks Questions** | ✅ Via MCP tool | ✅ For clarifications | ❌ Answers only |
| **Escalates** | ✅ When ≥5% uncertain | ✅ On test failures | ✅ Complex questions |
| **Reads PRD** | ✅ Always first | ✅ For comparison | ✅ For answers |
| **Coverage Threshold** | 80% (90% for P1) | Enforces threshold | N/A |
| **MCP Integration** | ✅ Full (all tools) | ✅ Reporting tools | ✅ Via askQuestion |

---

## 🚀 Common Usage Patterns

### Pattern 1: Feature Implementation Workflow

```bash
# Step 1: Get clarification
@answer-agent what are the acceptance criteria for feature F028?

# Step 2: Implement
@coding-agent implement MCP server getNextTask tool according to PRD.json F028

# Step 3: Verify
@verification-agent check if getNextTask implementation matches the plan
```

### Pattern 2: Fix Failing Tests

```bash
# Step 1: Ask about the failure
@answer-agent why might getNextTask return undefined instead of null?

# Step 2: Fix the code
@coding-agent fix getNextTask to return null when queue is empty

# Step 3: Re-verify
@verification-agent run tests for getNextTask
```

### Pattern 3: Understanding Requirements

```bash
# Quick lookup
@answer-agent where is the MCP protocol specification?

# Detailed explanation
@answer-agent explain how agent teams coordinate task execution

# Architectural question (will escalate)
@answer-agent what is the best database schema for the task queue?
```

---

## 🎯 Agent Strengths & Use Cases

### @coding-agent

**Strengths**:
- ✅ Implements atomic tasks precisely
- ✅ Asks questions when uncertain (zero assumptions)
- ✅ Writes tests alongside code
- ✅ Follows TypeScript strict mode

**Best For**:
- Implementing new features
- Writing MCP tools
- Creating agent team logic
- Building UI components
- Refactoring code

**Not For**:
- Verification (use @verification-agent)
- Answering questions (use @answer-agent)
- Architectural decisions (escalate via @answer-agent)

---

### @verification-agent

**Strengths**:
- ✅ Waits for file stability (60s)
- ✅ Compares to PRD acceptance criteria
- ✅ Runs comprehensive test suites
- ✅ Enforces coverage thresholds (P1=90%, P2=80%, P3=75%)

**Best For**:
- Verifying completed features
- Checking plan compliance
- Running automated tests
- Measuring code coverage
- Quality gate enforcement

**Not For**:
- Writing code (use @coding-agent)
- Quick questions (use @answer-agent)
- Fixing failing tests (it reports failures, doesn't fix)

---

### @answer-agent

**Strengths**:
- ✅ Fast responses (<5s for simple questions)
- ✅ Searches PRD/Plans/Code automatically
- ✅ Cites exact sources
- ✅ Escalates complex questions

**Best For**:
- Quick lookups (return types, file locations)
- Requirement clarifications
- Understanding PRD features
- Finding relevant documentation
- Routing complex questions

**Not For**:
- Writing code (use @coding-agent)
- Running tests (use @verification-agent)
- Architectural decisions (escalates to Planning Team)

---

## 🔄 Agent Handoff Flow

```
User Request
   ↓
@answer-agent (if question) ──→ Quick answer (<5s)
   ↓                              │
   │                              ↓
   │                         If complex → Escalate to Planning Team
   ↓
@coding-agent (if implementation)
   ↓
   • Reads PRD
   • Asks @answer-agent if uncertain
   • Implements code + tests
   • Reports completion
   ↓
@verification-agent (automatic after completion)
   ↓
   • Waits 60s for file stability
   • Runs tests
   • Compares to plan
   • Reports PASS/FAIL
   ↓
If FAIL → Back to @coding-agent for fixes
If PASS → Task complete ✅
```

---

## 📋 Agent Configuration Summary

### Coding Agent (`coding-agent.yml`)

```yaml
ask_threshold: 95%          # Asks if ≥5% uncertain
zero_assumption_policy: true
mcp_integration: enabled
modular_execution: enforced
coverage_target: 80% (90% for P1)
```

### Verification Agent (`verification-agent.yml`)

```yaml
file_stability_wait: 60s    # Waits for files to stabilize
comparison_mode: strict
coverage_thresholds:
  P1: 90%
  P2: 80%
  P3: 75%
```

### Answer Agent (`answer-agent.yml`)

```yaml
response_time_target: 5s    # <5s for simple questions
context_sources: [PRD, Plans, Code]
escalation_threshold: complex
confidence_minimum: 70%
```

---

## 🛠️ Overriding Agent Behavior

You can customize agent behavior per task:

```bash
# Force aggressive mode (skip questions)
@coding-agent --ask-threshold=99% implement simple utility

# Require stricter verification
@verification-agent --coverage-threshold=95% check P1 feature

# Allow deeper analysis
@answer-agent --response-time=30s explain MCP architecture
```

---

## 🧪 Testing Agent Personas

To test if agents are working:

```bash
# Test coding agent
@coding-agent create a simple hello world function with tests

# Test verification agent
@verification-agent check if the hello world function has tests

# Test answer agent
@answer-agent what is the purpose of the COE project?
```

---

## 📚 Related Documentation

- **Full README**: `.github/agents/README.md`
- **Coding Agent**: `.github/agents/coding-agent.yml`
- **Verification Agent**: `.github/agents/verification-agent.yml`
- **Answer Agent**: `.github/agents/answer-agent.yml`
- **Global Copilot Instructions**: `.github/copilot-instructions.md`
- **MCP API Reference**: `Plans/COE-Master-Plan/05-MCP-API-Reference.md`

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Agent not responding | Ensure you're using `@agent-name` syntax |
| Coding agent keeps asking questions | Lower `--ask-threshold` or provide more context |
| Verification agent fails every time | Check if tests are written and passing |
| Answer agent says "I don't know" | Question may require escalation (complex/architectural) |
| Agent gives wrong answer | Report issue, check if PRD has been updated |

---

**Version**: 1.0.0  
**Maintained By**: COE Development Team

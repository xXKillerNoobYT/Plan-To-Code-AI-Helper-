# 🤖 Copilot Agent Personas for COE Development

## What Are Agent Personas? (For Noobs!)

**Think of these as different "characters" that GitHub Copilot plays when helping you build the COE project!** 🎭

Just like actors play different roles, Copilot can switch between different modes:
- **@coding-agent**: The careful builder who asks questions before making assumptions
- **@verification-agent**: The quality checker who tests everything twice
- **@answer-agent**: The helpful assistant who answers your questions quickly

---

## 🎯 Why Use Agent Personas?

**Problem**: When Copilot helps with complex projects, it needs different "mindsets" for different tasks.

**Solution**: Agent personas give Copilot clear instructions on how to behave for specific roles:

| Persona | When to Use | Key Behavior |
|---------|-------------|--------------|
| **@coding-agent** | Writing code, implementing features | Asks questions when >5% uncertain, never guesses |
| **@verification-agent** | Checking completed work | Waits for files to stabilize, compares to plan |
| **@answer-agent** | Answering questions, providing context | Fast responses <5s, escalates complex questions |

---

## 📁 Available Agent Personas

### 1. **@coding-agent** (Main Builder)
**File**: `coding-agent.yml`

**Purpose**: Primary implementer for all COE features

**Key Settings**:
- `ask_threshold: 95%` — If ≥5% uncertain, asks via MCP `askQuestion` tool
- `zero_assumption_policy: true` — Never guess feature requirements
- `mcp_integration: enabled` — Uses MCP tools for communication
- `modular_execution: enforced` — Always follows atomic task rules

**When to Invoke**:
```bash
# In your prompt or chat
"@coding-agent implement the getNextTask MCP tool"
```

**Behavior**:
- ✅ Reads PRD.json/md before starting
- ✅ Asks clarifying questions via `askQuestion` MCP tool
- ✅ Implements one atomic task at a time
- ✅ Writes tests alongside code
- ❌ Never guesses if acceptance criteria are unclear

---

### 2. **@verification-agent** (Quality Checker)
**File**: `verification-agent.yml`

**Purpose**: Verifies completed work against plan specifications

**Key Settings**:
- `file_stability_wait: 60s` — Waits for files to stop changing before checking
- `comparison_mode: strict` — Compares implementation to plan requirements
- `test_coverage_threshold: 75%` — Enforces minimum coverage (90% for P1)

**When to Invoke**:
```bash
# After implementing a feature
"@verification-agent check if the MCP server implementation matches the plan"
```

**Behavior**:
- ✅ Waits for 60s file stability before checking
- ✅ Runs automated tests and linting
- ✅ Compares implementation to PRD acceptance criteria
- ✅ Reports discrepancies via `reportObservation` MCP tool
- ❌ Doesn't modify code (only verifies)

---

### 3. **@answer-agent** (Q&A Helper)
**File**: `answer-agent.yml`

**Purpose**: Provides fast, context-aware answers during development

**Key Settings**:
- `response_time_target: 5s` — Fast answers for common questions
- `context_sources: [PRD, Plans, Code]` — Searches all documentation
- `escalation_threshold: complex` — Routes hard questions to human/Planning Team

**When to Invoke**:
```bash
# When you have a question
"@answer-agent what is the expected return type for getNextTask?"
```

**Behavior**:
- ✅ Searches PRD.json/md first
- ✅ Checks Plans/ directory for detailed specs
- ✅ Returns answers in <5s for simple questions
- ✅ Escalates complex architectural questions
- ❌ Doesn't make up answers (says "I don't know" if uncertain)

---

## 🚀 How to Use Agent Personas

### Method 1: In Chat/Prompts

Simply mention the agent persona in your request:

```
@coding-agent implement the reportTaskStatus MCP tool with proper error handling
```

### Method 2: In GitHub Issues

Tag the agent in issue descriptions:

```markdown
## Task
Implement getNextTask MCP tool

@coding-agent please implement this feature following the PRD spec
```

### Method 3: In Pull Requests

Invoke agents for review:

```markdown
@verification-agent please verify this implementation matches the plan
```

---

## ⚙️ Agent Configuration Structure

Each agent YAML file contains:

```yaml
name: agent-name
team_role: description
activation_mode: how it activates
response_depth: level of detail
priority_awareness: true/false
mcp_tools: [list of MCP tools]
behavior_rules:
  - Rule 1
  - Rule 2
constraints:
  - Constraint 1
```

---

## 🔄 Agent Coordination

**How agents work together**:

```
1. User: "Implement feature X"
   ↓
2. @coding-agent: Reads PRD, asks clarifying questions
   ↓
3. @coding-agent: Implements code + tests
   ↓
4. @verification-agent: Checks implementation vs plan
   ↓
5. @verification-agent: Reports results
   ↓
6. If issues found → Loop back to @coding-agent
   If all good → Mark task complete
```

**When you need help during coding**:
```
@coding-agent working → Encounters unclear requirement
   ↓
@coding-agent calls @answer-agent via MCP askQuestion
   ↓
@answer-agent searches PRD/Plans
   ↓
@answer-agent returns answer <5s
   ↓
@coding-agent continues implementation
```

---

## 📊 Agent Decision Matrix

| Scenario | Which Agent? | Why? |
|----------|---------------|------|
| Implementing new feature | @coding-agent | Main builder role |
| Feature requirement unclear | @answer-agent | Fast Q&A lookups |
| Checking completed work | @verification-agent | Quality assurance |
| Writing tests | @coding-agent | Tests are part of implementation |
| Comparing to acceptance criteria | @verification-agent | Plan comparison expert |
| Architecture question | @answer-agent | Searches Plans/ docs |

---

## 🛠️ Customizing Agent Behavior

**You can override agent settings per task**:

```bash
# Force aggressive mode (skip questions)
@coding-agent --ask-threshold=99% implement simple utility function

# Require stricter verification
@verification-agent --coverage-threshold=95% check P1 feature

# Allow slower but deeper answers
@answer-agent --response-time=30s explain MCP protocol architecture
```

---

## 🧠 Best Practices

1. **Start with @coding-agent** for implementation work
2. **Use @answer-agent** when you need quick clarifications
3. **Always run @verification-agent** before marking tasks complete
4. **Let agents communicate via MCP tools** (don't manually relay messages)
5. **Respect agent specializations** (don't ask @verification-agent to write code)

---

## 🚨 Common Mistakes

❌ **BAD**: Asking @coding-agent to verify its own work  
✅ **GOOD**: Use @verification-agent for independent verification

❌ **BAD**: Using @answer-agent for complex architectural decisions  
✅ **GOOD**: Ask @answer-agent to route to human/Planning Team

❌ **BAD**: Letting @coding-agent guess when uncertain  
✅ **GOOD**: Let it ask questions via `askQuestion` MCP tool

---

## 📚 Related Documentation

- **Global Copilot Instructions**: `.github/copilot-instructions.md`
- **MCP Tool Reference**: `Plans/COE-Master-Plan/05-MCP-API-Reference.md`
- **Agent Team Specs**: `Plans/COE-Master-Plan/02-Agent-Role-Definitions.md`
- **Modular Execution**: `Plans/MODULAR-EXECUTION-PHILOSOPHY.md`

---

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Maintained By**: COE Development Team

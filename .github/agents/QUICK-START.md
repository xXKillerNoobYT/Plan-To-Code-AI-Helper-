# 🚀 Copilot Agent Personas - Quick Start Guide

**For developers who just want to get started NOW!**

---

## ⚡ 30-Second Quick Start

**What are agent personas?** Different "roles" that GitHub Copilot plays when helping you code.

**How to use them?** Just mention them in your chat or comments:

```bash
@coding-agent implement the getNextTask function
@verification-agent check if my implementation is correct
@answer-agent what is the return type of getNextTask?
```

That's it! **The agents know what to do based on their role.**

---

## 🎯 Which Agent Should I Use?

### Use `@coding-agent` when you want to:
- ✅ Implement a new feature
- ✅ Write code (TypeScript, React, etc.)
- ✅ Create tests for your code
- ✅ Refactor existing code

**Example**:
```
@coding-agent implement the reportTaskStatus MCP tool with error handling
```

---

### Use `@verification-agent` when you want to:
- ✅ Check if your code matches the plan
- ✅ Run automated tests
- ✅ Verify acceptance criteria are met
- ✅ Get a quality report

**Example**:
```
@verification-agent verify that the MCP server implementation meets all requirements
```

---

### Use `@answer-agent` when you want to:
- ✅ Ask a quick question
- ✅ Find something in the documentation
- ✅ Clarify a requirement
- ✅ Get context about a feature

**Example**:
```
@answer-agent where can I find the MCP protocol specification?
```

---

## 📝 Real-World Examples

### Example 1: Building a New Feature

```bash
# Step 1: Understand the requirement
You: "@answer-agent what are the acceptance criteria for feature F028?"

Answer Agent: "Feature F028 (MCP Server) acceptance criteria:
1. Implements getNextTask tool returning highest priority task
2. Returns super-detailed prompt with design references
3. Handles empty queue (returns null)
Source: PRD.json > features[27]"

# Step 2: Implement
You: "@coding-agent implement getNextTask MCP tool per PRD.json F028"

Coding Agent: *implements code with tests*

# Step 3: Verify
You: "@verification-agent check getNextTask implementation"

Verification Agent: "✅ PASS
- All tests passed (8/8)
- Coverage: 92% (exceeds 90% P1 threshold)
- All acceptance criteria met"
```

---

### Example 2: Fixing a Bug

```bash
# Step 1: Ask about the error
You: "@answer-agent why would getNextTask return undefined instead of null?"

Answer Agent: "getNextTask should return null when queue is empty, not undefined. 
Check if you're using 'return null' explicitly. TypeScript strict mode will 
catch this if return type is Promise<Task | null>.
Source: PRD.json F028 acceptance criteria #3"

# Step 2: Fix the code
You: "@coding-agent fix getNextTask to return null when queue empty"

Coding Agent: *fixes the code*

# Step 3: Verify the fix
You: "@verification-agent run tests for getNextTask"

Verification Agent: "✅ PASS - All tests now passing"
```

---

### Example 3: Understanding Architecture

```bash
You: "@answer-agent how do the agent teams coordinate?"

Answer Agent: "Agent coordination workflow:
1. Planning Team → generates tasks
2. Orchestrator → routes via getNextTask
3. Coding AI → implements
4. Verification Team → tests
5. Answer Team → supports via askQuestion

Communication uses MCP tools. See Plans/COE-Master-Plan/03-Workflow-Orchestration.md 
for full sequence diagrams."
```

---

## 🔧 Advanced Usage

### Customizing Agent Behavior

Override default settings per request:

```bash
# Tell coding agent to be more aggressive (ask fewer questions)
@coding-agent --ask-threshold=99% implement simple utility function

# Tell verification agent to be stricter
@verification-agent --coverage-threshold=95% verify P1 feature

# Give answer agent more time for complex questions
@answer-agent --response-time=30s explain the complete MCP protocol flow
```

---

### Chaining Agents in Workflow

You can mention multiple agents in sequence:

```bash
# Multi-step workflow
I need to implement feature X. 

@answer-agent first, what are the acceptance criteria?
[wait for response]

@coding-agent implement feature X with those criteria
[wait for implementation]

@verification-agent verify the implementation
```

---

### Using Agents in GitHub Issues

```markdown
## Task: Implement getNextTask MCP Tool

**Requirements**: See PRD.json Feature F028

---

### Implementation
@coding-agent please implement this feature following the PRD spec

### Verification
@verification-agent please verify after implementation
```

---

## 🎓 Agent Behavior Summary

### @coding-agent Behavior

**What it does**:
1. Reads PRD.json for feature specs
2. Asks questions if uncertain (≥5% uncertain)
3. Implements code following TypeScript strict mode
4. Writes tests alongside code
5. Reports completion via MCP tools

**What it doesn't do**:
- ❌ Guess requirements
- ❌ Skip tests
- ❌ Implement multiple features at once
- ❌ Ignore P1 priorities

---

### @verification-agent Behavior

**What it does**:
1. Waits 60 seconds for files to stabilize
2. Runs all automated tests (unit, integration, linting)
3. Compares implementation to PRD acceptance criteria
4. Generates detailed verification report
5. Reports PASS/FAIL/PARTIAL via MCP tools

**What it doesn't do**:
- ❌ Modify code (only verifies)
- ❌ Skip waiting for file stability
- ❌ Pass verification if requirements not met

---

### @answer-agent Behavior

**What it does**:
1. Searches PRD.json/md first
2. Checks Plans/ directory for detailed specs
3. Returns answer in <5 seconds (for simple questions)
4. Cites exact sources
5. Escalates complex/architectural questions

**What it doesn't do**:
- ❌ Make up answers
- ❌ Answer architectural questions (escalates)
- ❌ Modify code
- ❌ Run tests

---

## ⚠️ Common Mistakes & Fixes

### Mistake 1: Using wrong agent for the task

```bash
# ❌ BAD: Asking verification agent to write code
@verification-agent implement getNextTask

# ✅ GOOD: Use coding agent for implementation
@coding-agent implement getNextTask
```

---

### Mistake 2: Not providing enough context

```bash
# ❌ BAD: Vague request
@coding-agent write some code

# ✅ GOOD: Specific request with context
@coding-agent implement getNextTask MCP tool according to PRD.json Feature F028
```

---

### Mistake 3: Skipping verification

```bash
# ❌ BAD: Mark task done without verification
# (No verification step)

# ✅ GOOD: Always verify before marking complete
@coding-agent implement feature
# ... wait for implementation ...
@verification-agent verify implementation
# ... wait for PASS ...
# NOW mark task complete
```

---

## 🧪 Test Drive the Agents

Try these commands to see agents in action:

```bash
# Test Answer Agent (should respond in <5s)
@answer-agent what is the purpose of the COE project?

# Test Coding Agent (should ask questions if unclear)
@coding-agent create a function called greet that says hello

# Test Verification Agent (should run tests)
@verification-agent verify the greet function
```

---

## 📊 Agent Performance Targets

| Agent | Response Time | Success Rate |
|-------|---------------|--------------|
| **@coding-agent** | 15-45 min per task | ≥90% atomic tasks |
| **@verification-agent** | ~3 min + 60s wait | ≥95% accurate verdicts |
| **@answer-agent** | <5s simple, <15s complex | ≥95% correct answers |

---

## 🔗 Next Steps

1. **Try the agents now** - Use the examples above
2. **Read the full README** - `.github/agents/README.md`
3. **Check agent configs** - `.github/agents/*.yml`
4. **Explore MCP tools** - `Plans/COE-Master-Plan/05-MCP-API-Reference.md`
5. **Follow coding standards** - `.github/copilot-instructions.md`

---

## 🆘 Getting Help

- **Quick answer**: Ask `@answer-agent`
- **Implementation help**: See `.github/copilot-instructions.md`
- **Agent not working**: Check `.github/agents/README.md` troubleshooting section
- **Found a bug**: Report in GitHub Issues

---

**Happy coding! 🚀**

**Version**: 1.0.0  
**Last Updated**: January 24, 2026

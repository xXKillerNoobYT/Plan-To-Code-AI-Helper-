# Copilot Agent YAML Schema Documentation

**This file documents the expected structure of agent persona YAML files**

---

## 📋 YAML Schema Definition

All agent YAML files should follow this structure:

```yaml
# ========================================
# METADATA (Required)
# ========================================
name: string                    # Agent identifier (e.g., "coding-agent")
version: semver                 # Version number (e.g., "1.0.0")
description: string             # Brief description of agent purpose

# ========================================
# ROLE DEFINITION (Required)
# ========================================
team_role: string              # Role in development team (e.g., "primary_implementer")
persona_type: string           # Type of persona (e.g., "coding", "verification", "qa_support")
specialization: array          # List of specialized capabilities
  - string
  - string

# ========================================
# ACTIVATION & BEHAVIOR (Required)
# ========================================
activation_mode: enum          # How agent activates: "explicit" | "automatic" | "conditional"
response_depth: enum           # Detail level: "minimal" | "moderate" | "detailed" | "comprehensive" | "adaptive"
priority_awareness: boolean    # Whether agent respects P1/P2/P3 priorities

# ========================================
# AGENT-SPECIFIC CONFIGURATION
# ========================================
# Each agent type has its own specific config sections:

# For Coding Agent:
zero_assumption_policy:
  enabled: boolean
  ask_threshold: percentage    # e.g., "95%"
  triggers: array
  question_mechanism: object
  forbidden_assumptions: array

modular_execution:
  enforced: boolean
  atomic_criteria: object
  rejection_criteria: array

coding_standards:
  language: string             # e.g., "TypeScript"
  style_guide: string
  typescript_rules: object
  file_organization: object
  error_handling: object

testing_policy:
  required: boolean
  coverage_target: percentage
  coverage_p1: percentage
  test_types: object
  test_patterns: array
  completion_rule: string

# For Verification Agent:
file_stability:
  enabled: boolean
  wait_time: integer           # seconds
  stability_check: object
  watched_patterns: array
  skip_wait_for: array
  wait_actions: array

verification_modes:
  comparison_mode: enum        # "strict" | "moderate" | "lenient"
  strict_mode: array
  moderate_mode: array
  lenient_mode: array

plan_comparison:
  enabled: boolean
  reference_sources: array
  comparison_steps: object

test_execution:
  automatic: boolean
  test_suites: object
  coverage_thresholds: object
  on_test_failure: array

# For Answer Agent:
response_time:
  target: integer              # seconds
  time_budgets: object
  on_timeout: object

context_sources:
  enabled: boolean
  search_order: array          # e.g., ["prd", "plans", "code", "issues"]
  prd: object
  plans: object
  code: object
  issues: object

search_strategy:
  multi_stage: boolean
  stage_1_quick_lookup: object
  stage_2_multi_doc: object
  stage_3_deep_analysis: object
  stage_4_escalation: object

escalation:
  enabled: boolean
  threshold: string
  escalation_triggers: object
  escalation_routing: array

# ========================================
# MCP INTEGRATION (Required for all agents)
# ========================================
mcp_integration:
  enabled: boolean
  server_connection: string    # e.g., "auto" | "manual"
  available_tools: array       # List of MCP tool names
  tool_usage: object           # When/how to use each tool

# ========================================
# BEHAVIOR RULES (Required)
# ========================================
behavior_rules: array          # List of core principles and workflows
  - string
  - string

# ========================================
# CONSTRAINTS (Required)
# ========================================
constraints: array             # Strict limits and forbidden actions
  - string
  - string

# ========================================
# INTEGRATION WITH OTHER AGENTS (Optional)
# ========================================
agent_coordination:
  receives_from: array         # Which agents send to this one
    - agent: string
      receives: string
      action: string
  
  sends_to: array              # Which agents this one sends to
    - agent: string
      sends: string
      when: string

# ========================================
# PERFORMANCE METRICS (Optional)
# ========================================
metrics: object                # Target performance metrics
  target_*: value              # Various metrics

# ========================================
# EXAMPLES (Recommended)
# ========================================
examples: array                # Example usage scenarios
  - scenario: string
    steps: array

# ========================================
# VERSION HISTORY (Recommended)
# ========================================
changelog: array
  - version: semver
    date: date                 # YYYY-MM-DD
    changes: array
```

---

## 🎯 Field Definitions

### Core Metadata Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `name` | string | ✅ Yes | Unique agent identifier | `"coding-agent"` |
| `version` | semver | ✅ Yes | Semantic version number | `"1.0.0"` |
| `description` | string | ✅ Yes | Brief agent purpose | `"Main builder for COE features"` |

### Role Definition Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `team_role` | string | ✅ Yes | Role in team | `"primary_implementer"` |
| `persona_type` | string | ✅ Yes | Type of persona | `"coding"` |
| `specialization` | array | ✅ Yes | List of capabilities | `["TypeScript", "Testing"]` |

### Activation Fields

| Field | Type | Required | Description | Values |
|-------|------|----------|-------------|--------|
| `activation_mode` | enum | ✅ Yes | How agent activates | `"explicit"` \| `"automatic"` \| `"conditional"` |
| `response_depth` | enum | ✅ Yes | Detail level | `"minimal"` \| `"moderate"` \| `"detailed"` \| `"comprehensive"` \| `"adaptive"` |
| `priority_awareness` | boolean | ✅ Yes | Respects P1/P2/P3 | `true` \| `false` |

### MCP Integration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mcp_integration.enabled` | boolean | ✅ Yes | Enable MCP tools |
| `mcp_integration.available_tools` | array | ✅ Yes | List of MCP tool names |
| `mcp_integration.tool_usage` | object | ✅ Yes | When/how to use tools |

### Behavior Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `behavior_rules` | array | ✅ Yes | Core principles and workflows |
| `constraints` | array | ✅ Yes | Limits and forbidden actions |

---

## 📊 Validation Rules

### Required Sections (All Agents Must Have)

```yaml
✅ name
✅ version
✅ description
✅ team_role
✅ persona_type
✅ specialization
✅ activation_mode
✅ response_depth
✅ priority_awareness
✅ mcp_integration
✅ behavior_rules
✅ constraints
```

### Agent-Specific Required Sections

**Coding Agent**:
```yaml
✅ zero_assumption_policy
✅ modular_execution
✅ coding_standards
✅ testing_policy
```

**Verification Agent**:
```yaml
✅ file_stability
✅ verification_modes
✅ plan_comparison
✅ test_execution
```

**Answer Agent**:
```yaml
✅ response_time
✅ context_sources
✅ search_strategy
✅ escalation
```

---

## 🔍 Example Validation Checklist

Use this checklist when creating new agent YAML files:

- [ ] **Metadata complete**: name, version, description
- [ ] **Role defined**: team_role, persona_type, specialization
- [ ] **Activation configured**: activation_mode, response_depth, priority_awareness
- [ ] **MCP integration**: enabled, available_tools, tool_usage patterns
- [ ] **Behavior rules**: Core principles listed (≥5 rules)
- [ ] **Constraints**: Limits and forbidden actions (≥5 constraints)
- [ ] **Agent coordination**: receives_from and sends_to defined
- [ ] **Examples**: At least 2 usage scenarios
- [ ] **Changelog**: Version history with dates
- [ ] **Agent-specific**: All required sections for agent type

---

## 🎨 YAML Style Guide

### Formatting Rules

1. **Indentation**: 2 spaces (no tabs)
2. **Comments**: Use `#` for section headers
3. **Arrays**: Use inline `[]` for short lists, block style for long lists
4. **Strings**: Quote strings with special characters or spaces
5. **Booleans**: Use lowercase `true` / `false`
6. **Percentages**: Use string format `"95%"`
7. **Section dividers**: Use `# ===...=== ` for major sections

### Example Formatting

```yaml
# ========================================
# SECTION NAME
# ========================================

# Inline array (short)
simple_list: ["item1", "item2", "item3"]

# Block array (long)
detailed_list:
  - "First item with description"
  - "Second item with description"
  - "Third item with description"

# Nested object
complex_object:
  enabled: true
  threshold: "95%"
  sub_config:
    option1: value1
    option2: value2

# Multi-line string
description: |
  This is a multi-line description
  that spans several lines.
  Use the pipe (|) character.
```

---

## 🧪 Testing Agent YAML Files

### Manual Validation

```bash
# Check YAML syntax
python -c "import yaml; yaml.safe_load(open('.github/agents/coding-agent.yml'))"

# Or use online validator
# https://www.yamllint.com/
```

### Required Fields Check

```python
import yaml

required_fields = [
    'name', 'version', 'description',
    'team_role', 'persona_type', 'specialization',
    'activation_mode', 'response_depth', 'priority_awareness',
    'mcp_integration', 'behavior_rules', 'constraints'
]

with open('.github/agents/coding-agent.yml') as f:
    agent = yaml.safe_load(f)
    
for field in required_fields:
    assert field in agent, f"Missing required field: {field}"
```

---

## 📐 Common YAML Mistakes

### ❌ Mistake 1: Inconsistent Indentation

```yaml
# BAD
mcp_integration:
  enabled: true
    available_tools:
      - getNextTask

# GOOD
mcp_integration:
  enabled: true
  available_tools:
    - getNextTask
```

### ❌ Mistake 2: Missing Quotes for Special Characters

```yaml
# BAD
ask_threshold: 95%  # Treated as number 95, not string "95%"

# GOOD
ask_threshold: "95%"
```

### ❌ Mistake 3: Wrong Boolean Format

```yaml
# BAD
enabled: True   # Capital T
enabled: yes    # "yes" instead of true

# GOOD
enabled: true   # Lowercase
```

### ❌ Mistake 4: Tab Characters

```yaml
# BAD (contains tabs - invisible here)
behavior_rules:
	- "Rule 1"

# GOOD (2 spaces)
behavior_rules:
  - "Rule 1"
```

---

## 🔗 Related Documentation

- **Coding Agent**: `.github/agents/coding-agent.yml`
- **Verification Agent**: `.github/agents/verification-agent.yml`
- **Answer Agent**: `.github/agents/answer-agent.yml`
- **README**: `.github/agents/README.md`
- **Quick Start**: `.github/agents/QUICK-START.md`

---

## 📝 Creating a New Agent Persona

1. **Copy template** from existing agent YAML
2. **Update metadata** (name, version, description)
3. **Define role** (team_role, persona_type, specialization)
4. **Configure activation** (activation_mode, response_depth)
5. **Set up MCP integration** (available_tools, tool_usage)
6. **Add behavior rules** (≥5 core principles)
7. **Add constraints** (≥5 limits/forbidden actions)
8. **Add examples** (≥2 usage scenarios)
9. **Validate YAML** syntax and required fields
10. **Test** with real usage

---

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Maintained By**: COE Development Team

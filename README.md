# Plan-To-Code-AI-Helper

A unified coding agent that transforms plans into production-ready code through orchestrated collaboration of five specialized roles.

## Overview

Take a simple or complex plan, improve it through comprehensive design, and transform it into a proper program that's maintainable and extensible. The system uses a multi-role agent architecture to ensure quality at every step.

## Features

### 🤖 Five Specialized Roles

1. **Planner** - Analyzes requirements, detects vagueness, and creates detailed action plans
2. **Architect** - Designs system structure, components, and interfaces
3. **Coder** - Implements clean, documented code following best practices
4. **Reviewer** - Reviews code quality, standards compliance, and security
5. **Executor** - Validates implementation through testing and execution

### 🧠 Core Components

- **Smart Plan**: Intelligent vagueness detection in requirements
  - Identifies unclear statements
  - Generates clarifying questions
  - Ensures requirements are actionable

- **Zen Tasks**: Workflow management system
  - Task dependency tracking
  - Progress monitoring
  - Status reporting

- **Tasksync**: Feedback loop integration
  - Cross-role communication
  - Issue tracking
  - Quality assurance

- **Overseer**: Orchestration engine
  - Role switching logic
  - Context preservation
  - Scope enforcement

### ✨ Key Capabilities

- ✅ Strict scope adherence
- ✅ Automatic clarifying questions for vague requirements
- ✅ Context maintenance across all roles
- ✅ Clean, full-file code outputs
- ✅ Comprehensive execution reports
- ✅ Dependency-aware workflow execution

## Installation

```bash
# Clone the repository
git clone https://github.com/xXKillerNoobYT/Plan-To-Code-AI-Helper-.git
cd Plan-To-Code-AI-Helper-

# No external dependencies required - uses Python standard library only
python3 unified_agent.py
```

## Usage

### Basic Example

```python
from unified_agent import Overseer

# Define your requirements
requirements = """
Create a web API for user management:
- User registration and authentication
- Profile management
- Role-based access control
"""

# Initialize the Overseer
overseer = Overseer(
    project_name="UserManagementAPI",
    requirements=requirements
)

# Execute the complete workflow
results = overseer.execute_workflow()

# Get outputs from each role
for role_name, output in results["outputs"].items():
    print(output)

# Generate comprehensive report
print(overseer.generate_report())

# Check for any clarifying questions
questions = overseer.get_clarifying_questions()
if questions:
    for q in questions:
        print(f"❓ {q}")
```

### Advanced Usage

```python
from unified_agent import Overseer, RoleType

overseer = Overseer("MyProject", requirements)

# Setup custom workflow
overseer.setup_workflow()

# Execute specific role manually
planner = overseer.switch_role(RoleType.PLANNER)
plan_output = planner.execute(overseer.context, task)

# Access context at any point
print(f"Current plan: {overseer.context.plan}")
print(f"Generated files: {overseer.context.code_files.keys()}")

# Check workflow progress
status = overseer.zen_tasks.get_workflow_status()
print(f"Progress: {status['progress_percentage']:.1f}%")
```

## Architecture

```
unified_agent.py
├── Overseer (Orchestration)
│   ├── Context Management
│   ├── Role Switching
│   └── Workflow Control
│
├── Roles
│   ├── PlannerRole
│   ├── ArchitectRole
│   ├── CoderRole
│   ├── ReviewerRole
│   └── ExecutorRole
│
└── Core Systems
    ├── SmartPlan (Vagueness Detection)
    ├── ZenTasks (Workflow Management)
    └── Tasksync (Feedback Loops)
```

## Example Output

When you run the agent, it produces structured outputs from each role:

```
================================================================================
Planner Output
================================================================================
## Planning Phase

### Vagueness Detected
The following items need clarification:
- Line 4: Maybe add priority levels (TBD)

### Proceeding with assumptions...

### Action Plan
1. Architecture Design
2. Implementation
3. Review & Validation
4. Execution & Testing
================================================================================
```

## Workflow

The agent follows a strict workflow with dependency management:

1. **Planning** → Analyzes requirements, detects issues
2. **Architecture** → Designs system structure (depends on Planning)
3. **Coding** → Implements solution (depends on Architecture)
4. **Review** → Validates quality (depends on Coding)
5. **Execution** → Tests and validates (depends on Review)

## Configuration

The system is designed to be extensible. You can:

- Add custom roles by extending `AgentRole`
- Customize vagueness patterns in `SmartPlan`
- Modify workflow tasks in `setup_workflow()`
- Add custom validation in `ExecutorRole`

## Testing

Run the example to see the full workflow in action:

```bash
python3 unified_agent.py
```

Expected output includes:
- Role-specific outputs from all five agents
- Comprehensive execution report
- Generated code files
- Clarifying questions (if vagueness detected)

## Contributing

Contributions are welcome! Areas for enhancement:
- Additional role types
- More sophisticated vagueness detection
- Integration with external tools
- Custom output formatters
- Language-specific code generators

## License

MIT License - See LICENSE file for details

## Author

xXKillerNoobYT

---

**Unified Coding Agent** - From requirements to code, orchestrated intelligently.

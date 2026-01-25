# Plan-To-Code AI Helper

A comprehensive system that transforms plans into production-ready code through a combination of detailed planning frameworks and a unified coding agent with five specialized roles.

## 🎯 What This Repository Provides

This repository contains two powerful components:

1. **Planning Framework** - Comprehensive planning specifications, templates, and methodologies
2. **Unified Coding Agent** - Intelligent multi-role agent that executes plans into working code

Together, they provide an end-to-end solution from initial planning to final implementation.

---

## 📚 Part 1: Planning Framework

All planning specifications, templates, and methodologies are located in the `/Plans/` directory.

**Start here**: [Plans/README.md](Plans/README.md)

### What the Planning Framework Provides

- **Planning Specifications**: Detailed specifications for planning wizards, ticket systems, and AI team coordination
- **Templates**: Reusable project plan templates for any type of software project
- **Methodologies**: Proven approaches including modular execution, lifecycle models, and evolution frameworks  
- **Architecture Docs**: Complete system architecture and technical specifications in `Plans/COE-Master-Plan/`
- **PRD Generator**: Jupyter notebook (`PRD.ipynb`) to generate comprehensive Product Requirement Documents

### Key Planning Documents

| Document | Purpose |
|----------|---------|
| **Plans/AI-TEAMS-DOCUMENTATION-INDEX.md** | Master index and navigation |
| **Plans/CONSOLIDATED-MASTER-PLAN.md** | Complete project planning framework |
| **Plans/PROJECT-PLAN-TEMPLATE.md** | Generic project template |
| **PRD.ipynb** | PRD generator notebook |

---

## 🤖 Part 2: Unified Coding Agent

A unified coding agent that transforms plans into production-ready code through orchestrated collaboration of five specialized roles.

### Five Specialized Roles

1. **Planner** - Analyzes requirements, detects vagueness, and creates detailed action plans
2. **Architect** - Designs system structure, components, and interfaces
3. **Coder** - Implements clean, documented code following best practices
4. **Reviewer** - Reviews code quality, standards compliance, and security
5. **Executor** - Validates implementation through testing and execution

### Core Components

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

### Key Capabilities

- ✅ Strict scope adherence
- ✅ Automatic clarifying questions for vague requirements
- ✅ Context maintenance across all roles
- ✅ Clean, full-file code outputs
- ✅ Comprehensive execution reports
- ✅ Dependency-aware workflow execution

---

## 🚀 Getting Started

### For Planning Framework

1. Browse `/Plans/` for planning specifications and templates
2. Use `PROJECT-PLAN-TEMPLATE.md` as a starting point for new projects
3. Run `PRD.ipynb` to generate updated requirement documents from plan sources
4. Refer to architecture docs in `Plans/COE-Master-Plan/` for technical implementation details

### For Unified Agent

```bash
# Clone the repository
git clone https://github.com/xXKillerNoobYT/Plan-To-Code-AI-Helper-.git
cd Plan-To-Code-AI-Helper-

# No external dependencies required - uses Python standard library only
python3 unified_agent.py
```

## 💻 Usage

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

## Quick Links

- 📖 [QUICKSTART.md](QUICKSTART.md) - Quick start guide for the unified agent
- 🏗️ [DESIGN.md](DESIGN.md) - Design documentation
- 💻 [IMPLEMENTATION.md](IMPLEMENTATION.md) - Implementation details
- 📁 [Plans/](Plans/) - Planning framework documentation

---

**Version**: 3.0  
**Last Updated**: January 24, 2026  
**Author**: xXKillerNoobYT

From planning to implementation - orchestrated intelligently.

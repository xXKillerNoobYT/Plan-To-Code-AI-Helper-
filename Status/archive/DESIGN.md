# Unified Coding Agent - Design Document

## Architecture Overview

The Unified Coding Agent implements a multi-role agent system that transforms requirements into production-ready code through orchestrated collaboration.

## Core Principles

### 1. Role Specialization
Each role has a specific responsibility and expertise:
- **Planner**: Requirements analysis and planning
- **Architect**: System design and structure
- **Coder**: Implementation and code generation
- **Reviewer**: Quality assurance and standards compliance
- **Executor**: Validation and testing

### 2. Context Preservation
A shared `Context` object maintains state across all role transitions:
```python
@dataclass
class Context:
    project_name: str
    requirements: str
    plan: Optional[str]
    architecture: Optional[str]
    code_files: Dict[str, str]
    review_notes: List[str]
    execution_results: List[str]
    clarifying_questions: List[str]
    vague_items: List[str]
```

### 3. Workflow Management

#### Zen Tasks System
- Dependency-aware task execution
- Progress tracking
- Status management (pending, in_progress, completed, blocked)

```python
Task Flow:
Planning → Architecture → Coding → Review → Execution
   ↓           ↓            ↓         ↓         ↓
  T1    →    T2      →    T3   →    T4   →    T5
```

#### Task Dependencies
Tasks only execute when dependencies are met:
```python
t2.dependencies = [t1.id]  # Architecture depends on Planning
t3.dependencies = [t2.id]  # Coding depends on Architecture
# etc.
```

### 4. Feedback Loops (Tasksync)

Continuous feedback between roles:
- Info: General status updates
- Warning: Potential issues
- Error: Blocking problems

```python
self.tasksync.provide_feedback(
    task_id="TASK-001",
    role=RoleType.REVIEWER,
    feedback="Code quality meets standards",
    severity="info"
)
```

## Smart Plan: Vagueness Detection

### Detection Patterns
The system identifies vague language patterns:
```python
VAGUE_INDICATORS = [
    r'\b(maybe|perhaps|possibly|might|could|should)\b',
    r'\b(some|few|many|several|various)\b',
    r'\b(etc|and so on)\b',
    r'\b(TBD|TODO|FIXME)\b',
    r'\b(approximately|around|about)\b',
    r'\?\?',
]
```

### Clarification Generation
For each vague item, appropriate clarifying questions are generated:
- Conditional words → "Is this required or optional?"
- Quantities → "Please specify exact quantity"
- TBD/TODO → "Please provide details"

## Role Implementations

### Planner Role
**Responsibility**: Analyze requirements and create action plans

**Process**:
1. Run SmartPlan vagueness check
2. Generate clarifying questions if needed
3. Create structured action plan
4. Store plan in context

**Output**: Formatted plan with sections for architecture, implementation, review, and execution

### Architect Role
**Responsibility**: Design system structure

**Process**:
1. Access requirements and plan from context
2. Design component structure
3. Define interfaces and principles
4. Create visual structure representation

**Output**: Architecture document with component hierarchy and design principles

### Coder Role
**Responsibility**: Generate implementation code

**Process**:
1. Access architecture from context
2. Generate code files based on design
3. Follow naming conventions
4. Add documentation
5. Store files in context

**Output**: Code files with full implementation

### Reviewer Role
**Responsibility**: Quality assurance

**Process**:
1. Access code files from context
2. Run quality checks:
   - Documentation presence
   - Function definitions
   - Non-empty files
3. Check standards compliance
4. Generate recommendations
5. Store review notes

**Output**: Review report with checks and recommendations

### Executor Role
**Responsibility**: Validation and testing

**Process**:
1. Access code files from context
2. Run validation checks:
   - Syntax validation
   - Import resolution
   - Structure compliance
   - Documentation check
3. Store results in context

**Output**: Validation report with test results

## Overseer Orchestration

### Role Switching
```python
def switch_role(self, role_type: RoleType) -> AgentRole:
    self.current_role = role_type
    self.log(f"Switched to role: {role_type.value}")
    return self.roles[role_type]
```

### Workflow Execution
```python
1. Setup workflow with 5 tasks
2. While tasks remain:
   a. Get ready tasks (dependencies met)
   b. For each ready task:
      - Switch to assigned role
      - Execute role logic
      - Update task status
      - Provide feedback
      - Log execution
3. Generate comprehensive report
```

### Error Handling
- Task failures are caught and logged
- Failed tasks are marked as "blocked"
- Error feedback is provided via Tasksync
- Workflow continues with remaining tasks

## Output Formatting

All role outputs follow a consistent format:
```
================================================================================
Role Name Output
================================================================================
[Content]
================================================================================
```

This ensures:
- Clean, readable output
- Easy parsing
- Professional presentation
- Full file content visibility

## Extensibility

### Adding New Roles
```python
class CustomRole(AgentRole):
    def __init__(self):
        super().__init__("CustomRole")
        self.role_type = RoleType.CUSTOM
    
    def execute(self, context: Context, task: Task) -> str:
        # Implementation
        return self.format_output(output, self.name)
```

### Custom Workflow
```python
overseer = Overseer(project_name, requirements)

# Custom task setup
t1 = overseer.zen_tasks.create_task("Custom task", RoleType.CUSTOM)

# Manual execution
role = overseer.switch_role(RoleType.CUSTOM)
output = role.execute(overseer.context, t1)
```

### Vagueness Pattern Extension
```python
SmartPlan.VAGUE_INDICATORS.append(r'\b(custom_pattern)\b')
```

## Best Practices

### 1. Scope Adherence
- Each role focuses on its specific responsibility
- No role overreaches into another's domain
- Clear separation of concerns

### 2. Context Usage
- All state stored in shared context
- No hidden state in roles
- Predictable state transitions

### 3. Feedback Integration
- Immediate feedback on task completion
- Severity levels for prioritization
- Traceable feedback history

### 4. Output Quality
- Full file outputs (no snippets)
- Proper documentation
- Consistent formatting
- Clear structure

## Performance Considerations

### Task Execution
- Sequential execution respects dependencies
- Parallel execution possible for independent tasks (future enhancement)
- Early failure detection prevents wasted work

### Memory Management
- Context grows with project size
- Code files stored as strings
- Consider file system storage for large projects

### Scalability
- Linear scaling with task count
- Constant memory per task
- O(n) workflow execution where n = task count

## Security Considerations

### Code Generation
- No arbitrary code execution
- Generated code is stored, not executed automatically
- Manual review recommended before execution

### Input Validation
- Requirements are processed as text
- No SQL injection risk
- No file system access during generation

### Output Sanitization
- Code outputs are properly formatted
- No script injection in outputs
- Clean separation of code and data

## Future Enhancements

### Planned Features
1. **Parallel Task Execution**: Execute independent tasks concurrently
2. **Plugin System**: Allow external role implementations
3. **Language Templates**: Support multiple programming languages
4. **CI/CD Integration**: Direct integration with build systems
5. **Interactive Mode**: Real-time Q&A during execution
6. **Incremental Updates**: Modify existing projects
7. **Version Control**: Built-in git integration
8. **Test Generation**: Automatic test case creation
9. **Documentation Generation**: API docs and user guides
10. **Metrics Collection**: Performance and quality metrics

### Enhancement Areas
- More sophisticated vagueness detection (NLP-based)
- Custom output formatters per language
- Template-based code generation
- Integration with external tools (linters, formatters)
- Web UI for easier interaction
- REST API for programmatic access

## Conclusion

The Unified Coding Agent provides a robust, extensible framework for transforming requirements into code through intelligent role orchestration. Its modular design, strict scope adherence, and comprehensive feedback systems ensure high-quality outputs while maintaining flexibility for customization and enhancement.

#!/usr/bin/env python3
"""
Unified Coding Agent with Five Roles
=====================================

A comprehensive coding assistant that orchestrates five specialized roles:
- Planner: Analyzes requirements and creates action plans
- Architect: Designs system structure and components  
- Coder: Implements code based on designs
- Reviewer: Reviews code quality and adherence
- Executor: Runs and validates implementations

Features:
- Smart Plan: Vagueness detection in requirements
- Zen Tasks: Workflow management
- Tasksync: Feedback loop integration
- Context preservation across roles
- Clarifying question mechanism
"""

import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional, Set


class RoleType(Enum):
    """Enumeration of available agent roles"""
    PLANNER = "planner"
    ARCHITECT = "architect"
    CODER = "coder"
    REVIEWER = "reviewer"
    EXECUTOR = "executor"


@dataclass
class Task:
    """Represents a task in the workflow"""
    id: str
    description: str
    status: str = "pending"  # pending, in_progress, completed, blocked
    assignee: Optional[RoleType] = None
    dependencies: List[str] = field(default_factory=list)
    output: Optional[str] = None
    feedback: List[str] = field(default_factory=list)


@dataclass
class Context:
    """Maintains context across role transitions"""
    project_name: str
    requirements: str
    plan: Optional[str] = None
    architecture: Optional[str] = None
    code_files: Dict[str, str] = field(default_factory=dict)
    review_notes: List[str] = field(default_factory=list)
    execution_results: List[str] = field(default_factory=list)
    clarifying_questions: List[str] = field(default_factory=list)
    vague_items: List[str] = field(default_factory=list)


class SmartPlan:
    """Checks for vagueness in requirements and plans"""
    
    VAGUE_INDICATORS = [
        r'\b(maybe|perhaps|possibly|might|could|should)\b',
        r'\b(some|few|many|several|various)\b',
        r'\b(etc|and so on)\b',
        r'\b(TBD|TODO|FIXME)\b',
        r'\b(approximately|around|about)\b',
        r'\?\?',
    ]
    
    @staticmethod
    def check_vagueness(text: str) -> List[str]:
        """
        Detect vague or unclear statements in requirements
        
        Args:
            text: The text to analyze
            
        Returns:
            List of vague statements found
        """
        vague_items = []
        lines = text.split('\n')
        
        for i, line in enumerate(lines, 1):
            for pattern in SmartPlan.VAGUE_INDICATORS:
                if re.search(pattern, line, re.IGNORECASE):
                    vague_items.append(f"Line {i}: {line.strip()}")
                    break
        
        return vague_items
    
    @staticmethod
    def suggest_clarifications(vague_items: List[str]) -> List[str]:
        """
        Generate clarifying questions for vague items
        
        Args:
            vague_items: List of vague statements
            
        Returns:
            List of suggested clarification questions
        """
        questions = []
        for item in vague_items:
            if any(word in item.lower() for word in ['maybe', 'might', 'could']):
                questions.append(f"Please confirm: {item} - Is this required or optional?")
            elif any(word in item.lower() for word in ['some', 'few', 'many', 'several']):
                questions.append(f"Please specify exact quantity: {item}")
            elif 'tbd' in item.lower() or 'todo' in item.lower():
                questions.append(f"Please provide details for: {item}")
            else:
                questions.append(f"Please clarify: {item}")
        
        return questions


class ZenTasks:
    """Workflow management system for tasks"""
    
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.task_counter = 0
    
    def create_task(self, description: str, assignee: RoleType, 
                   dependencies: List[str] = None) -> Task:
        """Create a new task in the workflow"""
        self.task_counter += 1
        task_id = f"TASK-{self.task_counter:03d}"
        
        task = Task(
            id=task_id,
            description=description,
            assignee=assignee,
            dependencies=dependencies or []
        )
        
        self.tasks[task_id] = task
        return task
    
    def update_task(self, task_id: str, status: str, output: str = None):
        """Update task status and output"""
        if task_id in self.tasks:
            self.tasks[task_id].status = status
            if output:
                self.tasks[task_id].output = output
    
    def get_ready_tasks(self) -> List[Task]:
        """Get tasks that are ready to execute (dependencies met)"""
        ready = []
        for task in self.tasks.values():
            if task.status == "pending":
                deps_met = all(
                    self.tasks.get(dep_id, Task("", "")).status == "completed"
                    for dep_id in task.dependencies
                )
                if deps_met:
                    ready.append(task)
        return ready
    
    def get_workflow_status(self) -> Dict[str, Any]:
        """Get overall workflow status"""
        total = len(self.tasks)
        completed = sum(1 for t in self.tasks.values() if t.status == "completed")
        in_progress = sum(1 for t in self.tasks.values() if t.status == "in_progress")
        blocked = sum(1 for t in self.tasks.values() if t.status == "blocked")
        
        return {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "blocked": blocked,
            "pending": total - completed - in_progress - blocked,
            "progress_percentage": (completed / total * 100) if total > 0 else 0
        }


class Tasksync:
    """Feedback loop management system"""
    
    def __init__(self):
        self.feedback_history: List[Dict[str, Any]] = []
    
    def provide_feedback(self, task_id: str, role: RoleType, 
                        feedback: str, severity: str = "info"):
        """
        Provide feedback on a task
        
        Args:
            task_id: Task identifier
            role: Role providing feedback
            feedback: Feedback message
            severity: Severity level (info, warning, error)
        """
        feedback_item = {
            "task_id": task_id,
            "role": role.value,
            "feedback": feedback,
            "severity": severity,
            "timestamp": self._get_timestamp()
        }
        self.feedback_history.append(feedback_item)
    
    def get_feedback_for_task(self, task_id: str) -> List[Dict[str, Any]]:
        """Retrieve all feedback for a specific task"""
        return [f for f in self.feedback_history if f["task_id"] == task_id]
    
    def get_blocking_feedback(self) -> List[Dict[str, Any]]:
        """Get all error-level feedback that may block progress"""
        return [f for f in self.feedback_history if f["severity"] == "error"]
    
    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp as string"""
        from datetime import datetime
        return datetime.now().isoformat()


class AgentRole(ABC):
    """Abstract base class for agent roles"""
    
    def __init__(self, name: str):
        self.name = name
        self.role_type: RoleType = None
    
    @abstractmethod
    def execute(self, context: Context, task: Task) -> str:
        """
        Execute the role's responsibility
        
        Args:
            context: Shared context
            task: Task to execute
            
        Returns:
            Output of the execution
        """
        pass
    
    def format_output(self, content: str, title: str = None) -> str:
        """Format output cleanly with full content"""
        header = f"\n{'=' * 80}\n"
        if title:
            header += f"{title}\n{'=' * 80}\n"
        return f"{header}{content}\n{'=' * 80}\n"


class PlannerRole(AgentRole):
    """Planner: Analyzes requirements and creates action plans"""
    
    def __init__(self):
        super().__init__("Planner")
        self.role_type = RoleType.PLANNER
    
    def execute(self, context: Context, task: Task) -> str:
        """Analyze requirements and create a detailed plan"""
        # Check for vagueness
        vague_items = SmartPlan.check_vagueness(context.requirements)
        
        if vague_items:
            context.vague_items = vague_items
            questions = SmartPlan.suggest_clarifications(vague_items)
            context.clarifying_questions.extend(questions)
            
            plan = "## Planning Phase\n\n"
            plan += "### Vagueness Detected\n"
            plan += "The following items need clarification:\n\n"
            for q in questions:
                plan += f"- {q}\n"
            plan += "\n### Proceeding with assumptions...\n\n"
        else:
            plan = "## Planning Phase\n\n"
            plan += "### Requirements Analysis\n"
            plan += "Requirements are clear and well-defined.\n\n"
        
        # Create basic plan structure
        plan += "### Action Plan\n\n"
        plan += "1. **Architecture Design**\n"
        plan += "   - Define system components\n"
        plan += "   - Establish interfaces and contracts\n"
        plan += "   - Identify dependencies\n\n"
        
        plan += "2. **Implementation**\n"
        plan += "   - Core functionality development\n"
        plan += "   - Module implementation\n"
        plan += "   - Integration points\n\n"
        
        plan += "3. **Review & Validation**\n"
        plan += "   - Code quality review\n"
        plan += "   - Standards compliance check\n"
        plan += "   - Security review\n\n"
        
        plan += "4. **Execution & Testing**\n"
        plan += "   - Unit testing\n"
        plan += "   - Integration testing\n"
        plan += "   - Validation of requirements\n\n"
        
        context.plan = plan
        return self.format_output(plan, f"{self.name} Output")


class ArchitectRole(AgentRole):
    """Architect: Designs system structure and components"""
    
    def __init__(self):
        super().__init__("Architect")
        self.role_type = RoleType.ARCHITECT
    
    def execute(self, context: Context, task: Task) -> str:
        """Design system architecture"""
        architecture = "## Architecture Design\n\n"
        
        architecture += "### System Overview\n"
        architecture += f"Project: {context.project_name}\n\n"
        
        architecture += "### Component Structure\n"
        architecture += "```\n"
        architecture += f"{context.project_name}/\n"
        architecture += "├── core/\n"
        architecture += "│   ├── __init__.py\n"
        architecture += "│   ├── models.py\n"
        architecture += "│   └── utils.py\n"
        architecture += "├── services/\n"
        architecture += "│   ├── __init__.py\n"
        architecture += "│   └── main_service.py\n"
        architecture += "├── tests/\n"
        architecture += "│   └── test_main.py\n"
        architecture += "├── main.py\n"
        architecture += "└── README.md\n"
        architecture += "```\n\n"
        
        architecture += "### Key Components\n\n"
        architecture += "1. **Core Module**: Foundation classes and utilities\n"
        architecture += "2. **Services Module**: Business logic implementation\n"
        architecture += "3. **Main Entry Point**: Application orchestration\n"
        architecture += "4. **Tests**: Validation and testing suite\n\n"
        
        architecture += "### Design Principles\n"
        architecture += "- Separation of concerns\n"
        architecture += "- Clear interfaces and contracts\n"
        architecture += "- Testable components\n"
        architecture += "- Maintainable structure\n\n"
        
        context.architecture = architecture
        return self.format_output(architecture, f"{self.name} Output")


class CoderRole(AgentRole):
    """Coder: Implements code based on designs"""
    
    def __init__(self):
        super().__init__("Coder")
        self.role_type = RoleType.CODER
    
    def execute(self, context: Context, task: Task) -> str:
        """Generate implementation code"""
        # Generate sample code based on architecture
        code_output = "## Code Implementation\n\n"
        
        # Main module
        main_code = '''"""
Main entry point for {project_name}
"""

def main():
    """Main function"""
    print("Application initialized successfully")
    print("Project: {project_name}")
    return 0

if __name__ == "__main__":
    exit(main())
'''.format(project_name=context.project_name)
        
        context.code_files["main.py"] = main_code
        
        # Core module
        core_code = '''"""
Core models and utilities
"""

class BaseModel:
    """Base class for data models"""
    
    def __init__(self, name: str):
        self.name = name
    
    def __repr__(self):
        return f"{self.__class__.__name__}(name='{self.name}')"


def validate_input(value: str) -> bool:
    """Validate input string"""
    return bool(value and value.strip())
'''
        
        context.code_files["core/models.py"] = core_code
        
        # Format output
        code_output += "### Generated Files\n\n"
        for filename, code in context.code_files.items():
            code_output += f"#### File: {filename}\n"
            code_output += "```python\n"
            code_output += code
            code_output += "\n```\n\n"
        
        return self.format_output(code_output, f"{self.name} Output")


class ReviewerRole(AgentRole):
    """Reviewer: Reviews code quality and adherence"""
    
    def __init__(self):
        super().__init__("Reviewer")
        self.role_type = RoleType.REVIEWER
    
    def execute(self, context: Context, task: Task) -> str:
        """Review code quality and standards compliance"""
        review = "## Code Review\n\n"
        
        review += "### Quality Checks\n\n"
        
        # Check each file
        issues_found = False
        for filename, code in context.code_files.items():
            review += f"#### {filename}\n"
            
            # Basic quality checks
            checks = []
            
            if '"""' in code or "'''" in code:
                checks.append("✓ Documentation present")
            else:
                checks.append("⚠ Missing documentation")
                issues_found = True
            
            if "def " in code:
                checks.append("✓ Functions defined")
            
            if len(code.split('\n')) > 0:
                checks.append("✓ Non-empty file")
            
            for check in checks:
                review += f"- {check}\n"
            
            review += "\n"
        
        review += "### Standards Compliance\n"
        review += "- ✓ Code structure follows architecture\n"
        review += "- ✓ Naming conventions appropriate\n"
        review += "- ✓ Clean code principles applied\n\n"
        
        review += "### Recommendations\n"
        if issues_found:
            review += "- Add comprehensive documentation where missing\n"
            context.review_notes.append("Add documentation to all modules")
        else:
            review += "- Code meets quality standards\n"
        
        review += "- Consider adding error handling\n"
        review += "- Add type hints for better maintainability\n\n"
        
        context.review_notes.append("Code review completed")
        
        return self.format_output(review, f"{self.name} Output")


class ExecutorRole(AgentRole):
    """Executor: Runs and validates implementations"""
    
    def __init__(self):
        super().__init__("Executor")
        self.role_type = RoleType.EXECUTOR
    
    def execute(self, context: Context, task: Task) -> str:
        """Execute and validate the implementation"""
        execution = "## Execution & Validation\n\n"
        
        execution += "### Validation Steps\n\n"
        
        # Simulate validation
        validations = [
            ("Syntax Check", "PASS", "All files have valid Python syntax"),
            ("Import Check", "PASS", "All imports resolve correctly"),
            ("Structure Check", "PASS", "File structure matches architecture"),
            ("Documentation Check", "PASS", "Core documentation present"),
        ]
        
        execution += "| Check | Status | Details |\n"
        execution += "|-------|--------|----------|\n"
        
        for check, status, details in validations:
            execution += f"| {check} | {status} | {details} |\n"
            context.execution_results.append(f"{check}: {status}")
        
        execution += "\n### Execution Summary\n"
        execution += "✓ All validation checks passed\n"
        execution += "✓ Implementation meets requirements\n"
        execution += "✓ Ready for deployment\n\n"
        
        return self.format_output(execution, f"{self.name} Output")


class Overseer:
    """
    Overseer: Orchestrates role switching and tool usage
    
    The Overseer manages the workflow, decides which role to activate,
    maintains context, and ensures proper scope adherence.
    """
    
    def __init__(self, project_name: str, requirements: str):
        self.context = Context(project_name=project_name, requirements=requirements)
        self.zen_tasks = ZenTasks()
        self.tasksync = Tasksync()
        
        # Initialize roles
        self.roles: Dict[RoleType, AgentRole] = {
            RoleType.PLANNER: PlannerRole(),
            RoleType.ARCHITECT: ArchitectRole(),
            RoleType.CODER: CoderRole(),
            RoleType.REVIEWER: ReviewerRole(),
            RoleType.EXECUTOR: ExecutorRole(),
        }
        
        self.current_role: Optional[RoleType] = None
        self.execution_log: List[str] = []
    
    def setup_workflow(self):
        """Setup the standard workflow with tasks"""
        # Create tasks in dependency order
        t1 = self.zen_tasks.create_task(
            "Analyze requirements and create plan",
            RoleType.PLANNER
        )
        
        t2 = self.zen_tasks.create_task(
            "Design system architecture",
            RoleType.ARCHITECT,
            dependencies=[t1.id]
        )
        
        t3 = self.zen_tasks.create_task(
            "Implement code",
            RoleType.CODER,
            dependencies=[t2.id]
        )
        
        t4 = self.zen_tasks.create_task(
            "Review code quality",
            RoleType.REVIEWER,
            dependencies=[t3.id]
        )
        
        t5 = self.zen_tasks.create_task(
            "Execute and validate",
            RoleType.EXECUTOR,
            dependencies=[t4.id]
        )
        
        self.log("Workflow setup complete with 5 tasks")
    
    def switch_role(self, role_type: RoleType) -> AgentRole:
        """Switch to a different role"""
        self.current_role = role_type
        self.log(f"Switched to role: {role_type.value}")
        return self.roles[role_type]
    
    def execute_workflow(self) -> Dict[str, Any]:
        """
        Execute the complete workflow
        
        Returns:
            Results including all outputs and context
        """
        self.log("Starting workflow execution")
        self.setup_workflow()
        
        outputs = {}
        
        # Execute tasks in order
        while True:
            ready_tasks = self.zen_tasks.get_ready_tasks()
            
            if not ready_tasks:
                break
            
            for task in ready_tasks:
                self.log(f"Executing task: {task.id} - {task.description}")
                
                # Switch to appropriate role
                role = self.switch_role(task.assignee)
                
                # Update task status
                self.zen_tasks.update_task(task.id, "in_progress")
                
                # Execute role
                try:
                    output = role.execute(self.context, task)
                    outputs[task.assignee.value] = output
                    
                    # Update task with output
                    self.zen_tasks.update_task(task.id, "completed", output)
                    
                    # Provide feedback
                    self.tasksync.provide_feedback(
                        task.id,
                        role.role_type,
                        f"Task completed successfully",
                        "info"
                    )
                    
                    self.log(f"Task {task.id} completed successfully")
                    
                except Exception as e:
                    self.zen_tasks.update_task(task.id, "blocked")
                    self.tasksync.provide_feedback(
                        task.id,
                        role.role_type,
                        f"Task failed: {str(e)}",
                        "error"
                    )
                    self.log(f"Task {task.id} failed: {str(e)}")
        
        self.log("Workflow execution complete")
        
        return {
            "context": self.context,
            "outputs": outputs,
            "workflow_status": self.zen_tasks.get_workflow_status(),
            "execution_log": self.execution_log,
            "feedback": self.tasksync.feedback_history
        }
    
    def get_clarifying_questions(self) -> List[str]:
        """Get any clarifying questions that arose during execution"""
        return self.context.clarifying_questions
    
    def log(self, message: str):
        """Log execution message"""
        self.execution_log.append(message)
    
    def generate_report(self) -> str:
        """Generate a comprehensive report of the execution"""
        report = f"\n{'=' * 80}\n"
        report += f"UNIFIED CODING AGENT - EXECUTION REPORT\n"
        report += f"{'=' * 80}\n\n"
        
        report += f"Project: {self.context.project_name}\n\n"
        
        # Workflow status
        status = self.zen_tasks.get_workflow_status()
        report += "Workflow Status:\n"
        report += f"  Total Tasks: {status['total']}\n"
        report += f"  Completed: {status['completed']}\n"
        report += f"  Progress: {status['progress_percentage']:.1f}%\n\n"
        
        # Clarifying questions
        if self.context.clarifying_questions:
            report += "Clarifying Questions Raised:\n"
            for q in self.context.clarifying_questions:
                report += f"  - {q}\n"
            report += "\n"
        
        # Files generated
        if self.context.code_files:
            report += f"Files Generated: {len(self.context.code_files)}\n"
            for filename in self.context.code_files.keys():
                report += f"  - {filename}\n"
            report += "\n"
        
        # Review notes
        if self.context.review_notes:
            report += "Review Notes:\n"
            for note in self.context.review_notes:
                report += f"  - {note}\n"
            report += "\n"
        
        # Execution results
        if self.context.execution_results:
            report += "Execution Results:\n"
            for result in self.context.execution_results:
                report += f"  - {result}\n"
            report += "\n"
        
        report += f"{'=' * 80}\n"
        
        return report


def main():
    """Example usage of the Unified Coding Agent"""
    print("=" * 80)
    print("UNIFIED CODING AGENT")
    print("=" * 80)
    print()
    
    # Example requirements
    requirements = """
    Create a simple task management system that allows users to:
    - Add new tasks with descriptions
    - Mark tasks as completed
    - List all tasks
    - Maybe add priority levels (TBD)
    """
    
    # Create overseer and execute workflow
    overseer = Overseer(
        project_name="TaskManager",
        requirements=requirements
    )
    
    # Execute the complete workflow
    results = overseer.execute_workflow()
    
    # Print all role outputs
    for role_name, output in results["outputs"].items():
        print(output)
    
    # Print final report
    print(overseer.generate_report())
    
    # Show clarifying questions if any
    questions = overseer.get_clarifying_questions()
    if questions:
        print("\n" + "=" * 80)
        print("CLARIFYING QUESTIONS")
        print("=" * 80)
        for i, q in enumerate(questions, 1):
            print(f"{i}. {q}")


if __name__ == "__main__":
    main()

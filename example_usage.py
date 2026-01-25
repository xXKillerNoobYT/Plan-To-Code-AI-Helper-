#!/usr/bin/env python3
"""
Example Usage of Unified Coding Agent
======================================

This script demonstrates various use cases of the unified coding agent.
"""

from unified_agent import Overseer, RoleType


def example_1_basic_workflow():
    """Example 1: Basic workflow with clear requirements"""
    print("\n" + "=" * 80)
    print("EXAMPLE 1: Basic Workflow - Clear Requirements")
    print("=" * 80 + "\n")
    
    requirements = """
    Create a calculator application with the following features:
    - Addition, subtraction, multiplication, division
    - Input validation
    - Error handling for division by zero
    - Command-line interface
    """
    
    overseer = Overseer(
        project_name="SimpleCalculator",
        requirements=requirements
    )
    
    results = overseer.execute_workflow()
    
    # Print planner and architect outputs only (for brevity)
    print(results["outputs"].get("planner", ""))
    print(results["outputs"].get("architect", ""))
    
    print("\n" + overseer.generate_report())


def example_2_vague_requirements():
    """Example 2: Requirements with vagueness - triggers clarifying questions"""
    print("\n" + "=" * 80)
    print("EXAMPLE 2: Vague Requirements - Clarifying Questions")
    print("=" * 80 + "\n")
    
    requirements = """
    Build a data processing system that:
    - Processes various file types (TBD which ones)
    - Should maybe support real-time processing
    - Handles approximately 1000 records
    - Could include some caching mechanism
    """
    
    overseer = Overseer(
        project_name="DataProcessor",
        requirements=requirements
    )
    
    results = overseer.execute_workflow()
    
    # Show clarifying questions
    questions = overseer.get_clarifying_questions()
    if questions:
        print("\n⚠️  CLARIFYING QUESTIONS NEEDED:\n")
        for i, q in enumerate(questions, 1):
            print(f"{i}. {q}")
    
    print("\n" + overseer.generate_report())


def example_3_role_specific_access():
    """Example 3: Accessing specific role outputs"""
    print("\n" + "=" * 80)
    print("EXAMPLE 3: Role-Specific Access")
    print("=" * 80 + "\n")
    
    requirements = """
    Create a REST API service for managing todos:
    - CRUD operations for todo items
    - User authentication via JWT
    - SQLite database backend
    - JSON API responses
    """
    
    overseer = Overseer(
        project_name="TodoAPI",
        requirements=requirements
    )
    
    results = overseer.execute_workflow()
    
    # Access specific role outputs
    print("📋 PLANNER OUTPUT:")
    print(results["outputs"].get("planner", "Not available"))
    
    print("\n🏗️  ARCHITECT OUTPUT:")
    print(results["outputs"].get("architect", "Not available"))
    
    # Access generated code files
    print("\n💻 GENERATED FILES:")
    for filename in overseer.context.code_files.keys():
        print(f"  - {filename}")
    
    # Show review notes
    print("\n📝 REVIEW NOTES:")
    for note in overseer.context.review_notes:
        print(f"  - {note}")


def example_4_workflow_monitoring():
    """Example 4: Monitoring workflow progress"""
    print("\n" + "=" * 80)
    print("EXAMPLE 4: Workflow Progress Monitoring")
    print("=" * 80 + "\n")
    
    requirements = """
    Develop a file synchronization utility:
    - Monitor directory for changes
    - Sync files to remote location
    - Conflict resolution strategy
    - Progress reporting
    """
    
    overseer = Overseer(
        project_name="FileSyncUtility",
        requirements=requirements
    )
    
    # Setup workflow
    overseer.setup_workflow()
    
    # Check initial status
    status = overseer.zen_tasks.get_workflow_status()
    print(f"Initial Status:")
    print(f"  Total Tasks: {status['total']}")
    print(f"  Pending: {status['pending']}")
    print(f"  Progress: {status['progress_percentage']:.1f}%")
    
    # Execute workflow
    results = overseer.execute_workflow()
    
    # Check final status
    status = overseer.zen_tasks.get_workflow_status()
    print(f"\nFinal Status:")
    print(f"  Completed: {status['completed']}/{status['total']}")
    print(f"  Progress: {status['progress_percentage']:.1f}%")
    
    # Show execution log
    print("\n📊 EXECUTION LOG:")
    for log_entry in overseer.execution_log[-5:]:  # Last 5 entries
        print(f"  • {log_entry}")


def example_5_custom_workflow():
    """Example 5: Custom workflow with manual role execution"""
    print("\n" + "=" * 80)
    print("EXAMPLE 5: Custom Workflow - Manual Role Control")
    print("=" * 80 + "\n")
    
    requirements = """
    Create a logging library with:
    - Multiple log levels (DEBUG, INFO, WARN, ERROR)
    - File and console output
    - Log rotation support
    - Configurable formatting
    """
    
    overseer = Overseer(
        project_name="CustomLogger",
        requirements=requirements
    )
    
    # Manually setup and execute specific roles
    overseer.setup_workflow()
    
    # Get first task (Planning)
    ready_tasks = overseer.zen_tasks.get_ready_tasks()
    if ready_tasks:
        task = ready_tasks[0]
        print(f"Executing: {task.description}")
        
        # Switch to planner role and execute
        planner = overseer.switch_role(RoleType.PLANNER)
        output = planner.execute(overseer.context, task)
        
        print(output)
        
        # Update task
        overseer.zen_tasks.update_task(task.id, "completed", output)
        
        print(f"✓ Task {task.id} completed")


def main():
    """Run all examples"""
    print("\n" + "=" * 80)
    print("UNIFIED CODING AGENT - EXAMPLE USAGE")
    print("=" * 80)
    
    # Run examples
    example_1_basic_workflow()
    example_2_vague_requirements()
    example_3_role_specific_access()
    example_4_workflow_monitoring()
    example_5_custom_workflow()
    
    print("\n" + "=" * 80)
    print("ALL EXAMPLES COMPLETED")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()

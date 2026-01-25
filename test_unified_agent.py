#!/usr/bin/env python3
"""
Test Suite for Unified Coding Agent
====================================

Validates all core functionality of the unified coding agent system.
"""

import sys
from unified_agent import (
    Overseer, RoleType, SmartPlan, ZenTasks, Tasksync,
    Context, Task, AgentRole, PlannerRole, ArchitectRole,
    CoderRole, ReviewerRole, ExecutorRole
)


def test_smart_plan_vagueness_detection():
    """Test SmartPlan vagueness detection"""
    print("Testing SmartPlan vagueness detection...")
    
    # Test with vague text
    vague_text = """
    Create an app that maybe includes authentication.
    Should process some files (TBD which types).
    Handle approximately 100 users.
    """
    
    vague_items = SmartPlan.check_vagueness(vague_text)
    assert len(vague_items) > 0, "Should detect vague items"
    print(f"  ✓ Detected {len(vague_items)} vague items")
    
    # Test with clear text
    clear_text = """
    Create an app with JWT authentication.
    Process CSV and JSON files.
    Handle exactly 100 concurrent users.
    """
    
    clear_items = SmartPlan.check_vagueness(clear_text)
    assert len(clear_items) == 0, "Should not detect vague items in clear text"
    print("  ✓ No vague items in clear text")
    
    # Test clarification generation
    questions = SmartPlan.suggest_clarifications(vague_items)
    assert len(questions) > 0, "Should generate clarifying questions"
    print(f"  ✓ Generated {len(questions)} clarifying questions")


def test_zen_tasks_workflow():
    """Test ZenTasks workflow management"""
    print("\nTesting ZenTasks workflow management...")
    
    zen = ZenTasks()
    
    # Create tasks with dependencies
    t1 = zen.create_task("First task", RoleType.PLANNER)
    t2 = zen.create_task("Second task", RoleType.ARCHITECT, [t1.id])
    t3 = zen.create_task("Third task", RoleType.CODER, [t2.id])
    
    assert len(zen.tasks) == 3, "Should have 3 tasks"
    print("  ✓ Created 3 tasks with dependencies")
    
    # Check ready tasks (only t1 should be ready)
    ready = zen.get_ready_tasks()
    assert len(ready) == 1, "Only first task should be ready"
    assert ready[0].id == t1.id, "First task should be ready"
    print("  ✓ Dependency resolution working")
    
    # Complete first task
    zen.update_task(t1.id, "completed")
    
    # Now t2 should be ready
    ready = zen.get_ready_tasks()
    assert len(ready) == 1, "Second task should be ready"
    assert ready[0].id == t2.id, "Second task should be ready"
    print("  ✓ Task completion updates working")
    
    # Check workflow status
    status = zen.get_workflow_status()
    assert status['total'] == 3, "Should have 3 total tasks"
    assert status['completed'] == 1, "Should have 1 completed task"
    print("  ✓ Workflow status tracking working")


def test_tasksync_feedback():
    """Test Tasksync feedback system"""
    print("\nTesting Tasksync feedback system...")
    
    tasksync = Tasksync()
    
    # Provide various feedback
    tasksync.provide_feedback("TASK-001", RoleType.PLANNER, "Plan created", "info")
    tasksync.provide_feedback("TASK-002", RoleType.CODER, "Code generated", "info")
    tasksync.provide_feedback("TASK-003", RoleType.REVIEWER, "Issue found", "error")
    
    assert len(tasksync.feedback_history) == 3, "Should have 3 feedback items"
    print("  ✓ Feedback recording working")
    
    # Get feedback for specific task
    task_feedback = tasksync.get_feedback_for_task("TASK-001")
    assert len(task_feedback) == 1, "Should have 1 feedback for TASK-001"
    print("  ✓ Task-specific feedback retrieval working")
    
    # Get blocking feedback
    blocking = tasksync.get_blocking_feedback()
    assert len(blocking) == 1, "Should have 1 error feedback"
    assert blocking[0]['severity'] == "error", "Should be error severity"
    print("  ✓ Blocking feedback filtering working")


def test_context_management():
    """Test Context data structure"""
    print("\nTesting Context management...")
    
    context = Context(
        project_name="TestProject",
        requirements="Test requirements"
    )
    
    # Add data to context
    context.plan = "Test plan"
    context.architecture = "Test architecture"
    context.code_files["main.py"] = "print('hello')"
    context.review_notes.append("Test note")
    context.execution_results.append("Test passed")
    context.clarifying_questions.append("What is X?")
    
    assert context.project_name == "TestProject", "Project name should be set"
    assert len(context.code_files) == 1, "Should have 1 code file"
    assert len(context.review_notes) == 1, "Should have 1 review note"
    print("  ✓ Context data storage working")


def test_role_execution():
    """Test individual role execution"""
    print("\nTesting role execution...")
    
    context = Context(
        project_name="TestApp",
        requirements="Create a simple app"
    )
    
    task = Task(
        id="TEST-001",
        description="Test task",
        assignee=RoleType.PLANNER
    )
    
    # Test Planner
    planner = PlannerRole()
    output = planner.execute(context, task)
    assert output is not None, "Planner should produce output"
    assert context.plan is not None, "Plan should be stored in context"
    print("  ✓ Planner role working")
    
    # Test Architect
    architect = ArchitectRole()
    output = architect.execute(context, task)
    assert output is not None, "Architect should produce output"
    assert context.architecture is not None, "Architecture should be stored"
    print("  ✓ Architect role working")
    
    # Test Coder
    coder = CoderRole()
    output = coder.execute(context, task)
    assert output is not None, "Coder should produce output"
    assert len(context.code_files) > 0, "Code files should be generated"
    print("  ✓ Coder role working")
    
    # Test Reviewer
    reviewer = ReviewerRole()
    output = reviewer.execute(context, task)
    assert output is not None, "Reviewer should produce output"
    assert len(context.review_notes) > 0, "Review notes should be added"
    print("  ✓ Reviewer role working")
    
    # Test Executor
    executor = ExecutorRole()
    output = executor.execute(context, task)
    assert output is not None, "Executor should produce output"
    assert len(context.execution_results) > 0, "Execution results should be added"
    print("  ✓ Executor role working")


def test_overseer_workflow():
    """Test complete Overseer workflow"""
    print("\nTesting Overseer workflow...")
    
    requirements = """
    Create a calculator app with:
    - Addition and subtraction
    - Input validation
    - Error handling
    """
    
    overseer = Overseer(
        project_name="Calculator",
        requirements=requirements
    )
    
    # Execute workflow
    results = overseer.execute_workflow()
    
    # Verify results
    assert "outputs" in results, "Results should contain outputs"
    assert "context" in results, "Results should contain context"
    assert "workflow_status" in results, "Results should contain workflow status"
    print("  ✓ Workflow execution completed")
    
    # Check all roles executed
    assert "planner" in results["outputs"], "Planner should have executed"
    assert "architect" in results["outputs"], "Architect should have executed"
    assert "coder" in results["outputs"], "Coder should have executed"
    assert "reviewer" in results["outputs"], "Reviewer should have executed"
    assert "executor" in results["outputs"], "Executor should have executed"
    print("  ✓ All five roles executed")
    
    # Check workflow completion
    status = results["workflow_status"]
    assert status["completed"] == 5, "All 5 tasks should be completed"
    assert status["progress_percentage"] == 100.0, "Progress should be 100%"
    print("  ✓ Workflow completed successfully")
    
    # Check context updates
    assert overseer.context.plan is not None, "Plan should be set"
    assert overseer.context.architecture is not None, "Architecture should be set"
    assert len(overseer.context.code_files) > 0, "Code files should be generated"
    print("  ✓ Context updated correctly")


def test_vague_requirements_handling():
    """Test handling of vague requirements"""
    print("\nTesting vague requirements handling...")
    
    vague_requirements = """
    Build something that maybe processes files.
    Should handle some data (TBD).
    Could include approximately 10 features.
    """
    
    overseer = Overseer(
        project_name="VagueApp",
        requirements=vague_requirements
    )
    
    results = overseer.execute_workflow()
    
    # Should have clarifying questions
    questions = overseer.get_clarifying_questions()
    assert len(questions) > 0, "Should generate clarifying questions"
    print(f"  ✓ Generated {len(questions)} clarifying questions")
    
    # Should still complete workflow
    status = results["workflow_status"]
    assert status["completed"] == 5, "Should complete despite vagueness"
    print("  ✓ Workflow completed despite vague requirements")


def test_role_switching():
    """Test Overseer role switching"""
    print("\nTesting role switching...")
    
    overseer = Overseer("TestProject", "Test requirements")
    
    # Switch to different roles
    planner = overseer.switch_role(RoleType.PLANNER)
    assert overseer.current_role == RoleType.PLANNER, "Should switch to Planner"
    assert isinstance(planner, PlannerRole), "Should return PlannerRole instance"
    
    architect = overseer.switch_role(RoleType.ARCHITECT)
    assert overseer.current_role == RoleType.ARCHITECT, "Should switch to Architect"
    
    coder = overseer.switch_role(RoleType.CODER)
    assert overseer.current_role == RoleType.CODER, "Should switch to Coder"
    
    print("  ✓ Role switching working correctly")


def test_output_formatting():
    """Test output formatting consistency"""
    print("\nTesting output formatting...")
    
    context = Context("TestApp", "Test requirements")
    task = Task("TEST-001", "Test task")
    
    roles = [
        PlannerRole(),
        ArchitectRole(),
        CoderRole(),
        ReviewerRole(),
        ExecutorRole()
    ]
    
    for role in roles:
        output = role.execute(context, task)
        # Check for consistent formatting markers
        assert "=" * 80 in output, f"{role.name} output should have formatting"
        assert len(output) > 0, f"{role.name} should produce output"
    
    print("  ✓ All roles produce properly formatted output")


def test_report_generation():
    """Test comprehensive report generation"""
    print("\nTesting report generation...")
    
    overseer = Overseer("ReportTest", "Create a test app")
    results = overseer.execute_workflow()
    
    report = overseer.generate_report()
    
    # Check report contains key sections
    assert "EXECUTION REPORT" in report, "Should have report header"
    assert "Workflow Status" in report, "Should have workflow status"
    assert "Files Generated" in report, "Should have files section"
    assert len(report) > 0, "Report should not be empty"
    
    print("  ✓ Report generation working")


def run_all_tests():
    """Run all tests and report results"""
    print("\n" + "=" * 80)
    print("UNIFIED CODING AGENT - TEST SUITE")
    print("=" * 80)
    
    tests = [
        test_smart_plan_vagueness_detection,
        test_zen_tasks_workflow,
        test_tasksync_feedback,
        test_context_management,
        test_role_execution,
        test_overseer_workflow,
        test_vague_requirements_handling,
        test_role_switching,
        test_output_formatting,
        test_report_generation,
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            test_func()
            passed += 1
        except AssertionError as e:
            print(f"  ✗ FAILED: {str(e)}")
            failed += 1
        except Exception as e:
            print(f"  ✗ ERROR: {str(e)}")
            failed += 1
    
    print("\n" + "=" * 80)
    print(f"TEST RESULTS: {passed} passed, {failed} failed")
    print("=" * 80 + "\n")
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

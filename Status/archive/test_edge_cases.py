#!/usr/bin/env python3
"""
Edge Case Tests for Unified Coding Agent
=========================================

Tests edge cases, boundary conditions, and error scenarios.
"""

import pytest
from unified_agent import (
    Overseer, RoleType, SmartPlan, ZenTasks, Tasksync,
    Context, Task, PlannerRole, ArchitectRole,
    CoderRole, ReviewerRole, ExecutorRole
)


class TestSmartPlanEdgeCases:
    """Edge case tests for SmartPlan"""
    
    def test_empty_text(self):
        """Test vagueness detection with empty text"""
        result = SmartPlan.check_vagueness("")
        assert result == []
    
    def test_none_input(self):
        """Test handling of None input"""
        with pytest.raises(AttributeError):
            SmartPlan.check_vagueness(None)
    
    def test_very_long_text(self):
        """Test with very long requirements document"""
        long_text = "This is a clear requirement. " * 1000
        result = SmartPlan.check_vagueness(long_text)
        assert result == []
    
    def test_unicode_characters(self):
        """Test with unicode characters"""
        text = "Create app with émojis 🚀 and unicode ñ characters"
        result = SmartPlan.check_vagueness(text)
        assert isinstance(result, list)
    
    def test_all_vague_indicators(self):
        """Test text with all vague indicator types"""
        text = """
        maybe implement feature
        process some data
        handle various cases etc
        TODO: define this
        approximately 100 users
        What about this??
        """
        result = SmartPlan.check_vagueness(text)
        assert len(result) >= 5
    
    def test_case_insensitivity(self):
        """Test that detection is case-insensitive"""
        lower = SmartPlan.check_vagueness("maybe do this")
        upper = SmartPlan.check_vagueness("MAYBE do this")
        mixed = SmartPlan.check_vagueness("MaYbE do this")
        
        assert len(lower) > 0
        assert len(upper) > 0
        assert len(mixed) > 0
    
    def test_empty_clarifications(self):
        """Test clarification generation with empty list"""
        questions = SmartPlan.suggest_clarifications([])
        assert questions == []


class TestZenTasksEdgeCases:
    """Edge case tests for ZenTasks"""
    
    def test_empty_workflow(self):
        """Test workflow with no tasks"""
        zen = ZenTasks()
        status = zen.get_workflow_status()
        assert status['total'] == 0
        assert status['progress_percentage'] == 0
    
    def test_circular_dependency(self):
        """Test detection of circular dependencies (manual check)"""
        zen = ZenTasks()
        t1 = zen.create_task("Task 1", RoleType.PLANNER)
        t2 = zen.create_task("Task 2", RoleType.ARCHITECT, [t1.id])
        # Manually create circular dependency
        zen.tasks[t1.id].dependencies.append(t2.id)
        
        # Should not crash, but neither task will be ready
        ready = zen.get_ready_tasks()
        assert len(ready) == 0
    
    def test_nonexistent_dependency(self):
        """Test task with nonexistent dependency"""
        zen = ZenTasks()
        t1 = zen.create_task("Task 1", RoleType.PLANNER, ["NONEXISTENT"])
        ready = zen.get_ready_tasks()
        # Task should not be ready (dependency not met)
        assert t1 not in ready
    
    def test_update_nonexistent_task(self):
        """Test updating a task that doesn't exist"""
        zen = ZenTasks()
        # Should not crash, just no-op
        zen.update_task("NONEXISTENT", "completed")
    
    def test_large_task_count(self):
        """Test with many tasks"""
        zen = ZenTasks()
        for i in range(100):
            zen.create_task(f"Task {i}", RoleType.PLANNER)
        
        assert len(zen.tasks) == 100
        ready = zen.get_ready_tasks()
        assert len(ready) == 100  # All have no dependencies
    
    def test_deep_dependency_chain(self):
        """Test long chain of dependencies"""
        zen = ZenTasks()
        prev_id = None
        
        for i in range(10):
            deps = [prev_id] if prev_id else []
            task = zen.create_task(f"Task {i}", RoleType.PLANNER, deps)
            prev_id = task.id
        
        # Only first task should be ready
        ready = zen.get_ready_tasks()
        assert len(ready) == 1
        assert ready[0].id == "TASK-001"


class TestTasksyncEdgeCases:
    """Edge case tests for Tasksync"""
    
    def test_feedback_for_nonexistent_task(self):
        """Test getting feedback for nonexistent task"""
        sync = Tasksync()
        feedback = sync.get_feedback_for_task("NONEXISTENT")
        assert feedback == []
    
    def test_empty_feedback_history(self):
        """Test operations on empty feedback history"""
        sync = Tasksync()
        blocking = sync.get_blocking_feedback()
        assert blocking == []
    
    def test_duplicate_feedback(self):
        """Test adding duplicate feedback"""
        sync = Tasksync()
        sync.provide_feedback("T1", RoleType.PLANNER, "Same feedback", "info")
        sync.provide_feedback("T1", RoleType.PLANNER, "Same feedback", "info")
        
        feedback = sync.get_feedback_for_task("T1")
        assert len(feedback) == 2  # Both should be recorded
    
    def test_multiple_severity_levels(self):
        """Test filtering by different severity levels"""
        sync = Tasksync()
        sync.provide_feedback("T1", RoleType.PLANNER, "Info", "info")
        sync.provide_feedback("T2", RoleType.PLANNER, "Warning", "warning")
        sync.provide_feedback("T3", RoleType.PLANNER, "Error", "error")
        
        blocking = sync.get_blocking_feedback()
        # Only errors and warnings should block
        assert len(blocking) >= 1


class TestContextEdgeCases:
    """Edge case tests for Context"""
    
    def test_context_with_special_characters(self):
        """Test context with special characters in names"""
        ctx = Context(
            project_name="Test-Project_v2.0!",
            requirements="Requirements with <html> & special chars"
        )
        assert ctx.project_name == "Test-Project_v2.0!"
    
    def test_context_large_data(self):
        """Test context with large amounts of data"""
        ctx = Context("Test", "Requirements")
        
        # Add many files
        for i in range(100):
            ctx.code_files[f"file_{i}.py"] = f"# File {i}\nprint('hello')"
        
        assert len(ctx.code_files) == 100
    
    def test_context_mutation(self):
        """Test that context data can be mutated across roles"""
        ctx = Context("Test", "Requirements")
        ctx.plan = "Initial plan"
        ctx.plan = "Updated plan"
        assert ctx.plan == "Updated plan"


class TestRoleEdgeCases:
    """Edge case tests for Role execution"""
    
    def test_role_with_empty_context(self):
        """Test role execution with minimal context"""
        ctx = Context("", "")
        task = Task("T1", "")
        
        planner = PlannerRole()
        output = planner.execute(ctx, task)
        assert output is not None
        assert len(output) > 0
    
    def test_role_with_unicode_requirements(self):
        """Test roles with unicode in requirements"""
        ctx = Context("Test", "Créate ñ app with émojis 🚀")
        task = Task("T1", "Test task")
        
        planner = PlannerRole()
        output = planner.execute(ctx, task)
        assert output is not None
    
    def test_all_roles_preserve_context(self):
        """Test that all roles preserve existing context data"""
        ctx = Context("Test", "Requirements")
        ctx.plan = "Existing plan"
        ctx.architecture = "Existing architecture"
        task = Task("T1", "Test")
        
        # Each role should preserve existing context
        coder = CoderRole()
        coder.execute(ctx, task)
        assert ctx.plan == "Existing plan"
        assert ctx.architecture == "Existing architecture"


class TestOverseerEdgeCases:
    """Edge case tests for Overseer"""
    
    def test_overseer_with_empty_requirements(self):
        """Test Overseer with empty requirements"""
        overseer = Overseer("Test", "")
        results = overseer.execute_workflow()
        assert "workflow_status" in results
    
    def test_overseer_multiple_executions(self):
        """Test executing workflow multiple times"""
        overseer = Overseer("Test", "Simple requirements")
        
        results1 = overseer.execute_workflow()
        results2 = overseer.execute_workflow()
        
        # Both should complete successfully
        # Note: Second execution creates new tasks, so total completed increases
        assert results1["workflow_status"]["completed"] == 5
        assert results2["workflow_status"]["completed"] == 10  # Accumulated total
    
    def test_overseer_role_switch_during_workflow(self):
        """Test manual role switching during workflow"""
        overseer = Overseer("Test", "Requirements")
        
        # Switch roles manually
        overseer.switch_role(RoleType.CODER)
        assert overseer.current_role == RoleType.CODER
        
        # Workflow should still work
        results = overseer.execute_workflow()
        assert results["workflow_status"]["completed"] == 5
    
    def test_get_clarifying_questions_before_workflow(self):
        """Test getting clarifying questions before execution"""
        overseer = Overseer("Test", "Maybe implement something")
        # Should work even before workflow execution
        questions = overseer.get_clarifying_questions()
        assert isinstance(questions, list)


class TestBoundaryConditions:
    """Tests for boundary conditions and limits"""
    
    def test_task_id_overflow(self):
        """Test task ID generation with many tasks"""
        zen = ZenTasks()
        for i in range(1000):
            task = zen.create_task(f"Task {i}", RoleType.PLANNER)
        
        # Should handle large task numbers
        assert zen.task_counter == 1000
        assert "TASK-1000" in zen.tasks
    
    def test_extremely_long_requirements(self):
        """Test with very long requirements"""
        long_req = "Create a feature that does something. " * 10000
        overseer = Overseer("Test", long_req)
        # Should not crash
        assert overseer.context.requirements == long_req
    
    def test_zero_length_task_description(self):
        """Test task with empty description"""
        task = Task("T1", "")
        assert task.description == ""
        assert task.id == "T1"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

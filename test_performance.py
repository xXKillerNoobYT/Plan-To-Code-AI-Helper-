#!/usr/bin/env python3
"""
Performance Tests for Unified Coding Agent
==========================================

Tests performance characteristics and benchmarks.
"""

import pytest
import time
from unified_agent import (
    Overseer, RoleType, SmartPlan, ZenTasks,
    Context, Task, PlannerRole
)


class TestPerformance:
    """Performance and benchmark tests"""
    
    def test_vagueness_detection_performance(self):
        """Test vagueness detection speed on large text"""
        # Generate large text
        text = "\n".join([f"Line {i}: Maybe implement feature {i}" for i in range(1000)])
        
        start = time.time()
        result = SmartPlan.check_vagueness(text)
        elapsed = time.time() - start
        
        # Should complete in reasonable time (<1 second)
        assert elapsed < 1.0, f"Vagueness detection took {elapsed:.3f}s"
        assert len(result) == 1000  # Should find all vague lines
    
    def test_workflow_execution_time(self):
        """Test complete workflow execution time"""
        overseer = Overseer("PerfTest", "Create a simple calculator app")
        
        start = time.time()
        results = overseer.execute_workflow()
        elapsed = time.time() - start
        
        # Should complete in reasonable time (<5 seconds)
        assert elapsed < 5.0, f"Workflow took {elapsed:.3f}s"
        assert results["workflow_status"]["completed"] == 5
    
    def test_task_creation_performance(self):
        """Test task creation speed"""
        zen = ZenTasks()
        
        start = time.time()
        for i in range(1000):
            zen.create_task(f"Task {i}", RoleType.PLANNER)
        elapsed = time.time() - start
        
        # Should create 1000 tasks quickly (<0.1s)
        assert elapsed < 0.1, f"Task creation took {elapsed:.3f}s"
        assert len(zen.tasks) == 1000
    
    def test_role_switching_performance(self):
        """Test role switching overhead"""
        overseer = Overseer("Test", "Requirements")
        
        start = time.time()
        for _ in range(1000):
            overseer.switch_role(RoleType.PLANNER)
            overseer.switch_role(RoleType.ARCHITECT)
            overseer.switch_role(RoleType.CODER)
            overseer.switch_role(RoleType.REVIEWER)
            overseer.switch_role(RoleType.EXECUTOR)
        elapsed = time.time() - start
        
        # Should be very fast (<0.5s for 5000 switches)
        assert elapsed < 0.5, f"Role switching took {elapsed:.3f}s"
    
    def test_context_preservation_overhead(self):
        """Test context preservation performance"""
        ctx = Context("Test", "Requirements")
        task = Task("T1", "Test task")
        
        # Add significant data to context
        for i in range(100):
            ctx.code_files[f"file_{i}.py"] = "x" * 1000  # 100KB total
        
        planner = PlannerRole()
        
        start = time.time()
        planner.execute(ctx, task)
        elapsed = time.time() - start
        
        # Should handle large context efficiently (<1s)
        assert elapsed < 1.0, f"Context handling took {elapsed:.3f}s"
    
    def test_report_generation_performance(self):
        """Test report generation speed"""
        overseer = Overseer("Test", "Requirements")
        overseer.execute_workflow()
        
        start = time.time()
        report = overseer.generate_report()
        elapsed = time.time() - start
        
        # Report should generate quickly (<0.1s)
        assert elapsed < 0.1, f"Report generation took {elapsed:.3f}s"
        assert len(report) > 0
    
    @pytest.mark.slow
    def test_stress_test_large_workflow(self):
        """Stress test with very large workflow"""
        zen = ZenTasks()
        
        # Create 100 tasks with dependencies
        prev_id = None
        for i in range(100):
            deps = [prev_id] if prev_id else []
            task = zen.create_task(f"Task {i}", RoleType.PLANNER, deps)
            prev_id = task.id
        
        start = time.time()
        
        # Process all tasks
        for task in zen.tasks.values():
            zen.update_task(task.id, "completed")
        
        elapsed = time.time() - start
        
        # Should handle large workflows efficiently
        assert elapsed < 1.0, f"Large workflow took {elapsed:.3f}s"
        assert zen.get_workflow_status()["completed"] == 100
    
    def test_memory_efficiency(self):
        """Test memory usage with multiple workflows"""
        # Create and complete multiple workflows
        for i in range(10):
            overseer = Overseer(f"Test{i}", f"Requirements {i}")
            results = overseer.execute_workflow()
            assert results["workflow_status"]["completed"] == 5
        
        # If we get here without memory errors, test passes
        assert True


class TestScalability:
    """Tests for scalability with increasing load"""
    
    def test_scaling_task_count(self):
        """Test performance scales linearly with task count"""
        zen = ZenTasks()
        
        # Measure time for 100 tasks
        start = time.time()
        for i in range(100):
            zen.create_task(f"Task {i}", RoleType.PLANNER)
        time_100 = time.time() - start
        
        zen = ZenTasks()
        
        # Measure time for 1000 tasks
        start = time.time()
        for i in range(1000):
            zen.create_task(f"Task {i}", RoleType.PLANNER)
        time_1000 = time.time() - start
        
        # Should scale roughly linearly (within 50x for 10x tasks)
        # Note: May vary on different systems
        ratio = time_1000 / time_100 if time_100 > 0 else 0
        assert ratio < 50, f"Scaling ratio {ratio:.2f} too high"
    
    def test_concurrent_task_readiness_check(self):
        """Test performance with many tasks checking readiness"""
        zen = ZenTasks()
        
        # Create many independent tasks
        for i in range(500):
            zen.create_task(f"Task {i}", RoleType.PLANNER)
        
        start = time.time()
        ready = zen.get_ready_tasks()
        elapsed = time.time() - start
        
        # Should check readiness quickly even with many tasks
        assert elapsed < 1.0, f"Readiness check took {elapsed:.3f}s"
        assert len(ready) == 500


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "not slow"])

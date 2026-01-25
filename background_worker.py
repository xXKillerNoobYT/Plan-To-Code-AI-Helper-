#!/usr/bin/env python3
"""
Background Worker for Unified Coding Agent
==========================================

Provides asynchronous task execution capabilities to allow the main
unified agent to delegate long-running work to background threads
while continuing orchestration of other tasks.

Features:
- Thread-based async execution
- Task status tracking
- Result collection
- Error handling and propagation
- Thread-safe queue operations
"""

import threading
import queue
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, Optional, List
from datetime import datetime


class TaskStatus(Enum):
    """Status of a background task"""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class BackgroundTask:
    """Represents a task to be executed in background"""
    task_id: str
    callable: Callable
    args: tuple = field(default_factory=tuple)
    kwargs: dict = field(default_factory=dict)
    status: TaskStatus = TaskStatus.QUEUED
    result: Any = None
    error: Optional[Exception] = None
    submitted_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None


class BackgroundWorker:
    """
    Manages asynchronous task execution in background threads
    
    Allows the main agent to delegate time-consuming work while
    continuing to orchestrate other tasks. Results can be polled
    or retrieved when ready.
    """
    
    def __init__(self, max_workers: int = 3):
        """
        Initialize background worker system
        
        Args:
            max_workers: Maximum number of concurrent background threads
        """
        self.max_workers = max_workers
        self.task_queue: queue.Queue = queue.Queue()
        self.tasks: Dict[str, BackgroundTask] = {}
        self.workers: List[threading.Thread] = []
        self.shutdown_flag = threading.Event()
        self._lock = threading.Lock()
        
        # Start worker threads
        for i in range(max_workers):
            worker = threading.Thread(
                target=self._worker_loop,
                name=f"BackgroundWorker-{i}",
                daemon=True
            )
            worker.start()
            self.workers.append(worker)
    
    def submit_task(
        self,
        task_id: str,
        callable: Callable,
        *args,
        **kwargs
    ) -> str:
        """
        Submit a task for background execution
        
        Args:
            task_id: Unique identifier for the task
            callable: Function to execute
            *args: Positional arguments for callable
            **kwargs: Keyword arguments for callable
            
        Returns:
            Task ID for status tracking
            
        Raises:
            ValueError: If task_id already exists
        """
        with self._lock:
            if task_id in self.tasks:
                raise ValueError(f"Task {task_id} already exists")
            
            bg_task = BackgroundTask(
                task_id=task_id,
                callable=callable,
                args=args,
                kwargs=kwargs
            )
            
            self.tasks[task_id] = bg_task
            self.task_queue.put(bg_task)
        
        return task_id
    
    def get_status(self, task_id: str) -> TaskStatus:
        """
        Get current status of a task
        
        Args:
            task_id: Task identifier
            
        Returns:
            Current task status
            
        Raises:
            KeyError: If task_id doesn't exist
        """
        with self._lock:
            if task_id not in self.tasks:
                raise KeyError(f"Task {task_id} not found")
            return self.tasks[task_id].status
    
    def get_result(self, task_id: str, timeout: Optional[float] = None) -> Any:
        """
        Get result of a completed task (blocks until complete if still running)
        
        Args:
            task_id: Task identifier
            timeout: Maximum time to wait for completion (None = wait forever)
            
        Returns:
            Task result
            
        Raises:
            KeyError: If task doesn't exist
            TimeoutError: If timeout exceeded
            RuntimeError: If worker shutdown before task completed
            Exception: If task failed, re-raises the original exception
        """
        start_time = time.time()
        
        while True:
            with self._lock:
                if task_id not in self.tasks:
                    raise KeyError(f"Task {task_id} not found")
                
                task = self.tasks[task_id]
                
                if task.status == TaskStatus.COMPLETED:
                    return task.result
                elif task.status == TaskStatus.FAILED:
                    raise task.error
                elif task.status == TaskStatus.CANCELLED:
                    raise RuntimeError(f"Task {task_id} was cancelled")
            
            # Check if worker has been shutdown
            if self.shutdown_flag.is_set():
                with self._lock:
                    task = self.tasks[task_id]
                    if task.status not in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                        raise RuntimeError(f"Worker shutdown before task {task_id} completed")
            
            # Check timeout
            if timeout is not None:
                if time.time() - start_time > timeout:
                    raise TimeoutError(f"Task {task_id} did not complete within {timeout}s")
            
            # Wait a bit before checking again
            time.sleep(0.1)
    
    def cancel_task(self, task_id: str) -> bool:
        """
        Attempt to cancel a task (only works if not yet started)
        
        Args:
            task_id: Task identifier
            
        Returns:
            True if cancelled, False if already running/completed
        """
        with self._lock:
            if task_id not in self.tasks:
                raise KeyError(f"Task {task_id} not found")
            
            task = self.tasks[task_id]
            
            if task.status == TaskStatus.QUEUED:
                task.status = TaskStatus.CANCELLED
                return True
            
            return False
    
    def get_task_info(self, task_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a task
        
        Args:
            task_id: Task identifier
            
        Returns:
            Dictionary with task details
        """
        with self._lock:
            if task_id not in self.tasks:
                raise KeyError(f"Task {task_id} not found")
            
            task = self.tasks[task_id]
            
            info = {
                "task_id": task.task_id,
                "status": task.status.value,
                "submitted_at": datetime.fromtimestamp(task.submitted_at).isoformat(),
            }
            
            if task.started_at:
                info["started_at"] = datetime.fromtimestamp(task.started_at).isoformat()
                info["running_time"] = time.time() - task.started_at
            
            if task.completed_at:
                info["completed_at"] = datetime.fromtimestamp(task.completed_at).isoformat()
                info["total_time"] = task.completed_at - task.submitted_at
            
            if task.error:
                info["error"] = str(task.error)
            
            return info
    
    def list_tasks(self) -> List[Dict[str, Any]]:
        """
        List all tasks and their statuses
        
        Returns:
            List of task info dictionaries
        """
        with self._lock:
            return [self.get_task_info(tid) for tid in self.tasks.keys()]
    
    def shutdown(self, wait: bool = True):
        """
        Shutdown the background worker system
        
        Args:
            wait: If True, wait for all tasks to complete
        """
        self.shutdown_flag.set()
        
        if wait:
            for worker in self.workers:
                worker.join()
    
    def _worker_loop(self):
        """
        Main worker thread loop - processes tasks from queue
        """
        while not self.shutdown_flag.is_set():
            try:
                # Get task from queue (with timeout to check shutdown flag)
                task = self.task_queue.get(timeout=0.5)
            except queue.Empty:
                continue
            
            # Check if task was cancelled while in queue
            with self._lock:
                if task.status == TaskStatus.CANCELLED:
                    self.task_queue.task_done()
                    continue
                
                # Mark as running
                task.status = TaskStatus.RUNNING
                task.started_at = time.time()
            
            # Execute the task
            try:
                result = task.callable(*task.args, **task.kwargs)
                
                with self._lock:
                    task.result = result
                    task.status = TaskStatus.COMPLETED
                    task.completed_at = time.time()
                    
            except Exception as e:
                with self._lock:
                    task.error = e
                    task.status = TaskStatus.FAILED
                    task.completed_at = time.time()
            
            finally:
                self.task_queue.task_done()


# Global worker instance for convenience
_global_worker: Optional[BackgroundWorker] = None


def get_global_worker() -> BackgroundWorker:
    """
    Get or create the global background worker instance
    
    Returns:
        Global BackgroundWorker instance
    """
    global _global_worker
    if _global_worker is None:
        _global_worker = BackgroundWorker()
    return _global_worker


def delegate_to_background(task_id: str, callable: Callable, *args, **kwargs) -> str:
    """
    Convenience function to delegate task to global background worker
    
    Args:
        task_id: Unique task identifier
        callable: Function to execute
        *args: Arguments for callable
        **kwargs: Keyword arguments for callable
        
    Returns:
        Task ID for tracking
    """
    worker = get_global_worker()
    return worker.submit_task(task_id, callable, *args, **kwargs)

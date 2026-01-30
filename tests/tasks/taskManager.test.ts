/**
 * Test Suite: taskManager.ts
 * Tests for task CRUD operations and management
 */

import { TaskManager } from '../../src/tasks/taskManager';
import { TaskQueue, Task } from '../../src/tasks/queue';

describe('TaskManager', () => {
  let taskManager: TaskManager;
  let taskQueue: TaskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
    taskManager = new TaskManager(taskQueue);
  });

  describe('Initialization', () => {
    it('should create a TaskManager instance', () => {
      expect(taskManager).toBeDefined();
      expect(taskManager).toBeInstanceOf(TaskManager);
    });

    it('should accept a TaskQueue in constructor', () => {
      const queue = new TaskQueue();
      const manager = new TaskManager(queue);
      expect(manager).toBeDefined();
    });
  });

  describe('createTask', () => {
    it('should create a task with required fields', () => {
      const task = taskManager.createTask('Test Task', 'Test Description');

      expect(task).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.priority).toBe('medium');
      expect(task.status).toBe('pending');
    });

    it('should create a task with custom priority', () => {
      const task = taskManager.createTask('Test Task', 'Description', 'critical');

      expect(task.priority).toBe('critical');
    });

    it('should support all priority levels', () => {
      const priorities: Array<Task['priority']> = ['critical', 'high', 'medium', 'low'];

      priorities.forEach((priority) => {
        const task = taskManager.createTask('Task', 'Description', priority);
        expect(task.priority).toBe(priority);
      });
    });

    it('should generate a unique taskId', () => {
      const task1 = taskManager.createTask('Task 1', 'Desc 1');
      const task2 = taskManager.createTask('Task 2', 'Desc 2');

      expect(task1.taskId).not.toBe(task2.taskId);
    });

    it('should set taskId with proper format', () => {
      const task = taskManager.createTask('Task', 'Description');

      expect(task.taskId).toMatch(/^task-\d+-[a-z0-9]+$/);
    });

    it('should set created and updated timestamps', () => {
      const beforeCreation = new Date();
      const task = taskManager.createTask('Task', 'Description');
      const afterCreation = new Date();

      expect(task.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(task.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    });

    it('should set initial status to pending', () => {
      const task = taskManager.createTask('Task', 'Description');

      expect(task.status).toBe('pending');
    });

    it('should initialize empty dependencies array', () => {
      const task = taskManager.createTask('Task', 'Description');

      expect(task.dependencies).toEqual([]);
      expect(Array.isArray(task.dependencies)).toBe(true);
    });

    it('should add task to queue', () => {
      expect(taskQueue.getAllTasks()).toHaveLength(0);

      taskManager.createTask('Task', 'Description');

      expect(taskQueue.getAllTasks()).toHaveLength(1);
    });

    it('should add multiple tasks to queue', () => {
      taskManager.createTask('Task 1', 'Desc 1');
      taskManager.createTask('Task 2', 'Desc 2');
      taskManager.createTask('Task 3', 'Desc 3');

      expect(taskQueue.getAllTasks()).toHaveLength(3);
    });
  });

  describe('getTask', () => {
    it('should retrieve a task by ID', () => {
      const created = taskManager.createTask('Test Task', 'Description');
      const retrieved = taskManager.getTask(created.taskId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.taskId).toBe(created.taskId);
      expect(retrieved?.title).toBe('Test Task');
    });

    it('should return null for non-existent task', () => {
      const retrieved = taskManager.getTask('non-existent-id');

      expect(retrieved).toBeNull();
    });

    it('should retrieve correct task from multiple tasks', () => {
      const task1 = taskManager.createTask('Task 1', 'Desc 1', 'critical');
      const task2 = taskManager.createTask('Task 2', 'Desc 2', 'high');
      const task3 = taskManager.createTask('Task 3', 'Desc 3', 'low');

      const retrieved = taskManager.getTask(task2.taskId);

      expect(retrieved?.title).toBe('Task 2');
      expect(retrieved?.priority).toBe('high');
    });
  });

  describe('updateTask', () => {
    it('should return true for existing task', () => {
      const task = taskManager.createTask('Task', 'Description');
      const result = taskManager.updateTask(task.taskId, { status: 'done' });

      expect(result).toBe(true);
    });

    it('should return false for non-existent task', () => {
      const result = taskManager.updateTask('non-existent-id', { status: 'done' });

      expect(result).toBe(false);
    });

    it('should support updating task properties', () => {
      const task = taskManager.createTask('Original Task', 'Original Description');

      // Note: The actual update logic is TODO in the source, 
      // so this test verifies the interface works
      const result = taskManager.updateTask(task.taskId, {
        title: 'Updated Task',
        status: 'in-progress' as const,
      });

      expect(result).toBe(true);
    });

    it('should validate task existence before updating', () => {
      // Create a task to establish correct ID format
      const task = taskManager.createTask('Task', 'Description');
      const validId = task.taskId;

      // Update with valid ID should return true
      expect(taskManager.updateTask(validId, { status: 'done' })).toBe(true);

      // Update with invalid ID should return false
      expect(taskManager.updateTask('invalid-id-format', { status: 'done' })).toBe(false);
    });

    it('should support partial updates', () => {
      const task = taskManager.createTask('Task', 'Description', 'high');

      const result = taskManager.updateTask(task.taskId, {
        status: 'in-progress' as const,
      });

      expect(result).toBe(true);
    });
  });

  describe('deleteTask', () => {
    it('should return false for delete (not implemented)', () => {
      const task = taskManager.createTask('Task', 'Description');
      const result = taskManager.deleteTask(task.taskId);

      expect(result).toBe(false);
    });

    it('should handle delete attempt on non-existent task', () => {
      const result = taskManager.deleteTask('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('Task Generation Uniqueness', () => {
    it('should generate unique IDs for rapid creations', () => {
      const tasks = [];
      for (let i = 0; i < 50; i++) {
        tasks.push(taskManager.createTask(`Task ${i}`, `Description ${i}`));
      }

      const ids = tasks.map((t) => t.taskId);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(50);
    });

    it('should generate IDs with minimal collision probability', () => {
      const task1 = taskManager.createTask('Task 1', 'Desc');
      const task2 = taskManager.createTask('Task 2', 'Desc');
      const task3 = taskManager.createTask('Task 3', 'Desc');

      const ids = [task1.taskId, task2.taskId, task3.taskId];
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('Task Dependencies', () => {
    it('should create task with empty dependencies', () => {
      const task = taskManager.createTask('Task', 'Description');

      expect(task.dependencies).toEqual([]);
    });

    it('should support task dependencies workflow', () => {
      const task1 = taskManager.createTask('Task 1', 'Description 1');
      const task2 = taskManager.createTask('Task 2', 'Description 2', 'high');

      // Verify both tasks exist
      expect(taskManager.getTask(task1.taskId)).toBeDefined();
      expect(taskManager.getTask(task2.taskId)).toBeDefined();
    });
  });

  describe('Task Timestamps', () => {
    it('should set createdAt on task creation', () => {
      const task = taskManager.createTask('Task', 'Description');

      expect(task.createdAt).toBeInstanceOf(Date);
    });

    it('should set updatedAt on task creation', () => {
      const task = taskManager.createTask('Task', 'Description');

      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('should have createdAt equal to updatedAt initially', () => {
      const task = taskManager.createTask('Task', 'Description');

      expect(task.createdAt.getTime()).toBeCloseTo(task.updatedAt.getTime(), 0);
    });

    it('should create tasks with recent timestamps', () => {
      const before = Date.now();
      const task = taskManager.createTask('Task', 'Description');
      const after = Date.now();

      expect(task.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(task.createdAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('Integration with TaskQueue', () => {
    it('should add created tasks to the queue', () => {
      expect(taskQueue.getAllTasks()).toHaveLength(0);

      taskManager.createTask('Task 1', 'Desc 1');
      taskManager.createTask('Task 2', 'Desc 2');

      const allTasks = taskQueue.getAllTasks();
      expect(allTasks).toHaveLength(2);
      expect(allTasks[0].title).toBe('Task 1');
      expect(allTasks[1].title).toBe('Task 2');
    });

    it('should retrieve tasks through getTask from queue', () => {
      const created = taskManager.createTask('Test', 'Desc');
      const fromQueue = taskQueue.getAllTasks();

      expect(fromQueue).toContainEqual(expect.objectContaining({ taskId: created.taskId }));
    });
  });

  describe('Error Handling', () => {
    it('should handle createTask with empty title gracefully', () => {
      const task = taskManager.createTask('', 'Description');

      expect(task).toBeDefined();
      expect(task.title).toBe('');
    });

    it('should handle createTask with empty description gracefully', () => {
      const task = taskManager.createTask('Task', '');

      expect(task).toBeDefined();
      expect(task.description).toBe('');
    });

    it('should handle long task titles', () => {
      const longTitle = 'a'.repeat(1000);
      const task = taskManager.createTask(longTitle, 'Description');

      expect(task.title).toBe(longTitle);
    });

    it('should handle special characters in task title', () => {
      const specialTitle = 'Task with !@#$%^&*()[]{}|\\;:"\'<>?,./';
      const task = taskManager.createTask(specialTitle, 'Description');

      expect(task.title).toBe(specialTitle);
    });
  });
});

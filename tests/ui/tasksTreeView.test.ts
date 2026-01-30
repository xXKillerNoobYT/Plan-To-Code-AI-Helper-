/**
 * Test Suite: tasksTreeView.ts
 * Tests for VS Code tree view task display
 */

import * as vscode from 'vscode';
import { Task } from '../../src/tasks/queue';
import { TasksTreeDataProvider, TaskTreeItem } from '../../src/ui/tasksTreeView';

// Mock vscode module
jest.mock('vscode', () => ({
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  EventEmitter: class EventEmitter<T> {
    private listeners: Array<(event: T) => void> = [];

    event = (listener: (event: T) => void) => {
      this.listeners.push(listener);
      return {
        dispose: () => {
          this.listeners = this.listeners.filter((item) => item !== listener);
        }
      };
    };

    fire = (event: T) => {
      this.listeners.forEach((listener) => listener(event));
    };

    dispose = () => {
      this.listeners = [];
    };
  },
  TreeItem: class TreeItem {
    constructor(label: string, state?: number) {
      this.label = label;
      this.collapsibleState = state;
    }
    label!: string;
    collapsibleState?: number;
    tooltip?: string;
    description?: string;
  },
}));

describe('TasksTreeDataProvider', () => {
  let provider: TasksTreeDataProvider;
  let mockTasks: Task[];

  beforeEach(() => {
    // Create mock tasks
    mockTasks = [
      {
        taskId: 'task-1',
        title: 'Critical Task 1',
        description: 'Critical task description',
        priority: 'critical',
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        taskId: 'task-2',
        title: 'Critical Task 2',
        description: 'Another critical task',
        priority: 'critical',
        status: 'ready',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        taskId: 'task-3',
        title: 'High Priority Task',
        description: 'High priority description',
        priority: 'high',
        status: 'in-progress',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    provider = new TasksTreeDataProvider(mockTasks);
  });

  describe('Initialization', () => {
    it('should create TasksTreeDataProvider instance', () => {
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(TasksTreeDataProvider);
    });

    it('should initialize with tasks array', () => {
      const newProvider = new TasksTreeDataProvider(mockTasks);
      expect(newProvider).toBeDefined();
    });

    it('should handle empty tasks array', () => {
      const emptyProvider = new TasksTreeDataProvider([]);
      expect(emptyProvider).toBeDefined();
    });
  });

  describe('onDidChangeTreeData', () => {
    it('should have onDidChangeTreeData event', () => {
      expect(provider.onDidChangeTreeData).toBeDefined();
    });

    it('should support event subscription', () => {
      const listener = jest.fn();
      provider.onDidChangeTreeData(listener);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should trigger onDidChangeTreeData event', () => {
      const listener = jest.fn();
      provider.onDidChangeTreeData(listener);

      provider.refresh();

      expect(listener).toHaveBeenCalled();
    });

    it('should allow multiple refreshes', () => {
      const listener = jest.fn();
      provider.onDidChangeTreeData(listener);

      provider.refresh();
      provider.refresh();
      provider.refresh();

      expect(listener).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateTasks', () => {
    it('should update tasks and refresh', () => {
      const newTasks: Task[] = [
        {
          taskId: 'task-4',
          title: 'New Task',
          description: 'New task description',
          priority: 'medium',
          status: 'pending',
          dependencies: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const listener = jest.fn();
      provider.onDidChangeTreeData(listener);

      provider.updateTasks(newTasks);

      expect(listener).toHaveBeenCalled();
    });

    it('should replace existing tasks', () => {
      const newTasks: Task[] = [
        {
          taskId: 'new-task',
          title: 'Updated Task',
          description: 'Description',
          priority: 'high',
          status: 'pending',
          dependencies: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      provider.updateTasks(newTasks);

      // Verify by calling getChildren
      provider.getChildren(undefined).then((items) => {
        // Should have 4 priority categories
        expect(items).toHaveLength(4);
      });
    });
  });

  describe('getTreeItem', () => {
    it('should return tree item', () => {
      const item = new TaskTreeItem('Test Item', vscode.TreeItemCollapsibleState.None);
      const result = provider.getTreeItem(item);

      expect(result).toEqual(item);
    });

    it('should return same object', () => {
      const item = new TaskTreeItem('Test', vscode.TreeItemCollapsibleState.Collapsed);
      const result = provider.getTreeItem(item);

      expect(result).toBe(item);
    });
  });

  describe('getChildren - Root Level', () => {
    it('should return priority categories at root', async () => {
      const children = await provider.getChildren(undefined);

      expect(children).toHaveLength(4);
      expect(children[0].label).toContain('Critical');
      expect(children[1].label).toContain('High');
      expect(children[2].label).toContain('Medium');
      expect(children[3].label).toContain('Low');
    });

    it('should have correct collapsible states', async () => {
      const children = await provider.getChildren(undefined);

      // Critical and High should be expanded, Medium and Low collapsed
      expect(children[0].collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
      expect(children[1].collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
      expect(children[2].collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
      expect(children[3].collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
    });

    it('should include emoji icons for priorities', async () => {
      const children = await provider.getChildren(undefined);

      expect(children[0].label).toContain('🔴'); // Critical
      expect(children[1].label).toContain('🟠'); // High
      expect(children[2].label).toContain('🟡'); // Medium
      expect(children[3].label).toContain('🟢'); // Low
    });
  });

  describe('getChildren - Priority Level', () => {
    it('should return tasks for critical priority', async () => {
      const rootChildren = await provider.getChildren(undefined);
      const criticalItem = rootChildren[0];

      const tasks = await provider.getChildren(criticalItem);

      expect(tasks.length).toBe(2); // task-1 and task-2 are critical
      expect(tasks[0].label).toContain('Critical Task 1');
      expect(tasks[1].label).toContain('Critical Task 2');
    });

    it('should return tasks for high priority', async () => {
      const rootChildren = await provider.getChildren(undefined);
      const highItem = rootChildren[1];

      const tasks = await provider.getChildren(highItem);

      expect(tasks.length).toBe(1); // Only task-3 is high
      expect(tasks[0].label).toContain('High Priority Task');
    });

    it('should return empty array for priorities with no tasks', async () => {
      const rootChildren = await provider.getChildren(undefined);
      const mediumItem = rootChildren[2];

      const tasks = await provider.getChildren(mediumItem);

      expect(tasks).toHaveLength(0);
    });

    it('should include status icons in task labels', async () => {
      const rootChildren = await provider.getChildren(undefined);
      const criticalItem = rootChildren[0];

      const tasks = await provider.getChildren(criticalItem);

      expect(tasks[0].label).toContain('⏳'); // pending
      expect(tasks[1].label).toContain('✅'); // ready
    });

    it('should set task items as non-collapsible', async () => {
      const rootChildren = await provider.getChildren(undefined);
      const criticalItem = rootChildren[0];

      const tasks = await provider.getChildren(criticalItem);

      expect(tasks[0].collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
    });
  });

  describe('Task Status Icons', () => {
    it('should show pending icon for pending tasks', async () => {
      const pendingTask: Task = {
        taskId: 'task-pending',
        title: 'Pending Task',
        description: 'Description',
        priority: 'high',
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      provider.updateTasks([pendingTask]);
      const rootChildren = await provider.getChildren(undefined);
      const highItem = rootChildren[1];

      const tasks = await provider.getChildren(highItem);

      expect(tasks[0].label).toContain('⏳');
    });

    it('should show ready icon for ready tasks', async () => {
      const readyTask: Task = {
        taskId: 'task-ready',
        title: 'Ready Task',
        description: 'Description',
        priority: 'medium',
        status: 'ready',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      provider.updateTasks([readyTask]);
      const rootChildren = await provider.getChildren(undefined);
      const mediumItem = rootChildren[2];

      const tasks = await provider.getChildren(mediumItem);

      expect(tasks[0].label).toContain('✅');
    });

    it('should show in-progress icon for active tasks', async () => {
      const inProgressTask: Task = {
        taskId: 'task-active',
        title: 'Active Task',
        description: 'Description',
        priority: 'low',
        status: 'in-progress',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      provider.updateTasks([inProgressTask]);
      const rootChildren = await provider.getChildren(undefined);
      const lowItem = rootChildren[3];

      const tasks = await provider.getChildren(lowItem);

      expect(tasks[0].label).toContain('🔄');
    });

    it('should show done icon for completed tasks', async () => {
      const doneTask: Task = {
        taskId: 'task-done',
        title: 'Done Task',
        description: 'Description',
        priority: 'critical',
        status: 'done',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      provider.updateTasks([doneTask]);
      const rootChildren = await provider.getChildren(undefined);
      const criticalItem = rootChildren[0];

      const tasks = await provider.getChildren(criticalItem);

      expect(tasks[0].label).toContain('✔️');
    });

    it('should show blocked icon for blocked tasks', async () => {
      const blockedTask: Task = {
        taskId: 'task-blocked',
        title: 'Blocked Task',
        description: 'Description',
        priority: 'high',
        status: 'blocked',
        dependencies: ['task-1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      provider.updateTasks([blockedTask]);
      const rootChildren = await provider.getChildren(undefined);
      const highItem = rootChildren[1];

      const tasks = await provider.getChildren(highItem);

      expect(tasks[0].label).toContain('🚫');
    });
  });
});

describe('TaskTreeItem', () => {
  it('should create task tree item without task', () => {
    const item = new TaskTreeItem('Test Label', vscode.TreeItemCollapsibleState.None);

    expect(item.label).toBe('Test Label');
    expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
  });

  it('should create category item with expanded state', () => {
    const item = new TaskTreeItem('🔴 Critical', vscode.TreeItemCollapsibleState.Expanded, 'critical');

    expect(item.label).toBe('🔴 Critical');
    expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    expect(item.priority).toBe('critical');
  });

  it('should create task item with description tooltip', () => {
    const task: Task = {
      taskId: 'task-1',
      title: 'Test Task',
      description: 'Task description',
      priority: 'high',
      status: 'pending',
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const item = new TaskTreeItem('✅ Test Task', vscode.TreeItemCollapsibleState.None, 'high', task);

    expect(item.tooltip).toBe('Task description');
    expect(item.description).toBe('#task-1');
  });

  it('should include task ID in description', () => {
    const task: Task = {
      taskId: 'my-special-task-123',
      title: 'Test',
      description: 'Desc',
      priority: 'medium',
      status: 'ready',
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const item = new TaskTreeItem('Test', vscode.TreeItemCollapsibleState.None, 'medium', task);

    expect(item.description).toBe('#my-special-task-123');
  });

  it('should extend vscode.TreeItem', () => {
    const item = new TaskTreeItem('Test', vscode.TreeItemCollapsibleState.None);

    expect(item).toBeInstanceOf(vscode.TreeItem);
  });
});

describe('Priority Sorting', () => {
  it('should order priorities correctly', async () => {
    const tasks: Task[] = [
      {
        taskId: 'low',
        title: 'Low Task',
        description: 'Desc',
        priority: 'low',
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        taskId: 'critical',
        title: 'Critical Task',
        description: 'Desc',
        priority: 'critical',
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        taskId: 'medium',
        title: 'Medium Task',
        description: 'Desc',
        priority: 'medium',
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        taskId: 'high',
        title: 'High Task',
        description: 'Desc',
        priority: 'high',
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const testProvider = new TasksTreeDataProvider(tasks);
    const rootChildren = await testProvider.getChildren(undefined);

    // Should be in order: critical, high, medium, low
    expect(rootChildren[0].label).toContain('Critical');
    expect(rootChildren[1].label).toContain('High');
    expect(rootChildren[2].label).toContain('Medium');
    expect(rootChildren[3].label).toContain('Low');
  });
});

describe('Task Filtering', () => {
  it('should filter tasks by priority', async () => {
    const tasks: Task[] = [
      {
        taskId: '1',
        title: 'Critical 1',
        description: 'Desc',
        priority: 'critical',
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        taskId: '2',
        title: 'High 1',
        description: 'Desc',
        priority: 'high',
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        taskId: '3',
        title: 'Critical 2',
        description: 'Desc',
        priority: 'critical',
        status: 'pending',
        dependencies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const testProvider = new TasksTreeDataProvider(tasks);
    const rootChildren = await testProvider.getChildren(undefined);

    // Get critical tasks
    const criticalItems = await testProvider.getChildren(rootChildren[0]);
    expect(criticalItems).toHaveLength(2);

    // Get high tasks
    const highItems = await testProvider.getChildren(rootChildren[1]);
    expect(highItems).toHaveLength(1);
  });
});

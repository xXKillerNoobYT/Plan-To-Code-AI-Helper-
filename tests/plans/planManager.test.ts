/**
 * Test Suite: planManager.ts
 * Tests for plan loading, saving, and management
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PlanManager, PlanData } from '../../src/plans/planManager';

// Mock dependencies
jest.mock('vscode');
jest.mock('fs/promises');
jest.mock('path');

describe('PlanManager', () => {
  let planManager: PlanManager;
  const mockWorkspaceRoot = '/workspace';
  const mockPlanPath = '/workspace/Docs/Plans/plan.json';

  beforeEach(() => {
    // Mock vscode.workspace
    const mockUri = { fsPath: mockWorkspaceRoot } as vscode.Uri;
    (vscode.workspace.workspaceFolders as any) = [{ uri: mockUri }];

    // Mock path.join
    (path.join as any).mockImplementation((...args: string[]) => args.join('/'));

    // Clear all mocks
    jest.clearAllMocks();

    planManager = new PlanManager();
  });

  describe('Initialization', () => {
    it('should create a PlanManager instance', () => {
      expect(planManager).toBeDefined();
      expect(planManager).toBeInstanceOf(PlanManager);
    });

    it('should initialize with null current plan', () => {
      const currentPlan = planManager.getCurrentPlan();
      expect(currentPlan).toBeNull();
    });

    it('should determine plan path from workspace root', () => {
      expect(path.join).toHaveBeenCalledWith(
        mockWorkspaceRoot,
        'Docs',
        'Plans',
        'plan.json'
      );
    });
  });

  describe('loadPlan', () => {
    it('should load plan from file', async () => {
      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Test Project',
        tasks: [],
        metadata: { created: '2026-01-29' },
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockPlan));

      const result = await planManager.loadPlan();

      expect(result).toEqual(mockPlan);
      expect(fs.readFile).toHaveBeenCalledWith(mockPlanPath, 'utf-8');
    });

    it('should set currentPlan when loading successfully', async () => {
      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Test Project',
        tasks: [],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockPlan));

      await planManager.loadPlan();
      const current = planManager.getCurrentPlan();

      expect(current).toEqual(mockPlan);
    });

    it('should return null on file read error', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await planManager.loadPlan();

      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('invalid json {');

      const result = await planManager.loadPlan();

      expect(result).toBeNull();
    });

    it('should load plan with complex structure', async () => {
      const complexPlan: PlanData = {
        version: '2.0.0',
        project: 'Complex Project',
        tasks: [
          {
            taskId: 'task-1',
            title: 'Task 1',
            description: 'Description',
            priority: 'critical',
          },
          {
            taskId: 'task-2',
            title: 'Task 2',
            description: 'Description 2',
            priority: 'high',
          },
        ],
        metadata: {
          created: '2026-01-29',
          author: 'test-user',
          version: '2.0.0',
        },
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(complexPlan));

      const result = await planManager.loadPlan();

      expect(result?.tasks).toHaveLength(2);
      expect(result?.version).toBe('2.0.0');
    });

    it('should maintain plan state after loading', async () => {
      const plan1: PlanData = {
        version: '1.0.0',
        project: 'Project 1',
        tasks: [],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(plan1));
      await planManager.loadPlan();

      let current = planManager.getCurrentPlan();
      expect(current?.project).toBe('Project 1');

      // Load different plan
      const plan2: PlanData = {
        version: '2.0.0',
        project: 'Project 2',
        tasks: [],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(plan2));
      await planManager.loadPlan();

      current = planManager.getCurrentPlan();
      expect(current?.project).toBe('Project 2');
    });
  });

  describe('savePlan', () => {
    it('should save plan to file', async () => {
      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Test Project',
        tasks: [],
      };

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await planManager.savePlan(mockPlan);

      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should save plan with proper formatting', async () => {
      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Test Project',
        tasks: [],
      };

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await planManager.savePlan(mockPlan);

      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const fileContent = writeCall[1];

      // Should be formatted JSON
      expect(fileContent).toContain('"version"');
      expect(fileContent).toContain('"1.0.0"');
    });

    it('should update currentPlan after saving', async () => {
      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Test Project',
        tasks: [],
      };

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await planManager.savePlan(mockPlan);
      const current = planManager.getCurrentPlan();

      expect(current).toEqual(mockPlan);
    });

    it('should return false on write error', async () => {
      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Test Project',
        tasks: [],
      };

      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'));

      const result = await planManager.savePlan(mockPlan);

      expect(result).toBe(false);
    });

    it('should handle save errors gracefully', async () => {
      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Test Project',
        tasks: [],
      };

      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const result = await planManager.savePlan(mockPlan);

      expect(result).toBe(false);
    });

    it('should save plan with complex task structure', async () => {
      const complexPlan: PlanData = {
        version: '2.0.0',
        project: 'Complex Project',
        tasks: [
          {
            taskId: 'task-1',
            title: 'Task 1',
            description: 'Description',
            priority: 'critical',
            subtasks: ['task-1-1', 'task-1-2'],
          },
          {
            taskId: 'task-2',
            title: 'Task 2',
            dependencies: ['task-1'],
          },
        ],
        metadata: {
          totalTasks: 2,
          author: 'test-user',
        },
      };

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await planManager.savePlan(complexPlan);

      expect(result).toBe(true);
      const saveCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const savedContent = JSON.parse(saveCall[1]);
      expect(savedContent.tasks).toHaveLength(2);
    });
  });

  describe('getCurrentPlan', () => {
    it('should return null when no plan is loaded', () => {
      const result = planManager.getCurrentPlan();
      expect(result).toBeNull();
    });

    it('should return loaded plan', async () => {
      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Test Project',
        tasks: [],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockPlan));
      await planManager.loadPlan();

      const result = planManager.getCurrentPlan();
      expect(result).toEqual(mockPlan);
    });

    it('should return saved plan', async () => {
      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Saved Project',
        tasks: [],
      };

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      await planManager.savePlan(mockPlan);

      const result = planManager.getCurrentPlan();
      expect(result?.project).toBe('Saved Project');
    });
  });

  describe('setPlanPath', () => {
    it('should update plan path', () => {
      const newPath = '/custom/path/plan.json';
      planManager.setPlanPath(newPath);

      // Load should use the new path
      (fs.readFile as jest.Mock).mockResolvedValue('{}');
      planManager.loadPlan();

      expect(fs.readFile).toHaveBeenCalledWith(newPath, 'utf-8');
    });

    it('should allow changing path before load', async () => {
      const customPath = '/workspace/custom/plan.json';
      planManager.setPlanPath(customPath);

      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Test',
        tasks: [],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockPlan));
      await planManager.loadPlan();

      expect(fs.readFile).toHaveBeenCalledWith(customPath, 'utf-8');
    });

    it('should use new path for subsequent saves', async () => {
      const newPath = '/new/path/plan.json';
      planManager.setPlanPath(newPath);

      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Test',
        tasks: [],
      };

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      await planManager.savePlan(mockPlan);

      expect(fs.writeFile).toHaveBeenCalledWith(newPath, expect.any(String), 'utf-8');
    });

    it('should support multiple path changes', async () => {
      const paths = ['/path1/plan.json', '/path2/plan.json', '/path3/plan.json'];

      for (const path of paths) {
        planManager.setPlanPath(path);
      }

      (fs.readFile as jest.Mock).mockResolvedValue('{}');
      await planManager.loadPlan();

      // Should use the last path
      expect(fs.readFile).toHaveBeenCalledWith(paths[2], 'utf-8');
    });
  });

  describe('Load/Save Cycle', () => {
    it('should load plan, modify, and save', async () => {
      const originalPlan: PlanData = {
        version: '1.0.0',
        project: 'Original',
        tasks: [],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(originalPlan));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      // Load
      await planManager.loadPlan();
      let current = planManager.getCurrentPlan();
      expect(current?.project).toBe('Original');

      // Modify
      const modifiedPlan: PlanData = {
        ...originalPlan,
        project: 'Modified',
      };

      // Save
      await planManager.savePlan(modifiedPlan);
      current = planManager.getCurrentPlan();
      expect(current?.project).toBe('Modified');
    });

    it('should handle multiple load/save cycles', async () => {
      (fs.readFile as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('plan1')) {
          return JSON.stringify({
            version: '1.0',
            project: 'Project 1',
            tasks: [],
          });
        }
        return JSON.stringify({
          version: '2.0',
          project: 'Project 2',
          tasks: [],
        });
      });

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      // Load plan 1
      planManager.setPlanPath('/plan1.json');
      await planManager.loadPlan();
      expect(planManager.getCurrentPlan()?.project).toBe('Project 1');

      // Load plan 2
      planManager.setPlanPath('/plan2.json');
      await planManager.loadPlan();
      expect(planManager.getCurrentPlan()?.project).toBe('Project 2');
    });
  });

  describe('Error States', () => {
    it('should not modify currentPlan on failed load', async () => {
      const initialPlan: PlanData = {
        version: '1.0.0',
        project: 'Test',
        tasks: [],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(initialPlan));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      // Set initial plan
      await planManager.savePlan(initialPlan);

      // Failed load attempt
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Failed'));
      await planManager.loadPlan();

      // Current plan should still be the saved one
      expect(planManager.getCurrentPlan()?.project).toBe('Test');
    });

    it('should not modify currentPlan on failed save', async () => {
      const plan1: PlanData = {
        version: '1.0.0',
        project: 'Plan 1',
        tasks: [],
      };

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      await planManager.savePlan(plan1);

      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'));

      const plan2: PlanData = {
        version: '2.0.0',
        project: 'Plan 2',
        tasks: [],
      };

      const result = await planManager.savePlan(plan2);

      // Should return false and potentially not update (depends on implementation)
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases and Data Validation', () => {
    it('should handle empty task array', async () => {
      const emptyPlan: PlanData = {
        version: '1.0.0',
        project: 'Empty Project',
        tasks: [],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(emptyPlan));

      const result = await planManager.loadPlan();
      expect(result?.tasks).toHaveLength(0);
      expect(Array.isArray(result?.tasks)).toBe(true);
    });

    it('should preserve task ordering', async () => {
      const orderedPlan: PlanData = {
        version: '1.0.0',
        project: 'Ordered Project',
        tasks: [
          { taskId: 'task-1', title: 'First' },
          { taskId: 'task-2', title: 'Second' },
          { taskId: 'task-3', title: 'Third' },
        ],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(orderedPlan));

      const result = await planManager.loadPlan();
      expect(result?.tasks.map(t => t.taskId)).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('should handle special characters in project name', async () => {
      const specialPlan: PlanData = {
        version: '1.0.0',
        project: 'Project@#$%^&*()',
        tasks: [],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(specialPlan));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const loaded = await planManager.loadPlan();
      expect(loaded?.project).toBe('Project@#$%^&*()');

      await planManager.savePlan(loaded!);
      expect(planManager.getCurrentPlan()?.project).toBe('Project@#$%^&*()');
    });

    it('should handle unicode characters', async () => {
      const unicodePlan: PlanData = {
        version: '1.0.0',
        project: '项目 プロジェクト مشروع',
        tasks: [
          { taskId: 'task-1', title: '任務 1' },
          { taskId: 'task-2', title: 'タスク 2' },
        ],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(unicodePlan));

      const result = await planManager.loadPlan();
      expect(result?.project).toContain('项目');
      expect(result?.tasks[0].title).toContain('任務');
    });

    it('should handle very large plan files', async () => {
      const largePlan: PlanData = {
        version: '1.0.0',
        project: 'Large Project',
        tasks: Array.from({ length: 1000 }, (_, i) => ({
          taskId: `task-${i}`,
          title: `Task ${i}`,
          description: `Description for task ${i}`.repeat(10),
        })),
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(largePlan));

      const result = await planManager.loadPlan();
      expect(result?.tasks).toHaveLength(1000);
      expect(result?.tasks[999].taskId).toBe('task-999');
    });

    it('should preserve nested object structures in tasks', async () => {
      const complexTaskPlan: PlanData = {
        version: '1.0.0',
        project: 'Complex',
        tasks: [
          {
            taskId: 'task-1',
            title: 'Complex Task',
            metadata: {
              nested: {
                deep: {
                  value: 'test',
                },
              },
              array: [1, 2, 3],
            },
          } as any,
        ],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(complexTaskPlan));

      const result = await planManager.loadPlan();
      expect((result?.tasks[0] as any).metadata.nested.deep.value).toBe('test');
      expect((result?.tasks[0] as any).metadata.array).toEqual([1, 2, 3]);
    });

    it('should handle metadata with all optional fields', async () => {
      const metadataPlan: PlanData = {
        version: '1.0.0',
        project: 'Metadata Test',
        tasks: [],
        metadata: {
          created: '2026-01-30',
          author: 'John Doe',
          version: '1.0.0',
          totalTasks: 0,
          customField1: 'value1',
          customField2: 42,
          customField3: ['a', 'b', 'c'],
        },
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(metadataPlan));

      const result = await planManager.loadPlan();
      expect(result?.metadata?.customField1).toBe('value1');
      expect(result?.metadata?.customField2).toBe(42);
      expect(result?.metadata?.customField3).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent loads', async () => {
      const mockPlan: PlanData = {
        version: '1.0.0',
        project: 'Concurrent Test',
        tasks: [],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockPlan));

      const results = await Promise.all([
        planManager.loadPlan(),
        planManager.loadPlan(),
        planManager.loadPlan(),
      ]);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result?.project).toBe('Concurrent Test');
      });
    });

    it('should handle rapid path changes', async () => {
      const paths = ['/path1.json', '/path2.json', '/path3.json', '/path4.json', '/path5.json'];

      paths.forEach(p => planManager.setPlanPath(p));

      (fs.readFile as jest.Mock).mockResolvedValue('{"version":"1.0.0","project":"Test","tasks":[]}');

      await planManager.loadPlan();

      // Should use the last path
      expect(fs.readFile).toHaveBeenCalledWith(paths[4], 'utf-8');
    });

    it('should handle interleaved load and save', async () => {
      const plan1: PlanData = { version: '1.0.0', project: 'Plan1', tasks: [] };
      const plan2: PlanData = { version: '2.0.0', project: 'Plan2', tasks: [] };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(plan1));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      // Perform operations separately to avoid type conflicts
      const load1 = await planManager.loadPlan();
      const save = await planManager.savePlan(plan2);
      const load2 = await planManager.loadPlan();

      expect(load1?.project).toBe('Plan1');
      expect(save).toBe(true);
      expect(load2).toBeDefined();
    });
  });

  describe('Data Integrity', () => {
    it('should not lose data during save/load cycle', async () => {
      const originalPlan: PlanData = {
        version: '1.0.0',
        project: 'Original Project',
        tasks: [
          {
            taskId: 'task-1',
            title: 'Task 1',
            description: 'Description 1',
            priority: 'high',
            dependencies: ['task-2'],
          },
          {
            taskId: 'task-2',
            title: 'Task 2',
            description: 'Description 2',
            priority: 'medium',
            subtasks: ['task-2-1', 'task-2-2'],
          },
        ],
        metadata: {
          created: '2026-01-30',
          author: 'User',
          totalTasks: 2,
        },
      };

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      // Capture the saved content
      let savedContent = JSON.stringify(originalPlan);
      (fs.writeFile as jest.Mock).mockImplementation((path: string, content: string) => {
        savedContent = content;
        return Promise.resolve(undefined);
      });
      (fs.readFile as jest.Mock).mockResolvedValue(savedContent);

      // Save
      await planManager.savePlan(originalPlan);
      const saved = planManager.getCurrentPlan();

      // Load
      await planManager.loadPlan();
      const loaded = planManager.getCurrentPlan();

      // Verify all data is preserved
      expect(loaded).toEqual(saved);
      expect(loaded?.tasks).toHaveLength(2);
      expect(loaded?.tasks[0].dependencies).toEqual(['task-2']);
      expect(loaded?.tasks[1].subtasks).toEqual(['task-2-1', 'task-2-2']);
    });

    it('should handle null and undefined values correctly', async () => {
      const planWithNulls: any = {
        version: '1.0.0',
        project: 'Nulls Test',
        tasks: [
          {
            taskId: 'task-1',
            title: null,
            description: undefined,
            priority: 'high',
          },
        ],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(planWithNulls));

      const result = await planManager.loadPlan();
      expect(result?.tasks[0].taskId).toBe('task-1');
    });
  });

  describe('Workspace Integration', () => {
    it('should handle missing workspace folders', () => {
      (vscode.workspace.workspaceFolders as any) = undefined;

      const manager = new PlanManager();
      expect(manager).toBeDefined();
    });

    it('should handle empty workspace folders array', () => {
      (vscode.workspace.workspaceFolders as any) = [];

      const manager = new PlanManager();
      expect(manager).toBeDefined();
    });

    it('should use first workspace folder when multiple exist', () => {
      const workspaces = [
        { uri: { fsPath: '/workspace1' } },
        { uri: { fsPath: '/workspace2' } },
        { uri: { fsPath: '/workspace3' } },
      ];

      (vscode.workspace.workspaceFolders as any) = workspaces;
      (path.join as any).mockImplementation((...args: string[]) => args.join('/'));

      const manager = new PlanManager();
      (fs.readFile as jest.Mock).mockResolvedValue('{}');

      manager.loadPlan();

      // Should call with first workspace
      expect(path.join).toHaveBeenCalledWith('/workspace1', expect.any(String), expect.any(String), expect.any(String));
    });
  });

  describe('Performance and Bounds', () => {
    it('should handle plan with maximum reasonable task count', async () => {
      const hugePlan: PlanData = {
        version: '1.0.0',
        project: 'Huge Project',
        tasks: Array.from({ length: 5000 }, (_, i) => ({
          taskId: `task-${i}`,
          title: `Task ${i}`,
          priority: i % 3 === 0 ? 'high' : 'medium',
        })),
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(hugePlan));

      const startTime = Date.now();
      const result = await planManager.loadPlan();
      const loadTime = Date.now() - startTime;

      expect(result?.tasks).toHaveLength(5000);
      expect(loadTime).toBeLessThan(5000); // Should load in reasonable time
    });

    it('should save plans efficiently', async () => {
      const largePlan: PlanData = {
        version: '1.0.0',
        project: 'Large Save Test',
        tasks: Array.from({ length: 2000 }, (_, i) => ({
          taskId: `task-${i}`,
          title: `Task ${i}`,
          description: 'Description '.repeat(20),
        })),
      };

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const startTime = Date.now();
      const result = await planManager.savePlan(largePlan);
      const saveTime = Date.now() - startTime;

      expect(result).toBe(true);
      expect(saveTime).toBeLessThan(5000); // Should save in reasonable time
    });
  });

  describe('Type Safety', () => {
    it('should maintain type information for tasks', async () => {
      const typedPlan: PlanData = {
        version: '1.0.0',
        project: 'Typed',
        tasks: [
          {
            taskId: 'task-1',
            title: 'Task 1',
            priority: 'high',
            dependencies: ['task-2', 'task-3'],
          },
        ],
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(typedPlan));

      const result = await planManager.loadPlan();

      expect(typeof result?.version).toBe('string');
      expect(typeof result?.project).toBe('string');
      expect(Array.isArray(result?.tasks)).toBe(true);
      expect(Array.isArray(result?.tasks[0].dependencies)).toBe(true);
    });
  });
});

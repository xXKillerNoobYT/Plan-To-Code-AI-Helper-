/**
 * Test Suite: schemas.ts
 * Tests for plan schema validation and interfaces
 */

import {
  PlanSchema,
  ProjectInfo,
  Phase,
  TaskDefinition,
  Metadata,
  validatePlan,
} from '../../src/plans/schemas';

describe('Plan Schema Validation', () => {
  describe('PlanSchema Interface', () => {
    it('should create a valid basic plan schema', () => {
      const validPlan: PlanSchema = {
        version: '1.0.0',
        project: {
          name: 'Test Project',
          description: 'A test project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: ['test-user'],
        },
      };

      expect(validatePlan(validPlan)).toBe(true);
    });

    it('should include all required fields', () => {
      const plan: PlanSchema = {
        version: '1.0.0',
        project: {
          name: 'Test Project',
          description: 'A test project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(plan.version).toBeDefined();
      expect(plan.project).toBeDefined();
      expect(plan.phases).toBeInstanceOf(Array);
      expect(plan.tasks).toBeInstanceOf(Array);
      expect(plan.metadata).toBeDefined();
    });
  });

  describe('ProjectInfo Interface', () => {
    it('should create valid project info without optional fields', () => {
      const projectInfo: ProjectInfo = {
        name: 'My Project',
        description: 'Project description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(projectInfo.name).toBe('My Project');
      expect(projectInfo.description).toBe('Project description');
      expect(projectInfo.repository).toBeUndefined();
    });

    it('should create valid project info with optional repository', () => {
      const projectInfo: ProjectInfo = {
        name: 'My Project',
        description: 'Project description',
        repository: 'https://github.com/user/repo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(projectInfo.repository).toBe('https://github.com/user/repo');
    });

    it('should have timestamps in ISO format', () => {
      const now = new Date().toISOString();
      const projectInfo: ProjectInfo = {
        name: 'My Project',
        description: 'Project description',
        createdAt: now,
        updatedAt: now,
      };

      expect(projectInfo.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(projectInfo.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Phase Interface', () => {
    it('should create a valid phase with pending status', () => {
      const phase: Phase = {
        phaseId: 'phase-1',
        name: 'Planning Phase',
        description: 'Initial planning phase',
        status: 'not-started',
        tasks: [],
      };

      expect(phase.phaseId).toBe('phase-1');
      expect(phase.status).toBe('not-started');
      expect(phase.tasks).toEqual([]);
    });

    it('should support all phase status values', () => {
      const statuses: Array<'not-started' | 'in-progress' | 'completed'> = [
        'not-started',
        'in-progress',
        'completed',
      ];

      statuses.forEach((status) => {
        const phase: Phase = {
          phaseId: 'phase-1',
          name: 'Test Phase',
          description: 'Test',
          status: status,
          tasks: ['task-1', 'task-2'],
        };

        expect(phase.status).toBe(status);
      });
    });

    it('should track task IDs in a phase', () => {
      const phase: Phase = {
        phaseId: 'phase-1',
        name: 'Development Phase',
        description: 'Development work',
        status: 'in-progress',
        tasks: ['task-1', 'task-2', 'task-3'],
      };

      expect(phase.tasks).toHaveLength(3);
      expect(phase.tasks).toContain('task-1');
    });
  });

  describe('TaskDefinition Interface', () => {
    it('should create a valid task with required fields only', () => {
      const task: TaskDefinition = {
        taskId: 'task-1',
        title: 'Implement feature X',
        description: 'Implement feature X as specified',
        phase: 'phase-1',
        priority: 'high',
        status: 'pending',
        dependencies: [],
      };

      expect(task.taskId).toBe('task-1');
      expect(task.title).toBe('Implement feature X');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('pending');
    });

    it('should support all priority levels', () => {
      const priorities: Array<'critical' | 'high' | 'medium' | 'low'> = [
        'critical',
        'high',
        'medium',
        'low',
      ];

      priorities.forEach((priority) => {
        const task: TaskDefinition = {
          taskId: 'task-1',
          title: 'Test Task',
          description: 'Test',
          phase: 'phase-1',
          priority: priority,
          status: 'pending',
          dependencies: [],
        };

        expect(task.priority).toBe(priority);
      });
    });

    it('should support all status values', () => {
      const statuses: Array<'pending' | 'ready' | 'in-progress' | 'done' | 'blocked'> = [
        'pending',
        'ready',
        'in-progress',
        'done',
        'blocked',
      ];

      statuses.forEach((status) => {
        const task: TaskDefinition = {
          taskId: 'task-1',
          title: 'Test Task',
          description: 'Test',
          phase: 'phase-1',
          priority: 'medium',
          status: status,
          dependencies: [],
        };

        expect(task.status).toBe(status);
      });
    });

    it('should include optional fields when provided', () => {
      const task: TaskDefinition = {
        taskId: 'task-1',
        title: 'Implement feature X',
        description: 'Implement feature X as specified',
        phase: 'phase-1',
        priority: 'high',
        status: 'in-progress',
        dependencies: ['task-0'],
        assignee: 'john@example.com',
        estimatedHours: 8,
        actualHours: 6,
        tags: ['backend', 'api'],
        githubIssue: 123,
        acceptanceCriteria: [
          'Should return 200 status',
          'Should have proper error handling',
        ],
      };

      expect(task.assignee).toBe('john@example.com');
      expect(task.estimatedHours).toBe(8);
      expect(task.actualHours).toBe(6);
      expect(task.tags).toContain('backend');
      expect(task.githubIssue).toBe(123);
      expect(task.acceptanceCriteria).toHaveLength(2);
    });

    it('should handle task dependencies', () => {
      const task: TaskDefinition = {
        taskId: 'task-3',
        title: 'Integration task',
        description: 'Depends on other tasks',
        phase: 'phase-2',
        priority: 'high',
        status: 'blocked',
        dependencies: ['task-1', 'task-2'],
      };

      expect(task.dependencies).toHaveLength(2);
      expect(task.dependencies).toContain('task-1');
      expect(task.dependencies).toContain('task-2');
    });

    it('should calculate hours correctly', () => {
      const task: TaskDefinition = {
        taskId: 'task-1',
        title: 'Task',
        description: 'Description',
        phase: 'phase-1',
        priority: 'medium',
        status: 'done',
        dependencies: [],
        estimatedHours: 10,
        actualHours: 8,
      };

      expect(task.actualHours! < task.estimatedHours!).toBe(true);
    });
  });

  describe('Metadata Interface', () => {
    it('should track task progress correctly', () => {
      const metadata: Metadata = {
        totalTasks: 100,
        completedTasks: 50,
        progressPercentage: 50,
        lastModified: new Date().toISOString(),
        authors: ['user1', 'user2'],
      };

      expect(metadata.progressPercentage).toBe(
        (metadata.completedTasks / metadata.totalTasks) * 100
      );
    });

    it('should handle multiple authors', () => {
      const metadata: Metadata = {
        totalTasks: 10,
        completedTasks: 5,
        progressPercentage: 50,
        lastModified: new Date().toISOString(),
        authors: ['alice', 'bob', 'charlie'],
      };

      expect(metadata.authors).toHaveLength(3);
      expect(metadata.authors).toContain('alice');
    });

    it('should track last modification time', () => {
      const now = new Date().toISOString();
      const metadata: Metadata = {
        totalTasks: 50,
        completedTasks: 25,
        progressPercentage: 50,
        lastModified: now,
        authors: ['user1'],
      };

      expect(metadata.lastModified).toBe(now);
    });
  });

  describe('validatePlan Function', () => {
    it('should validate a complete valid plan', () => {
      const validPlan: PlanSchema = {
        version: '1.0.0',
        project: {
          name: 'Test Project',
          description: 'Test description',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [
          {
            phaseId: 'phase-1',
            name: 'Phase 1',
            description: 'First phase',
            status: 'not-started',
            tasks: [],
          },
        ],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Task 1',
            description: 'First task',
            phase: 'phase-1',
            priority: 'high',
            status: 'pending',
            dependencies: [],
          },
        ],
        metadata: {
          totalTasks: 1,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: ['tester'],
        },
      };

      expect(validatePlan(validPlan)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(validatePlan(null)).toBe(false);
      expect(validatePlan(undefined)).toBe(false);
    });

    it('should reject plans with missing version', () => {
      const invalidPlan = {
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [],
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plans with missing project', () => {
      const invalidPlan = {
        version: '1.0.0',
        phases: [],
        tasks: [],
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plans with non-array phases', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: 'not-an-array',
        tasks: [],
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plans with non-array tasks', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: 'not-an-array',
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject completely invalid objects', () => {
      expect(validatePlan({})).toBe(false);
      expect(validatePlan({ random: 'object' })).toBe(false);
    });

    it('should handle empty arrays validly', () => {
      const plan = {
        version: '1.0.0',
        project: {
          name: 'Empty Project',
          description: 'No tasks',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [],
      };

      expect(validatePlan(plan)).toBe(true);
    });
  });

  describe('Schema Integration', () => {
    it('should create a complete project lifecycle schema', () => {
      const completePlan: PlanSchema = {
        version: '2.0.0',
        project: {
          name: 'Complete Project',
          description: 'A comprehensive project',
          repository: 'https://github.com/test/project',
          createdAt: '2026-01-29T00:00:00Z',
          updatedAt: '2026-01-29T12:00:00Z',
        },
        phases: [
          {
            phaseId: 'planning',
            name: 'Planning',
            description: 'Project planning',
            status: 'completed',
            tasks: ['task-1', 'task-2'],
          },
          {
            phaseId: 'development',
            name: 'Development',
            description: 'Implementation',
            status: 'in-progress',
            tasks: ['task-3', 'task-4'],
          },
        ],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Requirements gathering',
            description: 'Gather project requirements',
            phase: 'planning',
            priority: 'critical',
            status: 'done',
            dependencies: [],
          },
          {
            taskId: 'task-2',
            title: 'Architecture design',
            description: 'Design system architecture',
            phase: 'planning',
            priority: 'critical',
            status: 'done',
            dependencies: ['task-1'],
          },
          {
            taskId: 'task-3',
            title: 'Backend implementation',
            description: 'Implement backend services',
            phase: 'development',
            priority: 'high',
            status: 'in-progress',
            dependencies: ['task-2'],
            assignee: 'dev1@example.com',
            estimatedHours: 40,
          },
          {
            taskId: 'task-4',
            title: 'Frontend implementation',
            description: 'Implement UI',
            phase: 'development',
            priority: 'high',
            status: 'pending',
            dependencies: ['task-2', 'task-3'],
            assignee: 'dev2@example.com',
            estimatedHours: 30,
          },
        ],
        metadata: {
          totalTasks: 4,
          completedTasks: 2,
          progressPercentage: 50,
          lastModified: '2026-01-29T12:00:00Z',
          authors: ['project-lead', 'architect'],
        },
      };

      expect(validatePlan(completePlan)).toBe(true);
      expect(completePlan.tasks).toHaveLength(4);
      expect(completePlan.phases).toHaveLength(2);
      expect(completePlan.metadata.progressPercentage).toBe(50);
    });
  });
});

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
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(plan)).toBe(true);
    });
  });

  describe('validatePlan Function - Advanced Validation', () => {
    it('should validate complex nested structures', () => {
      const complexPlan: PlanSchema = {
        version: '2.1.0',
        project: {
          name: 'Complex Project',
          description: 'Multi-phase, multi-task project',
          repository: 'https://github.com/example/complex',
          createdAt: '2026-01-20T10:00:00Z',
          updatedAt: '2026-01-30T15:30:00Z',
        },
        phases: [
          {
            phaseId: 'phase-1',
            name: 'Phase 1',
            description: 'First phase',
            status: 'completed',
            tasks: ['task-1', 'task-2', 'task-3'],
          },
          {
            phaseId: 'phase-2',
            name: 'Phase 2',
            description: 'Second phase',
            status: 'in-progress',
            tasks: ['task-4', 'task-5'],
          },
          {
            phaseId: 'phase-3',
            name: 'Phase 3',
            description: 'Third phase',
            status: 'not-started',
            tasks: [],
          },
        ],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Setup',
            description: 'Initial setup',
            phase: 'phase-1',
            priority: 'critical',
            status: 'done',
            dependencies: [],
            acceptanceCriteria: ['Setup complete', 'All tools installed'],
          },
          {
            taskId: 'task-2',
            title: 'Design',
            description: 'System design',
            phase: 'phase-1',
            priority: 'critical',
            status: 'done',
            dependencies: ['task-1'],
            tags: ['architecture', 'critical'],
          },
          {
            taskId: 'task-3',
            title: 'Review',
            description: 'Design review',
            phase: 'phase-1',
            priority: 'high',
            status: 'done',
            dependencies: ['task-2'],
          },
          {
            taskId: 'task-4',
            title: 'Backend Dev',
            description: 'Backend implementation',
            phase: 'phase-2',
            priority: 'high',
            status: 'in-progress',
            dependencies: ['task-2'],
            assignee: 'backend-dev@example.com',
            estimatedHours: 40,
            actualHours: 20,
            tags: ['backend', 'api'],
            githubIssue: 101,
          },
          {
            taskId: 'task-5',
            title: 'Frontend Dev',
            description: 'Frontend implementation',
            phase: 'phase-2',
            priority: 'high',
            status: 'pending',
            dependencies: ['task-2', 'task-4'],
            assignee: 'frontend-dev@example.com',
            estimatedHours: 35,
            tags: ['frontend', 'ui'],
            githubIssue: 102,
            acceptanceCriteria: [
              'Responsive design',
              'Accessibility WCAG AA',
              'Performance <3s',
            ],
          },
        ],
        metadata: {
          totalTasks: 5,
          completedTasks: 3,
          progressPercentage: 60,
          lastModified: '2026-01-30T15:30:00Z',
          authors: ['lead-engineer', 'architect', 'qa-lead'],
        },
      };

      expect(validatePlan(complexPlan)).toBe(true);
    });

    it('should reject plan with invalid ISO dates', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: 'not-a-date',
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

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plan with invalid priority', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Test',
            description: 'Test',
            phase: 'phase-1',
            priority: 'ultra-critical', // Invalid
            status: 'pending',
            dependencies: [],
          },
        ],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plan with invalid task status', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Test',
            description: 'Test',
            phase: 'phase-1',
            priority: 'high',
            status: 'invalid-status', // Invalid
            dependencies: [],
          },
        ],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plan with invalid phase status', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [
          {
            phaseId: 'phase-1',
            name: 'Phase',
            description: 'Test',
            status: 'half-completed', // Invalid
            tasks: [],
          },
        ],
        tasks: [],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject metadata with invalid progress percentage', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [],
        metadata: {
          totalTasks: 100,
          completedTasks: 50,
          progressPercentage: 150, // Invalid (>100)
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject metadata with more completed than total tasks', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [],
        metadata: {
          totalTasks: 5,
          completedTasks: 10, // Invalid
          progressPercentage: 50,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plan with non-numeric task hours', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Test',
            description: 'Test',
            phase: 'phase-1',
            priority: 'high',
            status: 'pending',
            dependencies: [],
            estimatedHours: 'not-a-number',
          },
        ],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plan with invalid github issue number', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Test',
            description: 'Test',
            phase: 'phase-1',
            priority: 'high',
            status: 'pending',
            dependencies: [],
            githubIssue: 'issue-123', // Should be a number
          },
        ],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject tasks with non-array dependencies', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Test',
            description: 'Test',
            phase: 'phase-1',
            priority: 'high',
            status: 'pending',
            dependencies: 'task-0', // Should be array
          },
        ],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject tasks with non-array tags', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Test',
            description: 'Test',
            phase: 'phase-1',
            priority: 'high',
            status: 'pending',
            dependencies: [],
            tags: 'important', // Should be array
          },
        ],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject tasks with non-array acceptance criteria', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Test',
            description: 'Test',
            phase: 'phase-1',
            priority: 'high',
            status: 'pending',
            dependencies: [],
            acceptanceCriteria: 'should work', // Should be array
          },
        ],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plan with negative task count in metadata', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [],
        metadata: {
          totalTasks: -5, // Invalid
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plan with non-array authors in metadata', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
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
          authors: 'single-author', // Should be array
        },
      };

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plan with empty string version', () => {
      const invalidPlan = {
        version: '', // Invalid - empty string
        project: {
          name: 'Test',
          description: 'Test',
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

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should reject plan with empty project name', () => {
      const invalidPlan = {
        version: '1.0.0',
        project: {
          name: '', // Invalid - empty string
          description: 'Test',
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

      expect(validatePlan(invalidPlan)).toBe(false);
    });

    it('should handle plans with all valid optional fields', () => {
      const plan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          repository: 'https://github.com/test/repo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Test',
            description: 'Test',
            phase: 'phase-1',
            priority: 'high',
            status: 'pending',
            dependencies: [],
            assignee: 'user@example.com',
            estimatedHours: 8,
            actualHours: 6,
            tags: ['tag1', 'tag2'],
            githubIssue: 123,
            acceptanceCriteria: ['criterion1', 'criterion2'],
          },
        ],
        metadata: {
          totalTasks: 1,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: ['user1', 'user2'],
        },
      };

      expect(validatePlan(plan)).toBe(true);
    });

    it('should validate phase with all valid task IDs', () => {
      const plan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [
          {
            phaseId: 'phase-1',
            name: 'Phase 1',
            description: 'Test',
            status: 'not-started',
            tasks: ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'],
          },
        ],
        tasks: [],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(plan)).toBe(true);
    });

    it('should reject phase with non-string task IDs', () => {
      const plan = {
        version: '1.0.0',
        project: {
          name: 'Test',
          description: 'Test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [
          {
            phaseId: 'phase-1',
            name: 'Phase 1',
            description: 'Test',
            status: 'not-started',
            tasks: ['task-1', 123, 'task-3'], // 123 is not a string
          },
        ],
        tasks: [],
        metadata: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
          lastModified: new Date().toISOString(),
          authors: [],
        },
      };

      expect(validatePlan(plan)).toBe(false);
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

    it('should support large scale plans with many tasks', () => {
      const tasks: TaskDefinition[] = [];
      for (let i = 1; i <= 100; i++) {
        tasks.push({
          taskId: `task-${i}`,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          phase: `phase-${Math.ceil(i / 25)}`,
          priority: ['critical', 'high', 'medium', 'low'][i % 4] as any,
          status: (['pending', 'ready', 'in-progress', 'done', 'blocked'] as const)[i % 5],
          dependencies: i > 1 ? [`task-${i - 1}`] : [],
        });
      }

      const largePlan: PlanSchema = {
        version: '1.0.0',
        project: {
          name: 'Large Project',
          description: 'Project with many tasks',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [
          {
            phaseId: 'phase-1',
            name: 'Phase 1',
            description: 'First 25 tasks',
            status: 'completed',
            tasks: tasks.slice(0, 25).map((t) => t.taskId),
          },
          {
            phaseId: 'phase-2',
            name: 'Phase 2',
            description: 'Next 25 tasks',
            status: 'in-progress',
            tasks: tasks.slice(25, 50).map((t) => t.taskId),
          },
          {
            phaseId: 'phase-3',
            name: 'Phase 3',
            description: 'Next 25 tasks',
            status: 'not-started',
            tasks: tasks.slice(50, 75).map((t) => t.taskId),
          },
          {
            phaseId: 'phase-4',
            name: 'Phase 4',
            description: 'Final 25 tasks',
            status: 'not-started',
            tasks: tasks.slice(75, 100).map((t) => t.taskId),
          },
        ],
        tasks: tasks,
        metadata: {
          totalTasks: 100,
          completedTasks: 25,
          progressPercentage: 25,
          lastModified: new Date().toISOString(),
          authors: ['team-lead'],
        },
      };

      expect(validatePlan(largePlan)).toBe(true);
      expect(largePlan.tasks).toHaveLength(100);
      expect(largePlan.phases).toHaveLength(4);
    });

    it('should preserve type safety throughout validation', () => {
      const plan: PlanSchema = {
        version: '1.0.0',
        project: {
          name: 'Type Safe',
          description: 'Test type safety',
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

      if (validatePlan(plan)) {
        // After validation, TypeScript knows this is PlanSchema
        expect(plan.version).toHaveLength(5);
        expect(plan.project.name).toBeDefined();
        expect(Array.isArray(plan.phases)).toBe(true);
      }
    });

    it('should validate deeply nested task relationships', () => {
      const plan: PlanSchema = {
        version: '1.0.0',
        project: {
          name: 'Complex Dependencies',
          description: 'Test complex task dependencies',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        phases: [
          {
            phaseId: 'phase-1',
            name: 'Foundation',
            description: 'Base tasks',
            status: 'in-progress',
            tasks: ['task-1', 'task-2'],
          },
        ],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Base Task',
            description: 'No dependencies',
            phase: 'phase-1',
            priority: 'critical',
            status: 'done',
            dependencies: [],
          },
          {
            taskId: 'task-2',
            title: 'Dependent Task',
            description: 'Depends on task-1',
            phase: 'phase-1',
            priority: 'high',
            status: 'in-progress',
            dependencies: ['task-1'],
          },
          {
            taskId: 'task-3',
            title: 'Multi-dep Task',
            description: 'Depends on multiple tasks',
            phase: 'phase-1',
            priority: 'high',
            status: 'blocked',
            dependencies: ['task-1', 'task-2'],
          },
        ],
        metadata: {
          totalTasks: 3,
          completedTasks: 1,
          progressPercentage: 33.33,
          lastModified: new Date().toISOString(),
          authors: ['dev-team'],
        },
      };

      expect(validatePlan(plan)).toBe(true);
      const task3 = plan.tasks[2];
      if (task3) {
        expect(task3.dependencies).toHaveLength(2);
        expect(task3.status).toBe('blocked');
      }
    });
  });
});
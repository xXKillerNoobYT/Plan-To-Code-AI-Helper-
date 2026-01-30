/**
 * 🧪 Programming Orchestrator - Branch Coverage Tests (Part 1)
 * 
 * Comprehensive branch coverage for validation guards, initialization,
 * and routeTask conditional logic in programmingOrchestrator.ts
 */

import * as vscode from 'vscode';
import { ProgrammingOrchestrator, Task, TaskPriority, TaskStatus } from '../../src/orchestrator/programmingOrchestrator';

describe('ProgrammingOrchestrator - Branch Coverage (Part 1: Validation & Guards)', () => {
    let orchestrator: ProgrammingOrchestrator;
    let mockContext: any;
    const storage = new Map<string, any>();

    const createTask = (overrides: Partial<Task> & Pick<Task, 'taskId' | 'title' | 'description' | 'priority' | 'status'>): Task => {
        const description = overrides.description && overrides.description.length >= 10
            ? overrides.description
            : 'Test task description'; // Ensure min 10 chars

        return {
            taskId: overrides.taskId,
            title: overrides.title,
            description,
            priority: overrides.priority,
            status: overrides.status,
            dependencies: overrides.dependencies ?? [],
            blockedBy: overrides.blockedBy ?? [],
            estimatedHours: overrides.estimatedHours ?? 1,
            acceptanceCriteria: overrides.acceptanceCriteria ?? ['Test acceptance criteria'],
            fromPlanningTeam: overrides.fromPlanningTeam ?? true,
            createdAt: overrides.createdAt ?? new Date(),
            relatedFiles: overrides.relatedFiles,
            designReferences: overrides.designReferences,
            contextBundle: overrides.contextBundle,
            assignedTo: overrides.assignedTo,
            metadata: overrides.metadata
        };
    };

    beforeEach(() => {
        storage.clear();
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: (key: string, defaultValue?: any) => storage.get(key) || defaultValue,
                update: async (key: string, value: any) => {
                    storage.set(key, value);
                },
                keys: () => Array.from(storage.keys()),
            },
        };
        orchestrator = new ProgrammingOrchestrator();
    });

    // ============================================================================
    // Initialization Validation Branches
    // ============================================================================

    describe('Initialization Validation', () => {
        it('should throw error when maxConcurrentSessions < 1', async () => {
            (orchestrator as any).maxConcurrentSessions = 0;

            await expect(orchestrator.init()).rejects.toThrow('maxConcurrentSessions must be >= 1');
        });

        it('should initialize successfully with valid configuration', async () => {
            await orchestrator.init();

            expect((orchestrator as any).isInitialized).toBe(true);
            expect((orchestrator as any).taskQueue).toEqual([]);
            expect((orchestrator as any).currentTask).toBeNull();
        });

        it('should initialize with valid maxConcurrentSessions', async () => {
            (orchestrator as any).maxConcurrentSessions = 5;

            await expect(orchestrator.init()).resolves.toBeUndefined();
            expect((orchestrator as any).maxConcurrentSessions).toBe(5);
        });
    });

    // ============================================================================
    // routeTask Validation Branches
    // ============================================================================

    describe('routeTask Validation Branches', () => {
        beforeEach(async () => {
            await orchestrator.init();
        });

        it('should throw error when task not from Planning Team', async () => {
            const invalidTask = createTask({
                taskId: 'not-from-planning',
                title: 'Test',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                fromPlanningTeam: false // Invalid
            });

            await expect(orchestrator.routeTask(invalidTask)).rejects.toThrow('Task must be from Planning Team');
        });

        it('should throw error when trying to route while another task is executing (one-at-a-time)', async () => {
            const task1 = createTask({
                taskId: 'task-1',
                title: 'Task 1',
                description: 'First task',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            });

            const task2 = createTask({
                taskId: 'task-2',
                title: 'Task 2',
                description: 'Second task',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            });

            // Add both tasks to queue
            await orchestrator.addTask(task1);
            await orchestrator.addTask(task2);

            // Set current task
            (orchestrator as any).currentTask = task1;

            // Try to route second task while first is executing
            await expect(orchestrator.routeTask(task2)).rejects.toThrow(
                /Cannot route new task while already executing.*One thing at a time/
            );
        });

        it('should allow routing same task when it is current task', async () => {
            const task = createTask({
                taskId: 'task-1',
                title: 'Task 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            });

            await orchestrator.addTask(task);
            (orchestrator as any).currentTask = task;

            // Should not throw when routing the same task
            await expect(orchestrator.routeTask(task)).resolves.toBeDefined();
        });

        it('should throw error when max concurrent sessions reached', async () => {
            (orchestrator as any).maxConcurrentSessions = 2;

            const task = createTask({
                taskId: 'task-1',
                title: 'Task 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            });

            await orchestrator.addTask(task);

            // Fill up active sessions
            (orchestrator as any).activeSessions.set('session-1', true);
            (orchestrator as any).activeSessions.set('session-2', true);

            await expect(orchestrator.routeTask(task)).rejects.toThrow(
                /Max concurrent sessions.*reached/
            );
        });

        it('should throw error when task not in queue', async () => {
            const taskNotInQueue = createTask({
                taskId: 'not-in-queue',
                title: 'Not in Queue',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            });

            // Don't add task to queue
            await expect(orchestrator.routeTask(taskNotInQueue)).rejects.toThrow(
                /Task not found in queue.*must be added to queue before routing/
            );
        });

        it('should throw error when dependencies not met', async () => {
            const dependencyTask = createTask({
                taskId: 'dependency-task',
                title: 'Dependency',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            });

            const taskWithDeps = createTask({
                taskId: 'main-task',
                title: 'Main Task',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: ['dependency-task']
            });

            await orchestrator.addTask(dependencyTask);
            await orchestrator.addTask(taskWithDeps);

            await expect(orchestrator.routeTask(taskWithDeps)).rejects.toThrow(
                /Cannot route task: unmet dependencies/
            );
        });

        it('should successfully route task when all validations pass', async () => {
            const task = createTask({
                taskId: 'valid-task',
                title: 'Valid Task',
                description: 'Test task with all validations passing',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            });

            await orchestrator.addTask(task);

            const directive = await orchestrator.routeTask(task);

            expect(directive).toBeDefined();
            expect(directive.taskId).toBe('valid-task');
            expect(directive.contextBundle).toBeDefined();
        });
    });

    // ============================================================================
    // Queue Management Guard Branches
    // ============================================================================

    describe('Queue Management Guards', () => {
        it('should handle empty queue in getReadyCount', () => {
            const count = orchestrator.getReadyCount();
            expect(count).toBe(0);
        });

        it('should handle null/undefined taskQueue in getReadyCount', () => {
            (orchestrator as any).taskQueue = null;
            const count = orchestrator.getReadyCount();
            expect(count).toBe(0);
        });

        it('should handle non-array taskQueue in getReadyCount', () => {
            (orchestrator as any).taskQueue = { invalid: 'data' };
            const count = orchestrator.getReadyCount();
            expect(count).toBe(0);
        });

        it('should count ready tasks correctly', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'ready-1',
                title: 'Ready 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'in-progress-1',
                title: 'In Progress',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS
            }));

            await orchestrator.addTask(createTask({
                taskId: 'ready-2',
                title: 'Ready 2',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.READY
            }));

            const count = orchestrator.getReadyCount();
            expect(count).toBe(2);
        });

        it('should return false for hasTaskForTicket when queue is null', async () => {
            (orchestrator as any).taskQueue = null;
            const result = await orchestrator.hasTaskForTicket('TK-001');
            expect(result).toBe(false);
        });

        it('should return false for hasTaskForTicket when queue is not array', async () => {
            (orchestrator as any).taskQueue = { invalid: 'data' };
            const result = await orchestrator.hasTaskForTicket('TK-001');
            expect(result).toBe(false);
        });

        it('should return false for hasTaskForTicket when ticket not found', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'task-1',
                title: 'Task 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                metadata: { ticketId: 'TK-001' }
            }));

            const result = await orchestrator.hasTaskForTicket('TK-999');
            expect(result).toBe(false);
        });

        it('should return true for hasTaskForTicket when ticket found', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'task-1',
                title: 'Task 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                metadata: { ticketId: 'TK-001' }
            }));

            const result = await orchestrator.hasTaskForTicket('TK-001');
            expect(result).toBe(true);
        });
    });

    // ============================================================================
    // Dependency Checking Branches
    // ============================================================================

    describe('Dependency Checking Branches', () => {
        it('should return true when task has no dependencies', () => {
            const task = createTask({
                taskId: 'task-1',
                title: 'Task 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: []
            });

            const result = (orchestrator as any).areDependenciesMet(task);
            expect(result).toBe(true);
        });

        it('should return false when dependency task not found in queue', async () => {
            const task = createTask({
                taskId: 'task-1',
                title: 'Task 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: ['non-existent-dep']
            });

            await orchestrator.addTask(task);

            const result = (orchestrator as any).areDependenciesMet(task);
            expect(result).toBe(false);
        });

        it('should return false when dependency task is not completed', async () => {
            const depTask = createTask({
                taskId: 'dep-task',
                title: 'Dependency',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY // Not completed
            });

            const task = createTask({
                taskId: 'main-task',
                title: 'Main Task',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: ['dep-task']
            });

            await orchestrator.addTask(depTask);
            await orchestrator.addTask(task);

            const result = (orchestrator as any).areDependenciesMet(task);
            expect(result).toBe(false);
        });

        it('should return true when all dependency tasks are completed', async () => {
            const depTask = createTask({
                taskId: 'dep-task',
                title: 'Dependency',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.COMPLETED // Completed
            });

            const task = createTask({
                taskId: 'main-task',
                title: 'Main Task',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: ['dep-task']
            });

            await orchestrator.addTask(depTask);
            await orchestrator.addTask(task);

            const result = (orchestrator as any).areDependenciesMet(task);
            expect(result).toBe(true);
        });

        it('should return true when all multiple dependencies are completed', async () => {
            const dep1 = createTask({
                taskId: 'dep-1',
                title: 'Dependency 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.COMPLETED
            });

            const dep2 = createTask({
                taskId: 'dep-2',
                title: 'Dependency 2',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.COMPLETED
            });

            const task = createTask({
                taskId: 'main-task',
                title: 'Main Task',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: ['dep-1', 'dep-2']
            });

            await orchestrator.addTask(dep1);
            await orchestrator.addTask(dep2);
            await orchestrator.addTask(task);

            const result = (orchestrator as any).areDependenciesMet(task);
            expect(result).toBe(true);
        });

        it('should return false when some dependencies are not completed', async () => {
            const dep1 = createTask({
                taskId: 'dep-1',
                title: 'Dependency 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.COMPLETED
            });

            const dep2 = createTask({
                taskId: 'dep-2',
                title: 'Dependency 2',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS // Not completed
            });

            const task = createTask({
                taskId: 'main-task',
                title: 'Main Task',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: ['dep-1', 'dep-2']
            });

            await orchestrator.addTask(dep1);
            await orchestrator.addTask(dep2);
            await orchestrator.addTask(task);

            const result = (orchestrator as any).areDependenciesMet(task);
            expect(result).toBe(false);
        });
    });

    // ============================================================================
    // getNextTask Guard Branches
    // ============================================================================

    describe('getNextTask Guard Branches', () => {
        it('should return null when no tasks are ready', () => {
            const nextTask = orchestrator.getNextTask();
            expect(nextTask).toBeNull();
        });

        it('should log warning when no ready tasks available', () => {
            const loggerWarnSpy = jest.spyOn((orchestrator as any).logger, 'warn');

            orchestrator.getNextTask();

            expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No ready tasks'));
            loggerWarnSpy.mockRestore();
        });

        it('should return highest priority task when multiple ready', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'p3-task',
                title: 'P3 Task',
                description: 'Test',
                priority: TaskPriority.P3,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'p1-task',
                title: 'P1 Task',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'p2-task',
                title: 'P2 Task',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.READY
            }));

            const nextTask = orchestrator.getNextTask();

            expect(nextTask).toBeDefined();
            expect(nextTask?.taskId).toBe('p1-task');
            expect(nextTask?.priority).toBe(TaskPriority.P1);
        });
    });

    // ============================================================================
    // isBusy Branch
    // ============================================================================

    describe('isBusy Branch Logic', () => {
        it('should return false when no current task', () => {
            const result = orchestrator.isBusy();
            expect(result).toBe(false);
        });

        it('should return false when current task is not in progress', async () => {
            const task = createTask({
                taskId: 'task-1',
                title: 'Task 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            });

            (orchestrator as any).currentTask = task;

            const result = orchestrator.isBusy();
            expect(result).toBe(false);
        });

        it('should return true when current task is in progress', async () => {
            const task = createTask({
                taskId: 'task-1',
                title: 'Task 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS
            });

            (orchestrator as any).currentTask = task;

            const result = orchestrator.isBusy();
            expect(result).toBe(true);
        });
    });
});

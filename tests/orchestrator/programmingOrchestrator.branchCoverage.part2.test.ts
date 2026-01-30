/**
 * 🧪 Programming Orchestrator - Branch Coverage Tests (Part 2)
 * 
 * Comprehensive branch coverage for queue helpers, persistence,
 * and filtering logic in programmingOrchestrator.ts
 */

import * as vscode from 'vscode';
import { ProgrammingOrchestrator, Task, TaskPriority, TaskStatus } from '../../src/orchestrator/programmingOrchestrator';

describe('ProgrammingOrchestrator - Branch Coverage (Part 2: Queue & Persistence)', () => {
    let orchestrator: ProgrammingOrchestrator;
    let mockContext: any;
    const storage = new Map<string, any>();

    const createTask = (overrides: Partial<Task> & Pick<Task, 'taskId' | 'title' | 'description' | 'priority' | 'status'>): Task => {
        const description = overrides.description && overrides.description.length >= 10
            ? overrides.description
            : 'Test task description';

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
    // getReadyTasks Filtering Branches
    // ============================================================================

    describe('getReadyTasks Filtering Branches', () => {
        it('should filter out non-ready tasks', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'ready-1',
                title: 'Ready Task',
                description: 'Test task ready',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'in-progress-1',
                title: 'In Progress Task',
                description: 'Test task in progress',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS
            }));

            await orchestrator.addTask(createTask({
                taskId: 'completed-1',
                title: 'Completed Task',
                description: 'Test task completed',
                priority: TaskPriority.P1,
                status: TaskStatus.COMPLETED
            }));

            const readyTasks = (orchestrator as any).getReadyTasks();

            expect(readyTasks.length).toBe(1);
            expect(readyTasks[0].taskId).toBe('ready-1');
        });

        it('should filter out blocked tasks', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'blocked-1',
                title: 'Blocked Task',
                description: 'Test task blocked',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                blockedBy: ['some-task']
            }));

            await orchestrator.addTask(createTask({
                taskId: 'not-blocked-1',
                title: 'Not Blocked',
                description: 'Test task not blocked',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                blockedBy: []
            }));

            const readyTasks = (orchestrator as any).getReadyTasks();

            expect(readyTasks.length).toBe(1);
            expect(readyTasks[0].taskId).toBe('not-blocked-1');
        });

        it('should sort ready tasks by priority (P1 > P2 > P3)', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'p3-task',
                title: 'P3',
                description: 'Test P3 task',
                priority: TaskPriority.P3,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'p1-task',
                title: 'P1',
                description: 'Test P1 task',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'p2-task',
                title: 'P2',
                description: 'Test P2 task',
                priority: TaskPriority.P2,
                status: TaskStatus.READY
            }));

            const readyTasks = (orchestrator as any).getReadyTasks();

            expect(readyTasks.length).toBe(3);
            expect(readyTasks[0].priority).toBe(TaskPriority.P1);
            expect(readyTasks[1].priority).toBe(TaskPriority.P2);
            expect(readyTasks[2].priority).toBe(TaskPriority.P3);
        });
    });

    // ============================================================================
    // getQueueStatus Branches
    // ============================================================================

    describe('getQueueStatus Branches', () => {
        it('should return empty stats when queue is empty', () => {
            const stats = orchestrator.getQueueStatus();

            expect(stats.totalTasks).toBe(0);
            expect(stats.byPriority.P1).toBe(0);
            expect(stats.byPriority.P2).toBe(0);
            expect(stats.byPriority.P3).toBe(0);
            expect(stats.currentTask).toBeNull();
        });

        it('should count tasks by priority correctly', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'p1-1',
                title: 'P1 Task 1',
                description: 'Test P1 task',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'p1-2',
                title: 'P1 Task 2',
                description: 'Test P1 task',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'p2-1',
                title: 'P2 Task',
                description: 'Test P2 task',
                priority: TaskPriority.P2,
                status: TaskStatus.READY
            }));

            const stats = orchestrator.getQueueStatus();

            expect(stats.totalTasks).toBe(3);
            expect(stats.byPriority.P1).toBe(2);
            expect(stats.byPriority.P2).toBe(1);
            expect(stats.byPriority.P3).toBe(0);
        });

        it('should count tasks by status correctly', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'ready-1',
                title: 'Ready',
                description: 'Test ready task',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'in-progress-1',
                title: 'In Progress',
                description: 'Test in progress',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS
            }));

            await orchestrator.addTask(createTask({
                taskId: 'completed-1',
                title: 'Completed',
                description: 'Test completed',
                priority: TaskPriority.P1,
                status: TaskStatus.COMPLETED
            }));

            const stats = orchestrator.getQueueStatus();

            expect(stats.byStatus.ready).toBe(1);
            expect(stats.byStatus.inProgress).toBe(1);
            expect(stats.byStatus.completed).toBe(1);
            expect(stats.byStatus.blocked).toBe(0);
        });

        it('should include current task when set', async () => {
            const task = createTask({
                taskId: 'current-1',
                title: 'Current',
                description: 'Test current task',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS
            });

            (orchestrator as any).currentTask = task;

            const stats = orchestrator.getQueueStatus();

            expect(stats.currentTask).toBeDefined();
            expect(stats.currentTask?.taskId).toBe('current-1');
        });
    });

    // ============================================================================
    // saveTaskQueue Branches
    // ============================================================================

    describe('saveTaskQueue Branches', () => {
        it('should clear existing debounce timer before saving', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            // Set a timer
            (orchestrator as any).saveDebounceTimer = setTimeout(() => { }, 1000);
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

            // Trigger save
            await orchestrator.addTask(createTask({
                taskId: 'save-test-1',
                title: 'Save Test',
                description: 'Test save debounce',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 250));

            expect(clearTimeoutSpy).toHaveBeenCalled();
            clearTimeoutSpy.mockRestore();
        });

        it('should not save when workspaceState is not set', async () => {
            // Don't initialize with persistence
            const updateSpy = jest.spyOn(mockContext.workspaceState, 'update');

            await orchestrator.addTask(createTask({
                taskId: 'no-save-1',
                title: 'No Save',
                description: 'Test no workspace state',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            await new Promise(resolve => setTimeout(resolve, 250));

            expect(updateSpy).not.toHaveBeenCalled();
            updateSpy.mockRestore();
        });

        it('should trim tasks when exceeding MAX_TASKS', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const maxTasks = (orchestrator as any).MAX_TASKS;

            // Add more than MAX_TASKS
            for (let i = 0; i < maxTasks + 10; i++) {
                await orchestrator.addTask(createTask({
                    taskId: `task-${i}`,
                    title: `Task ${i}`,
                    description: 'Test max tasks limit',
                    priority: TaskPriority.P3,
                    status: TaskStatus.READY
                }));
            }

            await new Promise(resolve => setTimeout(resolve, 250));

            const saved = storage.get('coe.taskQueue');
            expect(saved).toBeDefined();
            expect(saved.length).toBeLessThanOrEqual(maxTasks);
        });
    });

    // ============================================================================
    // loadPersistedTasks Branches
    // ============================================================================

    describe('loadPersistedTasks Branches', () => {
        it('should return early when workspaceState is not set', async () => {
            // Don't set workspaceState
            (orchestrator as any).workspaceState = null;

            await (orchestrator as any).loadPersistedTasks();

            expect(orchestrator.getAllTasks().length).toBe(0);
        });

        it('should handle non-array persisted data', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            // Set invalid data
            storage.set('coe.taskQueue', { invalid: 'data' });

            await (orchestrator as any).loadPersistedTasks();

            expect(orchestrator.getAllTasks().length).toBe(0);
        });

        it('should handle null persisted data', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            storage.set('coe.taskQueue', null);

            await (orchestrator as any).loadPersistedTasks();

            expect(orchestrator.getAllTasks().length).toBe(0);
        });

        it('should filter out non-active tasks when loading', async () => {
            const persistedData = [
                {
                    taskId: 'ready-1',
                    title: 'Ready',
                    description: 'Test ready task',
                    priority: TaskPriority.P1,
                    status: 'ready',
                    dependencies: [],
                    blockedBy: [],
                    estimatedHours: 1,
                    acceptanceCriteria: ['Test'],
                    createdAt: new Date().toISOString()
                },
                {
                    taskId: 'completed-1',
                    title: 'Completed',
                    description: 'Test completed',
                    priority: TaskPriority.P1,
                    status: 'completed', // Should be filtered out
                    dependencies: [],
                    blockedBy: [],
                    estimatedHours: 1,
                    acceptanceCriteria: ['Test'],
                    createdAt: new Date().toISOString()
                }
            ];

            storage.set('coe.taskQueue', persistedData);
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const tasks = orchestrator.getAllTasks();
            expect(tasks.length).toBe(1);
            expect(tasks[0].taskId).toBe('ready-1');
        });

        it('should convert string dates to Date objects', async () => {
            const persistedData = [{
                taskId: 'date-test-1',
                title: 'Date Test',
                description: 'Test date conversion',
                priority: TaskPriority.P1,
                status: 'ready',
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                createdAt: '2026-01-15T10:00:00Z' // String date
            }];

            storage.set('coe.taskQueue', persistedData);
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const tasks = orchestrator.getAllTasks();
            expect(tasks[0].createdAt).toBeInstanceOf(Date);
        });

        it('should handle invalid date strings gracefully', async () => {
            const persistedData = [{
                taskId: 'invalid-date-1',
                title: 'Invalid Date',
                description: 'Test invalid date',
                priority: TaskPriority.P1,
                status: 'ready',
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                createdAt: 'invalid-date-string'
            }];

            storage.set('coe.taskQueue', persistedData);
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const tasks = orchestrator.getAllTasks();
            expect(tasks[0].createdAt).toBeInstanceOf(Date);
            expect(tasks[0].createdAt).toBeDefined();
            if (tasks[0].createdAt) {
                expect(tasks[0].createdAt.getTime()).toBeGreaterThan(0);
            }
        });

        it('should handle missing createdAt field', async () => {
            const persistedData = [{
                taskId: 'no-date-1',
                title: 'No Date',
                description: 'Test missing date',
                priority: TaskPriority.P1,
                status: 'ready',
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test']
                // No createdAt field
            }];

            storage.set('coe.taskQueue', persistedData);
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const tasks = orchestrator.getAllTasks();
            expect(tasks[0].createdAt).toBeInstanceOf(Date);
        });
    });

    // ============================================================================
    // reconcileTasks Branches
    // ============================================================================

    describe('reconcileTasks Branches', () => {
        it('should return early when queue is empty', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const initialLength = orchestrator.getAllTasks().length;

            await (orchestrator as any).reconcileTasks();

            expect(orchestrator.getAllTasks().length).toBe(initialLength);
        });

        it('should keep tasks without ticketId metadata', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'no-ticket-1',
                title: 'No Ticket',
                description: 'Test no ticket metadata',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
                // No metadata
            }));

            const beforeCount = orchestrator.getAllTasks().length;

            await (orchestrator as any).reconcileTasks();

            expect(orchestrator.getAllTasks().length).toBe(beforeCount);
        });
    });

    // ============================================================================
    // clearQueue Branches
    // ============================================================================

    describe('clearQueue Branches', () => {
        it('should clear all tasks and reset current task', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'clear-1',
                title: 'Clear Test',
                description: 'Test clear queue',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            (orchestrator as any).currentTask = createTask({
                taskId: 'current-1',
                title: 'Current',
                description: 'Test current',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS
            });

            orchestrator.clearQueue();

            expect(orchestrator.getAllTasks().length).toBe(0);
            expect((orchestrator as any).currentTask).toBeNull();
        });

        it('should trigger save after clearing', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            await orchestrator.addTask(createTask({
                taskId: 'clear-save-1',
                title: 'Clear Save',
                description: 'Test clear with save',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            const updateSpy = jest.spyOn(mockContext.workspaceState, 'update');

            orchestrator.clearQueue();

            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 250));

            expect(updateSpy).toHaveBeenCalled();
            updateSpy.mockRestore();
        });
    });

    // ============================================================================
    // setTasks Branches
    // ============================================================================

    describe('setTasks Branches', () => {
        it('should replace entire queue with new tasks', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'old-1',
                title: 'Old Task',
                description: 'Test old task',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            const newTasks = [
                createTask({
                    taskId: 'new-1',
                    title: 'New Task 1',
                    description: 'Test new task 1',
                    priority: TaskPriority.P1,
                    status: TaskStatus.READY
                }),
                createTask({
                    taskId: 'new-2',
                    title: 'New Task 2',
                    description: 'Test new task 2',
                    priority: TaskPriority.P2,
                    status: TaskStatus.READY
                })
            ];

            orchestrator.setTasks(newTasks);

            const tasks = orchestrator.getAllTasks();
            expect(tasks.length).toBe(2);
            expect(tasks.find(t => t.taskId === 'old-1')).toBeUndefined();
            expect(tasks.find(t => t.taskId === 'new-1')).toBeDefined();
        });
    });

    // ============================================================================
    // getTaskById Branches
    // ============================================================================

    describe('getTaskById Branches', () => {
        it('should return undefined when task not found', () => {
            const task = orchestrator.getTaskById('non-existent');
            expect(task).toBeUndefined();
        });

        it('should return task when found', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'find-me',
                title: 'Find Me',
                description: 'Test find by id',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            const task = orchestrator.getTaskById('find-me');

            expect(task).toBeDefined();
            expect(task?.taskId).toBe('find-me');
        });
    });

    // ============================================================================
    // getInProgressTasksCount Branches
    // ============================================================================

    describe('getInProgressTasksCount Branches', () => {
        it('should return 0 when no in-progress tasks', () => {
            const count = orchestrator.getInProgressTasksCount();
            expect(count).toBe(0);
        });

        it('should count in-progress tasks correctly', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'progress-1',
                title: 'In Progress 1',
                description: 'Test in progress',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS
            }));

            await orchestrator.addTask(createTask({
                taskId: 'ready-1',
                title: 'Ready',
                description: 'Test ready',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'progress-2',
                title: 'In Progress 2',
                description: 'Test in progress 2',
                priority: TaskPriority.P2,
                status: TaskStatus.IN_PROGRESS
            }));

            const count = orchestrator.getInProgressTasksCount();
            expect(count).toBe(2);
        });
    });

    // ============================================================================
    // getReadyTasksCount Branches
    // ============================================================================

    describe('getReadyTasksCount Branches', () => {
        it('should return 0 when no ready tasks', () => {
            const count = orchestrator.getReadyTasksCount();
            expect(count).toBe(0);
        });

        it('should count ready tasks correctly', async () => {
            await orchestrator.addTask(createTask({
                taskId: 'ready-1',
                title: 'Ready 1',
                description: 'Test ready 1',
                priority: TaskPriority.P1,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'ready-2',
                title: 'Ready 2',
                description: 'Test ready 2',
                priority: TaskPriority.P2,
                status: TaskStatus.READY
            }));

            await orchestrator.addTask(createTask({
                taskId: 'in-progress',
                title: 'In Progress',
                description: 'Test in progress',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS
            }));

            const count = orchestrator.getReadyTasksCount();
            expect(count).toBe(2);
        });
    });
});

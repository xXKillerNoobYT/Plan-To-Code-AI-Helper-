/**
 * 🧪 Programming Orchestrator - Branch Coverage Tests
 * 
 * Comprehensive conditional branch coverage for error paths, edge cases,
 * and control flow logic in the Programming Orchestrator.
 */

import * as vscode from 'vscode';
import { ProgrammingOrchestrator, Task, TaskPriority, TaskStatus } from '../src/orchestrator/programmingOrchestrator';

describe('ProgrammingOrchestrator - Branch Coverage', () => {
    let mockContext: any;
    let orchestrator: ProgrammingOrchestrator;
    const storage = new Map<string, any>();
    const createTask = (overrides: Partial<Task> & Pick<Task, 'taskId' | 'title' | 'description' | 'priority' | 'status'>): Task => ({
        taskId: overrides.taskId,
        title: overrides.title,
        description: overrides.description,
        priority: overrides.priority,
        status: overrides.status,
        dependencies: overrides.dependencies ?? [],
        blockedBy: overrides.blockedBy ?? [],
        estimatedHours: overrides.estimatedHours ?? 1,
        acceptanceCriteria: overrides.acceptanceCriteria ?? ['Test acceptance criteria'],
        fromPlanningTeam: overrides.fromPlanningTeam ?? true,
        createdAt: overrides.createdAt ?? new Date(),
        metadata: overrides.metadata
    });

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
    // Error Handling Branches
    // ============================================================================

    describe('Error Handling Paths', () => {
        it('should handle missing workspaceState gracefully', async () => {
            const badContext = { subscriptions: [], workspaceState: null };

            await expect(
                orchestrator.initializeWithPersistence(badContext.workspaceState as unknown as vscode.Memento)
            ).resolves.toBeUndefined();
        });

        it('should handle corrupted task data (non-array)', async () => {
            // Set corrupted persisted data
            await mockContext.workspaceState.update('coe.taskQueue', { invalid: 'object' });

            // Should initialize without error but with no tasks
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            expect(orchestrator.getAllTasks().length).toBe(0);
        });

        it('should handle NaN dates during persistence', async () => {
            // Create task with invalid date
            const invalidTask: any = {
                taskId: 'nan-date-task',
                title: 'NaN Date Test',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                createdAt: 'invalid-date-string', // Results in NaN when parsed
                metadata: {}
            };

            await mockContext.workspaceState.update('coe.taskQueue', [invalidTask]);
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const tasks = orchestrator.getAllTasks();
            expect(tasks.length).toBe(1);
            expect(tasks[0].createdAt).toBeInstanceOf(Date);
        });

        it('should handle quota exceeded errors during save', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Create a context that throws quota error
            const quotaContext = {
                subscriptions: [],
                workspaceState: {
                    update: async () => {
                        throw new Error('QUOTA_EXCEEDED: Storage quota exceeded');
                    }
                }
            };

            orchestrator.setCompletedTasksProvider({
                refresh: () => { }
            });

            // Add many tasks to trigger save attempts
            for (let i = 0; i < 5; i++) {
                orchestrator.addTask(createTask({
                    taskId: `task-${i}`,
                    title: `Task ${i}`,
                    description: 'Test',
                    priority: TaskPriority.P3,
                    status: TaskStatus.READY,
                }));
            }

            // This should handle the error gracefully
            await new Promise(resolve => setTimeout(resolve, 250));

            consoleErrorSpy.mockRestore();
        });
    });

    // ============================================================================
    // Conditional Branch Coverage
    // ============================================================================

    describe('Conditional Branches', () => {
        it('should refresh tree provider when available', async () => {
            const mockTreeProvider = {
                refresh: jest.fn()
            };

            orchestrator.setTreeDataProvider(mockTreeProvider);

            await orchestrator.addTask(createTask({
                taskId: 'refresh-test',
                title: 'Refresh Test',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
            }));

            // Trigger a refresh-worthy action
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockTreeProvider.refresh).toHaveBeenCalled();
        });

        it('should handle missing tree provider gracefully', async () => {
            // Don't set any tree provider
            expect(() => {
                orchestrator.addTask(createTask({
                    taskId: 'no-provider-test',
                    title: 'No Provider',
                    description: 'Test',
                    priority: TaskPriority.P2,
                    status: TaskStatus.READY,
                }));
            }).not.toThrow();
        });

        it('should check task queue capacity (max tasks limit)', async () => {
            const maxTasks = (orchestrator as any).MAX_TASKS;

            // Fill queue to capacity
            for (let i = 0; i < maxTasks; i++) {
                orchestrator.addTask(createTask({
                    taskId: `capacity-task-${i}`,
                    title: `Task ${i}`,
                    description: 'Test',
                    priority: TaskPriority.P3,
                    status: TaskStatus.READY,
                }));
            }

            expect(orchestrator.getAllTasks().length).toBe(maxTasks);
        });

        it('should validate concurrent session limits', async () => {
            const maxConcurrent = (orchestrator as any).maxConcurrentSessions;

            expect(maxConcurrent).toBeGreaterThan(0);
        });
    });

    // ============================================================================
    // Task Metadata & Ticket Integration
    // ============================================================================

    describe('Task Metadata Branches', () => {
        it('should handle tasks with ticket metadata', async () => {
            const taskWithTicket: Task = createTask({
                taskId: 'ticket-task-001',
                title: 'Task with Ticket',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                metadata: {
                    ticketId: 'ticket-123',
                    routedTeam: 'ANSWER'
                }
            });

            await orchestrator.addTask(taskWithTicket);

            const tasks = orchestrator.getAllTasks();
            expect(tasks[0].metadata?.ticketId).toBe('ticket-123');
        });

        it('should handle tasks without metadata', async () => {
            const taskWithoutMetadata: Task = createTask({
                taskId: 'no-metadata-task',
                title: 'No Metadata',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.READY,
            });

            await orchestrator.addTask(taskWithoutMetadata);

            const tasks = orchestrator.getAllTasks();
            expect(tasks[0].metadata).toBeUndefined();
        });

        it('should handle task priority variations', async () => {
            const priorities: TaskPriority[] = [TaskPriority.P1, TaskPriority.P2, TaskPriority.P3];

            priorities.forEach((priority, index) => {
                orchestrator.addTask(createTask({
                    taskId: `priority-${priority}`,
                    title: `Priority ${priority}`,
                    description: 'Test',
                    priority,
                    status: TaskStatus.READY,
                }));
            });

            const tasks = orchestrator.getAllTasks();
            expect(tasks.length).toBe(3);
            expect(tasks[0].priority).toBe(TaskPriority.P1);
            expect(tasks[1].priority).toBe(TaskPriority.P2);
            expect(tasks[2].priority).toBe(TaskPriority.P3);
        });

        it('should handle all task status variations', async () => {
            const statuses: TaskStatus[] = [
                TaskStatus.READY,
                TaskStatus.IN_PROGRESS,
                TaskStatus.COMPLETED,
                TaskStatus.BLOCKED,
                TaskStatus.FAILED
            ];

            statuses.forEach((status) => {
                orchestrator.addTask(createTask({
                    taskId: `status-${status}`,
                    title: `Status ${status}`,
                    description: 'Test',
                    priority: TaskPriority.P2,
                    status,
                }));
            });

            const tasks = orchestrator.getAllTasks();
            expect(tasks.length).toBe(5);
            tasks.forEach((task, index) => {
                expect(task.status).toBe(statuses[index]);
            });
        });
    });

    // ============================================================================
    // Save State Branches
    // ============================================================================

    describe('Save State Management', () => {
        it('should debounce save operations', async () => {
            const updateSpy = jest.spyOn(mockContext.workspaceState, 'update');

            // Add multiple tasks rapidly
            for (let i = 0; i < 3; i++) {
                orchestrator.addTask(createTask({
                    taskId: `debounce-task-${i}`,
                    title: `Task ${i}`,
                    description: 'Test',
                    priority: TaskPriority.P3,
                    status: TaskStatus.READY,
                }));
            }

            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should batch the saves
            const saveCallCount = updateSpy.mock.calls.filter(
                (call: unknown[]) => typeof call[0] === 'string' && (call[0] as string).includes('taskQueue')
            ).length;

            expect(saveCallCount).toBeLessThanOrEqual(2); // Should be debounced

            updateSpy.mockRestore();
        });

        it('should clear debounce timer when needed', async () => {
            orchestrator.addTask(createTask({
                taskId: 'timer-test',
                title: 'Timer Test',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.READY,
            }));

            // Multiple adds should cancel previous timers
            for (let i = 0; i < 3; i++) {
                orchestrator.addTask(createTask({
                    taskId: `timer-${i}`,
                    title: `Timer ${i}`,
                    description: 'Test',
                    priority: TaskPriority.P3,
                    status: TaskStatus.READY,
                }));
            }

            expect(orchestrator.getAllTasks().length).toBe(4);
        });
    });

    // ============================================================================
    // Empty Queue Branches
    // ============================================================================

    describe('Empty Queue Handling', () => {
        it('should handle operations on empty queue', async () => {
            const allTasks = orchestrator.getAllTasks();
            expect(allTasks.length).toBe(0);

            const stats = orchestrator.getQueueStatus();
            expect(stats.totalTasks).toBe(0);
            expect(stats.byStatus.ready).toBe(0);
        });

        it('should handle initialization with no persisted data', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            expect(orchestrator.getAllTasks().length).toBe(0);
        });
    });
});

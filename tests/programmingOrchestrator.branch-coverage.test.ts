/**
 * 🧪 Programming Orchestrator - Branch Coverage Tests
 * 
 * Tests for conditional branches, error handling, and edge cases
 * to increase branch coverage from 65% to 80%+
 * 
 * Focus Areas:
 * - Error handling paths
 * - State management edges
 * - Persistence and data validation
 * - Queue management limits
 */

import { ProgrammingOrchestrator, Task, TaskPriority, TaskStatus } from '../src/orchestrator/programmingOrchestrator';
import { TicketDatabase } from '../src/db/ticketsDb';

describe('ProgrammingOrchestrator - Branch Coverage', () => {
    let mockContext: any;
    let orchestrator: ProgrammingOrchestrator;

    beforeEach(() => {
        const storage = new Map<string, any>();
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

    describe('Error Handling Paths', () => {
        it('should handle initialization without workspace state', async () => {
            const result = await orchestrator.initializeWithPersistence(null as any);

            expect(result).toBeUndefined();
            expect(orchestrator.getAllTasks()).toEqual([]);
        });

        it('should handle corrupted persisted data (not an array)', async () => {
            await mockContext.workspaceState.update('coe.taskQueue', { corrupted: true });

            const result = await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            expect(result).toBeUndefined();
            expect(orchestrator.getAllTasks()).toEqual([]);
        });

        it('should handle persisted data with invalid date causing NaN', async () => {
            await mockContext.workspaceState.update('coe.taskQueue', [{
                taskId: 'test-001',
                title: 'Test',
                description: 'Test task',
                priority: 'P1',
                status: 'ready',
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                createdAt: 'Invalid-Date-2026', // Will parse to NaN
                metadata: {},
                fromPlanningTeam: true,
            }]);

            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const tasks = orchestrator.getAllTasks();
            expect(tasks.length).toBe(1);
            expect(tasks[0].createdAt).toBeInstanceOf(Date);

            // Should create a valid Date object (not NaN)
            const createdTime = tasks[0].createdAt!.getTime();
            expect(isNaN(createdTime)).toBe(false);
            // Date should be a reasonable timestamp (not null/0)
            expect(createdTime).toBeGreaterThan(0);
        });

        it('should handle storage quota exceeded error during save', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            // Mock update BEFORE adding task to capture the quota error
            const originalUpdate = mockContext.workspaceState.update;
            const mockUpdate = jest.fn().mockRejectedValue(
                new Error('QuotaExceededError: Storage quota has been exceeded')
            );
            mockContext.workspaceState.update = mockUpdate;

            // Add task (which triggers save after debounce)
            const addResult = await orchestrator.addTask({
                taskId: 'test-quota',
                title: 'Test Quota',
                description: 'Test quota handling',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            });

            // Wait for debounce timer and retry logic to complete (100ms + retry)
            await new Promise(resolve => setTimeout(resolve, 300));

            // Should attempt to handle error (mockUpdate should have been called)
            expect(mockUpdate).toHaveBeenCalled();

            // Restore
            mockContext.workspaceState.update = originalUpdate;
        });
    });

    describe('Task Queue Management', () => {
        it('should return getReadyTasks correctly', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const readyTask: Task = {
                taskId: 'ready-task-1',
                title: 'Ready Task',
                description: 'Should be in ready list',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            };

            const blockedTask: Task = {
                taskId: 'blocked-task-1',
                title: 'Blocked Task',
                description: 'Should not be in ready list',
                priority: TaskPriority.P1,
                status: TaskStatus.BLOCKED,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            };

            await orchestrator.addTask(readyTask);
            await orchestrator.addTask(blockedTask);

            const ready = orchestrator.getReadyTasks();
            expect(ready.length).toBe(1);
            expect(ready[0].taskId).toBe('ready-task-1');
        });

        it('should return getQueueStatus with correct counts', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            await orchestrator.addTask({
                taskId: 'task-1',
                title: 'Task 1',
                description: 'Ready task',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            });

            await orchestrator.addTask({
                taskId: 'task-2',
                title: 'Task 2',
                description: 'In progress task',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            });

            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(2);
            expect(status.byStatus.ready).toBe(1);
            expect(status.byStatus.inProgress).toBe(1);
        });

        it('should handle getNextTask when queue is empty', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const nextTask = orchestrator.getNextTask();
            expect(nextTask).toBeNull();
        });

        it('should clear queue successfully', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            await orchestrator.addTask({
                taskId: 'clear-test-1',
                title: 'Clear Test',
                description: 'Will be cleared',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            });

            expect(orchestrator.getAllTasks().length).toBe(1);

            orchestrator.clearQueue();

            expect(orchestrator.getAllTasks().length).toBe(0);
        });

        it('should return correct ready tasks count', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            await orchestrator.addTask({
                taskId: 'ready-count-1',
                title: 'Ready 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            });

            await orchestrator.addTask({
                taskId: 'blocked-count-1',
                title: 'Blocked 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.BLOCKED,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            });

            expect(orchestrator.getReadyTasksCount()).toBe(1);
        });

        it('should return correct in progress tasks count', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            await orchestrator.addTask({
                taskId: 'in-progress-count-1',
                title: 'In Progress 1',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            });

            expect(orchestrator.getInProgressTasksCount()).toBe(1);
        });
    });

    describe('Task Lookup and Ticket Integration', () => {
        it('should find task by ID', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            await orchestrator.addTask({
                taskId: 'find-me',
                title: 'Find Me',
                description: 'Test lookup',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            });

            const found = orchestrator.getTaskById('find-me');
            expect(found).toBeDefined();
            expect(found!.taskId).toBe('find-me');
        });

        it('should return undefined for non-existent task ID', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const found = orchestrator.getTaskById('non-existent');
            expect(found).toBeUndefined();
        });

        it('should detect task for ticket', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            await orchestrator.addTask({
                taskId: 'ticket-task',
                title: 'Ticket Task',
                description: 'From ticket',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
                metadata: {
                    ticketId: 'ticket-123'
                }
            });

            const hasTask = await orchestrator.hasTaskForTicket('ticket-123');
            expect(hasTask).toBe(true);
        });

        it('should return false for ticket without task', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const hasTask = await orchestrator.hasTaskForTicket('non-existent-ticket');
            expect(hasTask).toBe(false);
        });
    });

    describe('Busy Status Checks', () => {
        it('should return false when no tasks in progress', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            expect(orchestrator.isBusy()).toBe(false);
        });

        it('should return true when tasks are in progress', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            await orchestrator.addTask({
                taskId: 'busy-task',
                title: 'Busy Task',
                description: 'Making orchestrator busy',
                priority: TaskPriority.P1,
                status: TaskStatus.IN_PROGRESS,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            });

            expect(orchestrator.isBusy()).toBe(true);
        });
    });

    describe('Task Completion', () => {
        it('should reject completion for task not in progress', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const task: Task = {
                taskId: 'not-in-progress',
                title: 'Not In Progress Task',
                description: 'Test invalid completion',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                fromPlanningTeam: true,
            };

            await orchestrator.addTask(task);

            await expect(
                orchestrator.onTaskComplete('not-in-progress', 'Attempted completion')
            ).rejects.toThrow();
        });

        it('should reject completion for non-existent task', async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            await expect(
                orchestrator.onTaskComplete('non-existent', 'Attempted completion')
            ).rejects.toThrow();
        });
    });
});

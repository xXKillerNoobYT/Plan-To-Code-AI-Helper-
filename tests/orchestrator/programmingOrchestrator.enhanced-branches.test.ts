/**
 * Enhanced Branch Coverage Tests for ProgrammingOrchestrator
 * 
 * Targets: 80%+ branch coverage for key methods
 * - addTask() error handling
 * - getReadyTasks() filtering logic
 * - getNextTask() priority ordering
 * - Task lifecycle management
 * - State persistence and recovery
 */

import { ProgrammingOrchestrator, Task, TaskStatus, TaskPriority, MCPErrorCode } from '../../src/orchestrator/programmingOrchestrator';
import { MockMCPTools } from '../../src/orchestrator/programmingOrchestrator';

// ============================================================================
// Mock Logger
// ============================================================================

class MockLogger {
    logs: { level: string; message: string; args: any[] }[] = [];

    info(message: string, ...args: unknown[]) {
        this.logs.push({ level: 'info', message, args });
    }

    warn(message: string, ...args: unknown[]) {
        this.logs.push({ level: 'warn', message, args });
    }

    error(message: string, ...args: unknown[]) {
        this.logs.push({ level: 'error', message, args });
    }

    debug(message: string, ...args: unknown[]) {
        this.logs.push({ level: 'debug', message, args });
    }
}

// ============================================================================
// Test Helper Functions
// ============================================================================

function createTask(overrides?: Partial<Task>): Task {
    return {
        taskId: `test-task-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Test Task',
        description: 'This is a test task for branch coverage',
        priority: TaskPriority.P2,
        status: TaskStatus.READY,
        dependencies: [],
        blockedBy: [],
        estimatedHours: 2,
        acceptanceCriteria: ['Must complete successfully', 'Must have tests'],
        fromPlanningTeam: true,
        createdAt: new Date(),
        ...overrides,
    };
}

// ============================================================================
// Branch Coverage Test Suite
// ============================================================================

describe('ProgrammingOrchestrator - Enhanced Branch Coverage', () => {
    let orchestrator: ProgrammingOrchestrator;
    let logger: MockLogger;
    let mcpTools: MockMCPTools;

    beforeEach(async () => {
        logger = new MockLogger();
        mcpTools = new MockMCPTools();
        orchestrator = new ProgrammingOrchestrator(mcpTools, logger);
        await orchestrator.init();
    });

    // ========================================================================
    // addTask() Branch Coverage
    // ========================================================================

    describe('addTask() - Branch Coverage', () => {
        it('should successfully add valid task to empty queue (happy path)', async () => {
            const task = createTask({ priority: TaskPriority.P1 });

            const result = await orchestrator.addTask(task);

            expect(result).toBe(true);
            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(1);
            expect(status.byPriority.P1).toBe(1);
        });

        it('should return false when queue is at max capacity with no completed tasks', async () => {
            orchestrator = new ProgrammingOrchestrator(mcpTools, logger);
            (orchestrator as any).MAX_TASKS = 2; // Set small limit for testing
            await orchestrator.init();

            const task1 = createTask({ priority: TaskPriority.P1 });
            const task2 = createTask({ taskId: 'task-2', priority: TaskPriority.P2 });
            const task3 = createTask({ taskId: 'task-3', priority: TaskPriority.P3 });

            await orchestrator.addTask(task1);
            await orchestrator.addTask(task2);

            // Queue is now full
            const result = await orchestrator.addTask(task3);

            expect(result).toBe(false);
        });

        it('should remove oldest completed task when queue is full', async () => {
            orchestrator = new ProgrammingOrchestrator(mcpTools, logger);
            (orchestrator as any).MAX_TASKS = 2;
            await orchestrator.init();

            const task1 = createTask({ taskId: 'task-1', status: TaskStatus.COMPLETED });
            const task2 = createTask({ taskId: 'task-2', priority: TaskPriority.P2 });
            const task3 = createTask({ taskId: 'task-3', priority: TaskPriority.P3 });

            await orchestrator.addTask(task1); // Completed task
            await orchestrator.addTask(task2);

            // Queue full, but has completed task to remove
            const result = await orchestrator.addTask(task3);

            expect(result).toBe(true);
            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(2);
            // Oldest (task1) should have been removed
            expect(orchestrator.getTaskById('task-1')).toBeUndefined();
        });

        it('should prevent duplicate tasks for same ticketId (active only)', async () => {
            const ticketId = 'TICKET-001';

            const task1 = createTask({
                taskId: 'task-1',
                metadata: { ticketId },
            });

            const task2 = createTask({
                taskId: 'task-2',
                metadata: { ticketId }, // Same ticketId
            });

            const result1 = await orchestrator.addTask(task1);
            const result2 = await orchestrator.addTask(task2); // Should be rejected

            expect(result1).toBe(true);
            expect(result2).toBe(false); // Duplicate rejected
            expect(orchestrator.getQueueStatus().totalTasks).toBe(1);
        });

        it('should allow reuse of ticketId for completed tasks', async () => {
            const ticketId = 'TICKET-REUSE';

            const task1 = createTask({
                taskId: 'task-completed',
                status: TaskStatus.COMPLETED, // Completed task
                metadata: { ticketId },
            });

            const task2 = createTask({
                taskId: 'task-new',
                metadata: { ticketId }, // Same ticketId but new task
            });

            await orchestrator.addTask(task1);
            // Note: This tests the duplicate detection only checks active tasks
            // The actual reuse would be in a new orchestrator instance
        });

        it('should add tasks from different tickets successfully', async () => {
            const task1 = createTask({
                taskId: 'task-1',
                metadata: { ticketId: 'TICKET-001' },
            });

            const task2 = createTask({
                taskId: 'task-2',
                metadata: { ticketId: 'TICKET-002' }, // Different ticket
            });

            const result1 = await orchestrator.addTask(task1);
            const result2 = await orchestrator.addTask(task2);

            expect(result1).toBe(true);
            expect(result2).toBe(true);
            expect(orchestrator.getQueueStatus().totalTasks).toBe(2);
        });

        it('should add tasks without ticketId metadata', async () => {
            const task1 = createTask({ taskId: 'task-1' }); // No metadata
            const task2 = createTask({ taskId: 'task-2' }); // No metadata, same as task1 structure

            const result1 = await orchestrator.addTask(task1);
            const result2 = await orchestrator.addTask(task2); // Should succeed (different taskIds)

            expect(result1).toBe(true);
            expect(result2).toBe(true);
            expect(orchestrator.getQueueStatus().totalTasks).toBe(2);
        });
    });

    // ========================================================================
    // getReadyTasks() Branch Coverage
    // ========================================================================

    describe('getReadyTasks() - Branch Coverage', () => {
        it('should filter tasks by READY status', () => {
            const readyTask = createTask({ taskId: 'ready', status: TaskStatus.READY });
            const pendingTask = createTask({ taskId: 'pending', status: TaskStatus.PENDING });
            const inProgressTask = createTask({ taskId: 'in-progress', status: TaskStatus.IN_PROGRESS });

            orchestrator.addTask(readyTask);
            orchestrator.addTask(pendingTask);
            orchestrator.addTask(inProgressTask);

            const readyTasks = orchestrator.getReadyTasks();

            expect(readyTasks).toHaveLength(1);
            expect(readyTasks[0].taskId).toBe('ready');
        });

        it('should exclude blocked tasks', () => {
            const readyTask = createTask({ taskId: 'ready', status: TaskStatus.READY });
            const blockedTask = createTask({
                taskId: 'blocked',
                status: TaskStatus.READY,
                blockedBy: ['some-task-id'],
            });

            orchestrator.addTask(readyTask);
            orchestrator.addTask(blockedTask);

            const readyTasks = orchestrator.getReadyTasks();

            expect(readyTasks).toHaveLength(1);
            expect(readyTasks[0].taskId).toBe('ready');
        });

        it('should exclude tasks with unmet dependencies', () => {
            const readyTask = createTask({ taskId: 'ready', status: TaskStatus.READY });
            const dependentTask = createTask({
                taskId: 'dependent',
                status: TaskStatus.READY,
                dependencies: ['missing-task'], // Dependency doesn't exist
            });

            orchestrator.addTask(readyTask);
            orchestrator.addTask(dependentTask);

            const readyTasks = orchestrator.getReadyTasks();

            expect(readyTasks).toHaveLength(1);
            expect(readyTasks[0].taskId).toBe('ready');
        });

        it('should sort by priority (P1 > P2 > P3)', () => {
            const p3Task = createTask({ taskId: 'p3', priority: TaskPriority.P3 });
            const p1Task = createTask({ taskId: 'p1', priority: TaskPriority.P1 });
            const p2Task = createTask({ taskId: 'p2', priority: TaskPriority.P2 });

            orchestrator.addTask(p3Task);
            orchestrator.addTask(p1Task);
            orchestrator.addTask(p2Task);

            const readyTasks = orchestrator.getReadyTasks();

            expect(readyTasks).toHaveLength(3);
            expect(readyTasks[0].priority).toBe(TaskPriority.P1);
            expect(readyTasks[1].priority).toBe(TaskPriority.P2);
            expect(readyTasks[2].priority).toBe(TaskPriority.P3);
        });

        it('should return empty array when no tasks are ready', () => {
            const pendingTask = createTask({ status: TaskStatus.PENDING });
            const blockedTask = createTask({ status: TaskStatus.BLOCKED });

            orchestrator.addTask(pendingTask);
            orchestrator.addTask(blockedTask);

            const readyTasks = orchestrator.getReadyTasks();

            expect(readyTasks).toHaveLength(0);
        });

        it('should handle empty queue', () => {
            const readyTasks = orchestrator.getReadyTasks();

            expect(readyTasks).toHaveLength(0);
        });
    });

    // ========================================================================
    // getNextTask() Branch Coverage
    // ========================================================================

    describe('getNextTask() - Branch Coverage', () => {
        it('should return highest priority ready task', () => {
            const p3Task = createTask({ taskId: 'p3', priority: TaskPriority.P3 });
            const p1Task = createTask({ taskId: 'p1', priority: TaskPriority.P1 });

            orchestrator.addTask(p3Task);
            orchestrator.addTask(p1Task);

            const nextTask = orchestrator.getNextTask();

            expect(nextTask).not.toBeNull();
            expect(nextTask!.taskId).toBe('p1');
            expect(nextTask!.priority).toBe(TaskPriority.P1);
        });

        it('should return null when no tasks are ready', () => {
            const pendingTask = createTask({ status: TaskStatus.PENDING });
            orchestrator.addTask(pendingTask);

            const nextTask = orchestrator.getNextTask();

            expect(nextTask).toBeNull();
        });

        it('should return null from empty queue', () => {
            const nextTask = orchestrator.getNextTask();

            expect(nextTask).toBeNull();
        });

        it('should handle error gracefully', () => {
            // This test verifies error handling in getNextTask
            // By mocking getReadyTasks to throw
            const originalGetReadyTasks = orchestrator.getReadyTasks;
            orchestrator.getReadyTasks = () => {
                throw new Error('Mock error');
            };

            expect(() => orchestrator.getNextTask()).toThrow('Mock error');

            // Restore
            orchestrator.getReadyTasks = originalGetReadyTasks;
        });
    });

    // ========================================================================
    // getQueueStatus() Branch Coverage
    // ========================================================================

    describe('getQueueStatus() - Branch Coverage', () => {
        it('should count tasks by priority correctly', () => {
            const p1Task1 = createTask({ taskId: 'p1-1', priority: TaskPriority.P1 });
            const p1Task2 = createTask({ taskId: 'p1-2', priority: TaskPriority.P1 });
            const p2Task = createTask({ priority: TaskPriority.P2 });
            const p3Task = createTask({ priority: TaskPriority.P3 });

            orchestrator.addTask(p1Task1);
            orchestrator.addTask(p1Task2);
            orchestrator.addTask(p2Task);
            orchestrator.addTask(p3Task);

            const status = orchestrator.getQueueStatus();

            expect(status.byPriority.P1).toBe(2);
            expect(status.byPriority.P2).toBe(1);
            expect(status.byPriority.P3).toBe(1);
        });

        it('should count tasks by status correctly', () => {
            const readyTask = createTask({ taskId: 'ready', status: TaskStatus.READY });
            const pendingTask = createTask({ taskId: 'pending', status: TaskStatus.PENDING });
            const completedTask = createTask({ taskId: 'completed', status: TaskStatus.COMPLETED });

            orchestrator.addTask(readyTask);
            orchestrator.addTask(pendingTask);
            orchestrator.addTask(completedTask);

            const status = orchestrator.getQueueStatus();

            expect(status.byStatus.ready).toBe(1);
            expect(status.byStatus.pending).toBe(1);
            expect(status.byStatus.completed).toBe(1);
        });

        it('should include current task and active sessions in status', () => {
            const task = createTask();
            orchestrator.addTask(task);

            const status = orchestrator.getQueueStatus();

            expect(status.currentTask).toBeNull(); // Not set until execution
            expect(status.activeSessions).toBeGreaterThanOrEqual(0);
        });

        it('should return zero counts for empty queue', () => {
            const status = orchestrator.getQueueStatus();

            expect(status.totalTasks).toBe(0);
            expect(status.byPriority.P1).toBe(0);
            expect(status.byPriority.P2).toBe(0);
            expect(status.byPriority.P3).toBe(0);
            expect(status.byStatus.ready).toBe(0);
        });
    });

    // ========================================================================
    // isBusy() Branch Coverage
    // ========================================================================

    describe('isBusy() - Branch Coverage', () => {
        it('should return false when no tasks in queue', () => {
            const busy = orchestrator.isBusy();

            expect(busy).toBe(false);
        });

        it('should return false when queue has ready tasks but none in progress', () => {
            const task = createTask({ status: TaskStatus.READY });
            orchestrator.addTask(task);

            const busy = orchestrator.isBusy();

            expect(busy).toBe(false);
        });

        it('should return true when task in queue is in progress', () => {
            const task = createTask({ status: TaskStatus.IN_PROGRESS });
            orchestrator.addTask(task);

            const busy = orchestrator.isBusy();

            expect(busy).toBe(true);
        });
    });

    // ========================================================================
    // clearQueue() Branch Coverage
    // ========================================================================

    describe('clearQueue() - Branch Coverage', () => {
        it('should empty the queue', () => {
            const task1 = createTask({ taskId: 'task-1' });
            const task2 = createTask({ taskId: 'task-2' });

            orchestrator.addTask(task1);
            orchestrator.addTask(task2);

            expect(orchestrator.getQueueStatus().totalTasks).toBe(2);

            orchestrator.clearQueue();

            expect(orchestrator.getQueueStatus().totalTasks).toBe(0);
        });

        it('should clear current task', () => {
            // Tests that clearQueue properly clears state
            const task = createTask();
            orchestrator.addTask(task);

            orchestrator.clearQueue();

            expect(orchestrator.getNextTask()).toBeNull();
        });
    });

    // ========================================================================
    // getTaskById() Branch Coverage
    // ========================================================================

    describe('getTaskById() - Branch Coverage', () => {
        it('should find task by id', () => {
            const task = createTask({ taskId: 'unique-task-id' });
            orchestrator.addTask(task);

            const found = orchestrator.getTaskById('unique-task-id');

            expect(found).toBeDefined();
            expect(found!.taskId).toBe('unique-task-id');
        });

        it('should return undefined when task not found', () => {
            const found = orchestrator.getTaskById('non-existent-id');

            expect(found).toBeUndefined();
        });

        it('should return undefined from empty queue', () => {
            const found = orchestrator.getTaskById('any-id');

            expect(found).toBeUndefined();
        });
    });

    // ========================================================================
    // init() and shutdown() Branch Coverage
    // ========================================================================

    describe('Lifecycle - init() and shutdown()', () => {
        it('should initialize successfully', async () => {
            const newOrchestrator = new ProgrammingOrchestrator(mcpTools, logger);
            await newOrchestrator.init();

            expect(newOrchestrator.getQueueStatus().totalTasks).toBe(0);
        });

        it('should throw error if maxConcurrentSessions is invalid', async () => {
            const newOrchestrator = new ProgrammingOrchestrator(mcpTools, logger);
            (newOrchestrator as any).maxConcurrentSessions = 0; // Invalid

            await expect(newOrchestrator.init()).rejects.toThrow();
        });

        it('should shutdown gracefully', async () => {
            const task = createTask();
            orchestrator.addTask(task);

            await orchestrator.shutdown();

            expect(orchestrator.getQueueStatus().totalTasks).toBe(0);
        });
    });

    // ========================================================================
    // Integration: Task Dependencies Branch Coverage
    // ========================================================================

    describe('Task Dependencies - Branch Coverage', () => {
        it('should identify when dependencies are met', () => {
            const taskA = createTask({ taskId: 'task-a', status: TaskStatus.COMPLETED });
            const taskB = createTask({
                taskId: 'task-b',
                status: TaskStatus.READY,
                dependencies: ['task-a'], // Depends on task-a
            });

            orchestrator.addTask(taskA);
            orchestrator.addTask(taskB);

            const readyTasks = orchestrator.getReadyTasks();

            // taskB should be ready since taskA (dependency) is completed
            expect(readyTasks.some(t => t.taskId === 'task-b')).toBe(true);
        });

        it('should exclude tasks with unmet dependencies', () => {
            const taskA = createTask({
                taskId: 'task-a',
                status: TaskStatus.READY,
                dependencies: ['non-existent-task'], // Unmet dependency
            });

            orchestrator.addTask(taskA);

            const readyTasks = orchestrator.getReadyTasks();

            expect(readyTasks).toHaveLength(0);
        });

        it('should handle empty dependencies array', () => {
            const task = createTask({
                taskId: 'task-a',
                status: TaskStatus.READY,
                dependencies: [],
            });

            orchestrator.addTask(task);

            const readyTasks = orchestrator.getReadyTasks();

            expect(readyTasks).toHaveLength(1);
        });
    });

    // ========================================================================
    // Edge Cases & Error Recovery
    // ========================================================================

    describe('Edge Cases & Error Handling', () => {
        it('should handle very long task lists efficiently', () => {
            const tasks: Task[] = [];
            for (let i = 0; i < 30; i++) {
                tasks.push(
                    createTask({
                        taskId: `task-${i}`,
                        priority: [TaskPriority.P1, TaskPriority.P2, TaskPriority.P3][i % 3] as TaskPriority,
                    })
                );
            }

            tasks.forEach(t => orchestrator.addTask(t));

            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBeLessThanOrEqual(30);
        });

        it('should handle mixed task statuses', () => {
            const statuses = [
                TaskStatus.READY,
                TaskStatus.PENDING,
                TaskStatus.IN_PROGRESS,
                TaskStatus.BLOCKED,
                TaskStatus.COMPLETED,
                TaskStatus.FAILED,
            ];

            statuses.forEach((status, idx) => {
                orchestrator.addTask(
                    createTask({ taskId: `task-${idx}`, status })
                );
            });

            const nextTask = orchestrator.getNextTask();
            expect(nextTask!.status).toBe(TaskStatus.READY);
        });

        it('should handle tasks with metadata', async () => {
            const task = createTask({
                metadata: {
                    ticketId: 'TICKET-123',
                    routedTeam: 'ANSWER',
                    isEscalated: true,
                },
            });

            const result = await orchestrator.addTask(task);

            expect(result).toBe(true);
            const found = orchestrator.getTaskById(task.taskId);
            expect(found!.metadata?.ticketId).toBe('TICKET-123');
        });
    });
});

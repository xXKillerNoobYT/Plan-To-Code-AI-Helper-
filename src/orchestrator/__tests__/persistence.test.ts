/**
 * 🧪 Tests for Task Queue Persistence
 * 
 * Verifies that tasks persist across extension reloads using workspaceState
 */

import { ProgrammingOrchestrator, TaskPriority, TaskStatus } from '../programmingOrchestrator';
import * as vscode from 'vscode';

// Mock workspace state
class MockWorkspaceState implements vscode.Memento {
    private storage = new Map<string, any>();

    keys(): readonly string[] {
        return Array.from(this.storage.keys());
    }

    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultValue: T): T;
    get<T>(key: string, defaultValue?: T): T | undefined {
        return this.storage.has(key) ? this.storage.get(key) : defaultValue;
    }

    async update(key: string, value: any): Promise<void> {
        this.storage.set(key, value);
    }

    clear(): void {
        this.storage.clear();
    }
}

describe('Task Queue Persistence', () => {
    let orchestrator: ProgrammingOrchestrator;
    let mockState: MockWorkspaceState;

    beforeEach(async () => {
        // Create new orchestrator instance
        orchestrator = new ProgrammingOrchestrator();

        // Create mock workspace state
        mockState = new MockWorkspaceState();

        // Initialize orchestrator
        await orchestrator.init();
        await orchestrator.initializeWithPersistence(mockState);
    });

    afterEach(() => {
        mockState.clear();
    });

    describe('Persistence Basics', () => {
        it('should save tasks to workspace state after addTask', async () => {
            await orchestrator.addTask({
                taskId: 'task-1',
                title: 'Test Task',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.READY,
                dependencies: [],
                metadata: { ticketId: 'TK-123' },
                fromPlanningTeam: true,
                acceptanceCriteria: ['Test'],
                estimatedHours: 1,
                blockedBy: []
            });

            // Wait for debounced save
            await new Promise(resolve => setTimeout(resolve, 300));

            const saved = mockState.get<any[]>('coe.taskQueue');
            expect(saved).toBeDefined();
            expect(saved?.length).toBe(1);
            expect(saved?.[0].taskId).toBe('task-1');
            expect(saved?.[0].metadata.ticketId).toBe('TK-123');
        });

        it('should load tasks from workspace state on initialize', async () => {
            // Pre-populate workspace state
            await mockState.update('coe.taskQueue', [
                {
                    id: 'task-1',
                    taskId: 'task-1',
                    title: 'Persisted Task',
                    description: 'Test',
                    priority: TaskPriority.P1,
                    status: TaskStatus.READY,
                    dependencies: [],
                    metadata: { ticketId: 'TK-456' }
                }
            ]);

            // Create new orchestrator instance
            const newOrchestrator = new ProgrammingOrchestrator();
            await newOrchestrator.init();
            await newOrchestrator.initializeWithPersistence(mockState);

            // Verify task was loaded
            const tasks = newOrchestrator.getAllTasks();
            expect(tasks.length).toBe(1);
            expect(tasks[0].taskId).toBe('task-1');
            expect(tasks[0].title).toBe('Persisted Task');
        });

        it('should only load active tasks (ready/inProgress/blocked)', async () => {
            await mockState.update('coe.taskQueue', [
                { id: 'task-1', taskId: 'task-1', status: TaskStatus.READY, priority: TaskPriority.P1, title: 'Ready', description: '', dependencies: [] },
                { id: 'task-2', taskId: 'task-2', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.P2, title: 'Active', description: '', dependencies: [] },
                { id: 'task-3', taskId: 'task-3', status: TaskStatus.COMPLETED, priority: TaskPriority.P3, title: 'Done', description: '', dependencies: [] },
                { id: 'task-4', taskId: 'task-4', status: TaskStatus.BLOCKED, priority: TaskPriority.P1, title: 'Blocked', description: '', dependencies: [] },
                { id: 'task-5', taskId: 'task-5', status: TaskStatus.FAILED, priority: TaskPriority.P2, title: 'Failed', description: '', dependencies: [] }
            ]);

            const newOrchestrator = new ProgrammingOrchestrator();
            await newOrchestrator.init();
            await newOrchestrator.initializeWithPersistence(mockState);

            const tasks = newOrchestrator.getAllTasks();
            expect(tasks.length).toBe(3); // ready, inProgress, blocked only
            expect(tasks.some(t => t.status === TaskStatus.COMPLETED)).toBe(false);
            expect(tasks.some(t => t.status === TaskStatus.FAILED)).toBe(false);
        });
    });

    describe('Duplicate Prevention', () => {
        it('should prevent duplicate tasks for same ticketId', async () => {
            const task1 = {
                taskId: 'task-1',
                title: 'Task from TK-123',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.READY,
                dependencies: [],
                metadata: { ticketId: 'TK-123' },
                fromPlanningTeam: true,
                acceptanceCriteria: ['Test'],
                estimatedHours: 1,
                blockedBy: []
            };

            const task2 = {
                taskId: 'task-2',
                title: 'Duplicate of TK-123',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.READY,
                dependencies: [],
                metadata: { ticketId: 'TK-123' },
                fromPlanningTeam: true,
                acceptanceCriteria: ['Test'],
                estimatedHours: 1,
                blockedBy: []
            };

            await orchestrator.addTask(task1);
            await orchestrator.addTask(task2); // Should be skipped

            const tasks = orchestrator.getAllTasks();
            expect(tasks.length).toBe(1);
            expect(tasks[0].taskId).toBe('task-1');
        });

        it('should allow tasks without ticketId', async () => {
            await orchestrator.addTask({
                taskId: 'task-1',
                title: 'Manual Task 1',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.READY,
                dependencies: [],
                metadata: {},
                fromPlanningTeam: true,
                acceptanceCriteria: ['Test'],
                estimatedHours: 1,
                blockedBy: []
            });

            await orchestrator.addTask({
                taskId: 'task-2',
                title: 'Manual Task 2',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.READY,
                dependencies: [],
                metadata: {},
                fromPlanningTeam: true,
                acceptanceCriteria: ['Test'],
                estimatedHours: 1,
                blockedBy: []
            });

            expect(orchestrator.getAllTasks().length).toBe(2);
        });

        it('should correctly identify duplicates with hasTaskForTicket', async () => {
            await orchestrator.addTask({
                taskId: 'task-TK-999',
                title: 'Task from ticket',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                metadata: { ticketId: 'TK-999' },
                fromPlanningTeam: true,
                acceptanceCriteria: ['Test'],
                estimatedHours: 1,
                blockedBy: []
            });

            const hasDuplicate = await orchestrator.hasTaskForTicket('TK-999');
            expect(hasDuplicate).toBe(true);

            const noMatch = await orchestrator.hasTaskForTicket('TK-000');
            expect(noMatch).toBe(false);
        });
    });

    describe('Status Bar Integration', () => {
        it('should provide accurate ready count', async () => {
            await orchestrator.addTask({
                taskId: 'task-1',
                title: 'Ready Task',
                description: 'Test',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                metadata: {},
                fromPlanningTeam: true,
                acceptanceCriteria: ['Test'],
                estimatedHours: 1,
                blockedBy: []
            });

            await orchestrator.addTask({
                taskId: 'task-2',
                title: 'In Progress Task',
                description: 'Test',
                priority: TaskPriority.P2,
                status: TaskStatus.IN_PROGRESS,
                dependencies: [],
                metadata: {},
                fromPlanningTeam: true,
                acceptanceCriteria: ['Test'],
                estimatedHours: 1,
                blockedBy: []
            });

            expect(orchestrator.getReadyTasksCount()).toBe(1);
            expect(orchestrator.getInProgressTasksCount()).toBe(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle corrupted storage gracefully', async () => {
            // Corrupt storage with invalid data
            await mockState.update('coe.taskQueue', 'invalid-json-data');

            const newOrchestrator = new ProgrammingOrchestrator();
            await newOrchestrator.init();
            await newOrchestrator.initializeWithPersistence(mockState);

            // Should start with empty queue (no crash)
            expect(newOrchestrator.getAllTasks().length).toBe(0);
        });

        it('should handle missing storage gracefully', async () => {
            const newOrchestrator = new ProgrammingOrchestrator();
            await newOrchestrator.init();
            await newOrchestrator.initializeWithPersistence(mockState);

            expect(newOrchestrator.getAllTasks().length).toBe(0);
        });
    });
});

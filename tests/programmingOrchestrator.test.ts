/**
 * 🧪 Programming Orchestrator Tests
 * 
 * Tests for task persistence, date conversion, and duplicate detection.
 */

import { ProgrammingOrchestrator, Task, TaskPriority, TaskStatus } from '../src/orchestrator/programmingOrchestrator';

describe('ProgrammingOrchestrator', () => {
    let mockContext: any;
    let orchestrator: ProgrammingOrchestrator;

    beforeEach(() => {
        // Create mock workspace state
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

    afterEach(() => {
        // No cleanup needed - mockContext is recreated each test
    });

    describe('Task Persistence - Date Conversion', () => {
        it('should convert valid ISO date strings to Date objects on load', async () => {
            const testDate = new Date('2026-01-27T10:00:00.000Z');

            // Manually set persisted tasks with string dates
            await mockContext.workspaceState.update('coe.taskQueue', [{
                taskId: 'test-task-001',
                title: 'Test Task with ISO Date',
                description: 'Testing date conversion',
                priority: 'P2',
                status: 'ready',
                dependencies: [],
                blockedBy: [],
                estimatedHours: 2,
                acceptanceCriteria: ['Should load correctly'],
                createdAt: testDate.toISOString(), // String format (as stored)
                metadata: {
                    ticketId: 'ticket-001'
                }
            }]);

            // Initialize with persistence
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            // Get loaded tasks
            const tasks = orchestrator.getAllTasks();

            expect(tasks.length).toBe(1);
            expect(tasks[0].createdAt).toBeInstanceOf(Date);
            expect(tasks[0].createdAt).toBeDefined();
            expect(tasks[0].createdAt!.getTime()).toBe(testDate.getTime());
        });

        it('should handle invalid date strings and fallback to current date', async () => {
            // Spy on console.warn to check if warning is logged
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

            // Manually set persisted tasks with invalid date
            await mockContext.workspaceState.update('coe.taskQueue', [{
                taskId: 'test-task-002',
                title: 'Test Task with Invalid Date',
                description: 'Testing invalid date handling',
                priority: 'P1',
                status: 'ready',
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Should convert to Date'],
                createdAt: 'not-a-valid-date-string', // Invalid date
                metadata: {}
            }]);

            const beforeLoad = Date.now();
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);
            const afterLoad = Date.now();

            const tasks = orchestrator.getAllTasks();

            expect(tasks.length).toBe(1);
            expect(tasks[0].createdAt).toBeInstanceOf(Date);
            expect(tasks[0].createdAt).toBeDefined();

            // Check that date is within test execution time range (fallback to new Date())
            const createdTime = tasks[0].createdAt!.getTime();
            expect(createdTime).toBeGreaterThanOrEqual(beforeLoad);
            expect(createdTime).toBeLessThanOrEqual(afterLoad);

            // Verify warning was logged
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Invalid date for task')
            );

            consoleWarnSpy.mockRestore();
        });

        it('should handle missing createdAt field', async () => {
            await mockContext.workspaceState.update('coe.taskQueue', [{
                taskId: 'test-task-003',
                title: 'Test Task without createdAt',
                description: 'Testing missing date field',
                priority: 'P3',
                status: 'ready',
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Should add Date'],
                // createdAt is missing
                metadata: {}
            }]);

            const beforeLoad = Date.now();
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);
            const afterLoad = Date.now();

            const tasks = orchestrator.getAllTasks();

            expect(tasks.length).toBe(1);
            expect(tasks[0].createdAt).toBeInstanceOf(Date);
            expect(tasks[0].createdAt).toBeDefined();

            const createdTime = tasks[0].createdAt!.getTime();
            expect(createdTime).toBeGreaterThanOrEqual(beforeLoad);
            expect(createdTime).toBeLessThanOrEqual(afterLoad);
        });

        it('should log conversion summary after loading tasks', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            await mockContext.workspaceState.update('coe.taskQueue', [{
                taskId: 'test-task-004',
                title: 'Test Task 1',
                description: 'Test',
                priority: 'P2',
                status: 'ready',
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test'],
                createdAt: new Date().toISOString(),
                metadata: {}
            }]);

            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringMatching(/Loaded and converted .* tasks with Date objects/)
            );

            consoleLogSpy.mockRestore();
        });
    });

    describe('Duplicate Detection', () => {
        beforeEach(async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);
        });

        it('should prevent duplicate tasks by exact ticketId match', async () => {
            const task1: Task = {
                taskId: 'task-001',
                title: 'Original Task',
                description: 'First task',
                priority: TaskPriority.P2,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 2,
                acceptanceCriteria: ['Test 1'],
                fromPlanningTeam: true,
                createdAt: new Date(),
                metadata: {
                    ticketId: 'ticket-duplicate-001'
                }
            };

            const task2: Task = {
                taskId: 'task-002',
                title: 'Different Title',
                description: 'Different description',
                priority: TaskPriority.P1, // Different priority
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test 2'],
                fromPlanningTeam: true,
                createdAt: new Date(),
                metadata: {
                    ticketId: 'ticket-duplicate-001' // Same ticketId!
                }
            };

            await orchestrator.addTask(task1);
            const beforeCount = orchestrator.getAllTasks().length;

            await orchestrator.addTask(task2); // Should be skipped
            const afterCount = orchestrator.getAllTasks().length;

            expect(afterCount).toBe(beforeCount);
            expect(afterCount).toBe(1);
        });

        it('should prevent duplicates by title+priority fallback when ticketId differs', async () => {
            const task1: Task = {
                taskId: 'task-003',
                title: 'Same Title Task',
                description: 'First task',
                priority: TaskPriority.P2,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 2,
                acceptanceCriteria: ['Test 1'],
                fromPlanningTeam: true,
                createdAt: new Date(),
                metadata: {
                    ticketId: 'ticket-003a'
                }
            };

            const task2: Task = {
                taskId: 'task-004',
                title: 'Same Title Task', // Same title
                description: 'Different description',
                priority: TaskPriority.P2, // Same priority
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 3,
                acceptanceCriteria: ['Test 2'],
                fromPlanningTeam: true,
                createdAt: new Date(),
                metadata: {
                    ticketId: 'ticket-003b' // Different ticketId
                }
            };

            await orchestrator.addTask(task1);
            const beforeCount = orchestrator.getAllTasks().length;

            await orchestrator.addTask(task2); // Should be skipped due to title+priority match
            const afterCount = orchestrator.getAllTasks().length;

            expect(afterCount).toBe(beforeCount);
            expect(afterCount).toBe(1);
        });

        it('should allow tasks with same title but different priority', async () => {
            const task1: Task = {
                taskId: 'task-005',
                title: 'Shared Title',
                description: 'Task 1',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 2,
                acceptanceCriteria: ['Test 1'],
                fromPlanningTeam: true,
                createdAt: new Date(),
                metadata: {
                    ticketId: 'ticket-005a'
                }
            };

            const task2: Task = {
                taskId: 'task-006',
                title: 'Shared Title', // Same title
                description: 'Task 2',
                priority: TaskPriority.P2, // Different priority
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 1,
                acceptanceCriteria: ['Test 2'],
                fromPlanningTeam: true,
                createdAt: new Date(),
                metadata: {
                    ticketId: 'ticket-005b' // Different ticketId
                }
            };

            await orchestrator.addTask(task1);
            const beforeCount = orchestrator.getAllTasks().length;

            await orchestrator.addTask(task2); // Should be allowed (different priority)
            const afterCount = orchestrator.getAllTasks().length;

            expect(afterCount).toBe(beforeCount + 1);
            expect(afterCount).toBe(2);
        });

        it('should handle hasTaskForTicket when queue is empty', async () => {
            const newOrchestrator = new ProgrammingOrchestrator();
            // Queue is initialized but empty

            // Should not error, should return false
            const result = await newOrchestrator.hasTaskForTicket('any-ticket-id');

            expect(result).toBe(false);
        });
    });

    describe('Task Persistence Across Reloads', () => {
        it('should persist and reload tasks correctly', async () => {
            // Initialize first orchestrator
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const originalTask: Task = {
                taskId: 'test-persist-001',
                title: 'Persistable Task',
                description: 'This task should survive reload',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 3,
                acceptanceCriteria: ['Should persist'],
                fromPlanningTeam: true,
                createdAt: new Date('2026-01-27T12:00:00.000Z'),
                metadata: {
                    ticketId: 'ticket-persist-001',
                    routedTeam: 'ANSWER'
                }
            };

            await orchestrator.addTask(originalTask);

            // Wait for debounced save to complete
            await new Promise(resolve => setTimeout(resolve, 300));

            // Create new orchestrator instance (simulating reload)
            const reloadedOrchestrator = new ProgrammingOrchestrator();
            await reloadedOrchestrator.initializeWithPersistence(mockContext.workspaceState);

            const loadedTasks = reloadedOrchestrator.getAllTasks();

            expect(loadedTasks.length).toBe(1);
            expect(loadedTasks[0].taskId).toBe(originalTask.taskId);
            expect(loadedTasks[0].title).toBe(originalTask.title);
            expect(loadedTasks[0].priority).toBe(originalTask.priority);
            expect(loadedTasks[0].createdAt).toBeInstanceOf(Date);
            expect(loadedTasks[0].metadata?.ticketId).toBe(originalTask.metadata?.ticketId);
        });

        it('should handle empty storage gracefully', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const tasks = orchestrator.getAllTasks();
            expect(tasks.length).toBe(0);

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringMatching(/No persisted tasks found|starting fresh/i)
            );

            consoleLogSpy.mockRestore();
        });

        it('should handle corrupted storage data', async () => {
            // Set invalid data in storage
            await mockContext.workspaceState.update('coe.taskQueue', 'not-an-array');

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            await orchestrator.initializeWithPersistence(mockContext.workspaceState);

            const tasks = orchestrator.getAllTasks();
            expect(tasks.length).toBe(0); // Should start fresh

            consoleLogSpy.mockRestore();
        });
    });

    describe('Queue Management', () => {
        beforeEach(async () => {
            await orchestrator.initializeWithPersistence(mockContext.workspaceState);
        });

        it('should maintain max 50 tasks limit', async () => {
            const tasks: Task[] = [];

            // Create 55 tasks
            for (let i = 0; i < 55; i++) {
                tasks.push({
                    taskId: `task-${i}`,
                    title: `Task ${i}`,
                    description: `Description ${i}`,
                    priority: TaskPriority.P2,
                    status: i < 10 ? TaskStatus.COMPLETED : TaskStatus.READY,
                    dependencies: [],
                    blockedBy: [],
                    estimatedHours: 1,
                    acceptanceCriteria: ['Test'],
                    fromPlanningTeam: true,
                    createdAt: new Date(),
                    metadata: {
                        ticketId: `ticket-${i}`
                    }
                });
            }

            // Add all tasks
            for (const task of tasks) {
                await orchestrator.addTask(task);
            }

            // Wait for save
            await new Promise(resolve => setTimeout(resolve, 300));

            const allTasks = orchestrator.getAllTasks();

            // Should not exceed 50 tasks
            expect(allTasks.length).toBeLessThanOrEqual(50);
        });
    });
});

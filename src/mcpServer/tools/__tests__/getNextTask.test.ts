/**
 * Tests for getNextTask MCP Tool
 * Validates task retrieval, filtering, priority sorting, and prompt generation
 */

import { getNextTask, GetNextTaskRequest } from '../getNextTask';
import { Task, TaskQueue } from '../../../tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../protocol';

describe('getNextTask MCP Tool', () => {
    let taskQueue: TaskQueue;

    beforeEach(() => {
        taskQueue = new TaskQueue();
    });

    // ========================================================================
    // Helper Functions
    // ========================================================================

    function createTestTask(
        overrides: Partial<Task> = {}
    ): Task {
        return {
            taskId: `task-${Date.now()}-${Math.random()}`,
            title: 'Test Task',
            description: 'Test task description',
            priority: 'medium',
            status: 'ready',
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }

    // ========================================================================
    // Basic Functionality
    // ========================================================================

    describe('Basic Functionality', () => {
        it('should return null when queue is empty', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.task).toBeNull();
            expect(result.queueLength).toBe(0);
            expect(result.nextTasksPreview).toEqual([]);
        });

        it('should return highest priority task when available', async () => {
            const lowPriorityTask = createTestTask({
                taskId: 'task-1',
                title: 'Low Priority',
                priority: 'low',
                status: 'ready',
            });
            const highPriorityTask = createTestTask({
                taskId: 'task-2',
                title: 'High Priority',
                priority: 'high',
                status: 'ready',
            });

            taskQueue.addTask(lowPriorityTask);
            taskQueue.addTask(highPriorityTask);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.taskId).toBe('task-2');
            expect(result.task?.priority).toBe('high');
        });

        it('should exclude done tasks by default', async () => {
            const doneTask = createTestTask({
                taskId: 'task-1',
                status: 'done',
            });
            const readyTask = createTestTask({
                taskId: 'task-2',
                status: 'ready',
            });

            taskQueue.addTask(doneTask);
            taskQueue.addTask(readyTask);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.taskId).toBe('task-2');
            expect(result.queueLength).toBe(1); // Only ready task counted
        });

        it('should exclude blocked tasks by default', async () => {
            const blockedTask = createTestTask({
                taskId: 'task-1',
                status: 'blocked',
            });
            const readyTask = createTestTask({
                taskId: 'task-2',
                status: 'ready',
            });

            taskQueue.addTask(blockedTask);
            taskQueue.addTask(readyTask);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.taskId).toBe('task-2');
            expect(result.queueLength).toBe(1);
        });
    });

    // ========================================================================
    // Priority Ordering
    // ========================================================================

    describe('Priority Ordering', () => {
        it('should prioritize critical over high', async () => {
            const highTask = createTestTask({
                taskId: 'task-1',
                priority: 'high',
                createdAt: new Date('2024-01-01'),
            });
            const criticalTask = createTestTask({
                taskId: 'task-2',
                priority: 'critical',
                createdAt: new Date('2024-01-02'),
            });

            taskQueue.addTask(highTask);
            taskQueue.addTask(criticalTask);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.taskId).toBe('task-2');
            expect(result.task?.priority).toBe('critical');
        });

        it('should prioritize high over medium', async () => {
            const mediumTask = createTestTask({
                taskId: 'task-1',
                priority: 'medium',
            });
            const highTask = createTestTask({
                taskId: 'task-2',
                priority: 'high',
            });

            taskQueue.addTask(mediumTask);
            taskQueue.addTask(highTask);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.priority).toBe('high');
        });

        it('should prioritize medium over low', async () => {
            const lowTask = createTestTask({
                taskId: 'task-1',
                priority: 'low',
            });
            const mediumTask = createTestTask({
                taskId: 'task-2',
                priority: 'medium',
            });

            taskQueue.addTask(lowTask);
            taskQueue.addTask(mediumTask);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.priority).toBe('medium');
        });

        it('should use creation date as tie-breaker for same priority', async () => {
            const newerTask = createTestTask({
                taskId: 'task-1',
                priority: 'high',
                createdAt: new Date('2024-01-02'),
            });
            const olderTask = createTestTask({
                taskId: 'task-2',
                priority: 'high',
                createdAt: new Date('2024-01-01'), // Created earlier
            });

            taskQueue.addTask(newerTask);
            taskQueue.addTask(olderTask);

            const result = await getNextTask({}, taskQueue);

            // Older task should come first
            expect(result.task?.taskId).toBe('task-2');
        });
    });

    // ========================================================================
    // Filtering
    // ========================================================================

    describe('Filtering', () => {
        it('should filter by status: ready', async () => {
            const pendingTask = createTestTask({
                taskId: 'task-1',
                status: 'pending',
            });
            const inProgressTask = createTestTask({
                taskId: 'task-2',
                status: 'in-progress',
            });
            const readyTask = createTestTask({
                taskId: 'task-3',
                status: 'ready',
            });

            taskQueue.addTask(pendingTask);
            taskQueue.addTask(inProgressTask);
            taskQueue.addTask(readyTask);

            const result = await getNextTask({ filter: 'ready' }, taskQueue);

            expect(result.queueLength).toBe(2); // pending + ready
            expect(['task-1', 'task-3']).toContain(result.task?.taskId);
        });

        it('should filter by status: blocked', async () => {
            const blockedTask = createTestTask({
                taskId: 'task-1',
                status: 'blocked',
            });
            const readyTask = createTestTask({
                taskId: 'task-2',
                status: 'ready',
            });

            taskQueue.addTask(blockedTask);
            taskQueue.addTask(readyTask);

            const result = await getNextTask({ filter: 'blocked' }, taskQueue);

            expect(result.task?.taskId).toBe('task-1');
            expect(result.queueLength).toBe(1);
        });

        it('should filter by status: all', async () => {
            const doneTask = createTestTask({ status: 'done' });
            const blockedTask = createTestTask({ status: 'blocked' });
            const readyTask = createTestTask({ status: 'ready' });

            taskQueue.addTask(doneTask);
            taskQueue.addTask(blockedTask);
            taskQueue.addTask(readyTask);

            const result = await getNextTask({ filter: 'all' }, taskQueue);

            expect(result.queueLength).toBe(3); // All tasks included
        });

        it('should filter by priority', async () => {
            const highTask = createTestTask({
                taskId: 'task-1',
                priority: 'high',
            });
            const mediumTask = createTestTask({
                taskId: 'task-2',
                priority: 'medium',
            });

            taskQueue.addTask(highTask);
            taskQueue.addTask(mediumTask);

            const result = await getNextTask({ priority: 'medium' }, taskQueue);

            expect(result.task?.taskId).toBe('task-2');
            expect(result.task?.priority).toBe('medium');
            expect(result.queueLength).toBe(1);
        });

        it('should combine status and priority filters', async () => {
            const highReadyTask = createTestTask({
                taskId: 'task-1',
                priority: 'high',
                status: 'ready',
            });
            const highBlockedTask = createTestTask({
                taskId: 'task-2',
                priority: 'high',
                status: 'blocked',
            });
            const mediumReadyTask = createTestTask({
                taskId: 'task-3',
                priority: 'medium',
                status: 'ready',
            });

            taskQueue.addTask(highReadyTask);
            taskQueue.addTask(highBlockedTask);
            taskQueue.addTask(mediumReadyTask);

            const result = await getNextTask({
                filter: 'ready',
                priority: 'high',
            }, taskQueue);

            expect(result.task?.taskId).toBe('task-1');
            expect(result.queueLength).toBe(1);
        });
    });

    // ========================================================================
    // Super-Detailed Prompt
    // ========================================================================

    describe('Super-Detailed Prompt', () => {
        it('should include super-detailed prompt by default', async () => {
            const task = createTestTask({
                description: 'Implement complex feature',
            });
            taskQueue.addTask(task);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.superDetailedPrompt).toBeDefined();
            expect(result.task?.superDetailedPrompt?.description).toBe('Implement complex feature');
            expect(result.task?.superDetailedPrompt?.context).toContain('COE project');
            expect(result.task?.superDetailedPrompt?.requirements).toBeInstanceOf(Array);
            expect(result.task?.superDetailedPrompt?.acceptanceCriteria).toBeInstanceOf(Array);
        });

        it('should exclude super-detailed prompt when includeDetailedPrompt is false', async () => {
            const task = createTestTask();
            taskQueue.addTask(task);

            const result = await getNextTask({
                includeDetailedPrompt: false,
            }, taskQueue);

            expect(result.task?.superDetailedPrompt).toBeUndefined();
        });

        it('should set complexity level based on description keywords', async () => {
            const complexTask = createTestTask({
                description: 'This is a complex task',
            });
            taskQueue.addTask(complexTask);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.superDetailedPrompt?.complexityLevel).toBe('hard');
        });

        it('should include design references in prompt', async () => {
            const task = createTestTask();
            taskQueue.addTask(task);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.superDetailedPrompt?.designReferences).toBeDefined();
            expect(result.task?.superDetailedPrompt?.designReferences?.fromPlan).toBeTruthy();
            expect(result.task?.superDetailedPrompt?.designReferences?.accessibilityNotes).toBeTruthy();
        });

        it('should include file contexts in prompt', async () => {
            const task = createTestTask();
            taskQueue.addTask(task);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.superDetailedPrompt?.files).toBeDefined();
            expect(result.task?.superDetailedPrompt?.files?.readFrom).toBeInstanceOf(Array);
            expect(result.task?.superDetailedPrompt?.files?.writeTo).toBeInstanceOf(Array);
        });
    });

    // ========================================================================
    // Plan Reference
    // ========================================================================

    describe('Plan Reference', () => {
        it('should include plan reference by default', async () => {
            const task = createTestTask();
            taskQueue.addTask(task);

            const result = await getNextTask({}, taskQueue);

            expect(result.task?.planReference).toBeDefined();
            expect(result.task?.planReference?.planId).toBeTruthy();
            expect(result.task?.planReference?.version).toBeTruthy();
        });

        it('should exclude plan reference when includeContext is false', async () => {
            const task = createTestTask();
            taskQueue.addTask(task);

            const result = await getNextTask({
                includeContext: false,
            }, taskQueue);

            expect(result.task?.planReference).toBeUndefined();
        });
    });

    // ========================================================================
    // Next Tasks Preview
    // ========================================================================

    describe('Next Tasks Preview', () => {
        it('should include preview of next 3 tasks', async () => {
            for (let i = 1; i <= 5; i++) {
                taskQueue.addTask(createTestTask({
                    taskId: `task-${i}`,
                    title: `Task ${i}`,
                    priority: 'medium',
                }));
            }

            const result = await getNextTask({}, taskQueue);

            expect(result.nextTasksPreview).toHaveLength(3);
            expect(result.nextTasksPreview[0]).toHaveProperty('id');
            expect(result.nextTasksPreview[0]).toHaveProperty('title');
            expect(result.nextTasksPreview[0]).toHaveProperty('priority');
        });

        it('should include fewer tasks if queue has <4 tasks', async () => {
            taskQueue.addTask(createTestTask({ taskId: 'task-1' }));
            taskQueue.addTask(createTestTask({ taskId: 'task-2' }));

            const result = await getNextTask({}, taskQueue);

            expect(result.nextTasksPreview).toHaveLength(1); // Only 1 task after current
        });

        it('should be empty when only 1 task in queue', async () => {
            taskQueue.addTask(createTestTask());

            const result = await getNextTask({}, taskQueue);

            expect(result.nextTasksPreview).toEqual([]);
        });
    });

    // ========================================================================
    // Validation
    // ========================================================================

    describe('Parameter Validation', () => {
        it('should throw MCPProtocolError for invalid filter value', async () => {
            await expect(
                getNextTask({ filter: 'invalid' }, taskQueue)
            ).rejects.toThrow(MCPProtocolError);

            try {
                await getNextTask({ filter: 'invalid' }, taskQueue);
            } catch (error) {
                expect((error as MCPProtocolError).code).toBe(MCPErrorCode.INVALID_PARAMS);
            }
        });

        it('should throw MCPProtocolError for invalid priority value', async () => {
            await expect(
                getNextTask({ priority: 'super-high' }, taskQueue)
            ).rejects.toThrow(MCPProtocolError);
        });

        it('should accept valid filter values', async () => {
            await expect(getNextTask({ filter: 'ready' }, taskQueue)).resolves.toBeDefined();
            await expect(getNextTask({ filter: 'blocked' }, taskQueue)).resolves.toBeDefined();
            await expect(getNextTask({ filter: 'all' }, taskQueue)).resolves.toBeDefined();
        });

        it('should accept valid priority values', async () => {
            await expect(getNextTask({ priority: 'critical' }, taskQueue)).resolves.toBeDefined();
            await expect(getNextTask({ priority: 'high' }, taskQueue)).resolves.toBeDefined();
            await expect(getNextTask({ priority: 'medium' }, taskQueue)).resolves.toBeDefined();
            await expect(getNextTask({ priority: 'low' }, taskQueue)).resolves.toBeDefined();
        });
    });

    // ========================================================================
    // Queue Length
    // ========================================================================

    describe('Queue Length', () => {
        it('should return accurate queue length with filters', async () => {
            taskQueue.addTask(createTestTask({ status: 'ready' }));
            taskQueue.addTask(createTestTask({ status: 'ready' }));
            taskQueue.addTask(createTestTask({ status: 'done' }));
            taskQueue.addTask(createTestTask({ status: 'blocked' }));

            const result = await getNextTask({ filter: 'ready' }, taskQueue);

            expect(result.queueLength).toBe(2); // Only ready tasks
        });

        it('should return 0 queue length when no tasks match filters', async () => {
            taskQueue.addTask(createTestTask({ priority: 'low' }));

            const result = await getNextTask({ priority: 'critical' }, taskQueue);

            expect(result.queueLength).toBe(0);
            expect(result.task).toBeNull();
        });
    });
});

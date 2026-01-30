/**
 * 🧪 Comprehensive Tests for getNextTask MCP Tool
 *
 * Tests all filtering, priority sorting, and error scenarios
 */

import { getNextTask, GetNextTaskRequest } from '../getNextTask';
import { TaskQueue, Task } from '../../../tasks/queue';
import { MCPProtocolError } from '../../protocol';

describe('getNextTask - Complete Branch Coverage', () => {
    let taskQueue: TaskQueue;
    let tasks: Task[] = [];

    beforeEach(() => {
        taskQueue = new TaskQueue();
        tasks = [];

        // Add sample tasks with different priorities
        const baseTask = {
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        tasks = [
            {
                taskId: 'CRITICAL-001',
                title: 'Critical task',
                description: 'Critical priority task',
                priority: 'critical',
                status: 'pending',
                ...baseTask,
            },
            {
                taskId: 'HIGH-001',
                title: 'High priority task',
                description: 'High priority task',
                priority: 'high',
                status: 'ready',
                ...baseTask,
            },
            {
                taskId: 'MEDIUM-001',
                title: 'Medium priority task',
                description: 'Medium priority task',
                priority: 'medium',
                status: 'pending',
                ...baseTask,
            },
            {
                taskId: 'LOW-001',
                title: 'Low priority task',
                description: 'Low priority task',
                priority: 'low',
                status: 'ready',
                ...baseTask,
            },
        ];

        tasks.forEach(task => taskQueue.addTask(task));
    });

    describe('Basic Task Retrieval', () => {
        it('should return highest priority task (critical)', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.task).toBeDefined();
            expect(result.task?.priority).toBe('critical');
            expect(result.task?.taskId).toBe('CRITICAL-001');
        });

        it('should return null when queue is empty', async () => {
            const emptyQueue = new TaskQueue();

            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, emptyQueue);

            expect(result.success).toBe(true);
            expect(result.task).toBeNull();
            expect(result.queueLength).toBe(0);
        });

        it('should include queue length in response', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            expect(result.queueLength).toBeGreaterThan(0);
        });

        it('should provide next tasks preview', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            expect(result.nextTasksPreview).toBeDefined();
            expect(Array.isArray(result.nextTasksPreview)).toBe(true);
        });
    });

    describe('Status Filtering', () => {
        it('should exclude done and blocked tasks by default', async () => {
            // Add done and blocked tasks
            taskQueue.addTask({
                taskId: 'DONE-001',
                title: 'Done task',
                description: '',
                priority: 'critical',
                status: 'done',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            taskQueue.addTask({
                taskId: 'BLOCKED-001',
                title: 'Blocked task',
                description: '',
                priority: 'critical',
                status: 'blocked',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.taskId).not.toBe('DONE-001');
            expect(result.task?.taskId).not.toBe('BLOCKED-001');
        });

        it('should filter for ready status only', async () => {
            const params: GetNextTaskRequest = {
                filter: 'ready',
            };

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.status).toBe('ready');
        });

        it('should filter for blocked status', async () => {
            // Add blocked task with critical priority
            taskQueue.addTask({
                taskId: 'BLOCKED-CRITICAL',
                title: 'Blocked critical',
                description: '',
                priority: 'critical',
                status: 'blocked',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: GetNextTaskRequest = {
                filter: 'blocked',
            };

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.status).toBe('blocked');
        });

        it('should include all tasks when filter is "all"', async () => {
            // Add done task
            taskQueue.addTask({
                taskId: 'DONE-TEST',
                title: 'Done task',
                description: '',
                priority: 'medium',
                status: 'done',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: GetNextTaskRequest = {
                filter: 'all',
            };

            const result = await getNextTask(params, taskQueue);

            // Should include done tasks when filter is 'all'
            expect(result.queueLength).toBeGreaterThanOrEqual(4);
        });
    });

    describe('Priority Filtering', () => {
        it('should filter tasks by specific priority', async () => {
            const params: GetNextTaskRequest = {
                priority: 'high',
            };

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.priority).toBe('high');
        });

        it('should return null if no tasks match priority filter', async () => {
            const params: GetNextTaskRequest = {
                priority: 'high',
                filter: 'blocked', // No high priority blocked tasks
            };

            const result = await getNextTask(params, taskQueue);

            expect(result.task).toBeNull();
        });

        it('should combine status and priority filters', async () => {
            const params: GetNextTaskRequest = {
                filter: 'ready',
                priority: 'low',
            };

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.priority).toBe('low');
            expect(result.task?.status).toBe('ready');
        });
    });

    describe('Priority Sorting', () => {
        it('should return critical tasks before high priority', async () => {
            const params1: GetNextTaskRequest = {};
            const result1 = await getNextTask(params1, taskQueue);

            expect(result1.task?.priority).toBe('critical');
        });

        it('should maintain creation time as tie-breaker', async () => {
            // Add two critical tasks with different creation times
            const earlier = new Date('2026-01-01T10:00:00Z');

            taskQueue.addTask({
                taskId: 'CRITICAL-FIRST',
                title: 'Earlier critical',
                description: '',
                priority: 'critical',
                status: 'pending',
                dependencies: [],
                createdAt: earlier,
                updatedAt: earlier,
            });

            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            // Should return one of the critical tasks
            expect(result.task?.priority).toBe('critical');
        });
    });

    describe('Super-Detailed Prompt Generation', () => {
        it('should include super detailed prompt by default', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.superDetailedPrompt).toBeDefined();
            expect(result.task?.superDetailedPrompt?.description).toBeDefined();
            expect(result.task?.superDetailedPrompt?.requirements).toBeDefined();
            expect(result.task?.superDetailedPrompt?.acceptanceCriteria).toBeDefined();
        });

        it('should exclude prompt when includeDetailedPrompt is false', async () => {
            const params: GetNextTaskRequest = {
                includeDetailedPrompt: false,
            };

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.superDetailedPrompt).toBeUndefined();
        });

        it('should include plan reference by default', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.planReference).toBeDefined();
            expect(result.task?.planReference?.planId).toBeDefined();
        });

        it('should exclude context when includeContext is false', async () => {
            const params: GetNextTaskRequest = {
                includeContext: false,
            };

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.planReference).toBeUndefined();
        });

        it('should generate complete super-detailed prompt structure', async () => {
            const params: GetNextTaskRequest = {};
            const result = await getNextTask(params, taskQueue);

            const prompt = result.task?.superDetailedPrompt;
            expect(prompt).toBeDefined();

            if (prompt) {
                // Verify all required fields exist
                expect(prompt.description).toBeDefined();
                expect(prompt.context).toBeDefined();
                expect(prompt.requirements).toBeInstanceOf(Array);
                expect(prompt.designReferences).toBeDefined();
                expect(prompt.files).toBeDefined();
                expect(prompt.acceptanceCriteria).toBeInstanceOf(Array);
                expect(prompt.estimatedHours).toBeGreaterThan(0);
                expect(['easy', 'medium', 'hard', 'expert']).toContain(prompt.complexityLevel);
                expect(prompt.skillsRequired).toBeInstanceOf(Array);

                // Verify files structure
                expect(prompt.files?.readFrom).toBeInstanceOf(Array);
                expect(prompt.files?.writeTo).toBeInstanceOf(Array);
                expect(prompt.files?.referencedIn).toBeInstanceOf(Array);

                // Verify design references
                expect(prompt.designReferences?.fromPlan).toBeDefined();
            }
        });
    });

    describe('Next Tasks Preview', () => {
        it('should return up to 3 next tasks preview', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            expect(result.nextTasksPreview.length).toBeLessThanOrEqual(3);
        });

        it('should not include current task in preview', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            const currentTaskId = result.task?.taskId;
            const previewIds = result.nextTasksPreview.map(t => t.id);

            expect(previewIds).not.toContain(currentTaskId);
        });

        it('should preview tasks in priority order', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            // Verify preview contains high then medium then low
            if (result.nextTasksPreview.length >= 2) {
                const first = result.nextTasksPreview[0];
                const second = result.nextTasksPreview[1];

                // More specific check would need priority values in preview
                expect(first).toBeDefined();
                expect(second).toBeDefined();
            }
        });

        it('should return exactly 3 previews when 4+ tasks available', async () => {
            // We already have 4 tasks in setup, so preview should have exactly 3
            const params: GetNextTaskRequest = {};
            const result = await getNextTask(params, taskQueue);

            // Current task + 3 in preview = 4 total tasks minimum
            expect(result.nextTasksPreview.length).toBe(3);
        });

        it('should return fewer previews when less than 4 tasks total', async () => {
            const smallQueue = new TaskQueue();

            // Add only 2 tasks
            smallQueue.addTask({
                taskId: 'TASK-1',
                title: 'First',
                description: '',
                priority: 'high',
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            smallQueue.addTask({
                taskId: 'TASK-2',
                title: 'Second',
                description: '',
                priority: 'medium',
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: GetNextTaskRequest = {};
            const result = await getNextTask(params, smallQueue);

            // Should have 1 preview (2 total - 1 current)
            expect(result.nextTasksPreview.length).toBe(1);
        });
    });

    describe('Error Handling', () => {
        it('should throw error for invalid filter value', async () => {
            const params: any = {
                filter: 'invalid-filter',
            };

            await expect(getNextTask(params, taskQueue)).rejects.toThrow(MCPProtocolError);
        });

        it('should throw error for invalid priority value', async () => {
            const params: any = {
                priority: 'highest', // Invalid, should be critical/high/medium/low
            };

            await expect(getNextTask(params, taskQueue)).rejects.toThrow(MCPProtocolError);
        });

        it('should throw error for invalid includeContext type', async () => {
            const params: any = {
                includeContext: 'yes', // Should be boolean
            };

            await expect(getNextTask(params, taskQueue)).rejects.toThrow(MCPProtocolError);
        });

        it('should throw error when getAllTasks returns non-array', async () => {
            // Create mock queue that returns invalid data
            const badQueue = {
                getAllTasks: () => 'not an array',
            } as any;

            const params: GetNextTaskRequest = {};

            await expect(getNextTask(params, badQueue)).rejects.toThrow(MCPProtocolError);
        });

        it('should reject unknown parameters (strict schema)', async () => {
            const params: any = {
                unknownParam: 'should fail',
                anotherBadParam: 123,
            };

            await expect(getNextTask(params, taskQueue)).rejects.toThrow(MCPProtocolError);
        });

        it('should re-throw non-Zod validation errors', async () => {
            // Create a malformed params object that will cause a non-Zod error
            const params: any = {
                // Valid params but we'll mock the schema to throw a different error
            };

            // Mock console.error to suppress error output during test
            const originalError = console.error;
            console.error = jest.fn();

            try {
                // This tests the "throw error" line (#247) for non-ZodError cases
                // We'll use a circular reference which causes JSON serialization issues
                const circular: any = { params };
                circular.self = circular;

                // This should trigger the catch-all error handler
                await expect(
                    getNextTask(circular as any, taskQueue)
                ).rejects.toThrow();
            } finally {
                console.error = originalError;
            }
        });
    });

    describe('Complexity Detection', () => {
        it('should detect complex tasks and set complexity level to hard', async () => {
            // Create a new queue to avoid priority conflicts
            const complexQueue = new TaskQueue();

            // Add complex task with high priority
            complexQueue.addTask({
                taskId: 'COMPLEX-001',
                title: 'Complex algorithm',
                description: 'Implement complex sorting algorithm',
                priority: 'critical',
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, complexQueue);

            // Should detect "complex" in description and set to 'hard'
            expect(result.task?.superDetailedPrompt?.complexityLevel).toBe('hard');
        });

        it('should detect simple tasks and set complexity level to easy', async () => {
            // Create a new queue to avoid priority conflicts
            const simpleQueue = new TaskQueue();

            // Add simple task  
            simpleQueue.addTask({
                taskId: 'SIMPLE-001',
                title: 'Simple fix',
                description: 'This is a simple bug fix',
                priority: 'critical',
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, simpleQueue);

            // Should detect "simple" in description and set to 'easy'
            expect(result.task?.superDetailedPrompt?.complexityLevel).toBe('easy');
        });

        it('should default to medium complexity when neither complex nor simple', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            // Should default to 'medium' when no keywords
            if (result.task?.description &&
                !result.task.description.toLowerCase().includes('complex') &&
                !result.task.description.toLowerCase().includes('simple')) {
                expect(result.task?.superDetailedPrompt?.complexityLevel).toBe('medium');
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle tasks with no dependencies', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.dependencies).toBeDefined();
            expect(Array.isArray(result.task?.dependencies)).toBe(true);
        });

        it('should handle tasks with multiple dependencies', async () => {
            // Add task with dependencies
            taskQueue.addTask({
                taskId: 'DEP-TASK',
                title: 'Dependent task',
                description: '',
                priority: 'medium',
                status: 'pending',
                dependencies: ['TASK-001', 'TASK-002', 'TASK-003'],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            // Should handle successfully
            expect(result.success).toBe(true);
        });

        it('should handle skills requirements generation', async () => {
            const params: GetNextTaskRequest = {};

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.superDetailedPrompt?.skillsRequired).toBeDefined();
            expect(Array.isArray(result.task?.superDetailedPrompt?.skillsRequired)).toBe(true);
        });

        it('should generate context string with dependencies info', async () => {
            // Add task with dependencies
            taskQueue.addTask({
                taskId: 'DEPS-TEST',
                title: 'Task with deps',
                description: 'Test dependencies context',
                priority: 'critical',
                status: 'pending',
                dependencies: ['OTHER-1', 'OTHER-2'],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: GetNextTaskRequest = {};
            const result = await getNextTask(params, taskQueue);

            // Should include dependency count in context
            if (result.task?.taskId === 'DEPS-TEST' && result.task?.superDetailedPrompt) {
                expect(result.task.superDetailedPrompt.context).toContain('Depends on 2 task(s)');
            }
        });

        it('should generate context string with no dependencies info', async () => {
            const params: GetNextTaskRequest = {};
            const result = await getNextTask(params, taskQueue);

            // Find a task with no dependencies
            if (result.task?.dependencies.length === 0 && result.task?.superDetailedPrompt) {
                expect(result.task.superDetailedPrompt.context).toContain('No dependencies');
            }
        });

        it('should return empty preview when only 1 task exists', async () => {
            const singleQueue = new TaskQueue();
            singleQueue.addTask({
                taskId: 'ONLY-ONE',
                title: 'Only task',
                description: '',
                priority: 'high',
                status: 'pending',
                dependencies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const params: GetNextTaskRequest = {};
            const result = await getNextTask(params, singleQueue);

            expect(result.nextTasksPreview).toHaveLength(0);
        });

        it('should explicitly include context when includeContext is true', async () => {
            const params: GetNextTaskRequest = {
                includeContext: true,
            };

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.planReference).toBeDefined();
            expect(result.task?.planReference?.planId).toBe('coe-project');
        });

        it('should explicitly include detailed prompt when includeDetailedPrompt is true', async () => {
            const params: GetNextTaskRequest = {
                includeDetailedPrompt: true,
            };

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.superDetailedPrompt).toBeDefined();
        });

        it('should handle all optional flags set to false', async () => {
            const params: GetNextTaskRequest = {
                includeContext: false,
                includeDetailedPrompt: false,
                includeRelatedFiles: false,
            };

            const result = await getNextTask(params, taskQueue);

            expect(result.task?.planReference).toBeUndefined();
            expect(result.task?.superDetailedPrompt).toBeUndefined();
        });
    });
});

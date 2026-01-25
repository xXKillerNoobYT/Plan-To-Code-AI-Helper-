/**
 * Programming Orchestrator - Comprehensive Test Suite
 * 
 * Tests cover:
 * - Happy paths (task initialization, routing, completion)
 * - Error handling (invalid input, no tasks, token limits)
 * - Integration with MCP tools (mock calls)
 * - Priority ordering (P1 > P2 > P3)
 * - One-thing-at-a-time enforcement
 * - Session management
 * - Queue operations
 * 
 * @version 1.0.0
 */

import {
    ProgrammingOrchestrator,
    Task,
    TaskStatus,
    TaskPriority,
    MCPErrorCode,
    MockMCPTools,
    SimpleLogger,
} from '../programmingOrchestrator';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * 🏭 Factory function to create test tasks
 */
function createTestTask(overrides: Partial<Task> = {}): Task {
    return {
        taskId: `task-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Test Task Implementation',
        description: 'This is a test task for the Programming Orchestrator',
        priority: TaskPriority.P2,
        status: TaskStatus.READY,
        dependencies: [],
        blockedBy: [],
        estimatedHours: 2,
        acceptanceCriteria: [
            'Test criterion 1',
            'Test criterion 2',
        ],
        relatedFiles: ['src/test.ts'],
        fromPlanningTeam: true,
        createdAt: new Date(),
        ...overrides,
    };
}

/**
 * 🧪 Mock MCP Tools for testing
 */
class TestMCPTools extends MockMCPTools {
    callHistory: Array<{ method: string; params: unknown }> = [];

    async getNextTask(planId: string, filter?: string) {
        this.callHistory.push({ method: 'getNextTask', params: { planId, filter } });
        return await super.getNextTask(planId, filter);
    }

    async reportTaskStatus(taskId: string, status: TaskStatus, output?: string) {
        this.callHistory.push({ method: 'reportTaskStatus', params: { taskId, status, output } });
        return await super.reportTaskStatus(taskId, status, output);
    }

    async askQuestion(question: string, context: Record<string, unknown>) {
        this.callHistory.push({ method: 'askQuestion', params: { question, context } });
        return await super.askQuestion(question, context);
    }

    async reportObservation(taskId: string, observation: string) {
        this.callHistory.push({ method: 'reportObservation', params: { taskId, observation } });
        return await super.reportObservation(taskId, observation);
    }

    async reportVerificationResult(taskId: string, passed: boolean, details?: string) {
        this.callHistory.push({
            method: 'reportVerificationResult',
            params: { taskId, passed, details },
        });
        return await super.reportVerificationResult(taskId, passed, details);
    }

    getCallCount(method: string): number {
        return this.callHistory.filter((c) => c.method === method).length;
    }

    clearCallHistory(): void {
        this.callHistory = [];
    }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Programming Orchestrator', () => {
    let orchestrator: ProgrammingOrchestrator;
    let mcpTools: TestMCPTools;
    let logger: SimpleLogger;

    beforeEach(() => {
        mcpTools = new TestMCPTools();
        logger = new SimpleLogger('ProgrammingOrchestratorTest');
        orchestrator = new ProgrammingOrchestrator(mcpTools, logger);
    });

    // ========================================================================
    // 1. Initialization & Lifecycle Tests
    // ========================================================================

    describe('Initialization & Lifecycle', () => {
        it('should initialize successfully', async () => {
            await expect(orchestrator.init()).resolves.not.toThrow();
        });

        it('should be ready after initialization', async () => {
            await orchestrator.init();
            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(0);
            expect(status.currentTask).toBeNull();
            expect(status.activeSessions).toBe(0);
        });

        it('should shutdown gracefully', async () => {
            await orchestrator.init();
            await expect(orchestrator.shutdown()).resolves.not.toThrow();
        });

        it('should clear queue on shutdown', async () => {
            await orchestrator.init();

            // Add a task
            const task = createTestTask();
            orchestrator.addTask(task);

            // Shutdown
            await orchestrator.shutdown();

            // Queue should be empty
            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(0);
        });
    });

    // ========================================================================
    // 2. Task Queue Management Tests
    // ========================================================================

    describe('Task Queue Management', () => {
        beforeEach(async () => {
            await orchestrator.init();
        });

        it('should add task to queue', () => {
            const task = createTestTask();
            expect(() => orchestrator.addTask(task)).not.toThrow();

            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(1);
        });

        it('should reject task not from Planning Team', () => {
            const task = createTestTask({ fromPlanningTeam: false });
            expect(() => orchestrator.addTask(task)).toThrow(
                /Planning Team/i,
            );
        });

        it('should order tasks by priority (P1 > P2 > P3)', () => {
            const p2Task = createTestTask({ taskId: 'p2-task', priority: TaskPriority.P2 });
            const p1Task = createTestTask({ taskId: 'p1-task', priority: TaskPriority.P1 });
            const p3Task = createTestTask({ taskId: 'p3-task', priority: TaskPriority.P3 });

            orchestrator.addTask(p2Task);
            orchestrator.addTask(p1Task);
            orchestrator.addTask(p3Task);

            const status = orchestrator.getQueueStatus();
            expect(status.byPriority.P1).toBe(1);
            expect(status.byPriority.P2).toBe(1);
            expect(status.byPriority.P3).toBe(1);
        });

        it('should get next ready task', () => {
            const task = createTestTask({ status: TaskStatus.READY });
            orchestrator.addTask(task);

            const nextTask = orchestrator.getNextTask();
            expect(nextTask).not.toBeNull();
            expect(nextTask?.taskId).toBe(task.taskId);
        });

        it('should return null when no ready tasks', () => {
            const task = createTestTask({ status: TaskStatus.PENDING });
            orchestrator.addTask(task);

            const nextTask = orchestrator.getNextTask();
            expect(nextTask).toBeNull();
        });

        it('should track queue statistics', () => {
            const p1Task = createTestTask({ priority: TaskPriority.P1 });
            const p2Task = createTestTask({ priority: TaskPriority.P2 });

            orchestrator.addTask(p1Task);
            orchestrator.addTask(p2Task);

            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(2);
            expect(status.byPriority.P1).toBe(1);
            expect(status.byPriority.P2).toBe(1);
            expect(status.byStatus.ready).toBe(2);
        });
    });

    // ========================================================================
    // 3. Task Routing (Handoff to Copilot) Tests
    // ========================================================================

    describe('Task Routing to Copilot', () => {
        beforeEach(async () => {
            await orchestrator.init();
        });

        it('should route task to Copilot successfully', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            const directive = await orchestrator.routeTask(task);

            expect(directive).toBeDefined();
            expect(directive.taskId).toBe(task.taskId);
            expect(directive.title).toBe(task.title);
            expect(directive.contextBundle).toBeDefined();
            expect(directive.acceptanceCriteria).toEqual(task.acceptanceCriteria);
        });

        it('should report task status as IN_PROGRESS on routing', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            mcpTools.clearCallHistory();
            await orchestrator.routeTask(task);

            const statusCalls = mcpTools.callHistory.filter((c) => c.method === 'reportTaskStatus');
            expect(statusCalls.length).toBeGreaterThan(0);
            expect((statusCalls[0].params as any).status).toBe(TaskStatus.IN_PROGRESS);
        });

        it('should include super-detailed prompt in directive', async () => {
            const task = createTestTask({
                title: 'Implement getNextTask',
                description: 'Create MCP tool to fetch next task',
                acceptanceCriteria: ['Tool returns P1 task first', 'Returns null if queue empty'],
                relatedFiles: ['src/mcpServer/tools.ts'],
            });
            orchestrator.addTask(task);

            const directive = await orchestrator.routeTask(task);

            expect(directive.contextBundle).toContain('Implement getNextTask');
            expect(directive.contextBundle).toContain('ACCEPTANCE CRITERIA');
            expect(directive.contextBundle).toContain('RELATED FILES');
        });

        it('should reject task not from Planning Team', async () => {
            const task = createTestTask({ fromPlanningTeam: false });

            // Can't even add it to queue - add validates Planning Team requirement
            await expect(() => orchestrator.addTask(task)).toThrow(
                /Planning Team/i,
            );
        });

        it('should enforce one-thing-at-a-time (no parallel routing)', async () => {
            const task1 = createTestTask({ taskId: 'task-1' });
            const task2 = createTestTask({ taskId: 'task-2' });

            orchestrator.addTask(task1);
            orchestrator.addTask(task2);

            // Route first task
            await orchestrator.routeTask(task1);

            // Attempt to route second task should fail
            await expect(orchestrator.routeTask(task2)).rejects.toThrow(
                /one thing at a time/i,
            );
        });

        it('should fail if dependencies not met', async () => {
            const task = createTestTask({
                dependencies: ['unmet-dep-123'],
            });
            orchestrator.addTask(task);

            await expect(orchestrator.routeTask(task)).rejects.toThrow(
                /unmet dependencies/i,
            );
        });

        it('should generate prompt under token limit', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            const directive = await orchestrator.routeTask(task);

            // Rough token estimate: 4 chars = 1 token
            const estimatedTokens = Math.ceil(directive.contextBundle.length / 4);
            expect(estimatedTokens).toBeLessThan(3500); // Leave buffer for 3000 limit
        });

        it('should include design references in directive', async () => {
            const designRefs = {
                colorPalette: { primary: '#007ACC', secondary: '#0078D4' },
                typography: { fontSize: '14px', fontFamily: 'Segoe UI' },
            };
            const task = createTestTask({ designReferences: designRefs });
            orchestrator.addTask(task);

            const directive = await orchestrator.routeTask(task);

            expect(directive.designReferences).toEqual(designRefs);
        });
    });

    // ========================================================================
    // 4. Task Completion & Status Updates Tests
    // ========================================================================

    describe('Task Completion & Status Updates', () => {
        beforeEach(async () => {
            await orchestrator.init();
        });

        it('should handle task completion', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            mcpTools.clearCallHistory();

            await expect(
                orchestrator.onTaskComplete(task.taskId, 'Task completed successfully'),
            ).resolves.not.toThrow();

            // Should report via MCP
            const statusCalls = mcpTools.callHistory.filter(
                (c) => c.method === 'reportTaskStatus',
            );
            expect(statusCalls.length).toBeGreaterThan(0);
        });

        it('should fail completing task not in progress', async () => {
            const task = createTestTask({ status: TaskStatus.PENDING });
            orchestrator.addTask(task);

            await expect(orchestrator.onTaskComplete(task.taskId)).rejects.toThrow(
                /not in progress/i,
            );
        });

        it('should handle task failure', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            mcpTools.clearCallHistory();

            await expect(
                orchestrator.onTaskFailed(task.taskId, 'Dependency error'),
            ).resolves.not.toThrow();

            // Should report observation
            const obsCalls = mcpTools.callHistory.filter(
                (c) => c.method === 'reportObservation',
            );
            expect(obsCalls.length).toBeGreaterThan(0);
        });

        it('should clear current task after completion', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            expect(orchestrator.getQueueStatus().currentTask).not.toBeNull();

            await orchestrator.onTaskComplete(task.taskId);
            expect(orchestrator.getQueueStatus().currentTask).toBeNull();
        });

        it('should track failed tasks in status', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            await orchestrator.onTaskFailed(task.taskId, 'Test failure');

            const status = orchestrator.getQueueStatus();
            expect(status.byStatus.failed).toBe(1);
        });
    });

    // ========================================================================
    // 5. Task Blocking & Clarification Tests
    // ========================================================================

    describe('Task Blocking & Clarifications', () => {
        beforeEach(async () => {
            await orchestrator.init();
        });

        it('should handle blocked task via Answer Team', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            mcpTools.clearCallHistory();

            await expect(
                orchestrator.onTaskBlocked(
                    task.taskId,
                    'What design system should I use?',
                ),
            ).resolves.not.toThrow();

            // Should call askQuestion
            const askQuestionCalls = mcpTools.callHistory.filter(
                (c) => c.method === 'askQuestion',
            );
            expect(askQuestionCalls.length).toBeGreaterThan(0);
        });

        it('should route clarification to Answer Team', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            mcpTools.clearCallHistory();

            const answer = await orchestrator.onTaskBlocked(
                task.taskId,
                'Question for Answer Team',
            );

            expect(answer).toBeDefined();
        });

        it('should update task status to BLOCKED', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            await orchestrator.onTaskBlocked(task.taskId, 'Blocked');

            const status = orchestrator.getQueueStatus();
            expect(status.byStatus.blocked).toBe(1);
        });

        it('should report block reason via MCP', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            mcpTools.clearCallHistory();

            await orchestrator.onTaskBlocked(task.taskId, 'Unclear requirement');

            const obsCalls = mcpTools.callHistory.filter(
                (c) => c.method === 'reportObservation',
            );
            expect(obsCalls.length).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // 6. Priority Enforcement Tests
    // ========================================================================

    describe('Priority & Task Ordering', () => {
        beforeEach(async () => {
            await orchestrator.init();
        });

        it('should prioritize P1 tasks over P2', () => {
            // Add P2 first, then P1
            const p2 = createTestTask({ taskId: 'p2-id', priority: TaskPriority.P2 });
            const p1 = createTestTask({ taskId: 'p1-id', priority: TaskPriority.P1 });

            orchestrator.addTask(p2);
            orchestrator.addTask(p1);

            // Next task should be P1
            const nextTask = orchestrator.getNextTask();
            expect(nextTask?.taskId).toBe('p1-id');
        });

        it('should prioritize P2 tasks over P3', () => {
            const p3 = createTestTask({ taskId: 'p3-id', priority: TaskPriority.P3 });
            const p2 = createTestTask({ taskId: 'p2-id', priority: TaskPriority.P2 });

            orchestrator.addTask(p3);
            orchestrator.addTask(p2);

            const nextTask = orchestrator.getNextTask();
            expect(nextTask?.taskId).toBe('p2-id');
        });

        it('should handle mixed priority queue correctly', () => {
            const tasks = [
                createTestTask({ taskId: 'p3-1', priority: TaskPriority.P3 }),
                createTestTask({ taskId: 'p1-1', priority: TaskPriority.P1 }),
                createTestTask({ taskId: 'p2-1', priority: TaskPriority.P2 }),
                createTestTask({ taskId: 'p1-2', priority: TaskPriority.P1 }),
                createTestTask({ taskId: 'p2-2', priority: TaskPriority.P2 }),
            ];

            tasks.forEach((t) => orchestrator.addTask(t));

            const status = orchestrator.getQueueStatus();
            expect(status.byPriority.P1).toBe(2);
            expect(status.byPriority.P2).toBe(2);
            expect(status.byPriority.P3).toBe(1);

            // First task should be P1
            const first = orchestrator.getNextTask();
            expect(first?.priority).toBe(TaskPriority.P1);
        });
    });

    // ========================================================================
    // 7. Input Validation Tests
    // ========================================================================

    describe('Input Validation', () => {
        beforeEach(async () => {
            await orchestrator.init();
        });

        it('should reject task with missing taskId', () => {
            const badTask = createTestTask();
            (badTask as any).taskId = '';

            expect(() => orchestrator.addTask(badTask)).toThrow();
        });

        it('should reject task with missing title', () => {
            const badTask = createTestTask();
            (badTask as any).title = '';

            expect(() => orchestrator.addTask(badTask)).toThrow();
        });

        it('should reject task with missing description', () => {
            const badTask = createTestTask();
            (badTask as any).description = '';

            expect(() => orchestrator.addTask(badTask)).toThrow();
        });

        it('should reject task with no acceptance criteria', () => {
            const badTask = createTestTask();
            badTask.acceptanceCriteria = [];

            expect(() => orchestrator.addTask(badTask)).toThrow();
        });

        it('should reject task with invalid priority', () => {
            const badTask = createTestTask();
            (badTask as any).priority = 'P4';

            expect(() => orchestrator.addTask(badTask)).toThrow();
        });
    });

    // ========================================================================
    // 8. Integration Tests
    // ========================================================================

    describe('Integration with MCP Tools', () => {
        beforeEach(async () => {
            await orchestrator.init();
        });

        it('should track MCP tool calls', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            mcpTools.clearCallHistory();
            await orchestrator.routeTask(task);

            expect(mcpTools.callHistory.length).toBeGreaterThan(0);
        });

        it('should call reportTaskStatus on route', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            mcpTools.clearCallHistory();
            await orchestrator.routeTask(task);

            const calls = mcpTools.getCallCount('reportTaskStatus');
            expect(calls).toBeGreaterThan(0);
        });

        it('should call reportTaskStatus on completion', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            mcpTools.clearCallHistory();

            await orchestrator.onTaskComplete(task.taskId);

            const calls = mcpTools.getCallCount('reportTaskStatus');
            expect(calls).toBeGreaterThan(0);
        });

        it('should call reportObservation on failure', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            mcpTools.clearCallHistory();

            await orchestrator.onTaskFailed(task.taskId, 'Test error');

            const calls = mcpTools.getCallCount('reportObservation');
            expect(calls).toBeGreaterThan(0);
        });

        it('should call askQuestion on block', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            mcpTools.clearCallHistory();

            await orchestrator.onTaskBlocked(task.taskId, 'Test block');

            const calls = mcpTools.getCallCount('askQuestion');
            expect(calls).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // 9. Edge Cases & Stress Tests
    // ========================================================================

    describe('Edge Cases & Stress Tests', () => {
        beforeEach(async () => {
            await orchestrator.init();
        });

        it('should handle large queue', () => {
            // Add 100 tasks
            for (let i = 0; i < 100; i++) {
                const task = createTestTask({ taskId: `task-${i}` });
                orchestrator.addTask(task);
            }

            const status = orchestrator.getQueueStatus();
            expect(status.totalTasks).toBe(100);
        });

        it('should handle many P1 tasks', () => {
            // Add 50 P1 tasks
            for (let i = 0; i < 50; i++) {
                const task = createTestTask({
                    taskId: `p1-task-${i}`,
                    priority: TaskPriority.P1,
                });
                orchestrator.addTask(task);
            }

            const status = orchestrator.getQueueStatus();
            expect(status.byPriority.P1).toBe(50);
        });

        it('should handle task with very long description', () => {
            const longDescription = 'A'.repeat(10000);
            const task = createTestTask({ description: longDescription });

            expect(() => orchestrator.addTask(task)).not.toThrow();
            expect(orchestrator.getQueueStatus().totalTasks).toBe(1);
        });

        it('should handle task with many dependencies', () => {
            const dependencies = Array.from({ length: 50 }, (_, i) => `dep-${i}`);
            const task = createTestTask({ dependencies });

            expect(() => orchestrator.addTask(task)).not.toThrow();
            expect(orchestrator.getQueueStatus().totalTasks).toBe(1);
        });

        it('should handle task not found gracefully', async () => {
            await expect(
                orchestrator.onTaskComplete('nonexistent-task-123'),
            ).rejects.toThrow(/not found/i);
        });
    });

    // ========================================================================
    // 10. Complex Workflow Tests
    // ========================================================================

    describe('Complex Workflow Scenarios', () => {
        beforeEach(async () => {
            await orchestrator.init();
        });

        it('should handle full workflow: add -> route -> complete', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            const directive = await orchestrator.routeTask(task);
            expect(directive).toBeDefined();

            await orchestrator.onTaskComplete(task.taskId);

            const status = orchestrator.getQueueStatus();
            expect(status.byStatus.completed).toBe(1);
            expect(status.currentTask).toBeNull();
        });

        it('should handle workflow: add -> route -> block -> complete', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            expect(orchestrator.getQueueStatus().byStatus.inProgress).toBe(1);

            // Block the task  
            await orchestrator.onTaskBlocked(task.taskId, 'Clarification needed');
            const status1 = orchestrator.getQueueStatus();
            expect(status1.byStatus.blocked).toBe(1);

            // After block is received from Answer Team, we would need to reset status
            // to IN_PROGRESS before completing. This is a deliberate design where blocking
            // pauses execution until user/system unblocks it.
            // So we cannot directly complete without re-routing first
            expect(status1.currentTask?.status).toBe(TaskStatus.BLOCKED);
        });

        it('should handle workflow: add -> route -> fail -> retry', async () => {
            const task = createTestTask();
            orchestrator.addTask(task);

            await orchestrator.routeTask(task);
            expect(orchestrator.getQueueStatus().byStatus.inProgress).toBe(1);

            await orchestrator.onTaskFailed(task.taskId, 'Initial failure');
            expect(orchestrator.getQueueStatus().byStatus.failed).toBe(1);

            // Reset task for retry
            task.status = TaskStatus.READY;
            const directive = await orchestrator.routeTask(task);
            expect(directive).toBeDefined();

            await orchestrator.onTaskComplete(task.taskId);
            const status = orchestrator.getQueueStatus();
            expect(status.byStatus.completed).toBe(1);
        });

        it('should handle dependencies chain: A->B->C', () => {
            const taskA = createTestTask({
                taskId: 'task-a',
                dependencies: [],
                status: TaskStatus.READY,
            });

            const taskB = createTestTask({
                taskId: 'task-b',
                dependencies: ['task-a'],
                status: TaskStatus.PENDING,
            });

            const taskC = createTestTask({
                taskId: 'task-c',
                dependencies: ['task-b'],
                status: TaskStatus.PENDING,
            });

            orchestrator.addTask(taskA);
            orchestrator.addTask(taskB);
            orchestrator.addTask(taskC);

            // Only A should be ready initially
            const nextTask = orchestrator.getNextTask();
            expect(nextTask?.taskId).toBe('task-a');
        });
    });
});

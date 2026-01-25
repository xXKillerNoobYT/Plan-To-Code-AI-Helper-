/**
 * Tests for reportObservation MCP Tool
 * Validates observation logging and task creation
 */

import { reportObservation, ReportObservationRequest } from '../reportObservation';
import { Task, TaskQueue } from '../../../tasks/queue';
import { MCPProtocolError, MCPErrorCode } from '../../protocol';

describe('reportObservation MCP Tool', () => {
    let taskQueue: TaskQueue;
    let testTask: Task;

    beforeEach(() => {
        taskQueue = new TaskQueue();
        testTask = {
            taskId: 'TASK-001',
            title: 'Test Task',
            description: 'Test',
            priority: 'medium',
            status: 'in-progress',
            dependencies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        taskQueue.addTask(testTask);
    });

    describe('Basic Functionality', () => {
        it('should log observation', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Found better approach',
                type: 'discovery',
                severity: 'medium',
            };

            const result = await reportObservation(params, taskQueue);

            expect(result.success).toBe(true);
            expect(result.observation).toBe('Found better approach');
            expect(result.status).toBe('logged');
        });

        it('should generate observation ID', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Test observation',
                type: 'discovery',
                severity: 'low',
            };

            const result = await reportObservation(params, taskQueue);

            expect(result.observationId).toBeDefined();
            expect(result.observationId).toContain('OBS-');
        });
    });

    describe('Observation Types', () => {
        it('should handle discovery type', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Found optimized algorithm',
                type: 'discovery',
                severity: 'medium',
            };

            const result = await reportObservation(params, taskQueue);
            expect(result.type).toBe('discovery');
        });

        it('should handle issue type', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Memory leak detected',
                type: 'issue',
                severity: 'high',
            };

            const result = await reportObservation(params, taskQueue);
            expect(result.type).toBe('issue');
        });

        it('should handle improvement type', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Can refactor for better readability',
                type: 'improvement',
                severity: 'low',
            };

            const result = await reportObservation(params, taskQueue);
            expect(result.type).toBe('improvement');
        });

        it('should handle architecture-concern type', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Circular dependency detected',
                type: 'architecture-concern',
                severity: 'high',
            };

            const result = await reportObservation(params, taskQueue);
            expect(result.type).toBe('architecture-concern');
        });
    });

    describe('Task Creation', () => {
        it('should create new task when requested', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Need to refactor',
                type: 'improvement',
                severity: 'medium',
                createNewTask: true,
                newTaskDetails: {
                    title: 'Refactor component',
                    priority: 'medium',
                    estimatedHours: 2,
                },
            };

            const result = await reportObservation(params, taskQueue);

            expect(result.newTaskCreated).toBeDefined();
            expect(result.status).toBe('task-created');
            expect(result.newTaskCreated?.title).toBe('Refactor component');
        });

        it('should add task to queue', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Need fix',
                type: 'issue',
                severity: 'high',
                createNewTask: true,
                newTaskDetails: {
                    title: 'Fix issue',
                    priority: 'high',
                    estimatedHours: 1,
                },
            };

            await reportObservation(params, taskQueue);

            const tasks = taskQueue.getAllTasks();
            const newTask = tasks.find(t => t.title === 'Fix issue');
            expect(newTask).toBeDefined();
        });

        it('should prioritize critical tasks immediately', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Critical bug',
                type: 'issue',
                severity: 'critical',
                createNewTask: true,
                newTaskDetails: {
                    title: 'Fix critical bug',
                    priority: 'critical',
                    estimatedHours: 0.5,
                },
            };

            const result = await reportObservation(params, taskQueue);

            expect(result.newTaskCreated?.position).toContain('immediate');
        });

        it('should not create task when createNewTask is false', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Observation',
                type: 'discovery',
                severity: 'low',
                createNewTask: false,
            };

            const result = await reportObservation(params, taskQueue);

            expect(result.newTaskCreated).toBeUndefined();
            expect(result.status).toBe('logged');
        });
    });

    describe('Dashboard Alerts', () => {
        it('should create alert for critical severity', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Critical finding',
                type: 'issue',
                severity: 'critical',
            };

            const result = await reportObservation(params, taskQueue);

            expect(result.dashboardAlert).toBeDefined();
            expect(result.dashboardAlert?.visible).toBe(true);
        });

        it('should create alert for high severity', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'High priority issue',
                type: 'issue',
                severity: 'high',
            };

            const result = await reportObservation(params, taskQueue);

            expect(result.dashboardAlert).toBeDefined();
        });

        it('should create alert for architecture concerns', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Design issue',
                type: 'architecture-concern',
                severity: 'medium',
            };

            const result = await reportObservation(params, taskQueue);

            expect(result.dashboardAlert).toBeDefined();
            expect(result.dashboardAlert?.message).toContain('Architecture');
        });

        it('should not create alert for low severity', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Minor improvement',
                type: 'improvement',
                severity: 'low',
            };

            const result = await reportObservation(params, taskQueue);

            expect(result.dashboardAlert).toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        it('should throw error for non-existent task', async () => {
            const params: ReportObservationRequest = {
                taskId: 'NONEXISTENT',
                observation: 'Test',
                type: 'discovery',
                severity: 'low',
            };

            await expect(reportObservation(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should throw error for empty observation', async () => {
            const params = {
                taskId: 'TASK-001',
                observation: '',
                type: 'discovery',
                severity: 'low',
            };

            await expect(reportObservation(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should throw error for invalid type', async () => {
            const params = {
                taskId: 'TASK-001',
                observation: 'Test',
                type: 'invalid-type',
                severity: 'low',
            };

            await expect(reportObservation(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });

        it('should throw error for invalid severity', async () => {
            const params = {
                taskId: 'TASK-001',
                observation: 'Test',
                type: 'discovery',
                severity: 'invalid',
            };

            await expect(reportObservation(params, taskQueue))
                .rejects.toThrow(MCPProtocolError);
        });
    });

    describe('Optional Fields', () => {
        it('should handle observation with details', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Performance issue',
                type: 'issue',
                severity: 'medium',
                details: {
                    what: 'Slow rendering',
                    why: 'Too many re-renders',
                    impact: 'User experience degraded',
                    suggestedAction: 'Use React.memo',
                },
            };

            const result = await reportObservation(params, taskQueue);
            expect(result.success).toBe(true);
        });

        it('should handle observation with related task', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Related to previous work',
                type: 'discovery',
                severity: 'low',
                relatedToTask: 'TASK-000',
            };

            const result = await reportObservation(params, taskQueue);
            expect(result.success).toBe(true);
        });

        it('should handle observation with files and references', async () => {
            const params: ReportObservationRequest = {
                taskId: 'TASK-001',
                observation: 'Documentation needed',
                type: 'improvement',
                severity: 'low',
                attachedFiles: ['src/component.ts', 'README.md'],
                references: ['https://docs.example.com'],
            };

            const result = await reportObservation(params, taskQueue);
            expect(result.success).toBe(true);
        });
    });
});

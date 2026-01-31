/**
 * 🧪 Planning Stub Tests
 * 
 * Comprehensive test suite for planningStub.ts
 * Tests: plan file loading, parsing, creation, and validation
 */

import * as vscode from 'vscode';
import {
    loadTasksFromPlanFile,
    isValidTask,
} from '../../src/plans/planningStub';
import {
    Task,
    TaskPriority,
    TaskStatus,
} from '../../src/orchestrator/programmingOrchestrator';

// Mock vscode module
jest.mock('vscode');

describe('Planning Stub - Plan File Loading & Parsing', () => {
    // Setup & teardown
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================================
    // Test Suite 1: parseTasksFromMarkdown (via loadTasksFromPlanFile)
    // ============================================================================

    describe('parseTasksFromMarkdown: Basic parsing', () => {
        it('should parse simple task with P1 priority', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = '- [ ] Build user registration endpoint #P1\n';
            const encoder = new TextEncoder();

            // Mock vscode.workspace.fs.stat to indicate file exists
            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});

            // Mock vscode.workspace.fs.readFile
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toHaveLength(1);
            expect(tasks[0].title).toBe('Build user registration endpoint');
            expect(tasks[0].priority).toBe(TaskPriority.P1);
            expect(tasks[0].status).toBe(TaskStatus.READY);
        });

        it('should parse task with P2 priority', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = '- [ ] Add task list display component #P2\n';
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toHaveLength(1);
            expect(tasks[0].title).toBe('Add task list display component');
            expect(tasks[0].priority).toBe(TaskPriority.P2);
        });

        it('should parse task with P3 priority', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = '- [ ] Write README with project overview #P3\n';
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toHaveLength(1);
            expect(tasks[0].title).toBe('Write README with project overview');
            expect(tasks[0].priority).toBe(TaskPriority.P3);
        });

        it('should default to P3 priority when not specified', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = '- [ ] Some task without priority\n';
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toHaveLength(1);
            expect(tasks[0].priority).toBe(TaskPriority.P3);
        });

        it('should parse multiple tasks from single file', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = `- [ ] Task one #P1
- [ ] Task two #P2
- [ ] Task three #P3
- [ ] Task four
`;
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toHaveLength(4);
            expect(tasks[0].title).toBe('Task one');
            expect(tasks[0].priority).toBe(TaskPriority.P1);
            expect(tasks[1].title).toBe('Task two');
            expect(tasks[1].priority).toBe(TaskPriority.P2);
            expect(tasks[2].title).toBe('Task three');
            expect(tasks[2].priority).toBe(TaskPriority.P3);
            expect(tasks[3].title).toBe('Task four');
            expect(tasks[3].priority).toBe(TaskPriority.P3);
        });

        it('should skip invalid lines in markdown', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = `# Plan Title
- [ ] Valid task #P1
Some random text
- [x] Completed task (not parsed)
- [ ] Another valid task #P2
More text
`;
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toHaveLength(2);
            expect(tasks[0].title).toBe('Valid task');
            expect(tasks[1].title).toBe('Another valid task');
        });

        it('should handle whitespace variations in checkbox format', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = `- [ ] Task with standard spacing
-  [ ] Task with extra space after dash
- [  ] Task with extra space in brackets
  - [ ] Indented task #P1
- [ ]Task without space before title
`;
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks.length).toBeGreaterThanOrEqual(1);
            expect(tasks[0].title).toBe('Task with standard spacing');
        });
    });

    // ============================================================================
    // Test Suite 2: Task property generation
    // ============================================================================

    describe('parseTasksFromMarkdown: Task property generation', () => {
        it('should generate unique taskIds for each task', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = `- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
`;
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            const taskIds = tasks.map((t) => t.taskId);
            const uniqueTaskIds = new Set(taskIds);

            expect(uniqueTaskIds.size).toBe(taskIds.length);
        });

        it('should set status to READY for all parsed tasks', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = `- [ ] Task 1 #P1
- [ ] Task 2 #P2
- [ ] Task 3
`;
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            tasks.forEach((task) => {
                expect(task.status).toBe(TaskStatus.READY);
            });
        });

        it('should set empty dependencies and blockedBy arrays', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = '- [ ] Task with dependencies #P1\n';
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks[0].dependencies).toEqual([]);
            expect(tasks[0].blockedBy).toEqual([]);
        });

        it('should set fromPlanningTeam to true', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = '- [ ] Task from plan #P1\n';
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks[0].fromPlanningTeam).toBe(true);
        });

        it('should have acceptance criteria from parsed file', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = '- [ ] Task with criteria #P1\n';
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks[0].acceptanceCriteria).toBeDefined();
            expect(Array.isArray(tasks[0].acceptanceCriteria)).toBe(true);
            expect(tasks[0].acceptanceCriteria.length).toBeGreaterThan(0);
        });
    });

    // ============================================================================
    // Test Suite 3: File I/O handling
    // ============================================================================

    describe('loadTasksFromPlanFile: File I/O', () => {
        it('should return empty array when no workspace folders', async () => {
            (vscode.workspace.workspaceFolders as any) = undefined;

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toEqual([]);
        });

        it('should return empty array when workspace folders is empty', async () => {
            (vscode.workspace.workspaceFolders as any) = [];

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toEqual([]);
        });

        it('should create starter file when plan file does not exist', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            // Mock stat to throw (file doesn't exist)
            (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(
                new Error('File not found')
            );

            // Mock createDirectory
            (vscode.workspace.fs.createDirectory as jest.Mock).mockResolvedValue(
                undefined
            );

            // Mock writeFile
            (vscode.workspace.fs.writeFile as jest.Mock).mockResolvedValue(
                undefined
            );

            // Mock readFile for reading the newly created file
            const starterContent = `# COE Project Plan (auto-created)

- [ ] Build user registration endpoint #P1
- [ ] Add task list display component #P2
- [ ] Write README with project overview
`;
            const encoder = new TextEncoder();
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(starterContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(vscode.workspace.fs.createDirectory).toHaveBeenCalled();
            expect(vscode.workspace.fs.writeFile).toHaveBeenCalled();
            expect(tasks).toHaveLength(3);
        });

        it('should not create file when plan file already exists', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = '- [ ] Existing task #P1\n';
            const encoder = new TextEncoder();

            // Mock stat to indicate file exists
            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});

            // Mock readFile
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(vscode.workspace.fs.createDirectory).not.toHaveBeenCalled();
            expect(vscode.workspace.fs.writeFile).not.toHaveBeenCalled();
            expect(tasks).toHaveLength(1);
        });

        it('should handle file read errors gracefully', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            // Mock stat to indicate file exists
            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});

            // Mock readFile to throw error
            (vscode.workspace.fs.readFile as jest.Mock).mockRejectedValue(
                new Error('Permission denied')
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toEqual([]);
        });

        it('should handle directory creation errors gracefully', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            // Mock stat to throw (file doesn't exist)
            (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(
                new Error('File not found')
            );

            // Mock createDirectory to throw error
            (vscode.workspace.fs.createDirectory as jest.Mock).mockRejectedValue(
                new Error('Permission denied')
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toEqual([]);
        });
    });

    // ============================================================================
    // Test Suite 4: isValidTask function
    // ============================================================================

    describe('isValidTask: Validation', () => {
        it('should return true for valid task with all required fields', () => {
            const validTask: Task = {
                taskId: 'TASK-001',
                title: 'Valid Task',
                description: 'A valid task description',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                acceptanceCriteria: ['Criterion 1', 'Criterion 2'],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 2,
            };

            expect(isValidTask(validTask)).toBe(true);
        });

        it('should return false when taskId is empty', () => {
            const invalidTask: Task = {
                taskId: '',
                title: 'Task',
                description: 'Description',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                acceptanceCriteria: ['Criterion'],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 1,
            };

            expect(isValidTask(invalidTask)).toBe(false);
        });

        it('should return false when title is empty', () => {
            const invalidTask: Task = {
                taskId: 'TASK-001',
                title: '',
                description: 'Description',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                acceptanceCriteria: ['Criterion'],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 1,
            };

            expect(isValidTask(invalidTask)).toBe(false);
        });

        it('should return false when acceptanceCriteria is empty', () => {
            const invalidTask: Task = {
                taskId: 'TASK-001',
                title: 'Task',
                description: 'Description',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                acceptanceCriteria: [],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 1,
            };

            expect(isValidTask(invalidTask)).toBe(false);
        });

        it('should return false for invalid priority value', () => {
            const invalidTask = {
                taskId: 'TASK-001',
                title: 'Task',
                description: 'Description',
                priority: 'INVALID_PRIORITY',
                status: TaskStatus.READY,
                acceptanceCriteria: ['Criterion'],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 1,
            } as any;

            expect(isValidTask(invalidTask)).toBe(false);
        });

        it('should return false for invalid status value', () => {
            const invalidTask = {
                taskId: 'TASK-001',
                title: 'Task',
                description: 'Description',
                priority: TaskPriority.P1,
                status: 'INVALID_STATUS',
                acceptanceCriteria: ['Criterion'],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 1,
            } as any;

            expect(isValidTask(invalidTask)).toBe(false);
        });

        it('should accept all valid priority values', () => {
            const baseTask: Task = {
                taskId: 'TASK-001',
                title: 'Task',
                description: 'Description',
                status: TaskStatus.READY,
                acceptanceCriteria: ['Criterion'],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 1,
            } as any;

            Object.values(TaskPriority).forEach((priority) => {
                const taskWithPriority = { ...baseTask, priority };
                expect(isValidTask(taskWithPriority)).toBe(true);
            });
        });

        it('should accept all valid status values', () => {
            const baseTask: Task = {
                taskId: 'TASK-001',
                title: 'Task',
                description: 'Description',
                priority: TaskPriority.P1,
                acceptanceCriteria: ['Criterion'],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 1,
            } as any;

            Object.values(TaskStatus).forEach((status) => {
                const taskWithStatus = { ...baseTask, status };
                expect(isValidTask(taskWithStatus)).toBe(true);
            });
        });

        it('should return false when taskId is missing', () => {
            const invalidTask = {
                title: 'Task',
                description: 'Description',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                acceptanceCriteria: ['Criterion'],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 1,
            } as any;

            expect(isValidTask(invalidTask)).toBe(false);
        });

        it('should return false when title is missing', () => {
            const invalidTask = {
                taskId: 'TASK-001',
                description: 'Description',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                acceptanceCriteria: ['Criterion'],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 1,
            } as any;

            expect(isValidTask(invalidTask)).toBe(false);
        });

        it('should return false when acceptanceCriteria is missing', () => {
            const invalidTask = {
                taskId: 'TASK-001',
                title: 'Task',
                description: 'Description',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 1,
            } as any;

            expect(isValidTask(invalidTask)).toBe(false);
        });

        it('should accept task with minimal required fields only', () => {
            const minimalTask: Task = {
                taskId: 'TASK-001',
                title: 'Task',
                description: '',
                priority: TaskPriority.P1,
                status: TaskStatus.READY,
                acceptanceCriteria: ['Criterion'],
                dependencies: [],
                blockedBy: [],
                fromPlanningTeam: false,
                createdAt: new Date(),
                estimatedHours: 0,
            };

            expect(isValidTask(minimalTask)).toBe(true);
        });

        it('should validate task with long strings', () => {
            const longTask: Task = {
                taskId: 'TASK-' + 'A'.repeat(100),
                title: 'Task with a very long title: ' + 'B'.repeat(200),
                description: 'C'.repeat(500),
                priority: TaskPriority.P2,
                status: TaskStatus.IN_PROGRESS,
                acceptanceCriteria: [
                    'Criterion ' + 'D'.repeat(100),
                    'Another criterion ' + 'E'.repeat(100),
                ],
                dependencies: ['TASK-001', 'TASK-002'],
                blockedBy: ['TASK-003'],
                fromPlanningTeam: true,
                createdAt: new Date(),
                estimatedHours: 10,
            };

            expect(isValidTask(longTask)).toBe(true);
        });
    });

    // ============================================================================
    // Test Suite 5: Integration tests
    // ============================================================================

    describe('loadTasksFromPlanFile: Integration', () => {
        it('should load, parse, and validate tasks from real markdown content', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = `# My Project Plan

## Q1 Goals
- [ ] Build user registration endpoint #P1
- [ ] Add email verification #P1
- [ ] Create user dashboard #P2

## Q2 Goals
- [ ] Add payment processing #P1
- [ ] Implement notifications
- [ ] Write API documentation #P3
`;
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toHaveLength(6);

            // Verify all tasks are valid
            tasks.forEach((task) => {
                expect(isValidTask(task)).toBe(true);
            });

            // Verify priorities are correct
            // P1: Build registration, Email verification, Payment processing = 3
            // P2: User dashboard = 1
            // P3: Implement notifications (no priority), Documentation = 2
            expect(tasks.filter((t) => t.priority === TaskPriority.P1)).toHaveLength(
                3
            );
            expect(tasks.filter((t) => t.priority === TaskPriority.P2)).toHaveLength(
                1
            );
            expect(tasks.filter((t) => t.priority === TaskPriority.P3)).toHaveLength(
                2
            );
        });

        it('should handle complex real-world plan file', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = `# COE Development Plan - 2026

## Phase 1: Foundation (Week 1-2)
- [ ] Setup project structure and dependencies #P1
- [ ] Create base orchestrator service #P1
- [ ] Implement task queue management #P1
- [ ] Build status bar UI component #P2

## Phase 2: Agent Integration (Week 3-4)
- [ ] Integrate Planning Team stub #P1
- [ ] Integrate Answer Team helper #P1
- [ ] Build Verification Team checkpoint #P2
- [ ] Add comprehensive error handling #P2

## Phase 3: Polish & Testing (Week 5)
- [ ] Write integration tests #P2
- [ ] Performance optimization #P3
- [ ] Documentation #P3
- [ ] Beta testing with stakeholders

## Blocked Tasks
- [ ] Deploy to production (blocked by Phase 3)
`;
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks.length).toBeGreaterThan(10);

            // All parsed tasks should be valid
            tasks.forEach((task) => {
                expect(isValidTask(task)).toBe(true);
                expect(task.status).toBe(TaskStatus.READY);
                expect(task.fromPlanningTeam).toBe(true);
                expect(task.taskId).toMatch(/^PLAN-\d+-\d+$/);
            });
        });
    });

    // ============================================================================
    // Test Suite 6: Edge cases
    // ============================================================================

    describe('parseTasksFromMarkdown: Edge cases', () => {
        it('should handle empty file content', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = '';
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toEqual([]);
        });

        it('should handle file with only whitespace', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = '   \n   \n   \n';
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toEqual([]);
        });

        it('should handle task with special characters in title', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent =
                '- [ ] Task with special chars: @#$%^&*() [brackets] {braces} #P1\n';
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toHaveLength(1);
            expect(tasks[0].title).toContain('special chars');
        });

        it('should handle task titles with URLs', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent =
                '- [ ] Review docs at https://example.com/docs and update code #P2\n';
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toHaveLength(1);
            expect(tasks[0].title).toContain('https://example.com');
        });

        it('should handle very long task titles', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const longTitle = 'A'.repeat(500);
            const fileContent = `- [ ] ${longTitle} #P1\n`;
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            expect(tasks).toHaveLength(1);
            expect(tasks[0].title).toHaveLength(500);
        });

        it('should handle priority labels with different spacing', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = `- [ ] Task one # P1
- [ ] Task two #P1
- [ ] Task three# P1
`;
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            // Only task two should be parsed as P1 priority
            const p1Tasks = tasks.filter((t) => t.priority === TaskPriority.P1);
            expect(p1Tasks.length).toBeGreaterThanOrEqual(1);
        });

        it('should handle mixed priority casing', async () => {
            const mockWorkspaceFolder = {
                uri: vscode.Uri.file('/workspace'),
            };

            (vscode.workspace.workspaceFolders as any) = [mockWorkspaceFolder];

            const fileContent = `- [ ] Task with P1 priority #P1
- [ ] Task with p1 priority #p1
- [ ] Task with p2 priority #p2
`;
            const encoder = new TextEncoder();

            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(
                encoder.encode(fileContent)
            );

            const tasks = await loadTasksFromPlanFile();

            // Should parse at least the uppercase P1
            expect(tasks.length).toBeGreaterThanOrEqual(1);
            expect(tasks[0].priority).toBe(TaskPriority.P1);
        });
    });
});

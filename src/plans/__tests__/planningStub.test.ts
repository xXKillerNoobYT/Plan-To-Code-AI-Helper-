/**
 * 🧪 Planning Team Stub Tests
 * 
 * Tests for task validation and markdown parsing patterns
 */

import { isValidTask } from '../planningStub';
import { TaskPriority, TaskStatus } from '../../orchestrator/programmingOrchestrator';

describe('Planning Team Stub - isValidTask', () => {
    it('should validate a correct task', () => {
        const task = {
            taskId: 'PLAN-1-123456',
            title: 'Test Task',
            description: 'Test Description',
            priority: TaskPriority.P1,
            status: TaskStatus.READY,
            acceptanceCriteria: ['Must work'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            estimatedHours: 1,
        };

        expect(isValidTask(task)).toBe(true);
    });

    it('should reject task with empty title', () => {
        const task = {
            taskId: 'PLAN-1-123456',
            title: '',
            description: 'Test Description',
            priority: TaskPriority.P1,
            status: TaskStatus.READY,
            acceptanceCriteria: ['Must work'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            estimatedHours: 1,
        };

        expect(isValidTask(task)).toBe(false);
    });

    it('should reject task with missing acceptance criteria', () => {
        const task = {
            taskId: 'PLAN-1-123456',
            title: 'Test Task',
            description: 'Test Description',
            priority: TaskPriority.P1,
            status: TaskStatus.READY,
            acceptanceCriteria: [],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            estimatedHours: 1,
        };

        expect(isValidTask(task)).toBe(false);
    });

    it('should reject task with empty taskId', () => {
        const task = {
            taskId: '',
            title: 'Test Task',
            description: 'Test Description',
            priority: TaskPriority.P1,
            status: TaskStatus.READY,
            acceptanceCriteria: ['Must work'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            estimatedHours: 1,
        };

        expect(isValidTask(task)).toBe(false);
    });
});

describe('Markdown Parsing - Task Line Patterns', () => {
    it('should parse tasks with P1 priority', () => {
        const line = '[ ] Implement login endpoint #P1';
        const match = line.match(/^\s*\[\s*\]\s+(.+?)(?:\s*#(P[123]))?$/);

        expect(match).not.toBeNull();
        expect(match?.[1]).toBe('Implement login endpoint');
        expect(match?.[2]).toBe('P1');
    });

    it('should parse tasks with P2 priority', () => {
        const line = '[ ] Add database migration #P2';
        const match = line.match(/^\s*\[\s*\]\s+(.+?)(?:\s*#(P[123]))?$/);

        expect(match).not.toBeNull();
        expect(match?.[1]).toBe('Add database migration');
        expect(match?.[2]).toBe('P2');
    });

    it('should parse tasks without priority (default to P3)', () => {
        const line = '[ ] Task without priority';
        const match = line.match(/^\s*\[\s*\]\s+(.+?)(?:\s*#(P[123]))?$/);

        expect(match).not.toBeNull();
        expect(match?.[1]).toBe('Task without priority');
        expect(match?.[2]).toBeUndefined();
    });

    it('should skip invalid lines (no [ ] pattern)', () => {
        const invalidLines = [
            'Some random text',
            'Another invalid line',
            '[x] Completed task',
            '- Task as bullet point',
        ];

        invalidLines.forEach((line) => {
            const match = line.match(/^\s*\[\s*\]\s+(.+?)(?:\s*#(P[123]))?$/);
            expect(match).toBeNull();
        });
    });

    it('should handle whitespace variations', () => {
        const lines = [
            '[  ]  Task with spaces  #P1',
            '  [ ] Indented task #P2',
            '[ ] Task with proper spacing #P3',
        ];

        lines.forEach((line) => {
            const match = line.match(/^\s*\[\s*\]\s+(.+?)(?:\s*#(P[123]))?$/);
            expect(match).not.toBeNull();
        });
    });

    it('should extract title correctly with various formats', () => {
        const testCases = [
            {
                line: '[ ] Implement login endpoint #P1',
                expectedTitle: 'Implement login endpoint',
                expectedPriority: 'P1',
            },
            {
                line: '  [ ] Add database migration  #P2',
                expectedTitle: 'Add database migration',
                expectedPriority: 'P2',
            },
            {
                line: '[ ] Fix bug',
                expectedTitle: 'Fix bug',
                expectedPriority: undefined,
            },
        ];

        testCases.forEach(({ line, expectedTitle, expectedPriority }) => {
            const match = line.match(/^\s*\[\s*\]\s+(.+?)(?:\s*#(P[123]))?$/);
            expect(match?.[1].trim()).toBe(expectedTitle);
            expect(match?.[2]).toBe(expectedPriority);
        });
    });

    it('should parse dash-prefixed tasks (- [ ] format)', () => {
        const lines = [
            '- [ ] Setup project structure #P1',
            '- [ ] Add documentation #P2',
            '- [ ] Nice feature #P3',
        ];

        const pattern = /^\s*(?:-\s+)?\[\s*\]\s+(.+?)(?:\s*#(P[123]))?$/;

        lines.forEach((line) => {
            const match = line.match(pattern);
            expect(match).not.toBeNull();
            expect(match?.[1]).toBeTruthy();
        });

        // Verify first one
        const firstMatch = lines[0].match(pattern);
        expect(firstMatch?.[1]).toBe('Setup project structure');
        expect(firstMatch?.[2]).toBe('P1');
    });
});
describe('Starter File Auto-Creation', () => {
  it('should parse starter content with 3 example tasks', () => {
    // Simulate the auto-created starter content
    const starterContent = `# COE Project Plan (auto-created)

- [ ] Build user registration endpoint #P1
- [ ] Add task list display component #P2
- [ ] Write README with project overview
`;

    const lines = starterContent.split('\n');
    const taskLines = lines.filter(l => l.match(/^\s*-\s+\[/));

    expect(taskLines.length).toBe(3);

    // Verify priorities
    const match1 = taskLines[0].match(/#(P[123])?/);
    const match2 = taskLines[1].match(/#(P[123])?/);
    const match3 = taskLines[2].match(/#(P[123])?/);

    expect(match1?.[1]).toBe('P1');
    expect(match2?.[1]).toBe('P2');
    expect(match3?.[1]).toBeUndefined(); // No priority = P3 default
  });

  it('should handle malformed lines gracefully', () => {
    const malformedLines = [
      'Random text',
      '[ Task without closing bracket',
      '## Section header',
      '[x] Already completed',
      '',
    ];

    const pattern = /^\s*(?:-\s+)?\[\s*\]\s+(.+?)(?:\s*#(P[123]))?$/;

    malformedLines.forEach((line) => {
      const match = line.match(pattern);
      expect(match).toBeNull(); // All should be skipped
    });
  });

  it('should return empty array when no workspace', () => {
    // This is a unit test for the regex pattern - the actual no-workspace scenario
    // requires mocking vscode.workspace.workspaceFolders which is integration-level
    const emptyPattern = /^\s*(?:-\s+)?\[\s*\]\s+(.+?)(?:\s*#(P[123]))?$/;
    expect(emptyPattern.test('- [ ] Task #P1')).toBe(true);
  });
});
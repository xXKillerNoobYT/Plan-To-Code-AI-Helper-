import { CoeTaskTreeProvider } from '../src/tree/CoeTaskTreeProvider';
import { Task, TaskPriority, TaskStatus } from '../src/orchestrator/programmingOrchestrator';

describe('CoeTaskTreeProvider', () => {
    const makeTask = (overrides: Partial<Task>): Task => ({
        taskId: overrides.taskId ?? '1',
        title: overrides.title ?? 'Test Task',
        description: overrides.description ?? 'Test description long enough',
        priority: overrides.priority ?? TaskPriority.P1,
        status: overrides.status ?? TaskStatus.READY,
        dependencies: overrides.dependencies ?? [],
        blockedBy: overrides.blockedBy ?? [],
        estimatedHours: overrides.estimatedHours ?? 1,
        acceptanceCriteria: overrides.acceptanceCriteria ?? ['criteria'],
        relatedFiles: overrides.relatedFiles,
        designReferences: overrides.designReferences,
        contextBundle: overrides.contextBundle,
        fromPlanningTeam: overrides.fromPlanningTeam ?? true,
        createdAt: overrides.createdAt,
        assignedTo: overrides.assignedTo,
    });

    it('returns tree items for ready tasks with priority label and command', async () => {
        const mockOrchestrator = {
            getReadyTasks: jest.fn().mockReturnValue([
                makeTask({ taskId: '1', title: 'Task 1', priority: TaskPriority.P1 }),
                makeTask({ taskId: '2', title: 'Task 2', priority: TaskPriority.P2 }),
            ]),
        } as any;

        const provider = new CoeTaskTreeProvider(mockOrchestrator);
        const children = await provider.getChildren();

        expect(children).toHaveLength(2);
        expect(children[0].label).toBe('Task 1');
        expect(children[0].description).toBe('P1 - High');
        expect(children[0].command?.command).toBe('coe.processTask');
        expect(children[0].command?.arguments?.[0]).toBe('1');
    });

    it('sorts by priority then title', async () => {
        const mockOrchestrator = {
            getReadyTasks: jest.fn().mockReturnValue([
                makeTask({ taskId: '3', title: 'B task', priority: TaskPriority.P2 }),
                makeTask({ taskId: '2', title: 'A task', priority: TaskPriority.P1 }),
                makeTask({ taskId: '1', title: 'C task', priority: TaskPriority.P1 }),
            ]),
        } as any;

        const provider = new CoeTaskTreeProvider(mockOrchestrator);
        const children = await provider.getChildren();

        expect(children.map((c) => c.label)).toEqual(['A task', 'C task', 'B task']);
    });

    it('returns empty list when orchestrator is null', async () => {
        const provider = new CoeTaskTreeProvider(null);
        const children = await provider.getChildren();
        expect(children).toHaveLength(1);
        expect(children[0].label).toContain('No tasks');
        expect(children[0].command).toBeUndefined();
    });

    it('fires change event on refresh', () => {
        const provider = new CoeTaskTreeProvider(null);
        const handler = jest.fn();
        provider.onDidChangeTreeData(handler);

        provider.refresh();

        expect(handler).toHaveBeenCalled();
    });
});
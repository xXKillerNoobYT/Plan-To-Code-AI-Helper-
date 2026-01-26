import * as vscode from 'vscode';
import { ProgrammingOrchestrator, Task, TaskPriority, TaskStatus } from '../orchestrator/programmingOrchestrator';

/**
 * 🎄 COE Tasks Queue Tree Provider
 * Displays ready tasks in the Explorer sidebar under "COE Tasks Queue".
 */
export class CoeTaskTreeProvider implements vscode.TreeDataProvider<CoeTaskTreeItem> {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<CoeTaskTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private orchestrator: ProgrammingOrchestrator | null) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: CoeTaskTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CoeTaskTreeItem): Thenable<CoeTaskTreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        }

        if (!this.orchestrator) {
            return Promise.resolve([this.buildEmptyItem()]);
        }

        const readyTasks = this.orchestrator.getReadyTasks();

        if (readyTasks.length === 0) {
            return Promise.resolve([this.buildEmptyItem()]);
        }

        const priorityRank: Record<TaskPriority, number> = {
            [TaskPriority.P1]: 1,
            [TaskPriority.P2]: 2,
            [TaskPriority.P3]: 3,
        };

        const items = readyTasks
            .slice()
            .sort((a, b) => {
                const diff = priorityRank[a.priority] - priorityRank[b.priority];
                return diff !== 0 ? diff : a.title.localeCompare(b.title);
            })
            .map((task) => new CoeTaskTreeItem(task, this.getPriorityLabel(task.priority)));
        return Promise.resolve(items);
    }

    private getPriorityLabel(priority: TaskPriority): string {
        switch (priority) {
            case TaskPriority.P1:
                return 'P1 - High';
            case TaskPriority.P2:
                return 'P2 - Medium';
            default:
                return 'P3 - Low';
        }
    }

    private buildEmptyItem(): CoeTaskTreeItem {
        const placeholder = new CoeTaskTreeItem(
            {
                taskId: 'empty',
                title: 'No tasks — edit Docs/Plans/current-plan.md',
                description: '',
                priority: TaskPriority.P3,
                status: TaskStatus.READY,
                dependencies: [],
                blockedBy: [],
                estimatedHours: 0,
                acceptanceCriteria: [],
                fromPlanningTeam: true,
            },
            '',
        );
        placeholder.iconPath = new vscode.ThemeIcon('inbox');
        placeholder.command = undefined;
        placeholder.contextValue = 'coe.task.empty';
        return placeholder;
    }
}

/**
 * 🌳 Tree item representing a single task
 */
export class CoeTaskTreeItem extends vscode.TreeItem {
    constructor(public readonly task: Task, priorityLabel?: string) {
        super(task.title, vscode.TreeItemCollapsibleState.None);

        this.description = priorityLabel ?? task.priority;
        this.tooltip = `${task.title}\nPriority: ${priorityLabel ?? task.priority}`;
        this.iconPath = new vscode.ThemeIcon(task.priority === TaskPriority.P1 ? 'checklist' : 'circle-large-outline');
        this.contextValue = 'coe.task';
        this.command = task.taskId === 'empty'
            ? undefined
            : {
                command: 'coe.processTask',
                title: 'Process Task',
                arguments: [task.taskId],
            };

        this.accessibilityInformation = {
            label: `${task.title} ${priorityLabel ?? task.priority}`,
            role: 'treeitem',
        };
    }
}
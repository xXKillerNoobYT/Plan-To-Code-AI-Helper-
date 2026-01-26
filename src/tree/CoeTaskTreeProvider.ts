import * as vscode from 'vscode';
import { ProgrammingOrchestrator, Task, TaskPriority } from '../orchestrator/programmingOrchestrator';

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

    getChildren(): Thenable<CoeTaskTreeItem[]> {
        if (!this.orchestrator) {
            return Promise.resolve([]);
        }

        const readyTasks = this.orchestrator.getReadyTasks();
        const items = readyTasks.map((task) => new CoeTaskTreeItem(task));
        return Promise.resolve(items);
    }
}

/**
 * 🌳 Tree item representing a single task
 */
export class CoeTaskTreeItem extends vscode.TreeItem {
    constructor(public readonly task: Task) {
        super(task.title, vscode.TreeItemCollapsibleState.None);

        this.description = task.priority;
        this.tooltip = task.description;
        this.iconPath = new vscode.ThemeIcon(task.priority === TaskPriority.P1 ? 'warning' : 'info');
        this.command = {
            command: 'coe.processTask',
            title: 'Process Task',
            arguments: [task.taskId],
        };
    }
}
/**
 * 🎯 Planning Team Stub - Simple Plan File Parser
 * 
 * Loads tasks from a Markdown file in the workspace with simple syntax:
 * - [ ] Task title #P1
 * - [ ] Another task #P2
 * - [ ] Task without priority (defaults to P3)
 * 
 * This is a minimal implementation for testing the orchestrator loop.
 */

import * as vscode from 'vscode';
import { Task, TaskPriority, TaskStatus } from '../orchestrator/programmingOrchestrator';

/**
 * 📖 Load Tasks from Plan File
 * 
 * Loads tasks from Docs/Plans/current-plan.md in the current workspace root.
 * Creates starter file if it doesn't exist.
 * Each line format: - [ ] Task title #P1 | #P2 | #P3
 * 
 * @returns Promise<Task[]> Array of parsed tasks, empty if workspace not found
 */
export async function loadTasksFromPlanFile(): Promise<Task[]> {
    try {
        // Get workspace root folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            console.warn('⚠️ No workspace folder found – using test mode only');
            return [];
        }

        // Construct path to plan file in workspace
        const planFileUri = vscode.Uri.joinPath(
            workspaceFolder.uri,
            'Docs',
            'Plans',
            'current-plan.md'
        );

        // Check if file exists
        let fileExists = false;
        try {
            await vscode.workspace.fs.stat(planFileUri);
            fileExists = true;
        } catch {
            fileExists = false;
        }

        // If file doesn't exist, create it with starter content
        if (!fileExists) {
            await createStarterPlanFile(workspaceFolder.uri, planFileUri);
            // Show user message
            await vscode.window.showInformationMessage(
                '✅ COE created a starter plan file in your project! Open Docs/Plans/current-plan.md to edit tasks.'
            );
        }

        // Read file content
        const fileContent = await vscode.workspace.fs.readFile(planFileUri);
        const fileText = new TextDecoder().decode(fileContent);

        // Parse tasks from markdown lines
        const tasks = parseTasksFromMarkdown(fileText);
        console.log(`✅ Loaded ${tasks.length} tasks from plan file`);

        return tasks;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error loading plan file: ${errorMessage}`);
        return [];
    }
}

/**
 * 📝 Create Starter Plan File
 * 
 * Creates the Docs/Plans directory structure and writes a starter plan file.
 * 
 * @param workspaceUri Workspace root URI
 * @param planFileUri URI where to create the plan file
 */
async function createStarterPlanFile(workspaceUri: vscode.Uri, planFileUri: vscode.Uri): Promise<void> {
    const starterContent = `# COE Project Plan (auto-created)

- [ ] Build user registration endpoint #P1
- [ ] Add task list display component #P2
- [ ] Write README with project overview
`;

    try {
        // Create directory structure
        const docsPlansUri = vscode.Uri.joinPath(workspaceUri, 'Docs', 'Plans');
        await vscode.workspace.fs.createDirectory(docsPlansUri);

        // Write file
        const encoder = new TextEncoder();
        const fileContent = encoder.encode(starterContent);
        await vscode.workspace.fs.writeFile(planFileUri, fileContent);
        console.log(`📝 Created starter plan file at Docs/Plans/current-plan.md`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to create starter plan file: ${errorMessage}`);
        throw error;
    }
}

/**
 * 🔍 Parse Tasks from Markdown Content
 * 
 * Extracts task lines matching: [ ] Title #P1
 * Generates: taskId (PLAN-{lineNumber}-{timestamp}), priority, status
 * 
 * @param markdownContent Raw markdown file content
 * @returns Task[] Array of parsed tasks (invalid lines skipped)
 */
function parseTasksFromMarkdown(markdownContent: string): Task[] {
    const tasks: Task[] = [];
    const timestamp = Date.now();
    const lines = markdownContent.split('\n');

    lines.forEach((line, index) => {
        // Match [ ] pattern (supports both "[ ]" and "- [ ]" formats)
        const match = line.match(/^\s*(?:-\s+)?\[\s*\]\s+(.+?)(?:\s*#(P[123]))?$/);

        if (!match) {
            return; // Skip non-matching lines silently
        }

        const taskTitle = match[1].trim();
        const priorityMatch = match[2];

        // Determine priority
        let priority = TaskPriority.P3;
        if (priorityMatch === 'P1') {
            priority = TaskPriority.P1;
        } else if (priorityMatch === 'P2') {
            priority = TaskPriority.P2;
        }

        // Create task object
        const task: Task = {
            taskId: `PLAN-${index + 1}-${timestamp}`,
            title: taskTitle,
            description: taskTitle, // Same as title for now
            priority,
            status: TaskStatus.READY,
            acceptanceCriteria: ['Task parsed from plan file'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            createdAt: new Date(),
            estimatedHours: 1, // Default 1 hour
        };

        tasks.push(task);
    });

    return tasks;
}

/**
 * 🧹 Validate Parsed Task
 * 
 * Ensures task meets minimum requirements before adding to orchestrator
 * 
 * @param task Task to validate
 * @returns boolean True if valid
 */
export function isValidTask(task: Task): boolean {
    // Check required string fields
    if (!task.taskId || task.taskId.length === 0) {
        return false;
    }
    if (!task.title || task.title.length === 0) {
        return false;
    }
    if (!task.acceptanceCriteria || task.acceptanceCriteria.length === 0) {
        return false;
    }

    // Check enum values are valid
    const validPriorities = Object.values(TaskPriority);
    const validStatuses = Object.values(TaskStatus);

    return validPriorities.includes(task.priority) && validStatuses.includes(task.status);
}

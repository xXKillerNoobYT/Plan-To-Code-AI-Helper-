/**
 * 🏗️ Workspace Setup Files Utility
 * 
 * Auto-creates important COE configuration and plan files on first startup
 * if they don't already exist in the workspace. Shows a friendly popup to
 * the user with options to open the newly created files.
 */

import * as vscode from 'vscode';

/**
 * Interface for file creation configuration
 */
interface FileToCreate {
    path: vscode.Uri;
    defaultContent: string;
    description: string;
}

/**
 * 🚀 Setup Missing Workspace Files
 * 
 * Automatically creates important COE files on extension startup:
 * - Docs/Plans/current-plan.md - Main task planning file
 * - .coe/config.json - LLM configuration settings
 * 
 * Shows a friendly popup to the user if any files were created.
 * 
 * @returns Promise<void>
 */
export async function setupMissingFiles(): Promise<void> {
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (!ws) {
        return;
    }

    // Define the files to check/create with their default content
    const filesToCreate: FileToCreate[] = [
        {
            path: vscode.Uri.joinPath(ws, 'Docs', 'Plans', 'current-plan.md'),
            defaultContent: `# COE Project Plan (auto-created)

- [ ] First task #P1
- [ ] Second task #P2
- [ ] Third task #P3

## Instructions
Edit this file to add your own tasks. Each task should follow the format:
\`- [ ] Task title #P1\` or \`#P2\` or \`#P3\` for priority levels.
`,
            description: 'Main task planning file',
        },
        {
            path: vscode.Uri.joinPath(ws, '.coe', 'config.json'),
            defaultContent: JSON.stringify(
                {
                    llm: {
                        url: 'http://192.168.1.205:1234/v1/chat/completions',
                        model: 'mistralai/ministral-3-14b-reasoning',
                        inputTokenLimit: 4000,
                        maxOutputTokens: 2000,
                        timeoutSeconds: 300,
                    },
                    description: 'Edit these settings to customize your LLM configuration',
                },
                null,
                2
            ),
            description: 'LLM configuration settings',
        },
    ];

    const createdFiles: FileToCreate[] = [];

    // Check each file and create if missing
    for (const file of filesToCreate) {
        try {
            // Try to stat the file (throws if doesn't exist)
            await vscode.workspace.fs.stat(file.path);
        } catch {
            // File doesn't exist – create parent folders + file
            try {
                const parent = vscode.Uri.joinPath(file.path, '..');
                await vscode.workspace.fs.createDirectory(parent);

                const encoder = new TextEncoder();
                const fileContent = encoder.encode(file.defaultContent);
                await vscode.workspace.fs.writeFile(file.path, fileContent);

                createdFiles.push(file);
            } catch (createError) {
                const errorMsg = createError instanceof Error ? createError.message : String(createError);
            }
        }
    }

    // Show friendly popup if any files were created (non-blocking)
    if (createdFiles.length > 0) {
        const fileList = createdFiles.map((f) => `• ${f.description}`).join('\n');
        // Don't await this - let it show asynchronously without blocking activation
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        vscode.window
            .showInformationMessage(
                `✅ COE created missing setup files:\n${fileList}\n\nWant to open them?`,
                'Open Files',
                "Don't show"
            )
            .then(async (choice) => {
                if (choice === 'Open Files') {
                    for (const file of createdFiles) {
                        try {
                            const doc = await vscode.workspace.openTextDocument(file.path);
                            await vscode.window.showTextDocument(doc, { preserveFocus: false });
                        } catch (openError) {
                            const errorMsg = openError instanceof Error ? openError.message : String(openError);
                        }
                    }
                }
            });
    }
}



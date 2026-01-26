/**
 * Copilot Orchestration Extension (COE) - Main Entry Point
 * 
 * This file is the "brain" of the extension. It activates when VS Code starts
 * and sets up all the features like the MCP server, task management, and UI.
 */

import * as vscode from 'vscode';
import { ProgrammingOrchestrator, SimpleLogger, TaskPriority, TaskStatus, Task } from './orchestrator/programmingOrchestrator';
import { loadTasksFromPlanFile } from './plans/planningStub';
import { setupMissingFiles } from './utils/setupFiles';
import { CoeTaskTreeProvider } from './tree/CoeTaskTreeProvider';

// ============================================================================
// Global State
// ============================================================================

/**
 * 🎯 Global Programming Orchestrator instance
 * Accessible throughout the extension for coordinating task execution
 */
let programmingOrchestrator: ProgrammingOrchestrator | null = null;

/**
 * 📝 Output channel for COE logging
 * Shows orchestrator initialization and task events
 */
let orchestratorOutputChannel: vscode.OutputChannel | null = null;

/**
 * � Status Bar Item for COE status display
 * Shows current queue status and allows quick access to process next task
 */
let statusBarItem: vscode.StatusBarItem | null = null;

/**
 * 🔄 Currently processing task (for status bar display)
 * Reserved for future use - currently status comes from orchestrator.getQueueStatus()
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentProcessingTask: { taskId: string; title: string; priority: string } | null = null;

/**
 * ⚙️  Global LLM Configuration
 * Loaded from .coe/config.json (workspace), VS Code settings, or defaults
 * Used by all LLM calls throughout the extension
 */
interface LLMConfig {
    url: string;
    model: string;
    inputTokenLimit: number;
    maxOutputTokens: number;
    timeoutSeconds: number;
}
let llmConfig: LLMConfig = {
    url: 'http://192.168.1.205:1234/v1/chat/completions',
    model: 'mistralai/ministral-3-14b-reasoning',
    inputTokenLimit: 4000,
    maxOutputTokens: 2000,
    timeoutSeconds: 300,
};

/**
 * 🔍 Get the current orchestrator instance
 * Used by other parts of the extension to access the orchestrator
 */
export function getOrchestrator(): ProgrammingOrchestrator | null {
    return programmingOrchestrator;
}

/**
 * 📊 Get the current status bar item
 * Used for testing and status updates
 */
export function getStatusBarItem(): vscode.StatusBarItem | null {
    return statusBarItem;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 🔄 Update the VS Code status bar with current queue information
 * Shows priority-aware queue status and allows interaction
 * 
 * Updates based on orchestrator state:
 * - Green when idle/ready
 * - Yellow when tasks are being worked on
 * - Gray when no tasks in queue
 */
function updateStatusBar(): void {
    if (!statusBarItem || !programmingOrchestrator) {
        return;
    }

    const status = programmingOrchestrator.getQueueStatus();
    const activeTask = status.currentTask;
    const readyCount = status.byStatus.ready;

    // Update text and icon based on orchestrator state
    if (activeTask) {
        const shortTitle = activeTask.title.slice(0, 25);
        statusBarItem.text = `$(play) COE: Working on ${shortTitle}...`;
        statusBarItem.color = '#ffff00'; // Yellow
    } else if (readyCount > 0) {
        statusBarItem.text = `$(list-tree) COE: ${readyCount} tasks ready`;
        statusBarItem.color = '#00ff00'; // Green
    } else {
        statusBarItem.text = '$(check-all) COE: All tasks complete — edit plan!';
        statusBarItem.color = '#888888'; // Gray
    }

    statusBarItem.show();
}

// ============================================================================
// Extension Lifecycle
// ============================================================================

/**
 * This function runs when the extension starts up.
 * Think of it as the "power on" button for COE.
 * 
 * @param context - VS Code provides this to help manage the extension's lifecycle
 */
export async function activate(context: vscode.ExtensionContext) {
    console.log('🚀 COE Activated');

    try {
    let treeDataProvider: CoeTaskTreeProvider | null = null;
    let planWatcher: vscode.FileSystemWatcher | null = null;

        // ====================================================================
        // 1. Create Output Channel for COE logging
        // ====================================================================
        orchestratorOutputChannel = vscode.window.createOutputChannel('COE Orchestrator');
        context.subscriptions.push(orchestratorOutputChannel);

        orchestratorOutputChannel.appendLine('═══════════════════════════════════════════════════════════');
        orchestratorOutputChannel.appendLine('🚀 Copilot Orchestration Extension (COE) Starting Up');
        orchestratorOutputChannel.appendLine('═══════════════════════════════════════════════════════════');
        orchestratorOutputChannel.show(true);

        // ====================================================================
        // 2. Create Status Bar Item for real-time queue status
        // ====================================================================
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        statusBarItem.text = '$(sync~spin) COE: Initializing...';
        statusBarItem.tooltip = 'Click to process next task';
        statusBarItem.command = 'coe.processNextTask';
        statusBarItem.color = '#ffff00'; // Yellow during initialization
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);

        orchestratorOutputChannel.appendLine('📊 Status Bar Item created');

        // ====================================================================
        // 2.5 Read LLM configuration settings with safe defaults
        // ====================================================================
        const config = vscode.workspace.getConfiguration('coe');
        // Initialize global llmConfig with defaults
        llmConfig = {
            url: 'http://192.168.1.205:1234/v1/chat/completions',
            model: 'mistralai/ministral-3-14b-reasoning',
            inputTokenLimit: 4000,
            maxOutputTokens: 2000,
            timeoutSeconds: 300,
        };

        orchestratorOutputChannel.appendLine('📋 Loading LLM configuration...');

        // ====================================================================
        // 2.75 Setup missing workspace files (plans, config, etc.)
        // ====================================================================
        orchestratorOutputChannel.appendLine('⚙️  Setting up missing workspace files...');
        try {
            await setupMissingFiles();
            orchestratorOutputChannel.appendLine('✅ Workspace files setup complete');
        } catch (setupError) {
            const errorMsg = setupError instanceof Error ? setupError.message : String(setupError);
            orchestratorOutputChannel.appendLine(`❌ Error setting up workspace files: ${errorMsg}`);
            console.error(`❌ setupMissingFiles error: ${errorMsg}`);
        }
        orchestratorOutputChannel.appendLine('');

        // ====================================================================
        // 2.8 Read LLM config from .coe/config.json (if exists)
        // ====================================================================
        const ws = vscode.workspace.workspaceFolders?.[0]?.uri;
        let configSource = 'defaults';
        if (ws) {
            const configUri = vscode.Uri.joinPath(ws, '.coe', 'config.json');
            try {
                const bytes = await vscode.workspace.fs.readFile(configUri);
                const text = new TextDecoder().decode(bytes);
                const userConfig = JSON.parse(text) as { llm?: Partial<LLMConfig> };

                if (userConfig.llm) {
                    if (userConfig.llm.url) llmConfig.url = userConfig.llm.url;
                    if (userConfig.llm.model) llmConfig.model = userConfig.llm.model;
                    if (userConfig.llm.inputTokenLimit !== undefined) llmConfig.inputTokenLimit = userConfig.llm.inputTokenLimit;
                    if (userConfig.llm.maxOutputTokens !== undefined) llmConfig.maxOutputTokens = userConfig.llm.maxOutputTokens;
                    if (userConfig.llm.timeoutSeconds !== undefined) llmConfig.timeoutSeconds = userConfig.llm.timeoutSeconds;
                    configSource = '.coe/config.json (workspace)';
                }
            } catch (configError) {
                llmConfig.url = config.get<string>('llm.url') ?? llmConfig.url;
                llmConfig.model = config.get<string>('llm.model') ?? llmConfig.model;
                llmConfig.inputTokenLimit = config.get<number>('llm.inputTokenLimit') ?? llmConfig.inputTokenLimit;
                llmConfig.maxOutputTokens = config.get<number>('llm.maxOutputTokens') ?? llmConfig.maxOutputTokens;
                llmConfig.timeoutSeconds = config.get<number>('llm.timeoutSeconds') ?? llmConfig.timeoutSeconds;
                configSource = 'VS Code settings or defaults';
            }
        } else {
            llmConfig.url = config.get<string>('llm.url') ?? llmConfig.url;
            llmConfig.model = config.get<string>('llm.model') ?? llmConfig.model;
            llmConfig.inputTokenLimit = config.get<number>('llm.inputTokenLimit') ?? llmConfig.inputTokenLimit;
            llmConfig.maxOutputTokens = config.get<number>('llm.maxOutputTokens') ?? llmConfig.maxOutputTokens;
            llmConfig.timeoutSeconds = config.get<number>('llm.timeoutSeconds') ?? llmConfig.timeoutSeconds;
            configSource = 'VS Code settings or defaults (no workspace)';
        }

        orchestratorOutputChannel.appendLine(`🔧 LLM config source: ${configSource}`);
        orchestratorOutputChannel.appendLine(
            `Using LLM: ${llmConfig.model} @ ${llmConfig.url} (input limit ${llmConfig.inputTokenLimit} tokens, output max ${llmConfig.maxOutputTokens}, timeout ${llmConfig.timeoutSeconds}s)`
        );
        orchestratorOutputChannel.appendLine('');

        // ====================================================================
        // 3. Initialize Programming Orchestrator
        // ====================================================================
        const logger = new SimpleLogger('COE.Extension');
        programmingOrchestrator = new ProgrammingOrchestrator(undefined, logger);

        orchestratorOutputChannel.appendLine('📝 Initializing Programming Orchestrator...');
        await programmingOrchestrator.init();

        orchestratorOutputChannel.appendLine('✅ Programming Orchestrator initialized – waiting for tasks…');
        orchestratorOutputChannel.appendLine('');

        // ====================================================================
        // 3.2 Initialize Tasks Tree View
        // ====================================================================
        treeDataProvider = new CoeTaskTreeProvider(programmingOrchestrator);
        const treeView = vscode.window.createTreeView('coe.tasksQueue', { treeDataProvider });
        context.subscriptions.push(treeView);

        // ====================================================================
        // 5. Register existing commands
        // ====================================================================
        const activateCommand = vscode.commands.registerCommand('coe.activate', () => {
            vscode.window.showInformationMessage('COE: Orchestration system ready!');
            console.log('COE: Manual activation triggered');
        });
        context.subscriptions.push(activateCommand);

        const executeTask = async (nextTask: Task): Promise<void> => {
            orchestratorOutputChannel?.appendLine('');
            orchestratorOutputChannel?.appendLine(`🚀 Processing task ${nextTask.taskId}...`);

            orchestratorOutputChannel?.appendLine(`📋 Task: ${nextTask.title}`);
            orchestratorOutputChannel?.appendLine(`🎯 Priority: ${nextTask.priority}`);

            const shortTitle = nextTask.title.length > 20
                ? nextTask.title.substring(0, 20) + '...'
                : nextTask.title;
            currentProcessingTask = {
                taskId: nextTask.taskId,
                title: shortTitle,
                priority: nextTask.priority,
            };
            updateStatusBar();

            orchestratorOutputChannel?.appendLine('🔄 Generating routing directive...');
            const directive = await programmingOrchestrator!.routeTask(nextTask);

            orchestratorOutputChannel?.appendLine('');
            orchestratorOutputChannel?.appendLine('📝 Generated Prompt for Copilot:');
            orchestratorOutputChannel?.appendLine('─'.repeat(60));
            orchestratorOutputChannel?.appendLine(JSON.stringify(directive, null, 2));
            orchestratorOutputChannel?.appendLine('─'.repeat(60));
            orchestratorOutputChannel?.appendLine('');

            const fullPromptFromRouteTask = directive.contextBundle ?? JSON.stringify(directive, null, 2);
            const estimatedInputTokens = Math.ceil(fullPromptFromRouteTask.length / 4);
            orchestratorOutputChannel?.appendLine(
                `📊 Estimated input tokens: ${estimatedInputTokens} / ${llmConfig.inputTokenLimit}`
            );

            let finalPrompt = fullPromptFromRouteTask;
            if (estimatedInputTokens > llmConfig.inputTokenLimit) {
                const maxChars = llmConfig.inputTokenLimit * 4;
                finalPrompt = fullPromptFromRouteTask.slice(-maxChars);
                orchestratorOutputChannel?.appendLine(
                    `⚠️ Prompt truncated from ${estimatedInputTokens} to ${llmConfig.inputTokenLimit} tokens`
                );
                vscode.window.showWarningMessage(
                    `⚠️ Prompt truncated from ${estimatedInputTokens} to ${llmConfig.inputTokenLimit} tokens`
                );
            }

            const completeTaskAndNotify = async (completionMessage: string) => {
                await programmingOrchestrator?.onTaskComplete(
                    nextTask.taskId,
                    completionMessage,
                );
                orchestratorOutputChannel?.appendLine('✅ Task marked complete');
                currentProcessingTask = null;

                const finalStatus = programmingOrchestrator?.getQueueStatus();
                const remainingCount = finalStatus?.byStatus.ready || 0;

                updateStatusBar();
                treeDataProvider?.refresh();

                if (remainingCount > 0) {
                    vscode.window.showInformationMessage(
                        `AI responded — task complete! ${remainingCount} tasks left.`
                    );
                } else {
                    vscode.window.showInformationMessage(
                        'AI responded — task complete!'
                    );
                }
            };

            const controller = new AbortController();
            const timeoutMs = llmConfig.timeoutSeconds * 1000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const start = Date.now();

            orchestratorOutputChannel?.appendLine(
                `🤖 Sending prompt to ${llmConfig.model} (timeout: ${llmConfig.timeoutSeconds}s)...`
            );

            try {
                const response = await fetch(llmConfig.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: llmConfig.model,
                        messages: [
                            { role: 'system', content: 'You are a senior TypeScript developer helping build a VS Code extension.' },
                            { role: 'user', content: finalPrompt },
                        ],
                        temperature: 0.7,
                        max_tokens: llmConfig.maxOutputTokens,
                        stream: true,
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                const elapsedMs = Date.now() - start;

                if (!response.ok) {
                    const statusInfo = `HTTP ${response.status} ${response.statusText}`.trim();
                    throw new Error(statusInfo);
                }

                const contentType = response.headers.get('content-type') || '';
                const isStream = contentType.includes('text/event-stream') && typeof (response.body as any)?.getReader === 'function';

                let fullReply = '';

                if (isStream) {
                    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
                    const decoder = new TextDecoder();

                    if (statusBarItem) {
                        statusBarItem.text = `$(sync~spin) Receiving from ${llmConfig.model}...`;
                        statusBarItem.color = '#ffff00';
                        statusBarItem.show();
                    }

                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;
                            const dataStr = line.slice(6).trim();
                            if (dataStr === '[DONE]') {
                                break;
                            }
                            try {
                                const parsed = JSON.parse(dataStr) as {
                                    choices?: Array<{ delta?: { content?: string } }>;
                                };

                                const delta = parsed.choices?.[0]?.delta?.content ?? '';
                                if (delta) {
                                    fullReply += delta;
                                }
                            } catch (error) {
                                orchestratorOutputChannel?.appendLine(`⚠️ Stream parse error: ${String(error)}`);
                            }
                        }
                    }
                } else {
                    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; };
                    fullReply = json.choices?.[0]?.message?.content ?? '';
                }

                orchestratorOutputChannel?.appendLine(`✅ Received response in ${elapsedMs}ms`);
                orchestratorOutputChannel?.appendLine('🧠 Model Reply:');
                orchestratorOutputChannel?.appendLine(fullReply || '(empty)');

                await completeTaskAndNotify(`Task completed via ${llmConfig.model}`);
            } catch (error) {
                clearTimeout(timeoutId);
                const isAbort = error instanceof Error && error.name === 'AbortError';
                orchestratorOutputChannel?.appendLine(
                    isAbort
                        ? `⏱️ Request timed out after ${llmConfig.timeoutSeconds}s`
                        : `❌ Error while calling model: ${error instanceof Error ? error.message : String(error)}`
                );
                if (isAbort) {
                    vscode.window.showErrorMessage(
                        `Request timed out after ${llmConfig.timeoutSeconds}s — model may still be thinking at ${llmConfig.url}`
                    );
                }
                currentProcessingTask = null;
                updateStatusBar();
                treeDataProvider?.refresh();
                throw error;
            }
        };

        // ====================================================================
        // 6. Register processNextTask command for real task execution
        // ====================================================================
        const processNextCommand = vscode.commands.registerCommand('coe.processNextTask', async () => {
            if (!programmingOrchestrator || !orchestratorOutputChannel) {
                vscode.window.showErrorMessage('❌ COE Orchestrator not initialized');
                return;
            }

            // Check if orchestrator is busy
            if (programmingOrchestrator.isBusy()) {
                vscode.window.showInformationMessage('⏳ Busy processing current task — try again in a few seconds');
                return;
            }

            const nextTask = programmingOrchestrator.getNextTask();
            if (!nextTask) {
                vscode.window.showInformationMessage('✅ All tasks complete! Edit Docs/Plans/current-plan.md to add more.');
                orchestratorOutputChannel.appendLine('ℹ️  No more ready tasks in queue');
                return;
            }

            await executeTask(nextTask);
        });
        context.subscriptions.push(processNextCommand);

        // ====================================================================
        // 6.1 Register processTask command for specific task execution
        // ====================================================================
        const processTaskCommand = vscode.commands.registerCommand('coe.processTask', async (taskId: string) => {
            if (!programmingOrchestrator || !orchestratorOutputChannel) {
                vscode.window.showErrorMessage('❌ COE Orchestrator not initialized');
                return;
            }

            if (programmingOrchestrator.isBusy()) {
                vscode.window.showInformationMessage('⏳ Busy processing current task — try again in a few seconds');
                return;
            }

            const target = programmingOrchestrator.getTaskById(taskId);
            if (!target) {
                vscode.window.showWarningMessage(`Task not found: ${taskId}`);
                return;
            }
            if (target.status !== TaskStatus.READY) {
                vscode.window.showWarningMessage(`Task ${taskId} is not ready (status: ${target.status})`);
                return;
            }

            await executeTask(target);
        });
        context.subscriptions.push(processTaskCommand);

        // ====================================================================
        // 7. Register test command for quick verification (backward compat)
        // ====================================================================
        const testCommand = vscode.commands.registerCommand('coe.testOrchestrator', async () => {
            if (!programmingOrchestrator || !orchestratorOutputChannel) {
                vscode.window.showErrorMessage('❌ COE Orchestrator not initialized');
                return;
            }

            // Check if real tasks are loaded - if so, disable test command completely
            const queueStatus = programmingOrchestrator.getQueueStatus();
            if (queueStatus.totalTasks > 0) {
                vscode.window.showInformationMessage(
                    'Real tasks loaded — click status bar to process plan tasks!'
                );
                orchestratorOutputChannel.appendLine('ℹ️  Test command disabled — real plan tasks are loaded');
                return;
            }

            try {
                orchestratorOutputChannel.appendLine('');
                orchestratorOutputChannel.appendLine('🧪 TEST: Creating and retrieving fake task...');

                // Create a fake P1 task for testing with unique timestamp ID
                const timestamp = Date.now();
                const fakeTask = {
                    taskId: `test-task-${timestamp}`,
                    title: 'Test Task - Verify Orchestrator',
                    description: 'This is a temporary test task to verify the orchestrator is working',
                    priority: TaskPriority.P1,
                    status: TaskStatus.READY,
                    dependencies: [],
                    blockedBy: [],
                    estimatedHours: 1,
                    acceptanceCriteria: [
                        'Test task was successfully added to queue',
                        'Test task was successfully retrieved as next task',
                        'Test task was successfully marked as completed',
                    ],
                    fromPlanningTeam: true,
                    createdAt: new Date(),
                };

                // Add task to queue
                programmingOrchestrator.addTask(fakeTask);
                orchestratorOutputChannel.appendLine(`✅ Fake task added to queue: ${fakeTask.taskId}`);

                // Update status bar after adding task
                updateStatusBar();

                // Get next task
                const nextTask = programmingOrchestrator.getNextTask();
                if (nextTask && nextTask.taskId === fakeTask.taskId) {
                    orchestratorOutputChannel.appendLine(`✅ Fake task retrieved successfully: "${nextTask.title}"`);

                    const stats = programmingOrchestrator.getQueueStatus();
                    orchestratorOutputChannel.appendLine(`📊 Queue Status: ${stats.totalTasks} total, ${stats.byStatus.ready} ready`);

                    // 🔄 CRITICAL: Mark task as IN_PROGRESS before completing it
                    // This is necessary because onTaskComplete() requires task status to be IN_PROGRESS
                    // In real execution, routeTask() would set this, but in tests we set it manually
                    orchestratorOutputChannel.appendLine('🔄 Simulating task completion for test...');
                    nextTask.status = TaskStatus.IN_PROGRESS;

                    // Now complete the task to clear active task state (for repeated test runs)
                    try {
                        await programmingOrchestrator.onTaskComplete(
                            fakeTask.taskId,
                            'Test task completed successfully'
                        );
                        orchestratorOutputChannel.appendLine('✅ Task marked complete – ready for next test run');
                    } catch (completeError) {
                        const errorMsg = completeError instanceof Error ? completeError.message : String(completeError);
                        orchestratorOutputChannel.appendLine(`❌ Failed to mark task complete: ${errorMsg}`);
                        vscode.window.showErrorMessage(`❌ COE: Failed to complete test task: ${errorMsg}`);
                        return;
                    }

                    // Update status bar after completion
                    updateStatusBar();

                    vscode.window.showInformationMessage('✅ COE: Orchestrator test passed!');
                } else {
                    orchestratorOutputChannel.appendLine('❌ Failed to retrieve fake task');
                    vscode.window.showErrorMessage('❌ COE: Orchestrator test failed');
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                orchestratorOutputChannel.appendLine(`❌ Test error: ${errorMsg}`);
                vscode.window.showErrorMessage(`❌ COE: Orchestrator test error: ${errorMsg}`);
            }
        });
        context.subscriptions.push(testCommand);

        orchestratorOutputChannel.appendLine('📋 Commands Registered:');
        orchestratorOutputChannel.appendLine('  • coe.activate - Activate orchestration');
        orchestratorOutputChannel.appendLine('  • coe.testOrchestrator - Test orchestrator (click status bar or use Command Palette)');
        orchestratorOutputChannel.appendLine('');
        orchestratorOutputChannel.appendLine('Start using COE by running "coe.testOrchestrator" from Command Palette or clicking the status bar!');

        // ====================================================================
        // 7. Log successful initialization
        // ====================================================================
        console.log('COE: Extension setup complete ✅');
        console.log('Programming Orchestrator instance available via getOrchestrator()');

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ COE Activation failed:', errorMsg);

        if (orchestratorOutputChannel) {
            orchestratorOutputChannel.appendLine(`❌ ACTIVATION FAILED: ${errorMsg}`);
        }

        vscode.window.showErrorMessage(`❌ COE: Failed to activate extension: ${errorMsg}`);
    }
}

/**
 * This function runs when the extension shuts down.
 * Think of it as the "power off" button - it cleans up resources.
 */
export async function deactivate() {
    try {
        console.log('COE: Extension deactivating...');

        // Dispose status bar item
        if (statusBarItem) {
            statusBarItem.dispose();
            statusBarItem = null;
            console.log('✅ Status Bar Item disposed');
        }

        // Shutdown Programming Orchestrator gracefully
        if (programmingOrchestrator) {
            await programmingOrchestrator.shutdown();
            programmingOrchestrator = null;
            console.log('✅ Programming Orchestrator shutdown complete');
        }

        // Dispose output channel
        if (orchestratorOutputChannel) {
            orchestratorOutputChannel.appendLine('');
            orchestratorOutputChannel.appendLine('🛑 COE: Extension deactivated');
            orchestratorOutputChannel.dispose();
            orchestratorOutputChannel = null;
        }

        console.log('✅ COE: Extension deactivated');
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Error during deactivation:', errorMsg);
    }
}

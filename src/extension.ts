/**
 * Copilot Orchestration Extension (COE) - Main Entry Point
 * 
 * This file is the "brain" of the extension. It activates when VS Code starts
 * and sets up all the features like the MCP server, task management, and UI.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { ProgrammingOrchestrator, SimpleLogger, TaskPriority, TaskStatus, Task } from './orchestrator/programmingOrchestrator';
import { loadTasksFromPlanFile } from './plans/planningStub';
import { setupMissingFiles } from './utils/setupFiles';
import { CoeTaskTreeProvider } from './tree/CoeTaskTreeProvider';
import { CompletedTasksTreeProvider } from './ui/completedTasksTreeProvider';
import { FileConfigManager, LLMConfig as FileLLMConfig } from './utils/fileConfig';
import { callLLMWithStreaming } from './utils/streamingLLM';
import { PRDGenerator } from './services/prdGenerator';
import { PlansFileWatcher } from './services/plansWatcher';
import { TicketDatabase } from './db/ticketsDb';
import { CoverageDiagnosticProvider } from './diagnostics/coverageProvider';
import { SkippedTestsDiagnosticProvider } from './diagnostics/skippedTestsProvider';

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
 * 🎫 Global TicketDb instance
 * Manages ticket persistence with SQLite + fallback Map
 */
let globalTicketDb: any = null; // Will be initialized on first use

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

/**
 * 🔧 Get the current LLM configuration
 * Reads from .coe/config.json (tool-agnostic, no VS Code dependency)
 */
export function getLLMConfig(): LLMConfig {
    return { ...llmConfig };
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

    const readyCount = programmingOrchestrator.getReadyTasksCount();
    const inProgressCount = programmingOrchestrator.getInProgressTasksCount();
    const totalCount = programmingOrchestrator.getAllTasks().length;

    // Update text and icon based on queue state
    if (inProgressCount > 0) {
        statusBarItem.text = `$(sync~spin) COE: ${inProgressCount} active`;
        statusBarItem.color = '#ffff00'; // Yellow
        statusBarItem.tooltip = `${inProgressCount} tasks in progress, ${readyCount} ready`;
    } else if (readyCount > 0) {
        statusBarItem.text = `$(checklist) COE Tasks: ${readyCount} ready`;
        statusBarItem.color = '#00ff00'; // Green
        statusBarItem.tooltip = `${readyCount} tasks ready to process`;
    } else if (totalCount > 0) {
        statusBarItem.text = '$(check) COE: All tasks complete';
        statusBarItem.color = '#888888'; // Gray
        statusBarItem.tooltip = `${totalCount} total tasks (all done)`;
    } else {
        statusBarItem.text = '$(checklist) COE: No tasks';
        statusBarItem.color = '#888888'; // Gray
        statusBarItem.tooltip = 'No tasks in queue. Create a ticket to get started.';
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
        let completedTasksProvider: CompletedTasksTreeProvider | null = null;
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
        // 2.5 Initialize File Configuration Manager (.coe/config.json)
        // ====================================================================
        orchestratorOutputChannel.appendLine('⚙️  Initializing File Configuration Manager...');
        try {
            await FileConfigManager.initialize();
            const configPath = FileConfigManager.getConfigPath();
            orchestratorOutputChannel.appendLine(`✅ Config manager initialized (file: ${configPath})`);
        } catch (configError) {
            const errorMsg = configError instanceof Error ? configError.message : String(configError);
            orchestratorOutputChannel.appendLine(`⚠️  Could not initialize config manager: ${errorMsg}`);
        }

        // ====================================================================
        // 2.6 Load LLM configuration from .coe/config.json
        // ====================================================================
        llmConfig = FileConfigManager.getLLMConfig();
        orchestratorOutputChannel.appendLine(`🔧 LLM config loaded from .coe/config.json`);
        orchestratorOutputChannel.appendLine(
            `Using LLM: ${llmConfig.model} @ ${llmConfig.url} (input limit ${llmConfig.inputTokenLimit} tokens, output max ${llmConfig.maxOutputTokens}, timeout ${llmConfig.timeoutSeconds}s)`
        );

        // Subscribe to config changes - update llmConfig when file changes
        const configUnsubscribe = FileConfigManager.onConfigChange((config) => {
            llmConfig = config.llm;
            orchestratorOutputChannel?.appendLine('📝 Config file changed - LLM config reloaded');
        });
        context.subscriptions.push({ dispose: configUnsubscribe });

        orchestratorOutputChannel.appendLine('');

        // ====================================================================
        // 2.7 Initialize Ticket Database (.coe/tickets.db)
        // ====================================================================
        orchestratorOutputChannel.appendLine('🗄️  Initializing Ticket Database...');
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (workspaceRoot) {
                const ticketDb = TicketDatabase.getInstance();
                await ticketDb.initialize(workspaceRoot);
                const stats = await ticketDb.getStats();
                orchestratorOutputChannel.appendLine(
                    `✅ Ticket Database initialized (${stats.total} tickets, fallback: ${stats.usingFallback})`
                );
                // Add cleanup on deactivation
                context.subscriptions.push({
                    dispose: async () => {
                        await ticketDb.close();
                    }
                });
            } else {
                orchestratorOutputChannel.appendLine('⚠️  No workspace folder found - ticket DB not initialized');
            }
        } catch (dbError) {
            const errorMsg = dbError instanceof Error ? dbError.message : String(dbError);
            orchestratorOutputChannel.appendLine(`⚠️  Ticket Database initialization failed: ${errorMsg}`);
            orchestratorOutputChannel.appendLine('   Using in-memory fallback for tickets');
        }

        orchestratorOutputChannel.appendLine('');

        // ====================================================================
        // 3. Initialize Programming Orchestrator
        // ====================================================================
        const logger = new SimpleLogger('COE.Extension');
        programmingOrchestrator = new ProgrammingOrchestrator(undefined, logger);

        orchestratorOutputChannel.appendLine('📝 Initializing Programming Orchestrator...');
        await programmingOrchestrator.init();

        // Initialize persistence to load previously saved tasks
        orchestratorOutputChannel.appendLine('💾 Loading persisted tasks from workspace state...');
        await programmingOrchestrator.initializeWithPersistence(context.workspaceState);

        orchestratorOutputChannel.appendLine('✅ Programming Orchestrator initialized – waiting for tasks…');
        orchestratorOutputChannel.appendLine('');

        // ====================================================================
        // 3.2 Initialize Tasks Tree View
        // ====================================================================
        treeDataProvider = new CoeTaskTreeProvider(programmingOrchestrator);
        const explorerTree = vscode.window.createTreeView('coe.tasksQueue', { treeDataProvider });
        const sidebarTree = vscode.window.createTreeView('coe-tasks', { treeDataProvider });
        context.subscriptions.push(explorerTree, sidebarTree);

        // Link TreeView provider to orchestrator for auto-refresh on queue changes
        programmingOrchestrator.setTreeDataProvider(treeDataProvider);

        // ====================================================================
        // 3.2.5 Initialize Completed Tasks History Tree View
        // ====================================================================
        const ticketDb = TicketDatabase.getInstance();
        completedTasksProvider = new CompletedTasksTreeProvider(ticketDb);
        const completedTree = vscode.window.createTreeView('coe.completedTasks', {
            treeDataProvider: completedTasksProvider
        });
        context.subscriptions.push(completedTree);

        // Link CompletedTasksTreeProvider to orchestrator
        programmingOrchestrator.setCompletedTasksProvider(completedTasksProvider);

        // Read retention config from VS Code settings
        const config = vscode.workspace.getConfiguration('coe.history');
        const retentionConfig = config.get('retention', { maxAgeHours: 168, maxCount: 0 });
        if (typeof retentionConfig === 'object' && 'maxAgeHours' in retentionConfig) {
            const maxAgeHours = (retentionConfig as any).maxAgeHours || 168;
            completedTasksProvider.updateRetention(maxAgeHours);
            orchestratorOutputChannel.appendLine(`✅ Completed Tasks view retention: ${maxAgeHours}h`);
        }

        orchestratorOutputChannel.appendLine('✅ Completed Tasks Tree View initialized');
        orchestratorOutputChannel.appendLine('');

        // ====================================================================
        // 3.2.6 Initialize Quality Gate Diagnostic Providers
        // ====================================================================
        orchestratorOutputChannel.appendLine('🔬 Initializing Quality Gate Diagnostic Providers...');

        // Coverage diagnostic provider (monitors coverage files)
        const coverageProvider = new CoverageDiagnosticProvider();
        coverageProvider.activate(context);
        orchestratorOutputChannel.appendLine('✅ Coverage Diagnostic Provider activated');

        // Skipped tests diagnostic provider (monitors test files)
        const skippedTestsProvider = new SkippedTestsDiagnosticProvider();
        skippedTestsProvider.activate(context);
        orchestratorOutputChannel.appendLine('✅ Skipped Tests Diagnostic Provider activated');

        orchestratorOutputChannel.appendLine('💡 Quality warnings will appear in Problems panel');
        orchestratorOutputChannel.appendLine('');

        // ====================================================================
        // 3.3 Load tasks from plan file
        // ====================================================================
        orchestratorOutputChannel.appendLine('📂 Loading tasks from plan file...');
        const planTasks = await loadTasksFromPlanFile();
        if (planTasks.length > 0) {
            planTasks.forEach((task) => programmingOrchestrator?.addTask(task));
            orchestratorOutputChannel.appendLine(`✅ Loaded and added ${planTasks.length} tasks from plan file`);
            console.log(`✅ Added ${planTasks.length} tasks to orchestrator`);
            console.log(`📊 Queue status after load:`, programmingOrchestrator?.getQueueStatus());
        } else {
            orchestratorOutputChannel.appendLine('ℹ️  No tasks loaded from plan file – using test mode only');
            console.log('ℹ️  No tasks loaded from plan file');
        }
        orchestratorOutputChannel.appendLine('');
        updateStatusBar();
        console.log('🔄 Calling treeDataProvider.refresh() after loading tasks');
        treeDataProvider.refresh();

        // ====================================================================
        // 3.3.5 Debug Summary: Tree View Status
        // ====================================================================
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔍 TREE VIEW DEBUG SUMMARY');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📊 Total tasks in orchestrator: ${programmingOrchestrator?.getQueueStatus()?.totalTasks || 0}`);
        console.log(`✅ Ready tasks: ${programmingOrchestrator?.getReadyTasks()?.length || 0}`);
        console.log(`🌳 Tree provider initialized: ${treeDataProvider !== null}`);
        console.log(`📺 Tree views created: ${explorerTree !== undefined && sidebarTree !== undefined}`);
        if (programmingOrchestrator) {
            const readyTasks = programmingOrchestrator.getReadyTasks();
            if (readyTasks.length > 0) {
                console.log('📋 Ready task details:');
                readyTasks.forEach(t => {
                    console.log(`   - ${t.taskId}: "${t.title}" [${t.priority}] status=${t.status}`);
                });
            } else {
                console.log('⚠️  No ready tasks found! Check task status in orchestrator.');
            }
        }
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');

        // ====================================================================
        // 3.4 Watch plan file for changes and refresh queue/tree
        // ====================================================================
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            planWatcher = vscode.workspace.createFileSystemWatcher('**/Docs/Plans/current-plan.md');
            const reloadTasks = async () => {
                orchestratorOutputChannel?.appendLine('🔄 Plan file changed — reloading tasks...');
                const tasks = await loadTasksFromPlanFile();
                programmingOrchestrator?.setTasks(tasks);
                treeDataProvider?.refresh();
                updateStatusBar();
            };
            planWatcher.onDidChange(reloadTasks, null, context.subscriptions);
            planWatcher.onDidCreate(reloadTasks, null, context.subscriptions);
            planWatcher.onDidDelete(reloadTasks, null, context.subscriptions);
            context.subscriptions.push(planWatcher);

            const planSaveListener = vscode.workspace.onDidSaveTextDocument((doc) => {
                const normalizedPath = doc.uri.fsPath.replace(/\\/g, '/');
                if (normalizedPath.endsWith('Docs/Plans/current-plan.md')) {
                    reloadTasks();
                }
            });
            context.subscriptions.push(planSaveListener);
        }

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

            orchestratorOutputChannel?.appendLine(
                `🌊 Streaming from ${llmConfig.model} (inactivity timeout: ${llmConfig.timeoutSeconds}s)...`
            );

            try {
                if (statusBarItem) {
                    statusBarItem.text = `$(sync~spin) Receiving from ${llmConfig.model}...`;
                    statusBarItem.color = '#ffff00';
                    statusBarItem.show();
                }

                const start = Date.now();

                const result = await callLLMWithStreaming({
                    config: llmConfig,
                    systemPrompt: 'You are a senior TypeScript developer helping build a VS Code extension.',
                    userPrompt: finalPrompt,
                    temperature: 0.7,
                    maxTokens: llmConfig.maxOutputTokens,
                    onToken: () => {
                        // Callback exists for future use with advanced logging
                    },
                    onError: (error) => {
                        orchestratorOutputChannel?.appendLine(`⚠️  Streaming error: ${error}`);
                    },
                    onComplete: () => {
                        orchestratorOutputChannel?.appendLine('✅ Streaming ended');
                    },
                });

                const elapsedMs = Date.now() - start;

                if (!result.success) {
                    const errorMsg = result.error || 'Unknown streaming error';
                    orchestratorOutputChannel?.appendLine(`❌ LLM call failed: ${errorMsg}`);
                    throw new Error(errorMsg);
                }

                const fullReply = result.content || 'Model returned no text content';

                // Validate we received content
                const trimmedReply = fullReply.trim();
                if (!trimmedReply) {
                    throw new Error('No content received from model');
                }

                orchestratorOutputChannel?.appendLine(`✅ Received response in ${elapsedMs}ms (method: ${result.method})`);
                orchestratorOutputChannel?.appendLine('─'.repeat(60));
                orchestratorOutputChannel?.appendLine('🧠 Model Reply:');
                orchestratorOutputChannel?.appendLine('─'.repeat(60));
                orchestratorOutputChannel?.appendLine(fullReply);
                orchestratorOutputChannel?.appendLine('─'.repeat(60));

                await completeTaskAndNotify(`Task completed via ${llmConfig.model}`);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                orchestratorOutputChannel?.appendLine(`❌ Error while calling model: ${message}`);
                vscode.window.showErrorMessage(`LLM not responding — ${message}`);
                // Return task to ready state so it can be retried
                nextTask.status = TaskStatus.READY;
                if (programmingOrchestrator) {
                    (programmingOrchestrator as unknown as { currentTask: Task | null }).currentTask = null;
                }
                currentProcessingTask = null;
                updateStatusBar();
                treeDataProvider?.refresh();
                return;
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
            console.log(`🎯 coe.processTask command triggered for taskId: ${taskId}`);

            if (!programmingOrchestrator || !orchestratorOutputChannel) {
                console.log('❌ Orchestrator not initialized');
                vscode.window.showErrorMessage('❌ COE Orchestrator not initialized');
                return;
            }

            if (programmingOrchestrator.isBusy()) {
                console.log('⏳ Orchestrator is busy');
                vscode.window.showInformationMessage('⏳ Busy processing current task — try again in a few seconds');
                return;
            }

            const target = programmingOrchestrator.getTaskById(taskId);
            if (!target) {
                console.log(`❌ Task not found: ${taskId}`);
                vscode.window.showWarningMessage(`Task not found: ${taskId}`);
                return;
            }

            console.log(`✅ Found task: ${target.title} - Status: ${target.status}`);

            if (target.status !== TaskStatus.READY) {
                console.log(`⚠️ Task not ready - status: ${target.status}`);
                vscode.window.showWarningMessage(`Task ${taskId} is not ready (status: ${target.status})`);
                return;
            }

            console.log(`🚀 Executing task from tree: ${target.title}`);
            await executeTask(target);
        });
        context.subscriptions.push(processTaskCommand);

        // ====================================================================
        // 7. Register PRD Generation Command
        // ====================================================================
        const regeneratePRDCommand = vscode.commands.registerCommand('coe.regeneratePRD', async () => {
            orchestratorOutputChannel?.appendLine('');
            orchestratorOutputChannel?.appendLine('═══════════════════════════════════════════════════════════');
            orchestratorOutputChannel?.appendLine('🚀 PRD Generation Started');
            orchestratorOutputChannel?.appendLine('═══════════════════════════════════════════════════════════');

            try {
                // Show progress notification
                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: 'Generating PRD from Plans/',
                        cancellable: false,
                    },
                    async (progress) => {
                        progress.report({ message: 'Reading Plans/ folder...' });

                        const llmConfigCopy = {
                            url: llmConfig.url,
                            model: llmConfig.model,
                            maxOutputTokens: llmConfig.maxOutputTokens,
                            timeoutSeconds: llmConfig.timeoutSeconds,
                        };

                        const result = await PRDGenerator.generate(
                            {
                                tokenLimit: llmConfig.inputTokenLimit,
                                retryOnFailure: true,
                                showPreview: false,
                                llmConfig: llmConfigCopy,
                            },
                            (status) => {
                                orchestratorOutputChannel?.appendLine(status);
                                progress.report({ message: status });
                            },
                            orchestratorOutputChannel || undefined
                        );

                        if (result.success) {
                            orchestratorOutputChannel?.appendLine('');
                            orchestratorOutputChannel?.appendLine(result.message);
                            if (result.mdPath) {
                                orchestratorOutputChannel?.appendLine(`📄 PRD.md: ${result.mdPath}`);
                            }
                            if (result.jsonPath) {
                                orchestratorOutputChannel?.appendLine(`📄 PRD.json: ${result.jsonPath}`);
                            }
                            if (result.warning) {
                                orchestratorOutputChannel?.appendLine(`⚠️  ${result.warning}`);
                            }
                            if (result.duration) {
                                orchestratorOutputChannel?.appendLine(
                                    `⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`
                                );
                            }

                            // Show popup with Open button
                            const openButton = 'Open PRD.md';
                            vscode.window.showInformationMessage(
                                '✅ PRD generated successfully!',
                                openButton
                            ).then(selection => {
                                if (selection === openButton && result.mdUri) {
                                    vscode.commands.executeCommand('vscode.open', result.mdUri);
                                }
                            });
                        } else {
                            orchestratorOutputChannel?.appendLine(result.message);
                            vscode.window.showErrorMessage(result.message);
                        }

                        orchestratorOutputChannel?.appendLine('═══════════════════════════════════════════════════════════');
                        orchestratorOutputChannel?.appendLine('');
                    }
                );
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                orchestratorOutputChannel?.appendLine(`❌ Error: ${errMsg}`);
                vscode.window.showErrorMessage(`❌ PRD Generation failed: ${errMsg}`);
            }
        });
        context.subscriptions.push(regeneratePRDCommand);

        // ====================================================================
        // 7.5 Start PRD Auto-Regeneration Watcher
        // ====================================================================
        orchestratorOutputChannel.appendLine('🔧 Setting up Plans/ folder watcher...');
        PlansFileWatcher.startWatching(context, true, orchestratorOutputChannel);

        // ====================================================================
        // 8. Register test command for quick verification (backward compat)
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

        // ====================================================================
        // 6. Register Test Ticket Command
        // ====================================================================
        const testCreateTicketCommand = vscode.commands.registerCommand(
            'coe.testCreateTicket',
            async () => {
                try {
                    if (!orchestratorOutputChannel) {
                        vscode.window.showErrorMessage('❌ COE: Output channel not initialized');
                        return;
                    }

                    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                    if (!workspaceRoot) {
                        vscode.window.showErrorMessage('❌ COE: No workspace folder open');
                        return;
                    }

                    orchestratorOutputChannel.appendLine('');
                    orchestratorOutputChannel.appendLine('🔗 Testing Ticket → Task Queue Integration (P1 Task 2)');
                    orchestratorOutputChannel.appendLine('═'.repeat(70));

                    // Get orchestrator to check queue status
                    const orchestrator = getOrchestrator();
                    if (!orchestrator) {
                        vscode.window.showErrorMessage('❌ COE: Orchestrator not initialized');
                        return;
                    }

                    // Log initial queue status
                    const beforeCount = orchestrator.getReadyTasksCount();
                    const beforeStats = orchestrator.getQueueStatus();
                    orchestratorOutputChannel.appendLine(`📊 Queue Status Before:`);
                    orchestratorOutputChannel.appendLine(`   Ready Tasks: ${beforeCount}`);
                    orchestratorOutputChannel.appendLine(`   Total Tasks: ${beforeStats.totalTasks}`);
                    orchestratorOutputChannel.appendLine(`   By Priority: P1=${beforeStats.byPriority.P1}, P2=${beforeStats.byPriority.P2}, P3=${beforeStats.byPriority.P3}`);

                    // Create or reuse global TicketDb instance
                    if (!globalTicketDb) {
                        const TicketDb = (await import('./services/ticketDb')).default;
                        globalTicketDb = new TicketDb(path.join(workspaceRoot, '.coe'));
                        await globalTicketDb.init();
                        orchestratorOutputChannel.appendLine('✅ TicketDb initialized (new instance)');
                    } else {
                        orchestratorOutputChannel.appendLine('✅ TicketDb already initialized (reusing instance)');
                    }

                    orchestratorOutputChannel.appendLine('');
                    orchestratorOutputChannel.appendLine('🎫 Creating test ticket...');

                    // Create test ticket - should automatically route and enqueue
                    const ticket = await globalTicketDb.createTicket({
                        type: 'human_to_ai',
                        title: 'How do I implement error handling?',
                        description: 'Need guidance on TypeScript error handling patterns for the project',
                        priority: 2
                    });

                    orchestratorOutputChannel.appendLine(`✅ Ticket created: ${ticket.id}`);
                    orchestratorOutputChannel.appendLine(`   Title: ${ticket.title}`);
                    orchestratorOutputChannel.appendLine(`   Type: ${ticket.type}`);
                    orchestratorOutputChannel.appendLine(`   Priority: P${ticket.priority}`);
                    orchestratorOutputChannel.appendLine(`   Status: ${ticket.status}`);

                    // Wait for async routing and TreeView refresh to complete
                    orchestratorOutputChannel.appendLine('');
                    orchestratorOutputChannel.appendLine('⏳ Waiting for routing, persistence, and TreeView refresh...');
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Check queue status after routing
                    const afterCount = orchestrator.getReadyTasksCount();
                    const afterStats = orchestrator.getQueueStatus();
                    orchestratorOutputChannel.appendLine('');
                    orchestratorOutputChannel.appendLine(`📊 Queue Status After:`);
                    orchestratorOutputChannel.appendLine(`   Ready Tasks: ${afterCount}`);
                    orchestratorOutputChannel.appendLine(`   Total Tasks: ${afterStats.totalTasks}`);

                    // Verify task was added
                    if (afterCount > beforeCount) {
                        orchestratorOutputChannel.appendLine('');
                        orchestratorOutputChannel.appendLine('✅ SUCCESS: Task added to queue!');
                        orchestratorOutputChannel.appendLine(`   Tasks increased from ${beforeCount} to ${afterCount}`);

                        // Find the newly added task
                        const readyTasks = orchestrator.getReadyTasks();
                        const newTask = readyTasks.find((t: Task) => (t as any)?.metadata?.ticketId === ticket.id);

                        if (newTask) {
                            orchestratorOutputChannel.appendLine('');
                            orchestratorOutputChannel.appendLine('📋 Added Task Details:');
                            orchestratorOutputChannel.appendLine(`   Task ID: ${newTask.taskId}`);
                            orchestratorOutputChannel.appendLine(`   Title: ${newTask.title}`);
                            orchestratorOutputChannel.appendLine(`   Priority: ${newTask.priority}`);
                            orchestratorOutputChannel.appendLine(`   Status: ${newTask.status}`);
                            orchestratorOutputChannel.appendLine(`   Routed To: ${(newTask as any)?.metadata?.routedTeam || 'unknown'}`);
                            orchestratorOutputChannel.appendLine(`   Metadata.ticketId: ${(newTask as any)?.metadata?.ticketId}`);

                            orchestratorOutputChannel.appendLine('');
                            orchestratorOutputChannel.appendLine('👀 CHECK SIDEBAR & STATUS BAR:');
                            orchestratorOutputChannel.appendLine('   → Sidebar: "COE Tasks Queue" should show 1 task');
                            orchestratorOutputChannel.appendLine(`   → Status Bar: Should show "COE Tasks: ${afterCount} ready"`);
                            orchestratorOutputChannel.appendLine('   → Task persisted to workspace storage ✅');
                            orchestratorOutputChannel.appendLine('');
                            orchestratorOutputChannel.appendLine('🔄 TRY RELOADING (Ctrl+R):');
                            orchestratorOutputChannel.appendLine('   → Task should still be in queue after reload');
                            orchestratorOutputChannel.appendLine('   → Run test again → should skip duplicate (check logs for skip message)');
                            orchestratorOutputChannel.appendLine('');
                            orchestratorOutputChannel.appendLine('💡 DUPLICATE DETECTION:');
                            orchestratorOutputChannel.appendLine('   → If you run this command again, the duplicate will be skipped');
                            orchestratorOutputChannel.appendLine('   → Check logs for "Task already exists for ticket..." message');

                            vscode.window.showInformationMessage(
                                `✅ Ticket ${ticket.id} created! Check sidebar & status bar (${afterCount} ready).`,
                                'Open Sidebar',
                                'Reload & Test'
                            ).then(selection => {
                                if (selection === 'Open Sidebar') {
                                    vscode.commands.executeCommand('workbench.view.extension.coe-explorer');
                                } else if (selection === 'Reload & Test') {
                                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                                }
                            });
                        } else {
                            orchestratorOutputChannel.appendLine('⚠️ Task found in queue but metadata not matching');
                        }
                    } else {
                        orchestratorOutputChannel.appendLine('');
                        orchestratorOutputChannel.appendLine('⚠️ Task not added to queue');

                        // Check if it's a duplicate
                        if (await orchestrator.hasTaskForTicket(ticket.id)) {
                            orchestratorOutputChannel.appendLine('   Reason: Duplicate ticket detected');
                            orchestratorOutputChannel.appendLine('   → Task for this ticket already exists in queue');
                            orchestratorOutputChannel.appendLine('   → This is expected behavior (duplicate prevention working!)');
                            vscode.window.showInformationMessage(`Duplicate skipped: Task already exists for ticket ${ticket.id}`);
                        } else {
                            orchestratorOutputChannel.appendLine('  - Routing/enqueue failed (check logs)');
                            vscode.window.showWarningMessage(`Task not added to queue`);
                        }
                    }

                    // Verify persistence by retrieving ticket
                    orchestratorOutputChannel.appendLine('');
                    orchestratorOutputChannel.appendLine('🔄 Verifying persistence...');
                    const retrieved = await globalTicketDb.getTicket(ticket.id);
                    if (retrieved) {
                        orchestratorOutputChannel.appendLine(`✅ Ticket persisted: ${retrieved.title}`);
                    } else {
                        orchestratorOutputChannel.appendLine('❌ Failed to retrieve ticket');
                    }

                    orchestratorOutputChannel.appendLine('');
                    orchestratorOutputChannel.appendLine('═'.repeat(70));
                    orchestratorOutputChannel.show();

                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    if (orchestratorOutputChannel) {
                        orchestratorOutputChannel.appendLine(`❌ Error: ${errorMsg}`);
                        orchestratorOutputChannel.appendLine(`Stack: ${error instanceof Error ? error.stack : 'N/A'}`);
                        orchestratorOutputChannel.show();
                    }
                    vscode.window.showErrorMessage(
                        `❌ Failed to test ticket integration: ${errorMsg}`
                    );
                }
            }
        );
        context.subscriptions.push(testCreateTicketCommand);

        // ====================================================================
        // Test Route Ticket Command
        // ====================================================================
        const testRouteTicketCommand = vscode.commands.registerCommand(
            'coe.testRouteTicket',
            async () => {
                try {
                    if (!orchestratorOutputChannel) {
                        vscode.window.showErrorMessage('❌ COE: Output channel not initialized');
                        return;
                    }

                    orchestratorOutputChannel.appendLine('');
                    orchestratorOutputChannel.appendLine('🎯 Testing Boss AI Router...');

                    // Import BossRouter and AgentTeamType
                    const { BossRouter } = await import('./services/bossRouter');
                    const { AgentTeamType } = await import('./types/agentTeam');

                    const router = BossRouter.getInstance();

                    // Create sample tickets for testing
                    const testTickets = [
                        {
                            ticket_id: 'TK-TEST-001',
                            type: 'ai_to_human' as const,
                            status: 'open' as const,
                            priority: 1 as const,
                            creator: 'Answer Team',
                            assignee: 'unassigned',
                            title: 'Need clarification on user requirement',
                            description: 'What should happen when user clicks the save button?',
                            thread: [],
                            created_at: new Date(),
                            updated_at: new Date()
                        },
                        {
                            ticket_id: 'TK-TEST-002',
                            type: 'human_to_ai' as const,
                            status: 'open' as const,
                            priority: 1 as const,
                            creator: 'user',
                            assignee: 'unassigned',
                            title: 'Plan new authentication system',
                            description: 'Need to define architecture for OAuth integration',
                            thread: [],
                            created_at: new Date(),
                            updated_at: new Date()
                        },
                        {
                            ticket_id: 'TK-TEST-003',
                            type: 'human_to_ai' as const,
                            status: 'open' as const,
                            priority: 2 as const,
                            creator: 'user',
                            assignee: 'unassigned',
                            title: 'Verify test coverage',
                            description: 'Check that all new code has proper test coverage',
                            thread: [],
                            created_at: new Date(),
                            updated_at: new Date()
                        },
                        {
                            ticket_id: 'TK-TEST-004',
                            type: 'human_to_ai' as const,
                            status: 'open' as const,
                            priority: 2 as const,
                            creator: 'user',
                            assignee: 'unassigned',
                            title: 'Research best database for project',
                            description: 'Investigate PostgreSQL vs MongoDB for our use case',
                            thread: [],
                            created_at: new Date(),
                            updated_at: new Date()
                        },
                        {
                            ticket_id: 'TK-TEST-005',
                            type: 'human_to_ai' as const,
                            status: 'open' as const,
                            priority: 3 as const,
                            creator: 'user',
                            assignee: 'unassigned',
                            title: 'Unknown task type',
                            description: 'Something random with no keywords',
                            thread: [],
                            created_at: new Date(),
                            updated_at: new Date()
                        }
                    ];

                    // Route each ticket and display results
                    orchestratorOutputChannel.appendLine('');
                    orchestratorOutputChannel.appendLine('Routing Test Tickets:');
                    orchestratorOutputChannel.appendLine('─'.repeat(60));

                    for (const ticket of testTickets) {
                        const team = router.routeTicket(ticket);

                        orchestratorOutputChannel.appendLine('');
                        orchestratorOutputChannel.appendLine(`Ticket: ${ticket.ticket_id}`);
                        orchestratorOutputChannel.appendLine(`  Title: ${ticket.title}`);
                        orchestratorOutputChannel.appendLine(`  Type: ${ticket.type} | Priority: P${ticket.priority}`);
                        orchestratorOutputChannel.appendLine(`  ➜ Routed to: ${team.toUpperCase()} TEAM`);

                        // Add explanation
                        let explanation = '';
                        switch (team) {
                            case AgentTeamType.Answer:
                                explanation = ticket.type === 'ai_to_human'
                                    ? '(AI asking human for clarification)'
                                    : '(Human question)';
                                break;
                            case AgentTeamType.Planning:
                                explanation = '(Complex work breakdown needed)';
                                break;
                            case AgentTeamType.Verification:
                                explanation = '(Testing/validation required)';
                                break;
                            case AgentTeamType.Research:
                                explanation = '(Investigation needed)';
                                break;
                            case AgentTeamType.Escalate:
                                explanation = '(No matching rule - escalating)';
                                break;
                        }
                        orchestratorOutputChannel.appendLine(`  ${explanation}`);
                    }

                    orchestratorOutputChannel.appendLine('');
                    orchestratorOutputChannel.appendLine('─'.repeat(60));
                    orchestratorOutputChannel.appendLine('✅ Boss AI Router test complete!');
                    orchestratorOutputChannel.appendLine('');
                    orchestratorOutputChannel.appendLine(`Total rules configured: ${router.getRules().length}`);

                    orchestratorOutputChannel.show();
                    vscode.window.showInformationMessage('✅ Boss AI Router test complete! Check output.');

                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    if (orchestratorOutputChannel) {
                        orchestratorOutputChannel.appendLine(`❌ Error testing router: ${errorMsg}`);
                        orchestratorOutputChannel.show();
                    }
                    vscode.window.showErrorMessage(`❌ Failed to test router: ${errorMsg}`);
                }
            }
        );
        context.subscriptions.push(testRouteTicketCommand);

        // ====================================================================
        // Cleanup History Command
        // ====================================================================
        const cleanupHistoryCommand = vscode.commands.registerCommand(
            'coe.cleanupHistory',
            async () => {
                if (!completedTasksProvider) {
                    vscode.window.showErrorMessage('❌ Completed tasks provider not initialized');
                    return;
                }

                try {
                    orchestratorOutputChannel?.appendLine('🧹 Starting completed tasks cleanup...');

                    // Read retention config from VS Code settings
                    const config = vscode.workspace.getConfiguration('coe.history');
                    const retentionConfig = config.get('retention', { maxAgeHours: 168, maxCount: 0 });

                    let maxAgeHours = 168;
                    let maxCount = 0;

                    if (typeof retentionConfig === 'object' && retentionConfig !== null) {
                        maxAgeHours = (retentionConfig as any).maxAgeHours || 168;
                        maxCount = (retentionConfig as any).maxCount || 0;
                    }

                    orchestratorOutputChannel?.appendLine(`   Config: maxAgeHours=${maxAgeHours}, maxCount=${maxCount}`);

                    // Run cleanup
                    const ticketDb = TicketDatabase.getInstance();
                    const deletedCount = await ticketDb.cleanupOldTasks(maxAgeHours, maxCount);

                    orchestratorOutputChannel?.appendLine(`✅ Cleanup complete: Deleted ${deletedCount} old completed tasks`);

                    // Refresh completed tasks view
                    completedTasksProvider.refresh();

                    if (deletedCount > 0) {
                        vscode.window.showInformationMessage(`✅ Deleted ${deletedCount} old completed task(s)`);
                    } else {
                        vscode.window.showInformationMessage('ℹ️ No tasks to cleanup (within retention limits)');
                    }

                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    orchestratorOutputChannel?.appendLine(`❌ Error during cleanup: ${errorMsg}`);
                    vscode.window.showErrorMessage(`❌ Cleanup failed: ${errorMsg}`);
                }
            }
        );
        context.subscriptions.push(cleanupHistoryCommand);

        orchestratorOutputChannel.appendLine('📋 Commands Registered:');
        orchestratorOutputChannel.appendLine('  • coe.activate - Activate orchestration');
        orchestratorOutputChannel.appendLine('  • coe.regeneratePRD - Regenerate PRD from Plans/ (Command Palette)');
        orchestratorOutputChannel.appendLine('  • coe.testOrchestrator - Test orchestrator (click status bar or use Command Palette)');
        orchestratorOutputChannel.appendLine('  • coe.testCreateTicket - Test ticket creation (Command Palette)');
        orchestratorOutputChannel.appendLine('  • coe.testRouteTicket - Test Boss AI Router (Command Palette)');
        orchestratorOutputChannel.appendLine('  • coe.cleanupHistory - Cleanup old completed tasks (Command Palette)');
        orchestratorOutputChannel.appendLine('');
        orchestratorOutputChannel.appendLine('Start using COE by running "coe.testOrchestrator" from Command Palette or clicking the status bar!');

        // User-facing success toast
        vscode.window.showInformationMessage('COE: Orchestrator started');

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

        // Stop PRD watcher
        PlansFileWatcher.stopWatching();
        console.log('✅ Plans Watcher stopped');

        // Dispose File Config Manager
        FileConfigManager.dispose();
        console.log('✅ File Config Manager disposed');

        // Close TicketDb if open
        if (globalTicketDb) {
            try {
                await globalTicketDb.close();
                globalTicketDb = null;
                console.log('✅ TicketDb closed and handle nulled');
            } catch (error) {
                console.error('❌ Error closing TicketDb:', error);
            }
        }

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

        // Small delay for OneDrive sync if needed (non-blocking)
        await new Promise(resolve => setTimeout(resolve, 200));

        console.log('✅ COE: Extension deactivated');
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Error during deactivation:', errorMsg);
    }
}

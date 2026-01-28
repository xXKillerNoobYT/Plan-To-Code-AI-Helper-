import { activate } from '../src/extension';
import { getOrchestrator, getStatusBarItem } from '../src/extension';
import { TaskPriority, TaskStatus, Task } from '../src/orchestrator/programmingOrchestrator';
import * as vscode from 'vscode';

/**
 * Helper to find a registered command handler by command id
 */
function getRegisteredCommandHandler(commandId: string): (() => Promise<void>) | undefined {
    // Access jest mock calls for registerCommand
    const calls = (vscode.commands.registerCommand as unknown as jest.Mock).mock.calls as Array<[string, unknown]>;
    const match = calls.find(([id]) => id === commandId);
    return (match?.[1] as (() => Promise<void>)) || undefined;
}

/**
 * Build a minimal VS Code extension context stub
 */
function buildContext(): vscode.ExtensionContext {
    return {
        subscriptions: [],
    } as unknown as vscode.ExtensionContext;
}

describe('COE Status Bar and Commands', () => {
    let outputChannelMock: { appendLine: jest.Mock; show: jest.Mock; dispose: jest.Mock };
    let statusBarMock: {
        text: string;
        tooltip: string;
        command: string;
        color: string;
        show: jest.Mock;
        dispose: jest.Mock;
    };
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            headers: { get: () => 'application/json' },
            body: undefined,
            json: jest.fn().mockResolvedValue({
                choices: [
                    { message: { content: 'Completed from LM Studio' } },
                ],
            }),
        });
        (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

        // Mock vscode.workspace for loadTasksFromPlanFile to return no workspace
        (vscode.workspace.workspaceFolders as any) = undefined;

        // Mock vscode.window functions
        outputChannelMock = {
            appendLine: jest.fn(),
            show: jest.fn(),
            dispose: jest.fn(),
        };
        (vscode.window.createOutputChannel as jest.Mock).mockReturnValue(outputChannelMock);

        statusBarMock = {
            text: '',
            tooltip: 'Click to process next task',
            command: 'coe.processNextTask',
            color: '',
            show: jest.fn(),
            dispose: jest.fn(),
        };

        (vscode.window.createStatusBarItem as jest.Mock).mockReturnValue(statusBarMock);
        (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
        (vscode.commands.registerCommand as jest.Mock).mockImplementation(
            (command: string, callback: any) => ({
                dispose: jest.fn(),
                _command: command,
                _callback: callback,
            })
        );
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('shows correct remaining count in status bar after task completion', async () => {
        // Activate extension
        await activate(buildContext());

        const orchestrator = getOrchestrator();
        const statusBar = getStatusBarItem();

        expect(orchestrator).toBeTruthy();
        expect(statusBar).toBeTruthy();

        if (!orchestrator || !statusBar) return;

        // Seed two tasks into the queue
        const t1: Task = {
            taskId: 'T-1',
            title: 'Implement API endpoint',
            description: 'Build endpoint',
            priority: TaskPriority.P1,
            status: TaskStatus.READY,
            acceptanceCriteria: ['works'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            createdAt: new Date(),
            estimatedHours: 1,
        };

        const t2: Task = {
            taskId: 'T-2',
            title: 'Write docs',
            description: 'Write project documentation and guides',
            priority: TaskPriority.P2,
            status: TaskStatus.READY,
            acceptanceCriteria: ['written'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            createdAt: new Date(),
            estimatedHours: 1,
        };

        orchestrator.addTask(t1);
        orchestrator.addTask(t2);

        // Verify tasks added
        let status = orchestrator.getQueueStatus();
        expect(status.totalTasks).toBe(2);

        // Execute processNextTask command
        const processHandler = getRegisteredCommandHandler('coe.processNextTask');
        expect(processHandler).toBeTruthy();
        if (!processHandler) return;

        await processHandler();

        await Promise.resolve();

        // Check final status
        status = orchestrator.getQueueStatus();
        expect(status.byStatus.ready).toBe(1);
    });

    it('sends LM Studio request (stream) with prompt body and logs response', async () => {
        await activate(buildContext());

        const orchestrator = getOrchestrator();
        expect(orchestrator).toBeTruthy();
        if (!orchestrator) return;

        const task: Task = {
            taskId: 'LM-1',
            title: 'Implement fetch call',
            description: 'Ensure LM Studio is called',
            priority: TaskPriority.P1,
            status: TaskStatus.READY,
            acceptanceCriteria: ['call lm studio'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            createdAt: new Date(),
            estimatedHours: 1,
        };

        orchestrator.addTask(task);

        const reader = {
            read: jest
                .fn()
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}' + '\n') })
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" world"}}]}' + '\n') })
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]' + '\n') })
                .mockResolvedValueOnce({ done: true, value: undefined }),
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/event-stream' },
            body: { getReader: () => reader },
        });

        const handler = getRegisteredCommandHandler('coe.processNextTask');
        expect(handler).toBeTruthy();
        if (!handler) return;

        await handler();

        const fetchCalls = fetchMock.mock.calls;
        expect(fetchCalls.length).toBe(1);
        const [url, init] = fetchCalls[0] as [string, RequestInit];
        expect(url).toBe('http://192.168.1.205:1234/v1/chat/completions');

        const body = JSON.parse((init.body as string) || '{}');
        expect(body.model).toBe('mistralai/ministral-3-14b-reasoning');
        expect(body.messages[1].content).toContain(task.title);

        // Check that response-related logs exist (new format uses separators and "Received response")
        const allLogs = outputChannelMock.appendLine.mock.calls
            .map(call => call[0] as string);

        // Check for response logging (might be "Received response" or contain model reply section)
        const hasResponseLog = allLogs.some(line =>
            line.includes('Received response') ||
            line.includes('Model Reply') ||
            line.includes('Hello') ||  // Part of the mocked response
            line === '─'.repeat(60)     // New separator format
        );
        expect(hasResponseLog).toBeTruthy();

        const infoPopup = (vscode.window.showInformationMessage as jest.Mock).mock.calls
            .map(call => call[0]);
        expect(infoPopup.some(msg => String(msg).includes('AI responded — task complete'))).toBe(true);
    });

    it('filters streaming metadata and only logs clean model text', async () => {
        await activate(buildContext());

        const orchestrator = getOrchestrator();
        expect(orchestrator).toBeTruthy();
        if (!orchestrator) return;

        const task: Task = {
            taskId: 'LM-meta-1',
            title: 'Clean streaming output',
            description: 'Ensure metadata is filtered',
            priority: TaskPriority.P1,
            status: TaskStatus.READY,
            acceptanceCriteria: ['clean log'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            createdAt: new Date(),
            estimatedHours: 1,
        };

        orchestrator.addTask(task);

        const reader = {
            read: jest
                .fn()
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}' + '\n') })
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" world"}}]}' + '\n') })
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"id":"chatcmpl-xyz","object":"chat.completion.chunk","choices":[{"delta":{},"finish_reason":"stop"}],"model":"mistral"}' + '\n') })
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]' + '\n') })
                .mockResolvedValueOnce({ done: true, value: undefined }),
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/event-stream' },
            body: { getReader: () => reader },
        });

        const handler = getRegisteredCommandHandler('coe.processNextTask');
        expect(handler).toBeTruthy();
        if (!handler) return;

        await handler();

        const logText = outputChannelMock.appendLine.mock.calls
            .map(call => String(call[0]))
            .join('\n');

        expect(logText).toContain('Hello world');
        expect(logText).not.toMatch(/chat\.completion\.chunk/);
        expect(logText).not.toMatch(/finish_reason/);
        expect(logText).not.toContain('[DONE]');
    });

    it('ignores malformed streaming chunks but keeps prior good content', async () => {
        await activate(buildContext());

        const orchestrator = getOrchestrator();
        expect(orchestrator).toBeTruthy();
        if (!orchestrator) return;

        const task: Task = {
            taskId: 'LM-malformed-1',
            title: 'Handle malformed chunks',
            description: 'Parser should skip bad JSON',
            priority: TaskPriority.P1,
            status: TaskStatus.READY,
            acceptanceCriteria: ['no crash on malformed chunk'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            createdAt: new Date(),
            estimatedHours: 1,
        };

        orchestrator.addTask(task);

        const reader = {
            read: jest
                .fn()
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Partial"}}]}' + '\n') })
                // malformed JSON chunk
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content"' + '\n') })
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" content"}}]}' + '\n') })
                .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]' + '\n') })
                .mockResolvedValueOnce({ done: true, value: undefined }),
        };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/event-stream' },
            body: { getReader: () => reader },
        });

        const handler = getRegisteredCommandHandler('coe.processNextTask');
        expect(handler).toBeTruthy();
        if (!handler) return;

        await handler();

        const logText = outputChannelMock.appendLine.mock.calls
            .map(call => String(call[0]))
            .join('\n');

        expect(logText).toContain('Partial content');
        expect(logText).not.toMatch(/SyntaxError/);
    });

    it('does not complete task and shows error when LM Studio is unreachable', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

        await activate(buildContext());

        const orchestrator = getOrchestrator();
        expect(orchestrator).toBeTruthy();
        if (!orchestrator) return;

        const task: Task = {
            taskId: 'LM-FAIL',
            title: 'Handle LM failure',
            description: 'Verify fallback simulation',
            priority: TaskPriority.P1,
            status: TaskStatus.READY,
            acceptanceCriteria: ['fallback runs'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            createdAt: new Date(),
            estimatedHours: 1,
        };

        orchestrator.addTask(task);

        const handler = getRegisteredCommandHandler('coe.processNextTask');
        expect(handler).toBeTruthy();
        if (!handler) return;

        await handler();

        await Promise.resolve();

        expect((vscode.window.showErrorMessage as jest.Mock).mock.calls.some(call =>
            String(call[0]).includes('LLM not responding')
        )).toBe(true);

        const status = orchestrator.getQueueStatus();
        expect(status.byStatus.ready).toBe(1);
        expect(status.currentTask).toBeNull();
    });

    it('shows "No tasks" in status bar when queue is empty', async () => {
        // Activate extension (no plan tasks loaded by mock)
        await activate(buildContext());

        const statusBar = getStatusBarItem();
        expect(statusBar).toBeTruthy();
        if (!statusBar) return;

        // Empty queue should show "No tasks"
        expect(statusBar.text).toContain('No tasks');
    });

    it('displays disabled message for test command when real tasks exist', async () => {
        await activate(buildContext());

        const orchestrator = getOrchestrator();
        expect(orchestrator).toBeTruthy();
        if (!orchestrator) return;

        // Add a real task to the queue
        orchestrator.addTask({
            taskId: 'REAL-1',
            title: 'Real Task',
            description: 'Do something',
            priority: TaskPriority.P1,
            status: TaskStatus.READY,
            acceptanceCriteria: ['ok'],
            dependencies: [],
            blockedBy: [],
            fromPlanningTeam: true,
            createdAt: new Date(),
            estimatedHours: 1,
        });

        const testHandler = getRegisteredCommandHandler('coe.testOrchestrator');
        expect(testHandler).toBeTruthy();
        if (!testHandler) return;

        await testHandler();

        // Should early return with disabled message
        expect((vscode.window.showInformationMessage as jest.Mock).mock.calls.some(call => {
            return String(call[0]) === 'Real tasks loaded — click status bar to process plan tasks!';
        })).toBe(true);
    });
});


/* jest manual mock for vscode */
/* eslint-disable @typescript-eslint/no-empty-function */

const noop = () => undefined;

const createOutputChannel = () => ({
    appendLine: noop,
    show: noop,
    dispose: noop,
});

const createStatusBarItem = () => ({
    text: '',
    tooltip: '',
    command: '',
    color: '',
    show: jest.fn(),
    dispose: jest.fn(),
});

const createWebviewPanel = () => ({
    webview: {
        html: '',
        onDidReceiveMessage: noop,
        postMessage: async () => true,
    },
    reveal: noop,
    onDidDispose: noop,
    dispose: noop,
});

export const window = {
    createOutputChannel: jest.fn(createOutputChannel),
    createStatusBarItem: jest.fn(createStatusBarItem),
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createWebviewPanel: jest.fn(createWebviewPanel),
    registerWebviewPanelSerializer: jest.fn(),
    withProgress: jest.fn((_opts, task) => task({ report: noop })),
};

export const commands = {
    registerCommand: jest.fn((_command: string, _handler: unknown) => ({ dispose: noop })),
    executeCommand: jest.fn(),
};

export const workspace = {
    getConfiguration: jest.fn(() => ({ get: noop, update: noop })),
    onDidChangeConfiguration: jest.fn(() => ({ dispose: noop })),
    workspaceFolders: [] as unknown[],
};

export const env = { openExternal: jest.fn() };

export const Uri = { parse: (value: string) => ({ fsPath: value }) };

export const ProgressLocation = { Notification: 15 } as const;

export const StatusBarAlignment = { Left: 1, Right: 2 } as const;

export class Disposable {
    dispose(): void { }
}

export default {
    window,
    commands,
    workspace,
    env,
    Uri,
    ProgressLocation,
    Disposable,
};

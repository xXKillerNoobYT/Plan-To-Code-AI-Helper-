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

const createTreeView = () => ({
    onDidChangeVisibility: jest.fn(),
    onDidChangeSelection: jest.fn(),
    dispose: jest.fn(),
    reveal: jest.fn(),
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
    createTreeView: jest.fn(createTreeView),
};

export const commands = {
    registerCommand: jest.fn((_command: string, _handler: unknown) => ({ dispose: noop })),
    executeCommand: jest.fn(),
};

export const workspace = {
    getConfiguration: jest.fn(() => ({ get: noop, update: noop })),
    onDidChangeConfiguration: jest.fn(() => ({ dispose: noop })),
    onDidSaveTextDocument: jest.fn(() => ({ dispose: noop })),
    workspaceFolders: [] as unknown[],
    createFileSystemWatcher: jest.fn(() => ({
        onDidChange: jest.fn(),
        onDidCreate: jest.fn(),
        onDidDelete: jest.fn(),
        dispose: jest.fn(),
    })),
    fs: {
        readFile: jest.fn(async () => new Uint8Array()),
        writeFile: jest.fn(async () => undefined),
        stat: jest.fn(async () => ({})),
        createDirectory: jest.fn(async () => undefined),
    },
};

export const env = { openExternal: jest.fn() };

export const Uri = { parse: (value: string) => ({ fsPath: value }) };

export const TreeItemCollapsibleState = { None: 0, Collapsed: 1, Expanded: 2 } as const;

export class TreeItem {
    label?: string;
    collapsibleState?: number;
    tooltip?: string;
    description?: string;
    iconPath?: unknown;
    command?: unknown;
    constructor(label?: string, collapsibleState?: number) {
        this.label = label;
        this.collapsibleState = collapsibleState;
    }
}

export class ThemeIcon {
    id: string;
    constructor(id: string) {
        this.id = id;
    }
}

export class MarkdownString {
    private value: string = '';
    constructor(value?: string) {
        if (value) {
            this.value = value;
        }
    }
    appendMarkdown(text: string): this {
        this.value += text;
        return this;
    }
    toString(): string {
        return this.value;
    }
}

export class EventEmitter<T> {
    private listeners: Array<(e: T) => unknown> = [];
    event = (listener: (e: T) => unknown) => {
        this.listeners.push(listener);
        return { dispose: noop };
    };
    fire(data?: T): void {
        this.listeners.forEach((l) => l(data as T));
    }
}

export const ProgressLocation = { Notification: 15 } as const;

export const StatusBarAlignment = { Left: 1, Right: 2 } as const;

export const languages = {
    createDiagnosticCollection: jest.fn(() => ({
        set: jest.fn(),
        clear: jest.fn(),
        dispose: jest.fn(),
    })),
};

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
    languages,
};

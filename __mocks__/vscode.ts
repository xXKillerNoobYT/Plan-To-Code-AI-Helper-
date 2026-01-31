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
    getConfiguration: jest.fn(() => ({
        get: jest.fn((_key: string, defaultValue?: any) => defaultValue),
        has: jest.fn(() => false),
        update: jest.fn()
    })),
    onDidChangeConfiguration: jest.fn(() => ({ dispose: noop })),
    onDidSaveTextDocument: jest.fn(() => ({ dispose: noop })),
    onDidChangeTextDocument: jest.fn(() => ({ dispose: noop })),
    onDidOpenTextDocument: jest.fn(() => ({ dispose: noop })),
    textDocuments: [] as unknown[],
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

export const Uri = {
    parse: (value: string) => ({
        fsPath: value,
        path: value,
        toString: () => value
    }),
    file: (path: string) => ({
        fsPath: path,
        path: path,
        scheme: 'file',
        toString: () => `file://${path}`
    }),
    joinPath: (base: any, ...pathSegments: string[]) => {
        const basePath = base.fsPath || base.path || base.toString();
        const joined = [basePath, ...pathSegments].join('/').replace(/\/+/g, '/');
        return {
            fsPath: joined,
            path: joined,
            scheme: base.scheme || 'file',
            toString: () => joined
        };
    }
};

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

export const ExtensionMode = {
    Production: 1,
    Development: 2,
    Test: 3,
} as const;

export const ExtensionKind = {
    UI: 1,
    Workspace: 2,
} as const;

export const languages = {
    createDiagnosticCollection: jest.fn(() => ({
        set: jest.fn(),
        clear: jest.fn(),
        delete: jest.fn(),
        dispose: jest.fn(),
    })),
};

export const DiagnosticSeverity = {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
} as const;

export class Diagnostic {
    range: Range;
    message: string;
    severity: number;
    source?: string;
    code?: string;

    constructor(range: Range, message: string, severity: number = 0) {
        this.range = range;
        this.message = message;
        this.severity = severity;
    }
}

export class Range {
    start: Position;
    end: Position;

    constructor(startLineOrPos: any, startColOrEnd?: any, endLine?: any, endCol?: any) {
        if (typeof startLineOrPos === 'number') {
            // Called as Range(startLine, startCol, endLine, endCol)
            this.start = new Position(startLineOrPos, startColOrEnd);
            this.end = new Position(endLine, endCol);
        } else if (startLineOrPos instanceof Position) {
            // Called as Range(startPos, endPos)
            this.start = startLineOrPos;
            this.end = startColOrEnd;
        } else {
            // Fallback
            this.start = new Position(0, 0);
            this.end = new Position(0, 0);
        }
    }
}

export class Position {
    line: number;
    character: number;

    constructor(line: number, character: number) {
        this.line = line;
        this.character = character;
    }
}

export class RelativePattern {
    base: string;
    pattern: string;

    constructor(base: string | { uri: { fsPath: string } }, pattern: string) {
        this.base = typeof base === 'string' ? base : base.uri.fsPath;
        this.pattern = pattern;
    }
}

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
    DiagnosticSeverity,
    Diagnostic,
    Range,
    Position,
    RelativePattern,
    StatusBarAlignment,
    ExtensionMode,
    ExtensionKind,
};

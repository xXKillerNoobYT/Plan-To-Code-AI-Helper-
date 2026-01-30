// ./api.web.spec.ts

import { GitHubAPI } from '../../src/github/api';
import * as vscode from 'vscode';

/** @aiContributed-2026-01-29 */
describe('GitHubAPI - setContext', () => {
  let gitHubAPI: GitHubAPI;

  beforeEach(() => {
    gitHubAPI = new GitHubAPI();
  });

  /** @aiContributed-2026-01-29 */
    it('should set the context correctly', () => {
    const scopedEnvironmentCollection = {
      persistent: true,
      description: 'mocked env collection',
      replace: jest.fn(),
      append: jest.fn(),
      prepend: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      forEach: jest.fn(),
      [Symbol.iterator]: jest.fn(function* () {
        return undefined as unknown as IterableIterator<[string, unknown]>;
      }),
    } as vscode.EnvironmentVariableCollection;

    const mockContext: vscode.ExtensionContext = {
      subscriptions: [],
      workspaceState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn(() => []),
      },
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
        setKeysForSync: jest.fn(),
        keys: jest.fn(() => []),
      },
      storageUri: vscode.Uri.parse('file:///mock/storage-uri'),
      globalStorageUri: vscode.Uri.parse('file:///mock/global-storage-uri'),
      logUri: vscode.Uri.parse('file:///mock/log-uri'),
      extensionMode: vscode.ExtensionMode.Development,
      extension: {
        id: 'mock.extension',
        extensionUri: vscode.Uri.parse('file:///mock/extension'),
        extensionPath: '/mock/extension',
        packageJSON: {},
        isActive: true,
        exports: {},
        activate: jest.fn(async () => ({})),
        extensionKind: vscode.ExtensionKind.UI,
      } as unknown as vscode.Extension<unknown>,
      languageModelAccessInformation: {} as vscode.LanguageModelAccessInformation,
      extensionUri: vscode.Uri.parse('file:///mock'),
      extensionPath: '/mock',
      asAbsolutePath: jest.fn(),
      storagePath: '/mock/storage',
      globalStoragePath: '/mock/globalStorage',
      logPath: '/mock/logs',
      environmentVariableCollection: {
        persistent: true,
        description: 'mocked env collection',
        replace: jest.fn(),
        append: jest.fn(),
        prepend: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn(),
        forEach: jest.fn(),
        [Symbol.iterator]: jest.fn(function* () {
          return undefined as unknown as IterableIterator<[string, unknown]>;
        }),
        getScoped: jest.fn(() => scopedEnvironmentCollection),
      },
      secrets: {
        store: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
        onDidChange: jest.fn(),
        keys: jest.fn(async () => []),
      },
    };

    (gitHubAPI as any).setContext(mockContext);

    expect((gitHubAPI as any).context).toBe(mockContext);
  });
});
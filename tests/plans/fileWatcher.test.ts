/**
 * Test Suite: fileWatcher.ts
 * Tests for file system watching and event handling
 */

import * as vscode from 'vscode';
import { FileWatcher } from '../../src/plans/fileWatcher';

// Mock vscode module
jest.mock('vscode', () => ({
  workspace: {
    createFileSystemWatcher: jest.fn(),
  },
}));

describe('FileWatcher', () => {
  let fileWatcher: FileWatcher;
  let mockWatcher: any;
  let mockUri: vscode.Uri;

  beforeEach(() => {
    // Create mock watcher with event emitters
    mockWatcher = {
      onDidChange: jest.fn(),
      onDidCreate: jest.fn(),
      onDidDelete: jest.fn(),
      dispose: jest.fn(),
    };

    // Mock URI
    mockUri = { fsPath: '/path/to/file.json' } as vscode.Uri;

    // Setup mock implementation
    (vscode.workspace.createFileSystemWatcher as jest.Mock).mockReturnValue(mockWatcher);

    fileWatcher = new FileWatcher();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a new FileWatcher instance', () => {
      expect(fileWatcher).toBeDefined();
      expect(fileWatcher).toBeInstanceOf(FileWatcher);
    });

    it('should not create a watcher on instantiation', () => {
      expect(vscode.workspace.createFileSystemWatcher).not.toHaveBeenCalled();
    });
  });

  describe('startWatching', () => {
    it('should create a file system watcher with default pattern', () => {
      fileWatcher.startWatching();

      expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledWith('**/Plans/**/*.json');
    });

    it('should create a file system watcher with custom pattern', () => {
      const customPattern = '**/src/**/*.ts';
      fileWatcher.startWatching(customPattern);

      expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledWith(customPattern);
    });

    it('should register onDidChange handler', () => {
      fileWatcher.startWatching();

      expect(mockWatcher.onDidChange).toHaveBeenCalled();
    });

    it('should register onDidCreate handler', () => {
      fileWatcher.startWatching();

      expect(mockWatcher.onDidCreate).toHaveBeenCalled();
    });

    it('should register onDidDelete handler', () => {
      fileWatcher.startWatching();

      expect(mockWatcher.onDidDelete).toHaveBeenCalled();
    });
  });

  describe('stopWatching', () => {
    it('should dispose the watcher', () => {
      fileWatcher.startWatching();
      fileWatcher.stopWatching();

      expect(mockWatcher.dispose).toHaveBeenCalled();
    });

    it('should not throw error when stopping without starting', () => {
      expect(() => {
        fileWatcher.stopWatching();
      }).not.toThrow();
    });

    it('should allow restarting after stopping', () => {
      fileWatcher.startWatching();
      fileWatcher.stopWatching();
      
      jest.clearAllMocks();
      
      fileWatcher.startWatching();

      expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalled();
    });
  });

  describe('onFileChange', () => {
    it('should register a change handler', () => {
      const handler = jest.fn();
      fileWatcher.onFileChange(handler);
      
      fileWatcher.startWatching();
      
      // Trigger onChange
      const onChangeCallback = mockWatcher.onDidChange.mock.calls[0][0];
      onChangeCallback(mockUri);

      expect(handler).toHaveBeenCalledWith(mockUri);
    });

    it('should support multiple change handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      fileWatcher.onFileChange(handler1);
      fileWatcher.onFileChange(handler2);
      fileWatcher.onFileChange(handler3);
      
      fileWatcher.startWatching();
      
      const onChangeCallback = mockWatcher.onDidChange.mock.calls[0][0];
      onChangeCallback(mockUri);

      expect(handler1).toHaveBeenCalledWith(mockUri);
      expect(handler2).toHaveBeenCalledWith(mockUri);
      expect(handler3).toHaveBeenCalledWith(mockUri);
    });

    it('should handle handler errors gracefully', () => {
      const goodHandler = jest.fn();
      const badHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      fileWatcher.onFileChange(badHandler);
      fileWatcher.onFileChange(goodHandler);
      
      fileWatcher.startWatching();
      
      const onChangeCallback = mockWatcher.onDidChange.mock.calls[0][0];
      
      // Should not throw despite bad handler
      expect(() => {
        onChangeCallback(mockUri);
      }).not.toThrow();

      expect(goodHandler).toHaveBeenCalledWith(mockUri);
    });
  });

  describe('File Change Events', () => {
    it('should trigger handlers on file change', () => {
      const handler = jest.fn();
      fileWatcher.onFileChange(handler);
      fileWatcher.startWatching();
      
      const onChangeCallback = mockWatcher.onDidChange.mock.calls[0][0];
      onChangeCallback(mockUri);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should trigger handlers on file create', () => {
      const handler = jest.fn();
      fileWatcher.onFileChange(handler);
      fileWatcher.startWatching();
      
      const onCreateCallback = mockWatcher.onDidCreate.mock.calls[0][0];
      onCreateCallback(mockUri);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should trigger handlers on file delete', () => {
      const handler = jest.fn();
      fileWatcher.onFileChange(handler);
      fileWatcher.startWatching();
      
      const onDeleteCallback = mockWatcher.onDidDelete.mock.calls[0][0];
      onDeleteCallback(mockUri);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should pass correct URI to handlers', () => {
      const handler = jest.fn();
      fileWatcher.onFileChange(handler);
      fileWatcher.startWatching();
      
      const onChangeCallback = mockWatcher.onDidChange.mock.calls[0][0];
      const testUri = { fsPath: '/test/path.json' } as vscode.Uri;
      onChangeCallback(testUri);

      expect(handler).toHaveBeenCalledWith(testUri);
    });

    it('should handle multiple file changes sequentially', () => {
      const handler = jest.fn();
      fileWatcher.onFileChange(handler);
      fileWatcher.startWatching();
      
      const onChangeCallback = mockWatcher.onDidChange.mock.calls[0][0];
      
      const uri1 = { fsPath: '/file1.json' } as vscode.Uri;
      const uri2 = { fsPath: '/file2.json' } as vscode.Uri;
      const uri3 = { fsPath: '/file3.json' } as vscode.Uri;

      onChangeCallback(uri1);
      onChangeCallback(uri2);
      onChangeCallback(uri3);

      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler).toHaveBeenNthCalledWith(1, uri1);
      expect(handler).toHaveBeenNthCalledWith(2, uri2);
      expect(handler).toHaveBeenNthCalledWith(3, uri3);
    });
  });

  describe('Dispose', () => {
    it('should dispose the watcher', () => {
      fileWatcher.startWatching();
      fileWatcher.dispose();

      expect(mockWatcher.dispose).toHaveBeenCalled();
    });

    it('should clean up resources on dispose', () => {
      fileWatcher.startWatching();
      expect(mockWatcher.dispose).not.toHaveBeenCalled();
      
      fileWatcher.dispose();
      expect(mockWatcher.dispose).toHaveBeenCalled();
    });

    it('should handle dispose when not watching', () => {
      expect(() => {
        fileWatcher.dispose();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle watching with empty pattern', () => {
      fileWatcher.startWatching('');

      expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledWith('');
    });

    it('should handle registering handlers before watching', () => {
      const handler = jest.fn();
      fileWatcher.onFileChange(handler);
      fileWatcher.startWatching();
      
      const onChangeCallback = mockWatcher.onDidChange.mock.calls[0][0];
      onChangeCallback(mockUri);

      expect(handler).toHaveBeenCalled();
    });

    it('should handle multiple start/stop cycles', () => {
      fileWatcher.startWatching();
      fileWatcher.stopWatching();
      fileWatcher.startWatching();
      fileWatcher.stopWatching();

      expect(mockWatcher.dispose).toHaveBeenCalledTimes(2);
    });
  });

  describe('Handler Error Resilience', () => {
    it('should continue calling other handlers if one throws', () => {
      const handler1 = jest.fn().mockImplementation(() => {
        throw new Error('Handler 1 error');
      });
      const handler2 = jest.fn();
      const handler3 = jest.fn().mockImplementation(() => {
        throw new Error('Handler 3 error');
      });

      fileWatcher.onFileChange(handler1);
      fileWatcher.onFileChange(handler2);
      fileWatcher.onFileChange(handler3);
      
      fileWatcher.startWatching();
      
      const onChangeCallback = mockWatcher.onDidChange.mock.calls[0][0];
      onChangeCallback(mockUri);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });
  });
});

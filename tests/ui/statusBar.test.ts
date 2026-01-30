/**
 * Test Suite: statusBar.ts
 * Tests for VS Code status bar integration
 */

import * as vscode from 'vscode';
import { StatusBarManager } from '../../src/ui/statusBar';

// Mock vscode module
jest.mock('vscode', () => ({
  window: {
    createStatusBarItem: jest.fn(),
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2,
  },
}));

describe('StatusBarManager', () => {
  let statusBarManager: StatusBarManager;
  let mockTaskCountItem: any;
  let mockSyncStatusItem: any;

  beforeEach(() => {
    // Create mock status bar items
    mockTaskCountItem = {
      text: '',
      tooltip: '',
      command: '',
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn(),
    };

    mockSyncStatusItem = {
      text: '',
      tooltip: '',
      command: '',
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn(),
    };

    const createStatusBarItemMock = vscode.window.createStatusBarItem as jest.Mock;
    createStatusBarItemMock.mockImplementation((alignment, priority) => {
      if (priority === 100) {
        return mockTaskCountItem;
      } else if (priority === 99) {
        return mockSyncStatusItem;
      }
    });

    statusBarManager = new StatusBarManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create StatusBarManager instance', () => {
      expect(statusBarManager).toBeDefined();
      expect(statusBarManager).toBeInstanceOf(StatusBarManager);
    });

    it('should create status bar items on initialization', () => {
      expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(2);
    });

    it('should set command for task count item', () => {
      expect(mockTaskCountItem.command).toBe('coe.showTasks');
    });

    it('should set command for sync status item', () => {
      expect(mockSyncStatusItem.command).toBe('coe.syncNow');
    });

    it('should use correct alignment (Left)', () => {
      const calls = (vscode.window.createStatusBarItem as jest.Mock).mock.calls;
      expect(calls[0][0]).toBe(vscode.StatusBarAlignment.Left);
      expect(calls[1][0]).toBe(vscode.StatusBarAlignment.Left);
    });

    it('should use correct priorities', () => {
      const calls = (vscode.window.createStatusBarItem as jest.Mock).mock.calls;
      expect(calls[0][1]).toBe(100); // Task count
      expect(calls[1][1]).toBe(99); // Sync status
    });
  });

  describe('show', () => {
    it('should show both status bar items', () => {
      statusBarManager.show();

      expect(mockTaskCountItem.show).toHaveBeenCalled();
      expect(mockSyncStatusItem.show).toHaveBeenCalled();
    });

    it('should call show method on each item', () => {
      statusBarManager.show();

      expect(mockTaskCountItem.show).toHaveBeenCalledTimes(1);
      expect(mockSyncStatusItem.show).toHaveBeenCalledTimes(1);
    });
  });

  describe('hide', () => {
    it('should hide both status bar items', () => {
      statusBarManager.hide();

      expect(mockTaskCountItem.hide).toHaveBeenCalled();
      expect(mockSyncStatusItem.hide).toHaveBeenCalled();
    });

    it('should call hide method on each item', () => {
      statusBarManager.hide();

      expect(mockTaskCountItem.hide).toHaveBeenCalledTimes(1);
      expect(mockSyncStatusItem.hide).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateTaskCount', () => {
    it('should update task count display', () => {
      statusBarManager.updateTaskCount(5, 20);

      expect(mockTaskCountItem.text).toBe('$(checklist) 5/20 tasks');
    });

    it('should set tooltip with pending count', () => {
      statusBarManager.updateTaskCount(5, 20);

      expect(mockTaskCountItem.tooltip).toBe('5 pending tasks out of 20 total');
    });

    it('should handle zero pending tasks', () => {
      statusBarManager.updateTaskCount(0, 10);

      expect(mockTaskCountItem.text).toBe('$(checklist) 0/10 tasks');
      expect(mockTaskCountItem.tooltip).toBe('0 pending tasks out of 10 total');
    });

    it('should handle all tasks pending', () => {
      statusBarManager.updateTaskCount(10, 10);

      expect(mockTaskCountItem.text).toBe('$(checklist) 10/10 tasks');
      expect(mockTaskCountItem.tooltip).toBe('10 pending tasks out of 10 total');
    });

    it('should handle large numbers', () => {
      statusBarManager.updateTaskCount(1000, 5000);

      expect(mockTaskCountItem.text).toBe('$(checklist) 1000/5000 tasks');
    });

    it('should update text dynamically', () => {
      statusBarManager.updateTaskCount(5, 20);
      expect(mockTaskCountItem.text).toBe('$(checklist) 5/20 tasks');

      statusBarManager.updateTaskCount(10, 20);
      expect(mockTaskCountItem.text).toBe('$(checklist) 10/20 tasks');

      statusBarManager.updateTaskCount(20, 20);
      expect(mockTaskCountItem.text).toBe('$(checklist) 20/20 tasks');
    });
  });

  describe('updateSyncStatus - Idle', () => {
    it('should display idle status', () => {
      statusBarManager.updateSyncStatus('idle');

      expect(mockSyncStatusItem.text).toBe('$(sync) Synced');
    });

    it('should show synced message for idle status', () => {
      statusBarManager.updateSyncStatus('idle');

      expect(mockSyncStatusItem.text).toContain('Synced');
    });

    it('should set tooltip to not synced yet when no lastSync', () => {
      statusBarManager.updateSyncStatus('idle');

      expect(mockSyncStatusItem.tooltip).toBe('Not synced yet');
    });

    it('should show last sync time when provided', () => {
      const lastSync = new Date('2026-01-29T14:30:00Z');
      statusBarManager.updateSyncStatus('idle', lastSync);

      expect(mockSyncStatusItem.tooltip).toContain('Last sync:');
    });

    it('should format last sync time correctly', () => {
      const lastSync = new Date('2026-01-29T14:30:00Z');
      statusBarManager.updateSyncStatus('idle', lastSync);

      // Should contain time portion
      expect(mockSyncStatusItem.tooltip).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });
  });

  describe('updateSyncStatus - Syncing', () => {
    it('should display syncing status', () => {
      statusBarManager.updateSyncStatus('syncing');

      expect(mockSyncStatusItem.text).toBe('$(sync~spin) Syncing...');
    });

    it('should show syncing tooltip', () => {
      statusBarManager.updateSyncStatus('syncing');

      expect(mockSyncStatusItem.tooltip).toBe('Syncing with GitHub...');
    });

    it('should use spinning sync icon', () => {
      statusBarManager.updateSyncStatus('syncing');

      expect(mockSyncStatusItem.text).toContain('sync~spin');
    });
  });

  describe('updateSyncStatus - Error', () => {
    it('should display error status', () => {
      statusBarManager.updateSyncStatus('error');

      expect(mockSyncStatusItem.text).toBe('$(error) Sync Error');
    });

    it('should show error tooltip', () => {
      statusBarManager.updateSyncStatus('error');

      expect(mockSyncStatusItem.tooltip).toBe('GitHub sync failed. Click to retry.');
    });

    it('should use error icon', () => {
      statusBarManager.updateSyncStatus('error');

      expect(mockSyncStatusItem.text).toContain('error');
    });
  });

  describe('Status Transitions', () => {
    it('should transition from idle to syncing', () => {
      statusBarManager.updateSyncStatus('idle');
      expect(mockSyncStatusItem.text).toBe('$(sync) Synced');

      statusBarManager.updateSyncStatus('syncing');
      expect(mockSyncStatusItem.text).toBe('$(sync~spin) Syncing...');
    });

    it('should transition from syncing to idle', () => {
      statusBarManager.updateSyncStatus('syncing');
      expect(mockSyncStatusItem.text).toBe('$(sync~spin) Syncing...');

      statusBarManager.updateSyncStatus('idle');
      expect(mockSyncStatusItem.text).toBe('$(sync) Synced');
    });

    it('should transition from syncing to error', () => {
      statusBarManager.updateSyncStatus('syncing');
      expect(mockSyncStatusItem.text).toBe('$(sync~spin) Syncing...');

      statusBarManager.updateSyncStatus('error');
      expect(mockSyncStatusItem.text).toBe('$(error) Sync Error');
    });

    it('should transition from error to idle', () => {
      statusBarManager.updateSyncStatus('error');
      expect(mockSyncStatusItem.text).toBe('$(error) Sync Error');

      statusBarManager.updateSyncStatus('idle');
      expect(mockSyncStatusItem.text).toBe('$(sync) Synced');
    });
  });

  describe('dispose', () => {
    it('should dispose both status bar items', () => {
      statusBarManager.dispose();

      expect(mockTaskCountItem.dispose).toHaveBeenCalled();
      expect(mockSyncStatusItem.dispose).toHaveBeenCalled();
    });

    it('should call dispose method on each item', () => {
      statusBarManager.dispose();

      expect(mockTaskCountItem.dispose).toHaveBeenCalledTimes(1);
      expect(mockSyncStatusItem.dispose).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call multiple times', () => {
      statusBarManager.dispose();
      statusBarManager.dispose();

      // Each item.dispose() called once per call to manager.dispose()
      expect(mockTaskCountItem.dispose).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration', () => {
    it('should update both items independently', () => {
      statusBarManager.updateTaskCount(3, 10);
      statusBarManager.updateSyncStatus('syncing');

      expect(mockTaskCountItem.text).toBe('$(checklist) 3/10 tasks');
      expect(mockSyncStatusItem.text).toBe('$(sync~spin) Syncing...');
    });

    it('should show and hide both items', () => {
      statusBarManager.show();
      expect(mockTaskCountItem.show).toHaveBeenCalledTimes(1);
      expect(mockSyncStatusItem.show).toHaveBeenCalledTimes(1);

      statusBarManager.hide();
      expect(mockTaskCountItem.hide).toHaveBeenCalledTimes(1);
      expect(mockSyncStatusItem.hide).toHaveBeenCalledTimes(1);
    });

    it('should handle full lifecycle', () => {
      statusBarManager.updateTaskCount(5, 20);
      statusBarManager.updateSyncStatus('idle');

      statusBarManager.show();
      expect(mockTaskCountItem.show).toHaveBeenCalled();

      statusBarManager.updateTaskCount(10, 20);
      statusBarManager.updateSyncStatus('syncing');

      statusBarManager.hide();
      expect(mockTaskCountItem.hide).toHaveBeenCalled();

      statusBarManager.dispose();
      expect(mockTaskCountItem.dispose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle status update with same values', () => {
      statusBarManager.updateSyncStatus('idle');
      statusBarManager.updateSyncStatus('idle');

      expect(mockSyncStatusItem.text).toBe('$(sync) Synced');
    });

    it('should handle task count with same values', () => {
      statusBarManager.updateTaskCount(5, 10);
      statusBarManager.updateTaskCount(5, 10);

      expect(mockTaskCountItem.text).toBe('$(checklist) 5/10 tasks');
    });

    it('should handle rapid status changes', () => {
      for (let i = 0; i < 10; i++) {
        statusBarManager.updateSyncStatus(i % 3 === 0 ? 'idle' : i % 3 === 1 ? 'syncing' : 'error');
      }

      // Should be on idle (last iteration: 9 % 3 === 0)
      expect(mockSyncStatusItem.text).toBe('$(sync) Synced');
    });
  });
});

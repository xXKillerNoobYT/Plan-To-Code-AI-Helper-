/**
 * Test Suite: plansPanel.ts
 * Tests for plans webview UI panel
 */

import * as vscode from 'vscode';
import { PlansPanel } from '../../src/ui/plansPanel';

// Mock vscode module
jest.mock('vscode', () => ({
  window: {
    createWebviewPanel: jest.fn(),
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
  },
}));

describe('PlansPanel', () => {
  let plansPanel: PlansPanel;
  let mockWebviewPanel: any;
  let mockContext: any;

  beforeEach(() => {
    // Create mock webview panel
    mockWebviewPanel = {
      webview: {
        html: '',
        postMessage: jest.fn(),
      },
      onDidDispose: jest.fn(),
      reveal: jest.fn(),
    };

    // Create mock context
    mockContext = {
      subscriptions: {
        push: jest.fn(),
      },
    };

    // Setup mock implementation
    (vscode.window.createWebviewPanel as jest.Mock).mockReturnValue(mockWebviewPanel);

    plansPanel = new PlansPanel();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a PlansPanel instance', () => {
      expect(plansPanel).toBeDefined();
      expect(plansPanel).toBeInstanceOf(PlansPanel);
    });

    it('should not create panel on instantiation', () => {
      expect(vscode.window.createWebviewPanel).not.toHaveBeenCalled();
    });
  });

  describe('show', () => {
    it('should create a webview panel', () => {
      plansPanel.show(mockContext);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
    });

    it('should create panel with correct view type', () => {
      plansPanel.show(mockContext);

      const args = (vscode.window.createWebviewPanel as jest.Mock).mock.calls[0];
      expect(args[0]).toBe('coePlans');
    });

    it('should create panel with correct title', () => {
      plansPanel.show(mockContext);

      const args = (vscode.window.createWebviewPanel as jest.Mock).mock.calls[0];
      expect(args[1]).toBe('COE Plans');
    });

    it('should create panel in ViewColumn.Two', () => {
      plansPanel.show(mockContext);

      const args = (vscode.window.createWebviewPanel as jest.Mock).mock.calls[0];
      expect(args[2]).toBe(vscode.ViewColumn.Two);
    });

    it('should enable scripts in webview', () => {
      plansPanel.show(mockContext);

      const args = (vscode.window.createWebviewPanel as jest.Mock).mock.calls[0];
      expect(args[3].enableScripts).toBe(true);
    });

    it('should retain context when hidden', () => {
      plansPanel.show(mockContext);

      const args = (vscode.window.createWebviewPanel as jest.Mock).mock.calls[0];
      expect(args[3].retainContextWhenHidden).toBe(true);
    });

    it('should set webview content', () => {
      plansPanel.show(mockContext);

      expect(mockWebviewPanel.webview.html).toBeDefined();
      expect(typeof mockWebviewPanel.webview.html).toBe('string');
    });

    it('should register dispose handler', () => {
      plansPanel.show(mockContext);

      expect(mockWebviewPanel.onDidDispose).toHaveBeenCalled();
    });

    it('should reveal panel if already open', () => {
      plansPanel.show(mockContext);
      plansPanel.show(mockContext);

      // First call creates panel, second call reveals
      expect(mockWebviewPanel.reveal).toHaveBeenCalled();
    });

    it('should not create multiple panels', () => {
      plansPanel.show(mockContext);
      plansPanel.show(mockContext);
      plansPanel.show(mockContext);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTML Content', () => {
    it('should generate valid HTML', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('should include head section', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
    });

    it('should include body section', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('should include proper meta tags', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('charset');
      expect(html).toContain('viewport');
    });

    it('should have page title', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('<title>COE Plans</title>');
    });

    it('should include CSS styling', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    it('should use VS Code color variables', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('--vscode-');
    });

    it('should include heading element', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('<h1>');
      expect(html).toContain('Plan');
    });

    it('should have content container', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('id="plan-content"');
    });

    it('should include script section', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('<script>');
      expect(html).toContain('</script>');
    });

    it('should acquire VS Code API', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('acquireVsCodeApi');
    });

    it('should listen for messages', () => {
      plansPanel.show(mockContext);

      const html = mockWebviewPanel.webview.html;
      expect(html).toContain('addEventListener');
      expect(html).toContain('message');
    });
  });

  describe('updatePlanContent', () => {
    it('should post message to webview', () => {
      plansPanel.show(mockContext);

      const planData = { version: '1.0', tasks: [] };
      plansPanel.updatePlanContent(planData);

      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'updatePlan',
          data: planData,
        })
      );
    });

    it('should include updatePlan command', () => {
      plansPanel.show(mockContext);

      const planData = { test: 'data' };
      plansPanel.updatePlanContent(planData);

      const call = mockWebviewPanel.webview.postMessage.mock.calls[0][0];
      expect(call.command).toBe('updatePlan');
    });

    it('should pass plan data correctly', () => {
      plansPanel.show(mockContext);

      const planData = {
        version: '2.0.0',
        project: 'Test Project',
        tasks: [{ id: 1, title: 'Task 1' }],
      };

      plansPanel.updatePlanContent(planData);

      const call = mockWebviewPanel.webview.postMessage.mock.calls[0][0];
      expect(call.data).toEqual(planData);
    });

    it('should not update if panel not shown', () => {
      const planData = { test: 'data' };
      plansPanel.updatePlanContent(planData);

      expect(mockWebviewPanel.webview.postMessage).not.toHaveBeenCalled();
    });

    it('should handle complex plan objects', () => {
      plansPanel.show(mockContext);

      const complexPlan = {
        version: '1.0.0',
        project: 'Complex Project',
        phases: [
          {
            phaseId: 'phase-1',
            name: 'Planning',
            tasks: ['task-1', 'task-2'],
          },
        ],
        tasks: [
          {
            taskId: 'task-1',
            title: 'Task 1',
            priority: 'high',
            dependencies: [],
          },
        ],
        metadata: {
          totalTasks: 1,
          completedTasks: 0,
        },
      };

      plansPanel.updatePlanContent(complexPlan);

      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: complexPlan,
        })
      );
    });

    it('should handle null data', () => {
      plansPanel.show(mockContext);

      plansPanel.updatePlanContent(null);

      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: null,
        })
      );
    });

    it('should handle empty object', () => {
      plansPanel.show(mockContext);

      plansPanel.updatePlanContent({});

      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {},
        })
      );
    });
  });

  describe('Panel Lifecycle', () => {
    it('should handle panel disposal', () => {
      plansPanel.show(mockContext);

      const disposeCallback = mockWebviewPanel.onDidDispose.mock.calls[0][0];
      disposeCallback();

      // After disposal, panel reference should be cleared
      // Next show should create new panel
      jest.clearAllMocks();
      (vscode.window.createWebviewPanel as jest.Mock).mockReturnValue(mockWebviewPanel);

      plansPanel.show(mockContext);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
    });

    it('should be able to show panel again after disposal', () => {
      plansPanel.show(mockContext);

      // Trigger dispose
      const disposeCallback = mockWebviewPanel.onDidDispose.mock.calls[0][0];
      disposeCallback();

      // Show again
      jest.clearAllMocks();
      (vscode.window.createWebviewPanel as jest.Mock).mockReturnValue(mockWebviewPanel);

      plansPanel.show(mockContext);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
    });
  });

  describe('Message Communication', () => {
    it('should support bidirectional communication through message passing', () => {
      plansPanel.show(mockContext);

      const planData = { version: '1.0', tasks: [{ id: 1 }] };
      plansPanel.updatePlanContent(planData);

      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalled();
    });

    it('should handle multiple updates', () => {
      plansPanel.show(mockContext);

      plansPanel.updatePlanContent({ version: '1.0' });
      plansPanel.updatePlanContent({ version: '2.0' });
      plansPanel.updatePlanContent({ version: '3.0' });

      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large plan objects', () => {
      plansPanel.show(mockContext);

      const largePlan = {
        tasks: Array.from({ length: 1000 }, (_, i) => ({
          taskId: `task-${i}`,
          title: `Task ${i}`,
        })),
      };

      plansPanel.updatePlanContent(largePlan);

      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalled();
    });

    it('should handle special characters in plan data', () => {
      plansPanel.show(mockContext);

      const planData = {
        title: 'Plan with special chars: !@#$%^&*()',
        description: 'Contains "quotes" and \'apostrophes\'',
      };

      plansPanel.updatePlanContent(planData);

      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalled();
    });

    it('should handle unicode in plan data', () => {
      plansPanel.show(mockContext);

      const planData = {
        title: 'Plan 📋 中文 Ελληνικά',
        tasks: ['タスク1', '🎯 Goal'],
      };

      plansPanel.updatePlanContent(planData);

      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalled();
    });

    it('should handle circular references in plan data gracefully', () => {
      plansPanel.show(mockContext);

      const planData: any = { name: 'Test' };
      planData.self = planData; // Circular reference

      // Should not throw
      expect(() => {
        plansPanel.updatePlanContent(planData);
      }).not.toThrow();
    });

    it('should handle rapid show/update calls', () => {
      plansPanel.show(mockContext);
      plansPanel.updatePlanContent({ version: '1.0' });
      plansPanel.updatePlanContent({ version: '2.0' });
      plansPanel.updatePlanContent({ version: '3.0' });

      expect(mockWebviewPanel.webview.postMessage).toHaveBeenCalledTimes(3);
      expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Context Integration', () => {
    it('should accept extension context', () => {
      expect(() => {
        plansPanel.show(mockContext);
      }).not.toThrow();
    });
  });
});

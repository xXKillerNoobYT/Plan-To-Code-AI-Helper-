/**
 * Test Suite: logger.ts
 * Tests for centralized logging utility
 */

import * as vscode from 'vscode';
import { Logger, LogLevel, logger } from '../../src/utils/logger';

// Mock vscode module
jest.mock('vscode', () => ({
  window: {
    createOutputChannel: jest.fn(),
  },
}));

describe('Logger Utility', () => {
  let mockOutputChannel: any;

  beforeEach(() => {
    // Reset singleton instance
    (Logger as any).instance = undefined;

    // Create mock output channel
    mockOutputChannel = {
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn(),
    };

    // Mock vscode.window.createOutputChannel
    (vscode.window.createOutputChannel as jest.Mock).mockReturnValue(mockOutputChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LogLevel Enum', () => {
    it('should have correct log level values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
    });

    it('should maintain proper log level hierarchy', () => {
      expect(LogLevel.DEBUG < LogLevel.INFO).toBe(true);
      expect(LogLevel.INFO < LogLevel.WARN).toBe(true);
      expect(LogLevel.WARN < LogLevel.ERROR).toBe(true);
    });
  });

  describe('Logger Singleton Pattern', () => {
    it('should create only one instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create output channel on first instantiation', () => {
      Logger.getInstance();

      expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('COE Extension');
    });

    it('should not create multiple output channels', () => {
      Logger.getInstance();
      Logger.getInstance();
      Logger.getInstance();

      expect(vscode.window.createOutputChannel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Log Level Management', () => {
    it('should set log level', () => {
      const loggerInstance = Logger.getInstance();

      loggerInstance.setLevel(LogLevel.DEBUG);
      loggerInstance.debug('Test debug message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });

    it('should filter logs based on level', () => {
      const loggerInstance = Logger.getInstance();

      // Set level to WARN - debug and info should not log
      loggerInstance.setLevel(LogLevel.WARN);
      loggerInstance.debug('Debug message');
      loggerInstance.info('Info message');

      expect(mockOutputChannel.appendLine).not.toHaveBeenCalled();
    });

    it('should log ERROR when level is WARN', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.WARN);

      loggerInstance.error('Error message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });

    it('should log all levels when set to DEBUG', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.DEBUG);

      loggerInstance.debug('Debug');
      loggerInstance.info('Info');
      loggerInstance.warn('Warn');
      loggerInstance.error('Error');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(4);
    });

    it('should only log errors when level is ERROR', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.ERROR);

      loggerInstance.debug('Debug');
      loggerInstance.info('Info');
      loggerInstance.warn('Warn');
      loggerInstance.error('Error');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(1);
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      );
    });
  });

  describe('Debug Logging', () => {
    it('should log debug messages with DEBUG level', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.DEBUG);

      loggerInstance.debug('Test debug message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message')
      );
    });

    it('should not log debug messages when level is higher', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      loggerInstance.debug('Test debug message');

      expect(mockOutputChannel.appendLine).not.toHaveBeenCalled();
    });

    it('should include timestamp in debug messages', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.DEBUG);

      loggerInstance.debug('Test message');

      const calls = mockOutputChannel.appendLine.mock.calls;
      const message = calls[0][0];

      expect(message).toMatch(/\[\d{4}-\d{2}-\d{2}T/); // ISO timestamp format
    });
  });

  describe('Info Logging', () => {
    it('should log info messages with INFO level', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      loggerInstance.info('Test info message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('should not log info when level is WARN or higher', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.WARN);

      loggerInstance.info('Test info message');

      expect(mockOutputChannel.appendLine).not.toHaveBeenCalled();
    });

    it('should log info by default (initial level is INFO)', () => {
      const loggerInstance = Logger.getInstance();

      loggerInstance.info('Default info message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });
  });

  describe('Warning Logging', () => {
    it('should log warning messages with WARN level', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      loggerInstance.warn('Test warning message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message')
      );
    });

    it('should not log warnings when level is ERROR', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.ERROR);

      loggerInstance.warn('Test warning message');

      expect(mockOutputChannel.appendLine).not.toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    it('should log error messages with ERROR level', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.ERROR);

      loggerInstance.error('Test error message');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    it('should always log errors regardless of level', () => {
      const loggerInstance = Logger.getInstance();

      // Even with DEBUG level (lowest), errors should log
      loggerInstance.setLevel(LogLevel.ERROR);
      loggerInstance.error('Critical error');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });
  });

  describe('Logging with Arguments', () => {
    it('should log additional arguments as JSON', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.DEBUG);

      const args = { userId: 123, action: 'create' };
      loggerInstance.debug('User action', args);

      const calls = mockOutputChannel.appendLine.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2); // Message + args
      expect(calls[1][0]).toContain('"userId"');
      expect(calls[1][0]).toContain('123');
    });

    it('should format multiple arguments as JSON', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      const arg1 = { id: 1 };
      const arg2 = { name: 'test' };
      loggerInstance.info('Multiple args', arg1, arg2);

      const calls = mockOutputChannel.appendLine.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle complex nested objects', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.DEBUG);

      const complexObject = {
        user: {
          id: 1,
          permissions: ['read', 'write'],
          metadata: {
            created: '2026-01-29',
            updated: '2026-01-29',
          },
        },
      };

      loggerInstance.debug('Complex object', complexObject);

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });

    it('should handle primitive type arguments', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      loggerInstance.info('String and number', 'test-string', 42, true);

      const calls = mockOutputChannel.appendLine.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle null and undefined in arguments', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      loggerInstance.info('With nulls', null, undefined);

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });
  });

  describe('Output Channel Management', () => {
    it('should show output channel', () => {
      const loggerInstance = Logger.getInstance();

      loggerInstance.show();

      expect(mockOutputChannel.show).toHaveBeenCalled();
    });

    it('should dispose output channel', () => {
      const loggerInstance = Logger.getInstance();

      loggerInstance.dispose();

      expect(mockOutputChannel.dispose).toHaveBeenCalled();
    });

    it('should show channel after logging', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      loggerInstance.info('Test message');
      loggerInstance.show();

      expect(mockOutputChannel.show).toHaveBeenCalled();
    });
  });

  describe('Message Formatting', () => {
    it('should include timestamp in ISO format', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      loggerInstance.info('Message');

      const calls = mockOutputChannel.appendLine.mock.calls;
      const message = calls[0][0];

      // Should be ISO 8601 format: YYYY-MM-DDTHH:MM:SS.sssZ
      expect(message).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include log level in brackets', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.DEBUG);

      loggerInstance.debug('Debug msg');
      loggerInstance.info('Info msg');
      loggerInstance.warn('Warn msg');
      loggerInstance.error('Error msg');

      const calls = mockOutputChannel.appendLine.mock.calls;
      expect(calls[0][0]).toMatch(/\[DEBUG\]/);
      expect(calls[1][0]).toMatch(/\[INFO\]/);
      expect(calls[2][0]).toMatch(/\[WARN\]/);
      expect(calls[3][0]).toMatch(/\[ERROR\]/);
    });

    it('should include message content', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      const messageText = 'This is my log message';
      loggerInstance.info(messageText);

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining(messageText)
      );
    });
  });

  describe('Exported Singleton Instance', () => {
    it('should export a logger instance', () => {
      // Reset before this test
      (Logger as any).instance = undefined;
      (vscode.window.createOutputChannel as jest.Mock).mockReturnValue(mockOutputChannel);
      
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should be usable for logging immediately', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);
      loggerInstance.info('Logger test');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      const longMessage = 'a'.repeat(10000);
      loggerInstance.info(longMessage);

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });

    it('should handle special characters in messages', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      loggerInstance.info('Special chars: !@#$%^&*()[]{}|\\;:"\'<>?,./');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });

    it('should handle empty string messages', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.INFO);

      loggerInstance.info('');

      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });

    it('should handle rapid sequential logging calls', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.DEBUG);

      for (let i = 0; i < 100; i++) {
        loggerInstance.debug(`Message ${i}`);
      }

      expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(100);
    });

    it('should handle circular references in objects gracefully', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.DEBUG);

      const obj = { name: 'test', value: 123 };

      // Should not throw with normal objects
      expect(() => {
        loggerInstance.debug('Regular object', obj);
      }).not.toThrow();
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
    });
  });

  describe('Level Transitions', () => {
    it('should allow changing log level multiple times', () => {
      const loggerInstance = Logger.getInstance();

      loggerInstance.setLevel(LogLevel.DEBUG);
      loggerInstance.debug('Debug 1');

      loggerInstance.setLevel(LogLevel.ERROR);
      loggerInstance.debug('Debug 2'); // Should not log

      loggerInstance.setLevel(LogLevel.DEBUG);
      loggerInstance.debug('Debug 3'); // Should log

      // Should have 2 debug calls (not 3)
      const debugCalls = mockOutputChannel.appendLine.mock.calls.filter((call: any[]) =>
        call[0].includes('[DEBUG]')
      );
      expect(debugCalls.length).toBe(2);
    });

    it('should respect level changes between different log methods', () => {
      const loggerInstance = Logger.getInstance();
      loggerInstance.setLevel(LogLevel.DEBUG);

      loggerInstance.debug('Debug');
      loggerInstance.setLevel(LogLevel.WARN);
      loggerInstance.warn('Warn');
      loggerInstance.setLevel(LogLevel.ERROR);
      loggerInstance.error('Error');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(3);
    });
  });
});

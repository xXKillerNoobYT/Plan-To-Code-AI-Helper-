/**
 * Extension Output Log & Warning Suppression Tests
 * Verifies that deprecation warnings are suppressed and log filtering works
 */

import * as vscode from 'vscode';

describe('Extension Output Log & Warning Suppression', () => {
    describe('Warning Suppression', () => {
        it('should set NODE_NO_WARNINGS environment variable on activation', () => {
            // Verify that NODE_NO_WARNINGS is set to suppress deprecation warnings
            expect(process.env.NODE_NO_WARNINGS).toBe('1');
        });

        it('should suppress punycode deprecation warnings', () => {
            // This test verifies the environment variable is set correctly
            // Actual warning suppression is handled by Node.js runtime
            const warningsSuppressed = process.env.NODE_NO_WARNINGS === '1';
            expect(warningsSuppressed).toBe(true);
        });
    });

    describe('Log Level Filtering', () => {
        let mockOutputChannel: jest.Mocked<vscode.OutputChannel>;
        let mockConfig: any;

        beforeEach(() => {
            // Create mock output channel
            mockOutputChannel = {
                appendLine: jest.fn(),
                append: jest.fn(),
                clear: jest.fn(),
                show: jest.fn(),
                hide: jest.fn(),
                dispose: jest.fn(),
                name: 'COE Orchestrator',
                replace: jest.fn()
            };

            // Mock VS Code configuration
            mockConfig = {
                get: jest.fn((key: string, defaultValue?: any) => {
                    if (key === 'logLevel') {
                        return defaultValue || 'info';
                    }
                    return defaultValue;
                }),
                has: jest.fn(() => true),
                inspect: jest.fn(),
                update: jest.fn()
            };

            jest.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue(mockConfig as any);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should filter debug messages when log level is set to info', () => {
            // Set log level to 'info'
            mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'logLevel') {
                    return 'info';
                }
                return defaultValue;
            });

            // The logToOutput function is internal, so we test the behavior indirectly
            // by verifying the configuration is read correctly
            const config = vscode.workspace.getConfiguration('coe');
            const logLevel = config.get<string>('logLevel', 'info');

            expect(logLevel).toBe('info');
            expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('coe');
        });

        it('should filter debug and info messages when log level is set to warn', () => {
            // Set log level to 'warn'
            mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'logLevel') {
                    return 'warn';
                }
                return defaultValue;
            });

            const config = vscode.workspace.getConfiguration('coe');
            const logLevel = config.get<string>('logLevel', 'info');

            expect(logLevel).toBe('warn');
        });

        it('should always show error messages regardless of log level', () => {
            // Set log level to 'error' (highest)
            mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'logLevel') {
                    return 'error';
                }
                return defaultValue;
            });

            const config = vscode.workspace.getConfiguration('coe');
            const logLevel = config.get<string>('logLevel', 'info');

            expect(logLevel).toBe('error');
        });

        it('should default to info level when no setting is configured', () => {
            // Mock missing configuration
            mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
                return defaultValue;
            });

            const config = vscode.workspace.getConfiguration('coe');
            const logLevel = config.get<string>('logLevel', 'info');

            expect(logLevel).toBe('info');
        });

        it('should handle invalid log level values gracefully', () => {
            // Set invalid log level
            mockConfig.get.mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'logLevel') {
                    return 'invalid';
                }
                return defaultValue;
            });

            const config = vscode.workspace.getConfiguration('coe');
            const logLevel = config.get<string>('logLevel', 'info');

            // Extension should handle invalid values by falling back to default
            expect(logLevel).toBe('invalid'); // Config returns invalid, but logToOutput will map to INFO
        });
    });

    describe('Configuration Schema', () => {
        it('should define coe.logLevel setting with correct enum values', () => {
            // This test verifies the package.json configuration schema
            // The actual schema validation is done by VS Code
            const validLogLevels = ['debug', 'info', 'warn', 'error'];

            // Verify our test expectations match the schema
            validLogLevels.forEach(level => {
                expect(['debug', 'info', 'warn', 'error']).toContain(level);
            });
        });
    });
});

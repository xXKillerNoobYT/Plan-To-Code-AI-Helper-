/**
 * Comprehensive tests for Logger implementation
 * 
 * Tests the ILogger interface, ConsoleLogger, and NullLogger implementations
 * Verifies proper logging behavior and interface compliance
 * 
 * References: src/orchestrator/logger.ts
 */

import { ILogger, ConsoleLogger, NullLogger, defaultLogger } from '../../src/orchestrator/logger';

describe('Logger Implementation', () => {
    describe('ILogger Interface', () => {
        /**
         * Verify that ConsoleLogger implements the ILogger interface
         */
        it('should have ConsoleLogger implement all ILogger methods', () => {
            const logger: ILogger = new ConsoleLogger();

            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
        });

        /**
         * Verify that NullLogger implements the ILogger interface
         */
        it('should have NullLogger implement all ILogger methods', () => {
            const logger: ILogger = new NullLogger();

            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
        });
    });

    describe('ConsoleLogger', () => {
        let logger: ConsoleLogger;
        let consoleInfoSpy: jest.SpyInstance;
        let consoleWarnSpy: jest.SpyInstance;
        let consoleErrorSpy: jest.SpyInstance;
        let consoleDebugSpy: jest.SpyInstance;

        beforeEach(() => {
            logger = new ConsoleLogger();
            consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
            consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
        });

        afterEach(() => {
            consoleInfoSpy.mockRestore();
            consoleWarnSpy.mockRestore();
            consoleErrorSpy.mockRestore();
            consoleDebugSpy.mockRestore();
        });

        describe('debug method', () => {
            /**
             * Console.debug is mocked but not implemented in ConsoleLogger
             * Verify debug method exists but doesn't call console
             */
            it('should have debug method', () => {
                expect(typeof logger.debug).toBe('function');
            });

            /**
             * Verify debug method accepts message and optional data
             */
            it('should accept message and optional data', () => {
                expect(() => logger.debug('test message')).not.toThrow();
                expect(() => logger.debug('test message', { key: 'value' })).not.toThrow();
            });
        });

        describe('info method', () => {
            /**
             * Verify info method logs to console.info with proper format
             */
            it('should call console.info with formatted message', () => {
                logger.info('Test message');

                expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test message', '');
            });

            /**
             * Verify info method includes data when provided
             */
            it('should include data in console.info when provided', () => {
                const testData = { key: 'value', count: 42 };
                logger.info('Test message', testData);

                expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test message', testData);
            });

            /**
             * Verify info method handles empty string data
             */
            it('should pass empty string when data is undefined', () => {
                logger.info('Test message', undefined);

                expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test message', '');
            });

            /**
             * Verify info method handles null data
             */
            it('should pass empty string when data is null', () => {
                logger.info('Test message', null);

                expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test message', '');
            });

            /**
             * Verify info method handles various data types
             */
            it('should handle string data', () => {
                logger.info('Test message', 'string data');

                expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test message', 'string data');
            });

            /**
             * Verify info method handles number data
             */
            it('should handle number data', () => {
                logger.info('Test message', 123);

                expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test message', 123);
            });

            /**
             * Verify info method handles array data
             */
            it('should handle array data', () => {
                const arrayData = [1, 2, 3];
                logger.info('Test message', arrayData);

                expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test message', arrayData);
            });

            /**
             * Verify info method handles complex object data
             */
            it('should handle complex object data', () => {
                const complexData = {
                    nested: { value: 'deep' },
                    array: [1, 2, 3],
                    string: 'test'
                };
                logger.info('Test message', complexData);

                expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test message', complexData);
            });
        });

        describe('warn method', () => {
            /**
             * Console.warn is mocked but not implemented in ConsoleLogger
             * Verify warn method exists
             */
            it('should have warn method', () => {
                expect(typeof logger.warn).toBe('function');
            });

            /**
             * Verify warn method accepts message and optional data
             */
            it('should accept message and optional data', () => {
                expect(() => logger.warn('test warning')).not.toThrow();
                expect(() => logger.warn('test warning', { key: 'value' })).not.toThrow();
            });
        });

        describe('error method', () => {
            /**
             * Console.error is mocked but not implemented in ConsoleLogger
             * Verify error method exists
             */
            it('should have error method', () => {
                expect(typeof logger.error).toBe('function');
            });

            /**
             * Verify error method accepts message and optional error
             */
            it('should accept message and optional error', () => {
                const error = new Error('test error');
                expect(() => logger.error('Error occurred', error)).not.toThrow();
            });

            /**
             * Verify error method accepts plain object as error
             */
            it('should handle plain object as error', () => {
                expect(() => logger.error('Error occurred', { reason: 'test' })).not.toThrow();
            });

            /**
             * Verify error method handles string as error
             */
            it('should handle string as error', () => {
                expect(() => logger.error('Error occurred', 'error message')).not.toThrow();
            });
        });

        describe('method chaining prevention', () => {
            /**
             * Verify methods return undefined (not chainable)
             */
            it('should not support method chaining', () => {
                const result = logger.info('Test message');
                expect(result).toBeUndefined();
            });
        });
    });

    describe('NullLogger', () => {
        let logger: NullLogger;

        beforeEach(() => {
            logger = new NullLogger();
        });

        describe('all methods', () => {
            /**
             * Verify all NullLogger methods exist and do nothing
             */
            it('should have all required methods', () => {
                expect(typeof logger.debug).toBe('function');
                expect(typeof logger.info).toBe('function');
                expect(typeof logger.warn).toBe('function');
                expect(typeof logger.error).toBe('function');
            });

            /**
             * Verify debug method accepts parameters and returns undefined
             */
            it('debug should accept message and data without throwing', () => {
                expect(() => logger.debug('message', { data: 'test' })).not.toThrow();
                expect(logger.debug('message', { data: 'test' })).toBeUndefined();
            });

            /**
             * Verify info method accepts parameters and returns undefined
             */
            it('info should accept message and data without throwing', () => {
                expect(() => logger.info('message', { data: 'test' })).not.toThrow();
                expect(logger.info('message', { data: 'test' })).toBeUndefined();
            });

            /**
             * Verify warn method accepts parameters and returns undefined
             */
            it('warn should accept message and data without throwing', () => {
                expect(() => logger.warn('message', { data: 'test' })).not.toThrow();
                expect(logger.warn('message', { data: 'test' })).toBeUndefined();
            });

            /**
             * Verify error method accepts parameters and returns undefined
             */
            it('error should accept message and error without throwing', () => {
                expect(() => logger.error('message', new Error('test'))).not.toThrow();
                expect(logger.error('message', new Error('test'))).toBeUndefined();
            });

            /**
             * Verify NullLogger truly logs nothing (no side effects)
             */
            it('should produce no console output', () => {
                const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
                const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
                const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

                logger.debug('debug');
                logger.info('info');
                logger.warn('warn');
                logger.error('error');

                expect(consoleInfoSpy).not.toHaveBeenCalled();
                expect(consoleWarnSpy).not.toHaveBeenCalled();
                expect(consoleErrorSpy).not.toHaveBeenCalled();
                expect(consoleDebugSpy).not.toHaveBeenCalled();

                consoleInfoSpy.mockRestore();
                consoleWarnSpy.mockRestore();
                consoleErrorSpy.mockRestore();
                consoleDebugSpy.mockRestore();
            });

            /**
             * Verify NullLogger handles all data types without throwing
             */
            it('should handle all data types without throwing', () => {
                expect(() => logger.debug('msg', undefined)).not.toThrow();
                expect(() => logger.info('msg', null)).not.toThrow();
                expect(() => logger.warn('msg', 'string')).not.toThrow();
                expect(() => logger.error('msg', 123)).not.toThrow();
                expect(() => logger.debug('msg', { nested: { value: 'deep' } })).not.toThrow();
                expect(() => logger.info('msg', [1, 2, 3])).not.toThrow();
            });
        });
    });

    describe('defaultLogger Export', () => {
        /**
         * Verify defaultLogger is an instance of ConsoleLogger
         */
        it('should export a ConsoleLogger instance', () => {
            expect(defaultLogger).toBeInstanceOf(ConsoleLogger);
        });

        /**
         * Verify defaultLogger implements ILogger interface
         */
        it('should be assignable to ILogger type', () => {
            const logger: ILogger = defaultLogger;
            expect(logger).toBeDefined();
            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
        });

        /**
         * Verify defaultLogger works correctly
         */
        it('should be functional for logging', () => {
            const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

            defaultLogger.info('Test message', { data: 'value' });

            expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test message', { data: 'value' });

            consoleInfoSpy.mockRestore();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        /**
         * Verify logger handles very long messages
         */
        it('should handle very long messages', () => {
            const logger = new ConsoleLogger();
            const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

            const longMessage = 'a'.repeat(10000);
            logger.info(longMessage);

            expect(consoleInfoSpy).toHaveBeenCalled();

            consoleInfoSpy.mockRestore();
        });

        /**
         * Verify logger handles circular reference in data
         */
        it('should handle circular reference in data gracefully', () => {
            const logger = new ConsoleLogger();
            const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

            const circularObj: any = { a: 1 };
            circularObj.self = circularObj;

            // Should not throw despite circular reference
            expect(() => {
                logger.info('test', circularObj);
            }).not.toThrow();

            expect(consoleInfoSpy).toHaveBeenCalled();

            consoleInfoSpy.mockRestore();
        });

        /**
         * Verify logger handles symbols in data
         */
        it('should handle symbols in data', () => {
            const logger = new ConsoleLogger();
            const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

            const symbolData = { [Symbol('test')]: 'value' };

            expect(() => {
                logger.info('test', symbolData);
            }).not.toThrow();

            expect(consoleInfoSpy).toHaveBeenCalled();

            consoleInfoSpy.mockRestore();
        });

        /**
         * Verify logger handles class instances as data
         */
        it('should handle class instances as data', () => {
            const logger = new ConsoleLogger();
            const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

            class TestClass {
                value = 'test';
            }

            const instance = new TestClass();
            logger.info('test', instance);

            expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] test', instance);

            consoleInfoSpy.mockRestore();
        });

        /**
         * Verify logger handles function as data
         */
        it('should handle functions as data', () => {
            const logger = new ConsoleLogger();
            const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

            const testFunc = () => 'test';
            logger.info('test', testFunc);

            expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] test', testFunc);

            consoleInfoSpy.mockRestore();
        });
    });

    describe('Instance Independence', () => {
        /**
         * Verify separate instances don't interfere with each other
         */
        it('should have independent instances', () => {
            const logger1 = new ConsoleLogger();
            const logger2 = new ConsoleLogger();

            expect(logger1).not.toBe(logger2);
            expect(logger1).toBeInstanceOf(ConsoleLogger);
            expect(logger2).toBeInstanceOf(ConsoleLogger);
        });

        /**
         * Verify NullLogger instances are independent
         */
        it('should create independent NullLogger instances', () => {
            const logger1 = new NullLogger();
            const logger2 = new NullLogger();

            expect(logger1).not.toBe(logger2);
            expect(logger1).toBeInstanceOf(NullLogger);
            expect(logger2).toBeInstanceOf(NullLogger);
        });
    });
});

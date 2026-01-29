/**
 * Logger Interface for Programming Orchestrator
 * 
 * Provides structured logging for the orchestration system
 * References: Plans/MODULAR-EXECUTION-PHILOSOPHY.md
 */

export interface ILogger {
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, error?: Error | any): void;
}

/**
 * Default logger implementation using console
 */
export class ConsoleLogger implements ILogger {
    debug(message: string, data?: any): void {
    }

    info(message: string, data?: any): void {
        console.info(`[INFO] ${message}`, data || '');
    }

    warn(message: string, data?: any): void {
    }

    error(message: string, error?: Error | any): void {
    }
}

/**
 * No-op logger for testing/mocking
 */
export class NullLogger implements ILogger {
    debug(): void { }
    info(): void { }
    warn(): void { }
    error(): void { }
}

// Default instance
export const defaultLogger = new ConsoleLogger();



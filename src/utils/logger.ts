/**
 * Logger Utility
 * Centralized logging with different levels
 */

import * as vscode from 'vscode';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;
    private currentLevel: LogLevel = LogLevel.INFO;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('COE Extension');
    }

    /**
     * Get logger instance (singleton)
     */
    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Set log level
     */
    setLevel(level: LogLevel): void {
        this.currentLevel = level;
    }

    /**
     * Debug log
     */
    debug(message: string, ...args: any[]): void {
        if (this.currentLevel <= LogLevel.DEBUG) {
            this.log('DEBUG', message, ...args);
        }
    }

    /**
     * Info log
     */
    info(message: string, ...args: any[]): void {
        if (this.currentLevel <= LogLevel.INFO) {
            this.log('INFO', message, ...args);
        }
    }

    /**
     * Warning log
     */
    warn(message: string, ...args: any[]): void {
        if (this.currentLevel <= LogLevel.WARN) {
            this.log('WARN', message, ...args);
        }
    }

    /**
     * Error log
     */
    error(message: string, ...args: any[]): void {
        if (this.currentLevel <= LogLevel.ERROR) {
            this.log('ERROR', message, ...args);
        }
    }

    /**
     * Internal log method
     */
    private log(level: string, message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level}] ${message}`;

        this.outputChannel.appendLine(formattedMessage);

        if (args.length > 0) {
            this.outputChannel.appendLine(JSON.stringify(args, null, 2));
        }

        // Also log to console for debugging
        console.log(formattedMessage, ...args);
    }

    /**
     * Show output channel
     */
    show(): void {
        this.outputChannel.show();
    }

    /**
     * Dispose output channel
     */
    dispose(): void {
        this.outputChannel.dispose();
    }
}

// Export singleton instance
export const logger = Logger.getInstance();

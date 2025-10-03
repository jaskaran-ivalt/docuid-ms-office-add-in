/**
 * Centralized logging utility for DocuID Office Add-in
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private enableConsoleOutput: boolean = true;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 1000;

  private constructor() {
    // Initialize from localStorage settings
    this.loadSettings();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Load logging settings from localStorage
   */
  private loadSettings(): void {
    try {
      const storedLevel = localStorage.getItem('docuid_log_level');
      const storedConsole = localStorage.getItem('docuid_console_logging');

      if (storedLevel) {
        const level = parseInt(storedLevel, 10);
        if (level >= LogLevel.DEBUG && level <= LogLevel.ERROR) {
          this.logLevel = level;
        }
      }

      if (storedConsole !== null) {
        this.enableConsoleOutput = storedConsole === 'true';
      }

      // Default to DEBUG in development
      if (process.env.NODE_ENV === 'development') {
        this.logLevel = LogLevel.DEBUG;
      }
    } catch (error) {
      console.warn('Failed to load logging settings:', error);
    }
  }

  /**
   * Set the minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    localStorage.setItem('docuid_log_level', level.toString());
  }

  /**
   * Enable or disable console output
   */
  public setConsoleOutput(enabled: boolean): void {
    this.enableConsoleOutput = enabled;
    localStorage.setItem('docuid_console_logging', enabled.toString());
  }

  /**
   * Get current log level
   */
  public getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Get log history
   */
  public getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  public clearLogHistory(): void {
    this.logHistory = [];
  }

  /**
   * Export logs as JSON string
   */
  public exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, context: string, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
      error,
    };

    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift(); // Remove oldest entry
    }

    // Console output if enabled and level meets threshold
    if (this.enableConsoleOutput && level >= this.logLevel) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Output log entry to browser console with appropriate formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${LogLevel[entry.level]}] [${entry.context}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.error || entry.data || '');
        break;
    }
  }

  /**
   * Debug level logging
   */
  public debug(context: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  /**
   * Info level logging
   */
  public info(context: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, context, message, data);
  }

  /**
   * Warning level logging
   */
  public warn(context: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, context, message, data);
  }

  /**
   * Error level logging
   */
  public error(context: string, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, context, message, data, error);
  }

  /**
   * Log API request
   */
  public logApiRequest(context: string, method: string, url: string, data?: any): void {
    this.debug(context, `API Request: ${method} ${url}`, data);
  }

  /**
   * Log API response
   */
  public logApiResponse(context: string, method: string, url: string, status: number, responseTime?: number): void {
    const message = `API Response: ${method} ${url} - ${status}${responseTime ? ` (${responseTime}ms)` : ''}`;
    if (status >= 400) {
      this.warn(context, message);
    } else {
      this.debug(context, message);
    }
  }

  /**
   * Log authentication events
   */
  public logAuthEvent(context: string, event: string, userId?: string, data?: any): void {
    const message = `Auth Event: ${event}${userId ? ` (User: ${userId})` : ''}`;
    this.info(context, message, data);
  }

  /**
   * Log Office.js operations
   */
  public logOfficeOperation(context: string, operation: string, success: boolean, error?: any): void {
    const message = `Office Operation: ${operation} - ${success ? 'SUCCESS' : 'FAILED'}`;
    if (success) {
      this.debug(context, message);
    } else {
      this.error(context, message, undefined, error);
    }
  }

  /**
   * Create a contextual logger for a specific component/service
   */
  public createContextLogger(context: string): ContextualLogger {
    return new ContextualLogger(this, context);
  }
}

/**
 * Contextual logger that automatically includes context in all log messages
 */
export class ContextualLogger {
  constructor(private logger: Logger, private context: string) {}

  debug(message: string, data?: any): void {
    this.logger.debug(this.context, message, data);
  }

  info(message: string, data?: any): void {
    this.logger.info(this.context, message, data);
  }

  warn(message: string, data?: any): void {
    this.logger.warn(this.context, message, data);
  }

  error(message: string, error?: Error, data?: any): void {
    this.logger.error(this.context, message, error, data);
  }

  logApiRequest(method: string, url: string, data?: any): void {
    this.logger.logApiRequest(this.context, method, url, data);
  }

  logApiResponse(method: string, url: string, status: number, responseTime?: number): void {
    this.logger.logApiResponse(this.context, method, url, status, responseTime);
  }

  logAuthEvent(event: string, userId?: string, data?: any): void {
    this.logger.logAuthEvent(this.context, event, userId, data);
  }

  logOfficeOperation(operation: string, success: boolean, error?: any): void {
    this.logger.logOfficeOperation(this.context, operation, success, error);
  }
}

// Global logger instance
export const logger = Logger.getInstance();

// Helper functions for quick access
export const createLogger = (context: string) => logger.createContextLogger(context);

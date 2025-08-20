export interface LogEvent {
  level: "debug" | "error" | "info" | "warn";
  scope: string;
  message: string;
  args: unknown[];
  timestamp: Date;
}

export type LogHandler = (event: LogEvent) => void;

export interface LoggerOptions {
  /**
   * Custom log handlers that will be called for each log event
   */
  handlers?: LogHandler[];

  /**
   * Winston logger level (default: "debug")
   */
  level?: string;

  /**
   * Whether to enable colors in output (auto-detected by default)
   */
  colorize?: boolean;

  /**
   * Precision for timestamp in log output (number of decimal places for milliseconds, default: 0)
   */
  precision?: number;
}

export declare class Logger {
  private readonly scope: string;
  private readonly logger: any;
  private readonly isRenderer: boolean;
  private readonly handlers: LogHandler[];

  constructor(scope: string, options?: LoggerOptions);

  /**
   * Log an info message
   */
  info(...args: unknown[]): void;

  /**
   * Log a warning message
   */
  warn(...args: unknown[]): void;

  /**
   * Log an error message
   */
  error(...args: unknown[]): void;

  /**
   * Log a debug message
   */
  debug(...args: unknown[]): void;

  /**
   * Create a new logger instance with the given scope (alias for create)
   */
  static get(scope: string, options?: LoggerOptions): Logger;

  private formatArgs(args: unknown[]): string;

  private callHandlers(
    level: "debug" | "error" | "info" | "warn",
    formattedMessage: string,
    ...originalArgs: unknown[]
  ): void;
}

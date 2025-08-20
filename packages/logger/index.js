const util = require("util");
const winston = require("winston");

const { createLogger, format, transports } = winston;

/**
 * Logger class for structured logging with customizable handlers
 */
class Logger {
  /**
   * @param {string} scope - The scope/context for this logger instance
   * @param {import('./index.d.ts').LoggerOptions} [options={}] - Configuration options
   */
  constructor(scope, options = {}) {
    this.scope = scope;
    this.handlers = options.handlers || [];
    this.precision =
      typeof options.precision === "number" ? options.precision : 0;

    const timestampFormat = () => {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");

      let base = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      if (this.precision > 0) {
        let ms = now.getMilliseconds() / 1000;
        ms = ms.toFixed(this.precision).slice(1); // e.g. .123
        base += ms;
      }

      return base;
    };

    this.logger = createLogger({
      level: options.level || "debug",
      levels: winston.config.cli.levels,
      transports: [new transports.Console({ level: options.level || "debug" })],
      format: format.combine(
        format.timestamp({ format: timestampFormat }),
        format.printf(({ level, message, timestamp, _rawArgs }) => {
          // If the original call was a single plain string, prefer that raw string
          // for display.
          let displayMessage = message;

          if (
            Array.isArray(_rawArgs) &&
            _rawArgs.length === 1 &&
            typeof _rawArgs[0] === "string"
          ) {
            displayMessage = _rawArgs[0];
          }

          return `[${timestamp}] [${level}]${this.scope ? ` (${this.scope})` : ""} ${displayMessage}`;
        }),
      ),
    });
  }

  /**
   * Format arguments for logging
   * @private
   * @param {unknown[]} args - Arguments to format
   * @returns {string} Formatted string
   */
  formatArgs(args) {
    return args
      .map((arg) => {
        if (arg instanceof Error) {
          // If this is the only argument, show the full stack trace
          if (args.length === 1 && arg.stack) {
            return arg.stack;
          }

          // If it's part of multiple arguments, just show the stack trace without duplicating the message
          if (arg.stack) {
            // The stack trace usually starts with the error name and message, followed by the actual trace
            // Extract just the trace part (lines after the first line)
            const stackLines = arg.stack.split("\n");
            return stackLines.slice(1).join("\n");
          }

          // Fallback if no stack is available
          return arg.message || arg.toString();
        }

        if (Array.isArray(arg)) {
          return arg.map((a) => util.inspect(a, { depth: null })).join(" ");
        }

        if (typeof arg === "object" && arg !== null) {
          try {
            return util.inspect(arg, { depth: null });
          } catch {
            return String(arg);
          }
        }

        return String(arg);
      })
      .join(" ");
  }

  /**
   * Log an info message
   * @param {...unknown} args - Arguments to log
   */
  info(...args) {
    const formattedMessage = this.formatArgs(args);
    this.callHandlers("info", formattedMessage, ...args);
    // Pass the original args through as metadata so the formatter can
    // decide whether to use the raw string (to avoid extra quoting).
    this.logger.info(formattedMessage, { _rawArgs: args });
  }

  /**
   * Log a warning message
   * @param {...unknown} args - Arguments to log
   */
  warn(...args) {
    const formattedMessage = this.formatArgs(args);
    this.callHandlers("warn", formattedMessage, ...args);
    this.logger.warn(formattedMessage, { _rawArgs: args });
  }

  /**
   * Log an error message
   * @param {...unknown} args - Arguments to log
   */
  error(...args) {
    const formattedMessage = this.formatArgs(args);
    this.callHandlers("error", formattedMessage, ...args);
    this.logger.error(formattedMessage, { _rawArgs: args });
  }

  /**
   * Log a debug message
   * @param {...unknown} args - Arguments to log
   */
  debug(...args) {
    const formattedMessage = this.formatArgs(args);
    this.callHandlers("debug", formattedMessage, ...args);
    this.logger.debug(formattedMessage, { _rawArgs: args });
  }

  /**
   * Create a new logger instance with the given scope
   * @param {string} scope - The scope for the logger
   * @param {import('./index.d.ts').LoggerOptions} [options] - Configuration options
   * @returns {Logger} New logger instance
   */
  static get(scope, options) {
    return new Logger(scope, options);
  }

  /**
   * Call all registered handlers with the log data
   * @private
   * @param {"debug" | "error" | "info" | "warn"} level - Log level
   * @param {string} formattedMessage - The formatted message
   * @param {...unknown} originalArgs - Original arguments passed to the log method
   */
  callHandlers(level, formattedMessage, ...originalArgs) {
    for (const handler of this.handlers) {
      try {
        handler({
          level,
          scope: this.scope,
          message: formattedMessage,
          args: originalArgs,
          timestamp: new Date(),
        });
      } catch (error) {}
    }
  }
}

module.exports = { Logger };

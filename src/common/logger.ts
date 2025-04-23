import util from "util";
import type { Logger as WinstonLogger } from "winston";
import winston, { createLogger, format, transports } from "winston";

// TODO: add debug flag to enable debug logging

export class Logger {
  private readonly scope: string;

  private readonly logger: WinstonLogger;

  private constructor(scope: string) {
    this.scope = scope;
    this.logger = createLogger({
      level: "debug",
      levels: winston.config.cli.levels,
      transports: [new transports.Console({ level: "debug" })],
      format: format.combine(
        format.timestamp({ format: "HH:mm:ss" }),
        // color only for main
        process.type === "browser" ? format.colorize() : format.uncolorize(),
        format.printf(
          ({ level, message, timestamp }) =>
            `[${timestamp}] [${level}]${this.scope ? ` (${this.scope})` : ""} ${message}`,
        ),
      ),
    });
  }

  private formatArgs(args: unknown[]): string {
    return args
      .map((arg) => {
        if (Array.isArray(arg)) {
          return arg
            .map((a) => util.inspect(a, { depth: null, colors: false }))
            .join(" ");
        }

        if (typeof arg === "object" && arg !== null) {
          try {
            return util.inspect(arg, { depth: null, colors: false });
          } catch {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            return String(arg);
          }
        }

        return String(arg);
      })
      .join(" ");
  }

  public info(...args: unknown[]): void {
    this.logger.info(this.formatArgs(args));
  }

  public warn(...args: unknown[]): void {
    this.logger.warn(this.formatArgs(args));
  }

  public error(...args: unknown[]): void {
    this.logger.error(this.formatArgs(args));
  }

  public debug(...args: unknown[]): void {
    this.logger.debug(this.formatArgs(args));
  }

  public log(...args: unknown[]): void {
    this.info(...args);
  }

  public static get(scope: string): Logger {
    return new Logger(scope);
  }
}

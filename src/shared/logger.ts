import process from "process";
import util from "util";
import type { Logger as WinstonLogger } from "winston";
import winston, { createLogger, format, transports } from "winston";
import { ClientPacket } from "../renderer/game/lib/Packets";

// TODO: add debug flag to enable debug logging

export class Logger {
  private readonly scope: string;

  private readonly logger: WinstonLogger;

  private isRenderer = process.type === "renderer";

  private constructor(scope: string) {
    this.scope = scope;
    this.logger = createLogger({
      level: "debug",
      levels: winston.config.cli.levels,
      transports: [new transports.Console({ level: "debug" })],
      format: format.combine(
        format.timestamp({ format: "HH:mm:ss" }),
        // color only for main
        this.isRenderer ? format.colorize() : format.uncolorize(),
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
        if (arg instanceof Error) {
          // If this is the only argument, show the full stack trace
          // logger.error(msg, error)
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
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          return arg.message ?? arg.toString();
        }

        if (Array.isArray(arg)) {
          return arg
            .map((a) =>
              util.inspect(a, { depth: null, colors: !this.isRenderer }),
            )
            .join(" ");
        }

        if (typeof arg === "object" && arg !== null) {
          try {
            return util.inspect(arg, { depth: null, colors: !this.isRenderer });
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
    this.writeToGame("info", ...args);
    this.logger.info(this.formatArgs(args));
  }

  public warn(...args: unknown[]): void {
    this.writeToGame("warn", ...args);
    this.logger.warn(this.formatArgs(args));
  }

  public error(...args: unknown[]): void {
    this.writeToGame("error", ...args);
    this.logger.error(this.formatArgs(args));
  }

  public static get(scope: string): Logger {
    return new Logger(scope);
  }

  private writeToGame(
    scope: "error" | "info" | "warn",
    ...args: unknown[]
  ): void {
    if (this.isRenderer) {
      try {
        const text = this.formatArgs(args);
        const message = `%xt%moderator%-1%(${scope}) ${text}%`;
        window.swf.sendClientPacket(message, ClientPacket.String);
      } catch {}
    }
  }
}

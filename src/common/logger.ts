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

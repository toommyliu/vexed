import { client } from "~/shared/tipc";
import type { LogLevel, MainLogEntry } from "~/shared/types";

const levelToConsole: Record<LogLevel, keyof Console> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

function sendEntry(entry: MainLogEntry) {
  try {
    console.log("sent:", entry);
    void client.logger.logEntry(entry);
  } catch (error) {
    console.warn("Failed to forward log entry to main.", error);
  }
}

export function createRendererLogger(scope?: string) {
  const log = (level: LogLevel, message: string, data?: unknown) => {
    const consoleMethod = console[levelToConsole[level]] as (
      ...args: unknown[]
    ) => void;
    const prefix = scope ? `[${scope}] ` : "";
    if (data === undefined) {
      consoleMethod(`${prefix}${message}`);
    } else {
      consoleMethod(`${prefix}${message}`, data);
    }

    sendEntry({
      data,
      level,
      message,
      process: "renderer",
      scope: scope ?? "renderer",
      timestamp: Date.now(),
    });
  };

  return {
    debug: (message: string, data?: unknown) => log("debug", message, data),
    info: (message: string, data?: unknown) => log("info", message, data),
    warn: (message: string, data?: unknown) => log("warn", message, data),
    error: (message: string, data?: unknown) => log("error", message, data),
  };
}

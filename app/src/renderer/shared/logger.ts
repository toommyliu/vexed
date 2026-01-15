import type { LogLevel, MainLogEntry } from "~/shared/types";
import { client } from "~/shared/tipc";

const levelToConsole: Record<LogLevel, keyof Console> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

function sendEntry(entry: MainLogEntry) {
  try {
    void client.logger.logEntry.send(entry);
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
    if (data !== undefined) {
      consoleMethod(`${prefix}${message}`, data);
    } else {
      consoleMethod(`${prefix}${message}`);
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

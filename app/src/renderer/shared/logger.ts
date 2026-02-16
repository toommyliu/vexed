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
    void client.app.logEntry(entry);
  } catch (error) {
    console.warn("Failed to forward log entry to main.", error);
  }
}

function resolveLogArgs(messageOrData?: unknown, ...args: unknown[]) {
  if (typeof messageOrData === "string") {
    return {
      message: messageOrData,
      data: args.length > 1 ? args : args[0],
    };
  }

  return {
    message: undefined,
    data: args.length > 0 ? [messageOrData, ...args] : messageOrData,
  };
}

export function createRendererLogger(scope?: string) {
  const log = (
    level: LogLevel,
    messageOrData?: unknown,
    ...args: unknown[]
  ) => {
    const { message, data } = resolveLogArgs(messageOrData, ...args);
    const consoleMethod = console[levelToConsole[level]] as (
      ...args: unknown[]
    ) => void;
    const prefix = scope ? `[${scope}] ` : "";

    const logArgs: unknown[] = [];
    if (prefix || message) {
      logArgs.push(`${prefix}${message ?? ""}`);
    }

    if (data !== undefined) {
      logArgs.push(data);
    }

    consoleMethod(...logArgs);

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
    debug: (message: unknown, ...args: unknown[]) =>
      log("debug", message, ...args),
    info: (message: unknown, ...args: unknown[]) =>
      log("info", message, ...args),
    warn: (message: unknown, ...args: unknown[]) =>
      log("warn", message, ...args),
    error: (message: unknown, ...args: unknown[]) =>
      log("error", message, ...args),
  };
}

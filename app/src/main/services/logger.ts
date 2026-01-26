import { promises as fs } from "fs";
import { join } from "path";
import pino from "pino";
import { DOCUMENTS_PATH } from "~/shared/constants";
import type { LogLevel, MainLogEntry } from "~/shared/types";

const LOG_FILE_NAME = "log.txt";

let pinoInstance: ReturnType<typeof pino> | null = null;
let debugEnabled = false;

type LogPayload = {
  data?: unknown;
  message: string;
  scope?: string | undefined;
};

export async function initMainLogger() {
  if (pinoInstance) return;

  try {
    await fs.mkdir(DOCUMENTS_PATH, { recursive: true });

    if (pinoInstance) return;

    const filePath = join(DOCUMENTS_PATH, LOG_FILE_NAME);
    const destination = pino.destination({
      dest: filePath,
      sync: false,
    });

    pinoInstance = pino(
      {
        level: debugEnabled ? "debug" : "info",
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label: string) => ({ level: label }),
        },
        base: undefined, // remove hostname and pid
      },
      destination,
    );
  } catch (error) {
    console.warn("logger: failed to initialize pino", error);
  }
}

export function setLoggerDebugEnabled(enabled: boolean) {
  debugEnabled = enabled;
}

export function logMainEntry(entry: MainLogEntry) {
  if (!pinoInstance) {
    console[entry.level](`[${entry.scope}] ${entry.message}`, entry.data ?? "");
    return;
  }

  const { level, message, scope, data, process, timestamp } = entry;

  // Terminal output
  console[level](`[${scope || process}] ${message}`);
  // File output
  pinoInstance[level]({ scope, process, data, timestamp }, message);
}

export function logMain(level: LogLevel, payload: LogPayload) {
  logMainEntry({
    data: payload.data,
    level,
    message: payload.message,
    process: "main",
    scope: payload.scope ?? "",
    timestamp: Date.now(),
  });
}

export function logFromRenderer(entry: MainLogEntry) {
  logMainEntry({
    ...entry,
    process: "renderer",
    scope: entry.scope || "renderer",
  });
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, data?: unknown) =>
      logMain("debug", { scope, message, data }),
    info: (message: string, data?: unknown) =>
      logMain("info", { scope, message, data }),
    warn: (message: string, data?: unknown) =>
      logMain("warn", { scope, message, data }),
    error: (message: string, data?: unknown) =>
      logMain("error", { scope, message, data }),
  };
}

export const logger = {
  debug: (scope: string, message?: string, data?: unknown) => {
    const resolvedMessage = message ?? scope;
    const resolvedScope = message ? scope : undefined;
    logMain("debug", { scope: resolvedScope, message: resolvedMessage, data });
  },
  info: (scope: string, message?: string, data?: unknown) => {
    const resolvedMessage = message ?? scope;
    const resolvedScope = message ? scope : undefined;
    logMain("info", { scope: resolvedScope, message: resolvedMessage, data });
  },
  warn: (scope: string, message?: string, data?: unknown) => {
    const resolvedMessage = message ?? scope;
    const resolvedScope = message ? scope : undefined;
    logMain("warn", { scope: resolvedScope, message: resolvedMessage, data });
  },
  error: (scope: string, message?: string, data?: unknown) => {
    const resolvedMessage = message ?? scope;
    const resolvedScope = message ? scope : undefined;
    logMain("error", { scope: resolvedScope, message: resolvedMessage, data });
  },
};

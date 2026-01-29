import { createWriteStream, promises as fs, type WriteStream } from "fs";
import { join } from "path";
import process from "process";
import { DOCUMENTS_PATH } from "~/shared/constants";
import type { LogLevel, MainLogEntry } from "~/shared/types";

const LOG_FILE_NAME = "log.txt";
const FLUSH_INTERVAL_MS = 5_000;

let writeStream: WriteStream | null = null;
let debugEnabled = false;
let flushTimer: NodeJS.Timeout | null = null;
let initPromise: Promise<void> | null = null;

type LogPayload = {
  data?: unknown;
  message: string;
  scope?: string | undefined;
};

function formatEntry(entry: {
  data?: unknown;
  level: string;
  message: string;
  process?: string;
  scope?: string;
  timestamp: number;
}): string {
  const date = new Date(entry.timestamp).toISOString();
  let dataStr = "";

  // todo:
  if (entry.data !== undefined && entry.data !== null) {
    if (entry.data instanceof Error) {
      const { message, stack, name, ...extra } = entry.data as Error &
        Record<string, unknown>;
      const extraStr =
        Object.keys(extra).length > 0 ? ` ${JSON.stringify(extra)}` : "";

      dataStr = `\n${stack ?? message}${extraStr}`;
    } else {
      dataStr = ` ${JSON.stringify(entry.data)}`;
    }
  }

  return `[${date}] [${entry.level.toUpperCase()}] ${
    entry.process ? `[${entry.process}] ` : ""
  }${entry.scope ? `[${entry.scope}] ` : ""}${entry.message}${dataStr}\n`;
}

export async function initMainLogger() {
  if (writeStream) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await fs.mkdir(DOCUMENTS_PATH, { recursive: true });
      const filePath = join(DOCUMENTS_PATH, LOG_FILE_NAME);

      const stream = createWriteStream(filePath, {
        flags: "a",
        encoding: "utf8",
        highWaterMark: 16_384, // 16KB buffer
      });

      writeStream = stream;

      flushTimer = globalThis.setInterval(() => {
        if (writeStream && !writeStream.destroyed) writeStream.uncork();
      }, FLUSH_INTERVAL_MS);

      process.on("exit", () => {
        if (flushTimer) globalThis.clearInterval(flushTimer);
        writeStream?.end();
      });
    } catch (error) {
      console.warn("logger: failed to initialize write stream", error);
      initPromise = null;
    }
  })();

  return initPromise;
}

export function setLoggerDebugEnabled(enabled: boolean) {
  debugEnabled = enabled;
}

export function logMainEntry(entry: MainLogEntry) {
  const formatted = formatEntry({
    ...entry,
    level: entry.level,
    timestamp: entry.timestamp || Date.now(),
  });

  process.stdout.write(formatted);
  if (writeStream && !writeStream.destroyed) {
    writeStream.write(formatted);
  } else if (!writeStream) {
    console[entry.level](formatted.trim());
  }
}

export function logMain(level: LogLevel, payload: LogPayload) {
  if (level === "debug" && !debugEnabled) return;

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

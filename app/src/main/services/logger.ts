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

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3,
});

type LogPayload = {
  data?: unknown | undefined;
  message?: string | undefined;
  scope?: string | undefined;
};

function formatEntry(entry: {
  data?: unknown | undefined;
  level: string;
  message?: string | undefined;
  process?: string | undefined;
  scope?: string | undefined;
  timestamp: number;
}): string {
  const date = dateFormatter.format(entry.timestamp);
  let dataStr = "";

  if (entry.data !== undefined && entry.data !== null) {
    if (entry.data instanceof Error) {
      const { message, stack, name, ...extra } = entry.data as Error &
        Record<string, unknown>;
      const extraStr =
        Object.keys(extra).length > 0 ? ` ${JSON.stringify(extra)}` : "";

      dataStr = (entry.message ? "\n" : "") + `${stack ?? message}${extraStr}`;
    } else {
      dataStr = (entry.message ? " " : "") + JSON.stringify(entry.data);
    }
  }

  return `[${date}] [${entry.level.toUpperCase()}] ${
    entry.process ? `[${entry.process}] ` : ""
  }${entry.scope ? `[${entry.scope}] ` : ""}${entry.message ?? ""}${dataStr}\n`;
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

export function createLogger(scope: string) {
  return {
    debug: (messageOrData?: unknown, ...args: unknown[]) =>
      logMain("debug", { scope, ...resolveLogArgs(messageOrData, ...args) }),
    info: (messageOrData?: unknown, ...args: unknown[]) =>
      logMain("info", { scope, ...resolveLogArgs(messageOrData, ...args) }),
    warn: (messageOrData?: unknown, ...args: unknown[]) =>
      logMain("warn", { scope, ...resolveLogArgs(messageOrData, ...args) }),
    error: (messageOrData?: unknown, ...args: unknown[]) =>
      logMain("error", { scope, ...resolveLogArgs(messageOrData, ...args) }),
  };
}

export const logger = {
  debug: (scope: string, messageOrData?: unknown, ...args: unknown[]) =>
    logMain("debug", { scope, ...resolveLogArgs(messageOrData, ...args) }),
  info: (scope: string, messageOrData?: unknown, ...args: unknown[]) =>
    logMain("info", { scope, ...resolveLogArgs(messageOrData, ...args) }),
  warn: (scope: string, messageOrData?: unknown, ...args: unknown[]) =>
    logMain("warn", { scope, ...resolveLogArgs(messageOrData, ...args) }),
  error: (scope: string, messageOrData?: unknown, ...args: unknown[]) =>
    logMain("error", { scope, ...resolveLogArgs(messageOrData, ...args) }),
};

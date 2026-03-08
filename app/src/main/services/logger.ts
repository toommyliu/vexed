import { createWriteStream, promises as fs, type WriteStream } from "fs";
import { join } from "path";
import process from "process";
import type { LogLevel } from "~/shared/types";
import { DOCUMENTS_PATH } from "../constants";

const LOG_FILE_NAME = "log.txt";
const LOG_FILE_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const LOG_FILE_MAX_ARCHIVES = 5; // log.1.txt to log.5.txt
const LOG_FILE_PATH = join(DOCUMENTS_PATH, LOG_FILE_NAME);

let writeStream: WriteStream | null = null;
let debugEnabled = false;
let initPromise: Promise<void> | null = null;
let currentLogSize = 0;
let isRotating = false;
const queuedEntries: string[] = [];

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type LogPayload = {
  data?: unknown | undefined;
  message?: string | undefined;
  scope?: string | undefined;
};

type MainLogEntry = {
  data?: unknown;
  level: LogLevel;
  message?: string | undefined;
  process: "main" | "renderer";
  scope: string;
  timestamp: number;
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

function getArchivePath(index: number): string {
  return join(DOCUMENTS_PATH, `log.${index}.txt`);
}

async function safeUnlink(path: string): Promise<void> {
  try {
    await fs.unlink(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function safeRename(
  sourcePath: string,
  targetPath: string,
): Promise<void> {
  try {
    await safeUnlink(targetPath);
    await fs.rename(sourcePath, targetPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function endStream(stream: WriteStream): Promise<void> {
  return new Promise((resolve) => {
    stream.end(() => resolve());
  });
}

async function openWriteStream(): Promise<void> {
  const stream = createWriteStream(LOG_FILE_PATH, {
    flags: "a",
    encoding: "utf8",
    highWaterMark: 16_384, // 16KB buffer
  });

  writeStream = stream;

  try {
    const stat = await fs.stat(LOG_FILE_PATH);
    currentLogSize = stat.size;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    currentLogSize = 0;
  }
}

function flushQueuedEntries(): void {
  if (!writeStream || writeStream.destroyed || isRotating) return;
  while (queuedEntries.length > 0) {
    const entry = queuedEntries.shift();
    if (!entry) break;
    writeStream.write(entry);
    currentLogSize += Buffer.byteLength(entry, "utf8");
  }
  if (currentLogSize >= LOG_FILE_MAX_BYTES) {
    void rotateLogs();
  }
}

async function rotateLogs(): Promise<void> {
  if (isRotating) return;
  isRotating = true;

  try {
    const stream = writeStream;
    writeStream = null;
    if (stream && !stream.destroyed) await endStream(stream);
    await safeUnlink(getArchivePath(LOG_FILE_MAX_ARCHIVES));
    for (let index = LOG_FILE_MAX_ARCHIVES - 1; index >= 1; index--)
      await safeRename(getArchivePath(index), getArchivePath(index + 1));
    await safeRename(LOG_FILE_PATH, getArchivePath(1));
    await openWriteStream();
  } catch (error) {
    console.warn("logger: failed to rotate log files", error);
    if (!writeStream || writeStream.destroyed) {
      try {
        await openWriteStream();
      } catch (reopenError) {
        console.warn("logger: failed to reopen write stream", reopenError);
      }
    }
  } finally {
    isRotating = false;
    flushQueuedEntries();
  }
}

function writeEntry(formatted: string): void {
  if (!writeStream || writeStream.destroyed || isRotating) {
    queuedEntries.push(formatted);
    return;
  }
  writeStream.write(formatted);
  currentLogSize += Buffer.byteLength(formatted, "utf8");
  if (currentLogSize >= LOG_FILE_MAX_BYTES) void rotateLogs();
}

export async function initMainLogger() {
  if (writeStream) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      await fs.mkdir(DOCUMENTS_PATH, { recursive: true });
      await openWriteStream();
      flushQueuedEntries();
      process.on("exit", () => {
        writeStream?.end();
      });
    } catch (error) {
      console.warn("logger: failed to initialize write stream", error);
      initPromise = null;
    }
  })();
  return initPromise;
}

export function setLoggerDebug(enabled: boolean) {
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
    writeEntry(formatted);
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

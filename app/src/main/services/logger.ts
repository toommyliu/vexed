import { createWriteStream, promises, type WriteStream } from "fs";
import { join } from "path";
import { DOCUMENTS_PATH } from "~/shared/constants";
import type { LogLevel, MainLogEntry } from "~/shared/types";

const LOG_FILE_NAME = "log.txt";
const FLUSH_INTERVAL_MS = 250;
const IMMEDIATE_FLUSH_LINES = 1_000;
const MAX_BATCH_LINES = 500;
const MAX_QUEUE_SIZE = 1_000;

let logStream: WriteStream | null = null;
let flushInterval: NodeJS.Timeout | null = null;
let isFlushing = false;
let waitingForDrain = false;
let isClosing = false;
let dropNoticeEmitted = false;
let debugEnabled = false;

const queue: string[] = [];

type LogPayload = {
  data?: unknown;
  message: string;
  scope?: string | undefined;
};

async function ensureStream(): Promise<WriteStream | null> {
  if (logStream) return logStream;

  try {
    await promises.mkdir(DOCUMENTS_PATH, { recursive: true });
    const filePath = join(DOCUMENTS_PATH, LOG_FILE_NAME);
    // eslint-disable-next-line require-atomic-updates
    logStream = createWriteStream(filePath, { flags: "a" });
    return logStream;
  } catch (error) {
    console.warn("Logger: failed to open log file", error);
    return null;
  }
}

function shouldLog(entry: MainLogEntry): boolean {
  return !(entry.level === "debug" && !debugEnabled);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

function formatEntry(entry: MainLogEntry): string {
  const timestamp = new Date(entry.timestamp).toISOString();
  const level = entry.level.toUpperCase();
  const scope = entry.scope ? `[${entry.scope}]` : "";
  const processLabel = `[${entry.process}]`;
  const dataSegment =
    debugEnabled && entry.data !== undefined
      ? ` data=${safeStringify(entry.data)}`
      : "";
  return `[${timestamp}] [${level}] ${processLabel} ${scope} ${entry.message}${dataSegment}`.trim();
}

function startFlushInterval() {
  if (flushInterval) return;
  flushInterval = globalThis.setInterval(() => {
    void flushQueue();
  }, FLUSH_INTERVAL_MS);
}

function stopFlushInterval() {
  if (!flushInterval) return;
  globalThis.clearInterval(flushInterval);
  flushInterval = null;
}

function enqueueLine(line: string) {
  if (queue.length >= MAX_QUEUE_SIZE) {
    if (!dropNoticeEmitted) {
      dropNoticeEmitted = true;
      queue.push(
        `[${new Date().toISOString()}] [WARN] [main] [logger] Log queue overflow; dropping entries`,
      );
    }

    return;
  }

  queue.push(line);
  startFlushInterval();

  if (queue.length >= IMMEDIATE_FLUSH_LINES) {
    void flushQueue();
  }
}

async function writeBatch(stream: WriteStream, lines: string[]): Promise<void> {
  return new Promise((resolve) => {
    const payload = `${lines.join("\n")}\n`;
    const ok = stream.write(payload);
    if (ok) {
      resolve();
      return;
    }

    waitingForDrain = true;
    stream.once("drain", () => {
      waitingForDrain = false;
      resolve();
    });
  });
}

async function drainQueue(stream: WriteStream): Promise<void> {
  if (!queue.length) return;

  const batch = queue.splice(0, MAX_BATCH_LINES);
  // eslint-disable-next-line promise/prefer-await-to-then
  return writeBatch(stream, batch).then(async () => drainQueue(stream));
}

async function flushAndClose(): Promise<void> {
  if (isClosing) return;

  isClosing = true;
  stopFlushInterval();

  let activeStream: WriteStream | null = null;

  return (
    ensureStream()
      // eslint-disable-next-line promise/prefer-await-to-then
      .then(async (stream) => {
        if (!stream) {
          queue.length = 0;
          logStream = null;
          return null;
        }

        activeStream = stream;
        return drainQueue(stream);
      })
      // eslint-disable-next-line promise/prefer-await-to-then
      .then(async () => {
        const stream = activeStream;
        if (!stream) return;

        return new Promise<void>((resolve) => {
          stream.end(() => {
            logStream = null;
            resolve();
          });
        });
      })
      // eslint-disable-next-line promise/prefer-await-to-then
      .finally(() => {
        isClosing = false;
      })
  );
}

async function flushQueue(): Promise<void> {
  if (isFlushing || waitingForDrain || isClosing) return;
  if (!queue.length) {
    stopFlushInterval();
    return;
  }

  isFlushing = true;

  return (
    ensureStream()
      // eslint-disable-next-line promise/prefer-await-to-then
      .then(async (stream) => {
        if (!stream) {
          queue.length = 0;
          stopFlushInterval();
          return;
        }

        const batch = queue.splice(0, MAX_BATCH_LINES);
        return writeBatch(stream, batch);
      })
      // eslint-disable-next-line promise/prefer-await-to-then
      .then(() => {
        if (queue.length) {
          globalThis.setImmediate(() => {
            void flushQueue();
          });
        } else {
          stopFlushInterval();
        }
      })
      // eslint-disable-next-line promise/prefer-await-to-then
      .finally(() => {
        isFlushing = false;
      })
  );
}

export function setLoggerDebugEnabled(enabled: boolean) {
  debugEnabled = enabled;
}

export async function initMainLogger() {
  await ensureStream();
}

export async function flushAndCloseLogger(): Promise<void> {
  return flushAndClose();
}

export function logMainEntry(entry: MainLogEntry) {
  if (!shouldLog(entry)) return;

  const line = formatEntry(entry);

  if (entry.level === "info") {
    console.info(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else if (entry.level === "error") {
    console.error(line);
  } else if (entry.level === "debug") {
    console.debug(line);
  }

  enqueueLine(line);
}

export function logMain(level: LogLevel, payload: LogPayload) {
  const entry: MainLogEntry = {
    data: payload.data,
    level,
    message: payload.message,
    process: "main",
    scope: payload.scope ?? "main",
    timestamp: Date.now(),
  };

  logMainEntry(entry);
}

export function logFromRenderer(entry: MainLogEntry) {
  if (entry.process !== "renderer") {
    logMain("warn", {
      scope: "logger",
      message: "Received non-renderer log entry from renderer channel.",
      data: entry,
    });
  }

  logMainEntry({
    ...entry,
    process: "renderer",
    scope: entry.scope ?? "renderer",
  });
}

export const logger = {
  // TODO: consider adding a factory for scopes
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

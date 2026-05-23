import { promises as fs } from "fs";
import { join } from "path";
import { BrowserWindow, app, type WebContents } from "electron";
import { Data, Effect, Layer, ServiceMap } from "effect";
import {
  formatErrorInfo,
  makeRecordLine,
  normalizeObservabilityInput,
  sanitizeLogValue,
  type ObservabilityInput,
  type ObservabilityLevel,
  type ObservabilityRecord,
  type ObservabilitySnapshot,
  type ObservabilitySource,
} from "../../shared/observability";
import { makeRandomId } from "../../shared/random-id";
import { MainEnvironment } from "./MainEnvironment";

const MAX_LOG_BYTES = 20 * 1024 * 1024;
const MAX_ROTATED_FILES = 5;
const MAX_RECORDS = 2_000;

export class ObservabilityWriteError extends Data.TaggedError(
  "ObservabilityWriteError",
)<{
  readonly path: string;
  readonly cause: unknown;
}> {}

export interface ObservabilityShape {
  readonly runId: string;
  readonly logPath: string;
  readonly write: (
    input: ObservabilityInput,
  ) => Effect.Effect<ObservabilityRecord>;
  readonly debug: (
    component: string,
    message: string,
    data?: unknown,
  ) => Effect.Effect<ObservabilityRecord>;
  readonly info: (
    component: string,
    message: string,
    data?: unknown,
  ) => Effect.Effect<ObservabilityRecord>;
  readonly warn: (
    component: string,
    message: string,
    data?: unknown,
  ) => Effect.Effect<ObservabilityRecord>;
  readonly error: (
    component: string,
    message: string,
    error?: unknown,
    data?: unknown,
  ) => Effect.Effect<ObservabilityRecord>;
  readonly snapshot: Effect.Effect<ObservabilitySnapshot>;
  readonly installProcessHooks: Effect.Effect<void>;
  readonly observeWindow: (
    window: BrowserWindow,
    options?: {
      readonly source?: ObservabilitySource;
      readonly component?: string;
    },
  ) => Effect.Effect<void>;
}

export class Observability extends ServiceMap.Service<
  Observability,
  ObservabilityShape
>()("main/Observability") {}

const rotatedLogPath = (path: string, index: number): string =>
  `${path}.${index}`;

const isMissingFileError = (cause: unknown): boolean =>
  typeof cause === "object" &&
  cause !== null &&
  (cause as { readonly code?: unknown }).code === "ENOENT";

const sendToOpenDevConsole = (
  record: ObservabilityRecord,
): Effect.Effect<void> =>
  Effect.sync(() => {
    const stream =
      record.level === "error" || record.level === "warn"
        ? process.stderr
        : process.stdout;
    stream.write(`[${record.source}:${record.component}] ${record.message}\n`);
  });

export const makeObservability = (
  logDir: string,
  options: {
    readonly runId?: string;
    readonly now?: () => Date;
  } = {},
): ObservabilityShape => {
  const runId = options.runId ?? makeRandomId();
  const now = options.now ?? (() => new Date());
  const logPath = join(logDir, "logs.ndjson");
  const records: ObservabilityRecord[] = [];
  let nextRecordId = 0;
  let writeChain: Promise<void> = Promise.resolve();
  let processHooksInstalled = false;

  const rotateIfNeeded = async (): Promise<void> => {
    let currentSize = 0;
    try {
      currentSize = (await fs.stat(logPath)).size;
    } catch (cause) {
      if (isMissingFileError(cause)) {
        return;
      }
      throw cause;
    }

    if (currentSize < MAX_LOG_BYTES) {
      return;
    }

    for (let index = MAX_ROTATED_FILES - 1; index >= 1; index--) {
      try {
        await fs.rename(
          rotatedLogPath(logPath, index),
          rotatedLogPath(logPath, index + 1),
        );
      } catch (cause) {
        if (!isMissingFileError(cause)) {
          throw cause;
        }
      }
    }

    try {
      await fs.rename(logPath, rotatedLogPath(logPath, 1));
    } catch (cause) {
      if (!isMissingFileError(cause)) {
        throw cause;
      }
    }
  };

  const writeRecord = (
    record: ObservabilityRecord,
  ): Effect.Effect<ObservabilityRecord, ObservabilityWriteError> =>
    Effect.tryPromise({
      try: async () => {
        records.push(record);
        if (records.length > MAX_RECORDS) {
          records.splice(0, records.length - MAX_RECORDS);
        }

        writeChain = writeChain
          .catch(() => undefined)
          .then(async () => {
            await fs.mkdir(logDir, { recursive: true });
            await rotateIfNeeded();
            await fs.writeFile(logPath, makeRecordLine(record), {
              encoding: "utf8",
              flag: "a",
            });
          });
        await writeChain;
        return record;
      },
      catch: (cause) => new ObservabilityWriteError({ path: logPath, cause }),
    });

  const write: ObservabilityShape["write"] = (input) => {
    const normalized = normalizeObservabilityInput(input);
    const record: ObservabilityRecord = {
      id: nextRecordId++,
      runId,
      timestamp: now().toISOString(),
      level: normalized.level ?? "info",
      source: normalized.source ?? "main",
      component: normalized.component ?? "main",
      message: normalized.message,
      ...(normalized.data === undefined
        ? {}
        : { data: sanitizeLogValue(normalized.data) }),
      ...(normalized.error === undefined
        ? {}
        : { error: formatErrorInfo(normalized.error) }),
    };

    return writeRecord(record).pipe(
      Effect.catchCause(() =>
        sendToOpenDevConsole({
          ...record,
          level: "error",
          message: "Failed to write observability record",
        }).pipe(Effect.as(record)),
      ),
    );
  };

  const log =
    (level: ObservabilityLevel) =>
    (
      component: string,
      message: string,
      data?: unknown,
    ): Effect.Effect<ObservabilityRecord> =>
      write({
        level,
        source: "main",
        component,
        message,
        ...(data === undefined ? {} : { data }),
      });

  const error: ObservabilityShape["error"] = (
    component,
    message,
    error,
    data,
  ) =>
    write({
      level: "error",
      source: "main",
      component,
      message,
      ...(data === undefined ? {} : { data }),
      ...(error === undefined ? {} : { error }),
    });

  const observeWindow: ObservabilityShape["observeWindow"] = (
    window,
    options,
  ) =>
    Effect.sync(() => {
      const component = options?.component ?? `window:${window.id}`;
      const source = options?.source ?? "electron";
      const webContents = window.webContents as WebContents;

      webContents.on(
        "console-message",
        (_event, level, message, line, sourceId) => {
          const logLevel: ObservabilityLevel =
            level >= 3 ? "error" : level === 2 ? "warn" : "info";
          void Effect.runPromise(
            write({
              level: logLevel,
              source,
              component,
              message,
              data: { line, sourceId },
            }),
          );
        },
      );

      webContents.on(
        "did-fail-load",
        (_event, errorCode, errorDescription, validatedURL) => {
          void Effect.runPromise(
            write({
              level: "error",
              source,
              component,
              message: "Web contents failed to load",
              data: { errorCode, errorDescription, validatedURL },
            }),
          );
        },
      );

      webContents.on("render-process-gone", (_event, details) => {
        void Effect.runPromise(
          write({
            level: "error",
            source,
            component,
            message: "Render process exited",
            data: details,
          }),
        );
      });

      window.on("unresponsive", () => {
        void Effect.runPromise(
          write({
            level: "warn",
            source,
            component,
            message: "Window became unresponsive",
          }),
        );
      });

      window.on("responsive", () => {
        void Effect.runPromise(
          write({
            level: "info",
            source,
            component,
            message: "Window became responsive",
          }),
        );
      });
    });

  const installProcessHooks: ObservabilityShape["installProcessHooks"] =
    Effect.sync(() => {
      if (processHooksInstalled) {
        return;
      }

      processHooksInstalled = true;

      process.on("uncaughtException", (cause) => {
        void Effect.runPromise(
          write({
            level: "error",
            source: "process",
            component: "process",
            message: "Uncaught exception",
            error: cause,
          }),
        );
      });

      process.on("unhandledRejection", (cause) => {
        void Effect.runPromise(
          write({
            level: "error",
            source: "process",
            component: "process",
            message: "Unhandled rejection",
            error: cause,
          }),
        );
      });

      app.on("render-process-gone", (_event, webContents, details) => {
        void Effect.runPromise(
          write({
            level: "error",
            source: "electron",
            component: `webContents:${webContents.id}`,
            message: "Render process gone",
            data: details,
          }),
        );
      });

      app.on("child-process-gone", (_event, details) => {
        void Effect.runPromise(
          write({
            level: "error",
            source: "electron",
            component: "child-process",
            message: "Child process gone",
            data: details,
          }),
        );
      });
    });

  return {
    runId,
    logPath,
    write,
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error,
    snapshot: Effect.sync(() => ({
      runId,
      logPath,
      records: [...records],
    })),
    installProcessHooks,
    observeWindow,
  };
};

export const ObservabilityLive = Layer.effect(Observability)(
  Effect.gen(function* () {
    const env = yield* MainEnvironment;
    return makeObservability(env.logsDir);
  }),
);

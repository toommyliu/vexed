import { Effect, Layer, Scope } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Observability,
  type ObservabilityShape,
} from "../app/MainObservability";
import { MainIpc, MainIpcLive, type MainIpcShape } from "./MainIpc";

const electronMock = vi.hoisted(() => {
  const handlers = new Map<string, (...args: readonly unknown[]) => unknown>();
  const listeners = new Map<string, (...args: readonly unknown[]) => void>();

  return {
    handlers,
    listeners,
    ipcMain: {
      handle: vi.fn(
        (
          channel: string,
          handler: (...args: readonly unknown[]) => unknown,
        ) => {
          handlers.set(channel, handler);
        },
      ),
      removeHandler: vi.fn((channel: string) => {
        handlers.delete(channel);
      }),
      on: vi.fn(
        (channel: string, listener: (...args: readonly unknown[]) => void) => {
          listeners.set(channel, listener);
        },
      ),
      removeListener: vi.fn(
        (channel: string, listener: (...args: readonly unknown[]) => void) => {
          if (listeners.get(channel) === listener) {
            listeners.delete(channel);
          }
        },
      ),
    },
  };
});

vi.mock("electron", () => ({
  ipcMain: electronMock.ipcMain,
}));

const records: unknown[] = [];

const makeObservability = (): ObservabilityShape => {
  const write: ObservabilityShape["write"] = (input) =>
    Effect.sync(() => {
      records.push(input);
      return {
        id: records.length,
        runId: "test",
        timestamp: "2026-05-22T00:00:00.000Z",
        level: input.level ?? "info",
        source: input.source ?? "main",
        component: input.component ?? "test",
        message: input.message,
      };
    });

  return {
    runId: "test",
    logPath: "/tmp/vexed-test.ndjson",
    write,
    debug: (component, message, data) =>
      write({ level: "debug", source: "main", component, message, data }),
    info: (component, message, data) =>
      write({ level: "info", source: "main", component, message, data }),
    warn: (component, message, data) =>
      write({ level: "warn", source: "main", component, message, data }),
    error: (component, message, error, data) =>
      write({
        level: "error",
        source: "main",
        component,
        message,
        error,
        data,
      }),
    snapshot: Effect.succeed({
      runId: "test",
      logPath: "/tmp/vexed-test.ndjson",
      records: [],
    }),
    installProcessHooks: Effect.void,
    observeWindow: () => Effect.void,
  };
};

const withMainIpc = async <A>(
  body: (ipc: MainIpcShape) => Effect.Effect<A, unknown, MainIpc | Scope.Scope>,
): Promise<A> =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const ipc = yield* MainIpc;
        return yield* body(ipc);
      }),
    ).pipe(
      Effect.provide(
        MainIpcLive.pipe(
          Layer.provide(Layer.succeed(Observability)(makeObservability())),
        ),
      ),
    ),
  );

describe("MainIpc", () => {
  beforeEach(() => {
    records.length = 0;
    electronMock.handlers.clear();
    electronMock.listeners.clear();
    electronMock.ipcMain.handle.mockClear();
    electronMock.ipcMain.removeHandler.mockClear();
    electronMock.ipcMain.on.mockClear();
    electronMock.ipcMain.removeListener.mockClear();
  });

  it("registers scoped handlers and removes them on scope close", async () => {
    await withMainIpc((ipc) =>
      Effect.gen(function* () {
        yield* ipc.handle("test:handle", () => Effect.succeed("ok"));

        expect(electronMock.ipcMain.handle).toHaveBeenCalledWith(
          "test:handle",
          expect.any(Function),
        );
        expect(electronMock.handlers.has("test:handle")).toBe(true);
      }),
    );

    expect(electronMock.ipcMain.removeHandler).toHaveBeenCalledWith(
      "test:handle",
    );
    expect(electronMock.handlers.has("test:handle")).toBe(false);
  });

  it("preserves handler services and records successful invocations", async () => {
    await withMainIpc((ipc) =>
      Effect.gen(function* () {
        yield* ipc.handle("test:ok", (_event, value) =>
          Effect.succeed({ value }),
        );
        const handler = electronMock.handlers.get("test:ok");
        if (handler === undefined) {
          throw new Error("missing handler");
        }

        const result = yield* Effect.promise(
          () => handler({ sender: { id: 7 } }, "value") as Promise<unknown>,
        );

        expect(result).toEqual({ value: "value" });
        expect(records).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              level: "debug",
              component: "ipc",
              message: "IPC handler completed",
              data: expect.objectContaining({
                channel: "test:ok",
                senderId: 7,
              }),
            }),
          ]),
        );
      }),
    );
  });

  it("logs handler failures before rethrowing to Electron", async () => {
    await withMainIpc((ipc) =>
      Effect.gen(function* () {
        yield* ipc.handle("test:fail", () =>
          Effect.fail(new Error("handler failed")),
        );
        const handler = electronMock.handlers.get("test:fail");
        if (handler === undefined) {
          throw new Error("missing handler");
        }

        yield* Effect.promise(async () => {
          await expect(
            handler({ sender: { id: 9 } }) as Promise<unknown>,
          ).rejects.toThrow("handler failed");
        });

        expect(records).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              level: "error",
              component: "ipc",
              message: "IPC handler failed",
              data: expect.objectContaining({
                channel: "test:fail",
                senderId: 9,
              }),
            }),
          ]),
        );
      }),
    );
  });
});

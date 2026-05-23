import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from "electron";
import { Effect, Layer, Scope, ServiceMap } from "effect";
import { Observability } from "../app/MainObservability";

type IpcHandler<A, R> = (
  event: IpcMainInvokeEvent,
  ...args: readonly unknown[]
) => Effect.Effect<A, unknown, R>;

type IpcListener<R> = (
  event: IpcMainEvent,
  ...args: readonly unknown[]
) => Effect.Effect<void, unknown, R>;

export interface MainIpcShape {
  readonly handle: <A, R>(
    channel: string,
    handler: IpcHandler<A, R>,
  ) => Effect.Effect<void, never, R | Scope.Scope>;
  readonly on: <R>(
    channel: string,
    listener: IpcListener<R>,
  ) => Effect.Effect<void, never, R | Scope.Scope>;
}

export class MainIpc extends ServiceMap.Service<MainIpc, MainIpcShape>()(
  "main/MainIpc",
) {}

const errorMessage = (cause: unknown): string =>
  cause instanceof Error && cause.message !== ""
    ? cause.message
    : String(cause);

export const MainIpcLive = Layer.effect(MainIpc)(
  Effect.gen(function* () {
    const observability = yield* Observability;

    const handle = <A, R>(
      channel: string,
      handler: IpcHandler<A, R>,
    ): Effect.Effect<void, never, R | Scope.Scope> =>
      Effect.gen(function* () {
        const services = yield* Effect.services<R>();
        const runPromise = Effect.runPromiseWith(services);
        const runLog = (effect: Effect.Effect<unknown>): void => {
          void runPromise(effect).catch(() => undefined);
        };
        ipcMain.handle(channel, async (event, ...args) => {
          const startedAt = Date.now();
          try {
            const result = await runPromise(handler(event, ...args));
            runLog(
              observability.debug("ipc", "IPC handler completed", {
                channel,
                senderId: event.sender.id,
                durationMs: Date.now() - startedAt,
              }),
            );
            return result;
          } catch (cause) {
            runLog(
              observability.error("ipc", "IPC handler failed", cause, {
                channel,
                senderId: event.sender.id,
                durationMs: Date.now() - startedAt,
              }),
            );
            throw cause instanceof Error
              ? cause
              : new Error(errorMessage(cause));
          }
        });

        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            ipcMain.removeHandler(channel);
          }),
        );
      });

    const on = <R>(
      channel: string,
      listener: IpcListener<R>,
    ): Effect.Effect<void, never, R | Scope.Scope> =>
      Effect.gen(function* () {
        const services = yield* Effect.services<R>();
        const runPromise = Effect.runPromiseWith(services);
        const runLog = (effect: Effect.Effect<unknown>): void => {
          void runPromise(effect).catch(() => undefined);
        };
        const subscription = (event: IpcMainEvent, ...args: unknown[]) => {
          void runPromise(listener(event, ...args)).catch((cause) => {
            runLog(
              observability.error("ipc", "IPC listener failed", cause, {
                channel,
                senderId: event.sender.id,
              }),
            );
          });
        };

        ipcMain.on(channel, subscription);
        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            ipcMain.removeListener(channel, subscription);
          }),
        );
      });

    return { handle, on };
  }),
);

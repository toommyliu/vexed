import { BrowserWindow, type IpcMainInvokeEvent } from "electron";
import { Effect, Scope } from "effect";
import {
  createIdleFollowerState,
  normalizeFollowerConfig,
  normalizeFollowerState,
  type FollowerStartPayload,
  type FollowerState,
} from "../../../shared/follower";
import {
  FollowerIpcChannels,
  type FollowerRequestKind,
  type FollowerRequestMessage,
  type FollowerResponseMessage,
} from "../../../shared/ipc";
import { makeRandomId } from "../../../shared/random-id";
import { WindowIds } from "../../../shared/windows";
import {
  WindowManagerError,
  WindowService,
  type WindowEffectRunner,
} from "../../window/WindowService";
import { MainIpc } from "../MainIpc";

const FOLLOWER_REQUEST_TIMEOUT_MS = 5_000;

const states = new Map<number, FollowerState>();
const stateCleanupWindowIds = new Set<number>();
const pendingRequests = new Map<
  string,
  {
    readonly resolve: (value: unknown) => void;
    readonly reject: (error: Error) => void;
    readonly timeout: ReturnType<typeof setTimeout>;
  }
>();

const getSenderWindowId = (event: IpcMainInvokeEvent): number | undefined =>
  BrowserWindow.fromWebContents(event.sender)?.id;

const requestErrorMessage = (cause: unknown): string =>
  cause instanceof Error && cause.message !== ""
    ? cause.message
    : "Follower request failed";

const trackWindowState = (gameWindowId: number): void => {
  if (stateCleanupWindowIds.has(gameWindowId)) {
    return;
  }

  const window = BrowserWindow.fromId(gameWindowId);
  if (!window || window.isDestroyed()) {
    states.delete(gameWindowId);
    return;
  }

  stateCleanupWindowIds.add(gameWindowId);
  window.once("closed", () => {
    states.delete(gameWindowId);
    stateCleanupWindowIds.delete(gameWindowId);
  });
};

const setWindowState = (
  gameWindowId: number,
  state: FollowerState,
): FollowerState => {
  const normalized = normalizeFollowerState(state);
  states.set(gameWindowId, normalized);
  trackWindowState(gameWindowId);
  return normalized;
};

const getWindowState = (gameWindowId: number): FollowerState =>
  states.get(gameWindowId) ?? createIdleFollowerState();

const sendChanged = (
  window: BrowserWindow | null,
  senderWindowId: number | undefined,
  state: FollowerState,
): void => {
  if (
    !window ||
    window.id === senderWindowId ||
    window.isDestroyed() ||
    window.webContents.isDestroyed()
  ) {
    return;
  }

  window.webContents.send(FollowerIpcChannels.changed, state);
};

const senderGameWindowId = (
  event: IpcMainInvokeEvent,
): Effect.Effect<number, WindowManagerError, WindowService> =>
  Effect.gen(function* () {
    const senderWindowId = getSenderWindowId(event);
    if (senderWindowId === undefined) {
      return yield* new WindowManagerError({
        message: "Missing sender window",
      });
    }

    const windows = yield* WindowService;
    const gameWindowId = yield* windows.getGameWindowId(senderWindowId);
    if (gameWindowId === undefined) {
      return yield* new WindowManagerError({
        message: "Missing parent game window",
      });
    }

    return gameWindowId;
  });

const notifyFollowerChanged = (
  gameWindowId: number,
  senderWindowId: number | undefined,
  state: FollowerState,
): Effect.Effect<void, never, WindowService> =>
  Effect.gen(function* () {
    const windows = yield* WindowService;
    const gameWindow = yield* windows.getGameWindow(gameWindowId);
    const followerWindow = yield* windows.getGameChildWindow(
      gameWindowId,
      WindowIds.Follower,
    );

    sendChanged(gameWindow, senderWindowId, state);
    sendChanged(followerWindow, senderWindowId, state);
  });

const requestGameFollower = (
  gameWindow: BrowserWindow,
  kind: FollowerRequestKind,
  payload?: unknown,
): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const requestId = makeRandomId();
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error("Follower did not respond"));
    }, FOLLOWER_REQUEST_TIMEOUT_MS);

    pendingRequests.set(requestId, { resolve, reject, timeout });

    const request: FollowerRequestMessage = {
      requestId,
      kind,
      ...(payload === undefined ? {} : { payload }),
    };
    gameWindow.webContents.send(FollowerIpcChannels.request, request);
  });

const requestFollowerState = (
  event: IpcMainInvokeEvent,
  kind: FollowerRequestKind,
  payload?: unknown,
): Effect.Effect<FollowerState, WindowManagerError, WindowService> =>
  Effect.gen(function* () {
    const gameWindowId = yield* senderGameWindowId(event);
    const windows = yield* WindowService;
    const gameWindow = yield* windows.getGameWindow(gameWindowId);
    if (!gameWindow) {
      return yield* new WindowManagerError({
        message: "Missing parent game window",
      });
    }

    const rawState = yield* Effect.tryPromise({
      try: () => requestGameFollower(gameWindow, kind, payload),
      catch: (cause) =>
        new WindowManagerError({
          message: requestErrorMessage(cause),
          cause,
        }),
    }).pipe(
      Effect.catch((error: WindowManagerError) => {
        if (kind !== "getState") {
          return Effect.fail(error);
        }

        return Effect.succeed(getWindowState(gameWindowId));
      }),
    );
    const state = setWindowState(
      gameWindowId,
      normalizeFollowerState(rawState),
    );
    yield* notifyFollowerChanged(gameWindowId, getSenderWindowId(event), state);
    return state;
  });

export const registerFollowerIpcHandlers = (
  runWindowEffect: WindowEffectRunner,
): Effect.Effect<void, never, MainIpc | Scope.Scope> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;
    const run = <A>(
      effect: Effect.Effect<A, WindowManagerError, WindowService>,
    ) => Effect.promise(() => runWindowEffect(effect));

    yield* ipc.on(FollowerIpcChannels.response, (_event, response) =>
      Effect.sync(() => {
        const followerResponse = response as FollowerResponseMessage;
        if (typeof followerResponse.requestId !== "string") {
          return;
        }

        const pending = pendingRequests.get(followerResponse.requestId);
        if (!pending) {
          return;
        }

        pendingRequests.delete(followerResponse.requestId);
        clearTimeout(pending.timeout);

        if (followerResponse.ok) {
          pending.resolve(followerResponse.value);
        } else {
          pending.reject(
            new Error(followerResponse.error || "Follower request failed"),
          );
        }
      }),
    );

    yield* ipc.handle(FollowerIpcChannels.getState, (event) =>
      run(requestFollowerState(event, "getState")),
    );

    yield* ipc.handle(FollowerIpcChannels.me, (event) =>
      run(
        Effect.gen(function* () {
          const gameWindowId = yield* senderGameWindowId(event);
          const windows = yield* WindowService;
          const gameWindow = yield* windows.getGameWindow(gameWindowId);
          if (!gameWindow) {
            return yield* new WindowManagerError({
              message: "Missing parent game window",
            });
          }

          return yield* Effect.tryPromise({
            try: () => requestGameFollower(gameWindow, "me"),
            catch: (cause) =>
              new WindowManagerError({
                message: requestErrorMessage(cause),
                cause,
              }),
          }).pipe(Effect.map((name) => (typeof name === "string" ? name : "")));
        }),
      ),
    );

    yield* ipc.handle(FollowerIpcChannels.start, (event, payload) =>
      run(
        requestFollowerState(
          event,
          "start",
          normalizeFollowerConfig(payload as FollowerStartPayload),
        ),
      ),
    );

    yield* ipc.handle(FollowerIpcChannels.stop, (event) =>
      run(requestFollowerState(event, "stop")),
    );

    yield* ipc.handle(FollowerIpcChannels.publishState, (event, rawState) =>
      run(
        Effect.gen(function* () {
          const gameWindowId = yield* senderGameWindowId(event);
          const state = setWindowState(
            gameWindowId,
            normalizeFollowerState(rawState),
          );
          yield* notifyFollowerChanged(
            gameWindowId,
            getSenderWindowId(event),
            state,
          );
        }),
      ),
    );
  });

import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import { Effect } from "effect";
import {
  createIdleFollowerState,
  normalizeFollowerConfig,
  normalizeFollowerState,
  type FollowerStartPayload,
  type FollowerState,
} from "../shared/follower";
import {
  FollowerIpcChannels,
  type FollowerRequestKind,
  type FollowerRequestMessage,
  type FollowerResponseMessage,
} from "../shared/ipc";
import { WindowIds } from "../shared/windows";
import {
  WindowManagerError,
  WindowService,
  type WindowEffectRunner,
} from "./windows";

const FOLLOWER_REQUEST_TIMEOUT_MS = 5_000;

let followerIpcRegistered = false;
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
    const requestId = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
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
    const state = setWindowState(gameWindowId, normalizeFollowerState(rawState));
    yield* notifyFollowerChanged(gameWindowId, getSenderWindowId(event), state);
    return state;
  });

export const registerFollowerIpcHandlers = (
  runWindowEffect: WindowEffectRunner,
): void => {
  if (followerIpcRegistered) {
    return;
  }

  ipcMain.on(
    FollowerIpcChannels.response,
    (_event, response: FollowerResponseMessage) => {
      if (typeof response?.requestId !== "string") {
        return;
      }

      const pending = pendingRequests.get(response.requestId);
      if (!pending) {
        return;
      }

      pendingRequests.delete(response.requestId);
      clearTimeout(pending.timeout);

      if (response.ok) {
        pending.resolve(response.value);
      } else {
        pending.reject(new Error(response.error || "Follower request failed"));
      }
    },
  );

  ipcMain.handle(FollowerIpcChannels.getState, async (event) =>
    runWindowEffect(requestFollowerState(event, "getState")),
  );

  ipcMain.handle(FollowerIpcChannels.me, async (event) =>
    runWindowEffect(
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

  ipcMain.handle(
    FollowerIpcChannels.start,
    async (event, payload: FollowerStartPayload) =>
      runWindowEffect(
        requestFollowerState(event, "start", normalizeFollowerConfig(payload)),
      ),
  );

  ipcMain.handle(FollowerIpcChannels.stop, async (event) =>
    runWindowEffect(requestFollowerState(event, "stop")),
  );

  ipcMain.handle(
    FollowerIpcChannels.publishState,
    async (event, rawState: unknown) =>
      runWindowEffect(
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

  followerIpcRegistered = true;
};

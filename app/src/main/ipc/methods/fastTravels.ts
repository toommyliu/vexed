import { BrowserWindow, type IpcMainInvokeEvent } from "electron";
import { Effect, Scope } from "effect";
import {
  addFastTravel,
  deleteFastTravel,
  normalizeFastTravelDraft,
  normalizeFastTravelWarpPayload,
  updateFastTravel,
  type FastTravel,
  type FastTravelDraft,
  type FastTravelWarpPayload,
} from "../../../shared/fast-travels";
import {
  FastTravelsIpcChannels,
  type FastTravelsRequestMessage,
  type FastTravelsResponseMessage,
} from "../../../shared/ipc";
import { makeRandomId } from "../../../shared/random-id";
import {
  FastTravelRepository,
  type FastTravelRepositoryShape,
} from "../../persistence/fastTravels/FastTravelRepository";
import {
  WindowManagerError,
  WindowService,
  type WindowEffectRunner,
} from "../../window/WindowService";
import { MainIpc } from "../MainIpc";

const FAST_TRAVELS_REQUEST_TIMEOUT_MS = 5_000;

const pendingRequests = new Map<
  string,
  {
    readonly resolve: () => void;
    readonly reject: (error: Error) => void;
    readonly timeout: ReturnType<typeof setTimeout>;
  }
>();

const getSenderWindowId = (event: IpcMainInvokeEvent): number | undefined =>
  BrowserWindow.fromWebContents(event.sender)?.id;

const requestErrorMessage = (cause: unknown): string =>
  cause instanceof Error && cause.message !== ""
    ? cause.message
    : "Fast travel request failed";

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

const broadcastChanged = (locations: readonly FastTravel[]): void => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed() || win.webContents.isDestroyed()) {
      continue;
    }

    try {
      win.webContents.send(FastTravelsIpcChannels.changed, locations);
    } catch {
      // Window teardown can race the destroyed checks; broadcasts are best effort.
    }
  }
};

const publishLocations = (
  repository: FastTravelRepositoryShape,
  locations: readonly FastTravel[],
) =>
  repository
    .set(locations)
    .pipe(
      Effect.tap((normalized) =>
        Effect.sync(() => broadcastChanged(normalized)),
      ),
    );

const requestGameFastTravel = (
  gameWindow: BrowserWindow,
  payload: FastTravelWarpPayload,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const requestId = makeRandomId();
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error("Fast travel did not respond"));
    }, FAST_TRAVELS_REQUEST_TIMEOUT_MS);

    pendingRequests.set(requestId, { resolve, reject, timeout });

    const request: FastTravelsRequestMessage = {
      requestId,
      kind: "warp",
      payload,
    };

    try {
      gameWindow.webContents.send(FastTravelsIpcChannels.request, request);
    } catch (cause) {
      pendingRequests.delete(requestId);
      clearTimeout(timeout);
      reject(
        cause instanceof Error
          ? cause
          : new Error("Fast travel request failed"),
      );
    }
  });

const sendFastTravelRequest = (
  event: IpcMainInvokeEvent,
  payload: FastTravelWarpPayload,
): Effect.Effect<void, WindowManagerError, WindowService> =>
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
      try: () => requestGameFastTravel(gameWindow, payload),
      catch: (cause) =>
        new WindowManagerError({
          message: requestErrorMessage(cause),
          cause,
        }),
    });
  });

export const registerFastTravelsIpcHandlers = (
  runWindowEffect: WindowEffectRunner,
): Effect.Effect<void, never, FastTravelRepository | MainIpc | Scope.Scope> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;
    const run = <A>(
      effect: Effect.Effect<A, WindowManagerError, WindowService>,
    ) => Effect.promise(() => runWindowEffect(effect));

    yield* ipc.on(FastTravelsIpcChannels.response, (_event, response) =>
      Effect.sync(() => {
        const fastTravelResponse = response as FastTravelsResponseMessage;
        if (typeof fastTravelResponse?.requestId !== "string") {
          return;
        }

        const pending = pendingRequests.get(fastTravelResponse.requestId);
        if (!pending) {
          return;
        }

        pendingRequests.delete(fastTravelResponse.requestId);
        clearTimeout(pending.timeout);

        if (typeof fastTravelResponse.ok !== "boolean") {
          pending.reject(new Error("Invalid fast travel response"));
          return;
        }

        if (fastTravelResponse.ok) {
          pending.resolve();
        } else {
          const message =
            typeof fastTravelResponse.error === "string" &&
            fastTravelResponse.error !== ""
              ? fastTravelResponse.error
              : "Fast travel request failed";
          pending.reject(new Error(message));
        }
      }),
    );

    yield* ipc.handle(FastTravelsIpcChannels.getAll, () =>
      Effect.gen(function* () {
        const repository = yield* FastTravelRepository;
        return yield* repository.get;
      }),
    );

    yield* ipc.handle(FastTravelsIpcChannels.create, (_event, draft) =>
      Effect.gen(function* () {
        const repository = yield* FastTravelRepository;
        const current = yield* repository.get;
        return yield* publishLocations(
          repository,
          addFastTravel(
            current,
            normalizeFastTravelDraft(draft as FastTravelDraft),
          ),
        );
      }),
    );

    yield* ipc.handle(
      FastTravelsIpcChannels.update,
      (_event, originalName, draft) =>
        Effect.gen(function* () {
          const repository = yield* FastTravelRepository;
          const current = yield* repository.get;
          return yield* publishLocations(
            repository,
            updateFastTravel(
              current,
              typeof originalName === "string" ? originalName : "",
              normalizeFastTravelDraft(draft as FastTravelDraft),
            ),
          );
        }),
    );

    yield* ipc.handle(FastTravelsIpcChannels.delete, (_event, name) =>
      Effect.gen(function* () {
        const repository = yield* FastTravelRepository;
        const current = yield* repository.get;
        return yield* publishLocations(
          repository,
          deleteFastTravel(current, typeof name === "string" ? name : ""),
        );
      }),
    );

    yield* ipc.handle(FastTravelsIpcChannels.warp, (event, payload) =>
      run(
        sendFastTravelRequest(event, normalizeFastTravelWarpPayload(payload)),
      ),
    );
  });

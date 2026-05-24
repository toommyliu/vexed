import { BrowserWindow, type IpcMainInvokeEvent } from "electron";
import { Effect, Scope } from "effect";
import {
  normalizeLoaderGrabberGrabRequest,
  normalizeLoaderGrabberLoadRequest,
  type GrabbedData,
  type LoaderGrabberGrabRequest,
  type LoaderGrabberLoadRequest,
} from "../../../shared/loader-grabber";
import {
  LoaderGrabberIpcChannels,
  type LoaderGrabberRequestKind,
  type LoaderGrabberRequestMessage,
  type LoaderGrabberResponseMessage,
} from "../../../shared/ipc";
import { makeRandomId } from "../../../shared/random-id";
import {
  WindowManagerError,
  WindowService,
  type WindowEffectRunner,
} from "../../window/WindowService";
import { MainIpc } from "../MainIpc";

const LOADER_GRABBER_REQUEST_TIMEOUT_MS = 5_000;

const pendingRequests = new Map<
  string,
  {
    readonly resolve: (value: GrabbedData | null) => void;
    readonly reject: (error: Error) => void;
    readonly timeout: ReturnType<typeof setTimeout>;
  }
>();

const rejectPendingRequests = (error: Error): void => {
  for (const pending of pendingRequests.values()) {
    clearTimeout(pending.timeout);
    pending.reject(error);
  }
  pendingRequests.clear();
};

const getSenderWindowId = (event: IpcMainInvokeEvent): number | undefined =>
  BrowserWindow.fromWebContents(event.sender)?.id;

const requestErrorMessage = (cause: unknown): string =>
  cause instanceof Error && cause.message !== ""
    ? cause.message
    : "Loader grabber request failed";

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

const makeRequestMessage = (
  requestId: string,
  kind: LoaderGrabberRequestKind,
  payload: LoaderGrabberLoadRequest | LoaderGrabberGrabRequest,
): LoaderGrabberRequestMessage =>
  kind === "load"
    ? {
        kind,
        payload: payload as LoaderGrabberLoadRequest,
        requestId,
      }
    : {
        kind,
        payload: payload as LoaderGrabberGrabRequest,
        requestId,
      };

const requestGameLoaderGrabber = (
  gameWindow: BrowserWindow,
  kind: LoaderGrabberRequestKind,
  payload: LoaderGrabberLoadRequest | LoaderGrabberGrabRequest,
): Promise<GrabbedData | null> =>
  new Promise((resolve, reject) => {
    const requestId = makeRandomId();
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error("Loader grabber did not respond"));
    }, LOADER_GRABBER_REQUEST_TIMEOUT_MS);

    pendingRequests.set(requestId, { resolve, reject, timeout });

    try {
      gameWindow.webContents.send(
        LoaderGrabberIpcChannels.request,
        makeRequestMessage(requestId, kind, payload),
      );
    } catch (cause) {
      pendingRequests.delete(requestId);
      clearTimeout(timeout);
      reject(
        cause instanceof Error
          ? cause
          : new Error("Loader grabber request failed"),
      );
    }
  });

const sendLoaderGrabberRequest = (
  event: IpcMainInvokeEvent,
  kind: LoaderGrabberRequestKind,
  payload: LoaderGrabberLoadRequest | LoaderGrabberGrabRequest,
): Effect.Effect<GrabbedData | null, WindowManagerError, WindowService> =>
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
      try: () => requestGameLoaderGrabber(gameWindow, kind, payload),
      catch: (cause) =>
        new WindowManagerError({
          message: requestErrorMessage(cause),
          cause,
        }),
    });
  });

export const registerLoaderGrabberIpcHandlers = (
  runWindowEffect: WindowEffectRunner,
): Effect.Effect<void, never, MainIpc | Scope.Scope> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;
    const run = <A>(
      effect: Effect.Effect<A, WindowManagerError, WindowService>,
    ) => Effect.promise(() => runWindowEffect(effect));

    yield* ipc.on(LoaderGrabberIpcChannels.response, (_event, response) =>
      Effect.sync(() => {
        const loaderGrabberResponse = response as LoaderGrabberResponseMessage;
        if (typeof loaderGrabberResponse?.requestId !== "string") {
          return;
        }

        const pending = pendingRequests.get(loaderGrabberResponse.requestId);
        if (!pending) {
          return;
        }

        pendingRequests.delete(loaderGrabberResponse.requestId);
        clearTimeout(pending.timeout);

        if (typeof loaderGrabberResponse.ok !== "boolean") {
          pending.reject(new Error("Invalid loader grabber response"));
          return;
        }

        if (loaderGrabberResponse.ok) {
          pending.resolve(loaderGrabberResponse.value ?? null);
          return;
        }

        const message =
          typeof loaderGrabberResponse.error === "string" &&
          loaderGrabberResponse.error !== ""
            ? loaderGrabberResponse.error
            : "Loader grabber request failed";
        pending.reject(new Error(message));
      }),
    );

    yield* ipc.handle(LoaderGrabberIpcChannels.load, (event, payload) =>
      Effect.asVoid(
        run(
          sendLoaderGrabberRequest(
            event,
            "load",
            normalizeLoaderGrabberLoadRequest(payload),
          ),
        ),
      ),
    );

    yield* ipc.handle(LoaderGrabberIpcChannels.grab, (event, payload) =>
      run(
        sendLoaderGrabberRequest(
          event,
          "grab",
          normalizeLoaderGrabberGrabRequest(payload),
        ),
      ),
    );

    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        rejectPendingRequests(new Error("Loader grabber IPC is shutting down"));
      }),
    );
  });

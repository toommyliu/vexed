import { BrowserWindow, type IpcMainInvokeEvent } from "electron";
import { Effect, Scope } from "effect";
import {
  PacketsIpcChannels,
  type PacketsRequestKind,
  type PacketsRequestMessage,
  type PacketsResponseMessage,
} from "../../../shared/ipc";
import {
  isPacketCaptureType,
  isPacketSendTarget,
  normalizePacketQueuePayload,
  type PacketCapturedPayload,
  type PacketSendPayload,
  type PacketsStatusPayload,
} from "../../../shared/packets";
import { makeRandomId } from "../../../shared/random-id";
import { WindowIds } from "../../../shared/windows";
import {
  WindowManagerError,
  WindowService,
  type WindowEffectRunner,
} from "../../window/WindowService";
import { MainIpc } from "../MainIpc";

const PACKETS_REQUEST_TIMEOUT_MS = 5_000;

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
    : "Packet request failed";

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

const requestGamePackets = (
  gameWindow: BrowserWindow,
  kind: PacketsRequestKind,
  payload?: unknown,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const requestId = makeRandomId();
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error("Packets did not respond"));
    }, PACKETS_REQUEST_TIMEOUT_MS);

    pendingRequests.set(requestId, { resolve, reject, timeout });

    const request: PacketsRequestMessage = {
      requestId,
      kind,
      ...(payload === undefined ? {} : { payload }),
    };
    try {
      gameWindow.webContents.send(PacketsIpcChannels.request, request);
    } catch (cause) {
      pendingRequests.delete(requestId);
      clearTimeout(timeout);
      reject(
        cause instanceof Error ? cause : new Error("Packet request failed"),
      );
    }
  });

const sendPacketsRequest = (
  event: IpcMainInvokeEvent,
  kind: PacketsRequestKind,
  payload?: unknown,
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
      try: () => requestGamePackets(gameWindow, kind, payload),
      catch: (cause) =>
        new WindowManagerError({
          message: requestErrorMessage(cause),
          cause,
        }),
    });
  });

const normalizeSendPayload = (payload: unknown): PacketSendPayload => {
  const record = payload as Partial<PacketSendPayload> | null;
  if (!record || typeof record.packet !== "string") {
    throw new Error("Packet payload is required");
  }

  if (!isPacketSendTarget(record.target)) {
    throw new Error("Invalid packet send target");
  }

  return {
    packet: record.packet,
    target: record.target,
  };
};

const normalizeCapturedPayload = (
  payload: unknown,
): PacketCapturedPayload | null => {
  const record = payload as Partial<PacketCapturedPayload> | null;
  if (!record || typeof record.packet !== "string") {
    return null;
  }

  if (!isPacketCaptureType(record.type)) {
    return null;
  }

  return {
    capturedAt:
      typeof record.capturedAt === "number" &&
      Number.isFinite(record.capturedAt)
        ? record.capturedAt
        : Date.now(),
    packet: record.packet,
    type: record.type,
  };
};

const normalizeStatusPayload = (
  payload: unknown,
): PacketsStatusPayload | null => {
  const record = payload as Partial<PacketsStatusPayload> | null;
  if (
    !record ||
    typeof record.captureRunning !== "boolean" ||
    typeof record.queueRunning !== "boolean"
  ) {
    return null;
  }

  return {
    captureRunning: record.captureRunning,
    queueRunning: record.queueRunning,
    ...(typeof record.stoppedReason === "string" && record.stoppedReason !== ""
      ? { stoppedReason: record.stoppedReason }
      : {}),
  };
};

export const registerPacketsIpcHandlers = (
  runWindowEffect: WindowEffectRunner,
): Effect.Effect<void, never, MainIpc | Scope.Scope> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;
    const run = <A>(
      effect: Effect.Effect<A, WindowManagerError, WindowService>,
    ) => Effect.promise(() => runWindowEffect(effect));

    yield* ipc.on(PacketsIpcChannels.response, (_event, response) =>
      Effect.sync(() => {
        const packetResponse = response as PacketsResponseMessage;
        if (typeof packetResponse?.requestId !== "string") {
          return;
        }

        const pending = pendingRequests.get(packetResponse.requestId);
        if (!pending) {
          return;
        }

        pendingRequests.delete(packetResponse.requestId);
        clearTimeout(pending.timeout);

        if (packetResponse.ok) {
          pending.resolve();
        } else {
          pending.reject(
            new Error(packetResponse.error || "Packet request failed"),
          );
        }
      }),
    );

    yield* ipc.handle(PacketsIpcChannels.startCapture, (event) =>
      run(sendPacketsRequest(event, "startCapture")),
    );

    yield* ipc.handle(PacketsIpcChannels.stopCapture, (event) =>
      run(sendPacketsRequest(event, "stopCapture")),
    );

    yield* ipc.handle(PacketsIpcChannels.send, (event, payload) =>
      run(sendPacketsRequest(event, "send", normalizeSendPayload(payload))),
    );

    yield* ipc.handle(PacketsIpcChannels.startQueue, (event, payload) =>
      run(
        sendPacketsRequest(
          event,
          "startQueue",
          normalizePacketQueuePayload(payload),
        ),
      ),
    );

    yield* ipc.handle(PacketsIpcChannels.stopQueue, (event) =>
      run(sendPacketsRequest(event, "stopQueue")),
    );

    yield* ipc.handle(PacketsIpcChannels.publishCaptured, (event, payload) =>
      run(
        Effect.gen(function* () {
          const gameWindowId = yield* senderGameWindowId(event);
          const captured = normalizeCapturedPayload(payload);
          if (!captured) {
            return;
          }

          const windows = yield* WindowService;
          const packetsWindow = yield* windows.getGameChildWindow(
            gameWindowId,
            WindowIds.Packets,
          );

          if (
            packetsWindow &&
            !packetsWindow.isDestroyed() &&
            !packetsWindow.webContents.isDestroyed()
          ) {
            packetsWindow.webContents.send(
              PacketsIpcChannels.captured,
              captured,
            );
          }
        }),
      ),
    );

    yield* ipc.handle(PacketsIpcChannels.publishStatus, (event, payload) =>
      run(
        Effect.gen(function* () {
          const gameWindowId = yield* senderGameWindowId(event);
          const status = normalizeStatusPayload(payload);
          if (!status) {
            return;
          }

          const windows = yield* WindowService;
          const packetsWindow = yield* windows.getGameChildWindow(
            gameWindowId,
            WindowIds.Packets,
          );

          if (
            packetsWindow &&
            !packetsWindow.isDestroyed() &&
            !packetsWindow.webContents.isDestroyed()
          ) {
            packetsWindow.webContents.send(PacketsIpcChannels.status, status);
          }
        }),
      ),
    );
  });

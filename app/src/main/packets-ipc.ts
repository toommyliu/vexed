import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import { Effect } from "effect";
import {
  PacketsIpcChannels,
  type PacketsRequestKind,
  type PacketsRequestMessage,
  type PacketsResponseMessage,
} from "../shared/ipc";
import {
  clampPacketQueueDelay,
  isPacketCaptureType,
  isPacketSendTarget,
  type PacketCapturedPayload,
  type PacketQueuePayload,
  type PacketSendPayload,
  type PacketsStatusPayload,
} from "../shared/packets";
import { WindowIds } from "../shared/windows";
import {
  WindowManagerError,
  WindowService,
  type WindowEffectRunner,
} from "./windows";

const PACKETS_REQUEST_TIMEOUT_MS = 5_000;

let packetsIpcRegistered = false;
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
    const requestId = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
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
    gameWindow.webContents.send(PacketsIpcChannels.request, request);
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

const normalizeQueuePayload = (payload: unknown): PacketQueuePayload => {
  const record = payload as Partial<PacketQueuePayload> | null;
  if (!record || !Array.isArray(record.packets)) {
    throw new Error("Packet queue is required");
  }

  if (!isPacketSendTarget(record.target)) {
    throw new Error("Invalid packet send target");
  }

  return {
    delayMs: clampPacketQueueDelay(record.delayMs),
    packets: record.packets.filter((packet) => typeof packet === "string"),
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
): void => {
  if (packetsIpcRegistered) {
    return;
  }

  ipcMain.on(
    PacketsIpcChannels.response,
    (_event, response: PacketsResponseMessage) => {
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
        pending.resolve();
      } else {
        pending.reject(new Error(response.error || "Packet request failed"));
      }
    },
  );

  ipcMain.handle(PacketsIpcChannels.startCapture, async (event) =>
    runWindowEffect(sendPacketsRequest(event, "startCapture")),
  );

  ipcMain.handle(PacketsIpcChannels.stopCapture, async (event) =>
    runWindowEffect(sendPacketsRequest(event, "stopCapture")),
  );

  ipcMain.handle(PacketsIpcChannels.send, async (event, payload: unknown) =>
    runWindowEffect(
      sendPacketsRequest(event, "send", normalizeSendPayload(payload)),
    ),
  );

  ipcMain.handle(
    PacketsIpcChannels.startQueue,
    async (event, payload: unknown) =>
      runWindowEffect(
        sendPacketsRequest(event, "startQueue", normalizeQueuePayload(payload)),
      ),
  );

  ipcMain.handle(PacketsIpcChannels.stopQueue, async (event) =>
    runWindowEffect(sendPacketsRequest(event, "stopQueue")),
  );

  ipcMain.handle(
    PacketsIpcChannels.publishCaptured,
    async (event, payload: unknown) =>
      runWindowEffect(
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

  ipcMain.handle(
    PacketsIpcChannels.publishStatus,
    async (event, payload: unknown) =>
      runWindowEffect(
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

  packetsIpcRegistered = true;
};

import { Effect } from "effect";
import {
  clampPacketQueueDelay,
  isPacketSendTarget,
  normalizePacketQueuePayload,
  type PacketQueuePayload,
  type PacketSendPayload,
  type PacketSendTarget,
} from "../../../shared/packets";
import type {
  PacketsRequestMessage,
  PacketsResponseMessage,
} from "../../../shared/ipc";
import type { runtime as gameRuntime } from "./Runtime";
import { Packet, type ClientPacketSendType } from "./flash/Services/Packet";

type GameRuntime = typeof gameRuntime;

interface QueueState {
  readonly delayMs: number;
  readonly packets: readonly string[];
  readonly target: PacketSendTarget;
  index: number;
  stopped: boolean;
  timeout: ReturnType<typeof setTimeout> | undefined;
}

export interface PacketsBridgeController {
  readonly dispose: () => void;
  readonly stopActive: (stoppedReason?: string) => void;
}

const toRequestError = (cause: unknown): string =>
  cause instanceof Error && cause.message !== ""
    ? cause.message
    : "Packet request failed";

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

const disposeAll = (disposers: readonly (() => void)[]): void => {
  for (const dispose of disposers) {
    dispose();
  }
};

const sendPacketEffect = (payload: PacketSendPayload) =>
  Effect.gen(function* () {
    const packets = yield* Packet;

    if (payload.target === "server-string") {
      yield* packets.sendServer(payload.packet, "String");
      return;
    }

    if (payload.target === "server-json") {
      yield* packets.sendServer(payload.packet, "Json");
      return;
    }

    const clientType: ClientPacketSendType =
      payload.target === "client-json"
        ? "json"
        : payload.target === "client-xml"
          ? "xml"
          : "str";
    yield* packets.sendClient(payload.packet, clientType);
  });

const publishCaptured = (
  type: "client" | "server" | "extension",
  packet: string,
) =>
  Effect.promise(() =>
    window.ipc.packets
      .publishCaptured({
        capturedAt: Date.now(),
        packet,
        type,
      })
      .catch((error: unknown) => {
        console.error("Failed to publish captured packet:", error);
      }),
  );

const respondPacketRequest = (
  response: PacketsResponseMessage,
): Promise<void> => window.ipc.packets.respond(response);

export const installPacketsBridge = (
  runtime: GameRuntime,
): PacketsBridgeController => {
  let captureDisposers: (() => void)[] = [];
  let captureGeneration = 0;
  let disposed = false;
  let queueState: QueueState | undefined;
  let requestChain = Promise.resolve();

  const publishStatus = (stoppedReason?: string): void => {
    void window.ipc.packets
      .publishStatus({
        captureRunning: captureDisposers.length > 0,
        queueRunning: queueState !== undefined && !queueState.stopped,
        ...(stoppedReason ? { stoppedReason } : {}),
      })
      .catch((error: unknown) => {
        console.error("Failed to publish packet status:", error);
      });
  };

  const stopCapture = (publish = true): void => {
    const wasRunning = captureDisposers.length > 0;
    captureGeneration += 1;
    disposeAll(captureDisposers);
    captureDisposers = [];
    if (publish && wasRunning) {
      publishStatus();
    }
  };

  const startCapture = async (): Promise<void> => {
    stopCapture(false);
    const generation = captureGeneration + 1;
    captureGeneration = generation;
    const disposers = await runtime.runPromise(
      Effect.gen(function* () {
        const packets = yield* Packet;
        const disposeClient = yield* packets.packetFromClient((packet) =>
          publishCaptured("client", packet),
        );
        const disposeServer = yield* packets.packetFromServer((packet) =>
          publishCaptured("server", packet),
        );
        const disposeExtension = yield* packets.onExtensionResponse((packet) =>
          publishCaptured("extension", packet),
        );

        return [disposeClient, disposeServer, disposeExtension];
      }),
    );
    if (generation !== captureGeneration || disposed) {
      disposeAll(disposers);
      throw new Error("Packet capture start was interrupted");
    }
    captureDisposers = disposers;
    publishStatus();
  };

  const sendPacket = (payload: PacketSendPayload): Promise<void> =>
    runtime.runPromise(sendPacketEffect(payload).pipe(Effect.asVoid));

  const clearQueueTimer = (): void => {
    if (queueState?.timeout) {
      clearTimeout(queueState.timeout);
      queueState.timeout = undefined;
    }
  };

  const stopQueue = (publish = true): void => {
    const wasRunning = queueState !== undefined && !queueState.stopped;
    if (queueState) {
      queueState.stopped = true;
    }
    clearQueueTimer();
    queueState = undefined;
    if (publish && wasRunning) {
      publishStatus();
    }
  };

  const scheduleQueue = (state: QueueState): void => {
    if (queueState !== state || state.stopped) {
      return;
    }

    state.timeout = setTimeout(() => {
      void runQueueOnce();
    }, state.delayMs);
  };

  const runQueueOnce = async (): Promise<void> => {
    const state = queueState;
    if (!state || state.stopped || state.packets.length === 0) {
      stopQueue();
      return;
    }

    const packet = state.packets[state.index];
    state.index = (state.index + 1) % state.packets.length;

    try {
      await sendPacket({ packet: packet ?? "", target: state.target });
    } catch (error) {
      console.error("Packet queue send failed:", error);
      stopQueue(false);
      publishStatus("Queue stopped after a send failure");
      return;
    }

    scheduleQueue(state);
  };

  const startQueue = (payload: PacketQueuePayload): void => {
    if (payload.packets.length === 0) {
      throw new Error("Packet queue is empty");
    }

    stopQueue(false);
    queueState = {
      delayMs: clampPacketQueueDelay(payload.delayMs),
      index: 0,
      packets: payload.packets,
      stopped: false,
      target: payload.target,
      timeout: undefined,
    };
    scheduleQueue(queueState);
    publishStatus();
  };

  const handleRequest = async (
    request: PacketsRequestMessage,
  ): Promise<void> => {
    try {
      if (request.kind === "startCapture") {
        await startCapture();
      } else if (request.kind === "stopCapture") {
        stopCapture();
      } else if (request.kind === "send") {
        await sendPacket(normalizeSendPayload(request.payload));
      } else if (request.kind === "startQueue") {
        startQueue(normalizePacketQueuePayload(request.payload));
      } else if (request.kind === "stopQueue") {
        stopQueue();
      } else {
        throw new Error(`Unsupported packet request: ${String(request.kind)}`);
      }

      await respondPacketRequest({ ok: true, requestId: request.requestId });
    } catch (cause) {
      await respondPacketRequest({
        error: toRequestError(cause),
        ok: false,
        requestId: request.requestId,
      });
    }
  };

  const unsubscribeRequest = window.ipc.packets.onRequest((request) => {
    requestChain = requestChain
      .catch((error: unknown) => {
        console.error("Packet request chain failed:", error);
      })
      .then(async () => {
        if (disposed) {
          await respondPacketRequest({
            error: "Packet bridge is disposed",
            ok: false,
            requestId: request.requestId,
          });
          return;
        }

        await handleRequest(request);
      });
    void requestChain.catch((error: unknown) => {
      console.error("Packet request handling failed:", error);
    });
  });

  const stopActive = (stoppedReason?: string): void => {
    const wasCaptureRunning = captureDisposers.length > 0;
    const wasQueueRunning = queueState !== undefined && !queueState.stopped;
    stopCapture(false);
    stopQueue(false);
    if ((wasCaptureRunning || wasQueueRunning) && stoppedReason) {
      publishStatus(stoppedReason);
    }
  };

  const dispose = (): void => {
    disposed = true;
    unsubscribeRequest();
    stopActive();
  };

  return { dispose, stopActive };
};

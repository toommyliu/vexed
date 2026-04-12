import { Effect, Layer, Stream } from "effect";
import type {
  ClientPacket,
  ExtensionPacket,
  ServerPacket,
} from "../PacketTypes";
import {
  PacketHandler,
  type ClientPacketHandler,
  type ExtensionPacketHandler,
  type PacketHandlerDisposer,
  type PacketHandlerShape,
  type ServerPacketHandler,
} from "../Services/PacketHandler";
import { PacketRouter } from "../Services/PacketRouter";

const registerMapHandler = <A>(
  handlers: Map<string, (packet: A) => Effect.Effect<void>>,
  channel: string,
  cmd: string,
  handler: (packet: A) => Effect.Effect<void>,
): Effect.Effect<PacketHandlerDisposer> =>
  Effect.sync(() => {
    if (handlers.has(cmd)) {
      console.warn(
        `[flash.packet-handler] overriding handler for ${channel}:${cmd}`,
      );
    }

    handlers.set(cmd, handler);

    return () => {
      if (handlers.get(cmd) === handler) {
        handlers.delete(cmd);
      }
    };
  });

const runHandler = <A>(
  channel: string,
  cmd: string,
  packet: A,
  handler?: (packet: A) => Effect.Effect<void>,
): Effect.Effect<void> => {
  if (!handler) {
    return Effect.void;
  }

  return handler(packet).pipe(
    Effect.catchCause((cause) =>
      Effect.logError({
        message: "packet handler failed",
        channel,
        cmd,
        cause,
      }),
    ),
  );
};

const make = Effect.gen(function* () {
  const router = yield* PacketRouter;

  const clientHandlers = new Map<string, ClientPacketHandler>();
  const serverHandlers = new Map<string, ServerPacketHandler>();
  const extensionHandlers = new Map<string, ExtensionPacketHandler>();
  const extensionTypeHandlers = new Map<string, ExtensionPacketHandler>();

  const typedExtensionKey = (
    packetType: ExtensionPacket["packetType"],
    cmd: string,
  ) => `${packetType}:${cmd}`;

  const dispatchClient = (packet: ClientPacket) =>
    runHandler("client", packet.cmd, packet, clientHandlers.get(packet.cmd));

  const dispatchServer = (packet: ServerPacket) =>
    runHandler("server", packet.cmd, packet, serverHandlers.get(packet.cmd));

  const dispatchExtension = (packet: ExtensionPacket) => {
    const sharedHandler = extensionHandlers.get(packet.cmd);
    const typedHandler = extensionTypeHandlers.get(
      typedExtensionKey(packet.packetType, packet.cmd),
    );

    if (!sharedHandler && !typedHandler) {
      return Effect.void;
    }

    if (sharedHandler && typedHandler && sharedHandler === typedHandler) {
      return runHandler("extension", packet.cmd, packet, sharedHandler);
    }

    return Effect.all(
      [
        runHandler("extension", packet.cmd, packet, sharedHandler),
        runHandler(
          `extension:${packet.packetType}`,
          packet.cmd,
          packet,
          typedHandler,
        ),
      ],
      {
        discard: true,
      },
    );
  };

  yield* Effect.forkScoped(
    Stream.runForEach(router.clientPackets, dispatchClient),
  );
  yield* Effect.forkScoped(
    Stream.runForEach(router.serverPackets, dispatchServer),
  );
  yield* Effect.forkScoped(
    Stream.runForEach(router.extensionPackets, dispatchExtension),
  );

  const registerClient = (cmd: string, handler: ClientPacketHandler) =>
    registerMapHandler(clientHandlers, "client", cmd, handler);

  const registerServer = (cmd: string, handler: ServerPacketHandler) =>
    registerMapHandler(serverHandlers, "server", cmd, handler);

  const registerExtension = (cmd: string, handler: ExtensionPacketHandler) =>
    registerMapHandler(extensionHandlers, "extension", cmd, handler);

  const registerExtensionType = (
    packetType: ExtensionPacket["packetType"],
    cmd: string,
    handler: ExtensionPacketHandler,
  ) =>
    registerMapHandler(
      extensionTypeHandlers,
      `extension:${packetType}`,
      typedExtensionKey(packetType, cmd),
      handler,
    );

  return {
    registerClient,
    registerServer,
    registerExtension,
    registerExtensionType,
  } satisfies PacketHandlerShape;
});

export const PacketHandlerLive = Layer.effect(PacketHandler, make);

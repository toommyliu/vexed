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

type Handler<A> = (packet: A) => Effect.Effect<void>;

type HandlerMap<A> = Map<string, Set<Handler<A>>>;

const registerMapHandler = <A>(
  handlers: HandlerMap<A>,
  cmd: string,
  handler: Handler<A>,
): Effect.Effect<PacketHandlerDisposer> =>
  Effect.sync(() => {
    const registered = handlers.get(cmd) ?? new Set<Handler<A>>();
    registered.add(handler);
    handlers.set(cmd, registered);

    return () => {
      const current = handlers.get(cmd);
      if (!current) {
        return;
      }

      current.delete(handler);
      if (current.size === 0) {
        handlers.delete(cmd);
      }
    };
  });

const runHandlers = <A>(
  channel: string,
  cmd: string,
  packet: A,
  handlers: Iterable<Handler<A>> | undefined,
): Effect.Effect<void> => {
  if (!handlers) {
    return Effect.void;
  }

  const snapshot = Array.from(handlers);
  if (snapshot.length === 0) {
    return Effect.void;
  }

  return Effect.forEach(
    snapshot,
    (handler, handlerIndex) =>
      handler(packet).pipe(
        Effect.catchCause((cause) =>
          Effect.logError({
            message: "packet handler failed",
            channel,
            cmd,
            handlerIndex,
            cause,
          }),
        ),
      ),
    {
      discard: true,
    },
  );
};

const make = Effect.gen(function* () {
  const router = yield* PacketRouter;

  const clientHandlers = new Map<string, Set<ClientPacketHandler>>();
  const serverHandlers = new Map<string, Set<ServerPacketHandler>>();
  const extensionHandlers = new Map<string, Set<ExtensionPacketHandler>>();
  const extensionTypeHandlers = new Map<string, Set<ExtensionPacketHandler>>();

  const typedExtensionKey = (
    packetType: ExtensionPacket["packetType"],
    cmd: string,
  ) => `${packetType}:${cmd}`;

  const dispatchClient = (packet: ClientPacket) =>
    runHandlers("client", packet.cmd, packet, clientHandlers.get(packet.cmd));

  const dispatchServer = (packet: ServerPacket) =>
    runHandlers("server", packet.cmd, packet, serverHandlers.get(packet.cmd));

  const dispatchExtension = (packet: ExtensionPacket) => {
    const sharedHandlers = extensionHandlers.get(packet.cmd);
    const typedHandlers = extensionTypeHandlers.get(
      typedExtensionKey(packet.packetType, packet.cmd),
    );

    if (!sharedHandlers && !typedHandlers) {
      return Effect.void;
    }

    const handlers = new Set<ExtensionPacketHandler>();
    if (sharedHandlers) {
      for (const handler of sharedHandlers) {
        handlers.add(handler);
      }
    }

    if (typedHandlers) {
      for (const handler of typedHandlers) {
        handlers.add(handler);
      }
    }

    return runHandlers(
      `extension:${packet.packetType}`,
      packet.cmd,
      packet,
      handlers,
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
    registerMapHandler(clientHandlers, cmd, handler);

  const registerServer = (cmd: string, handler: ServerPacketHandler) =>
    registerMapHandler(serverHandlers, cmd, handler);

  const registerExtension = (cmd: string, handler: ExtensionPacketHandler) =>
    registerMapHandler(extensionHandlers, cmd, handler);

  const registerExtensionType = (
    packetType: ExtensionPacket["packetType"],
    cmd: string,
    handler: ExtensionPacketHandler,
  ) =>
    registerMapHandler(
      extensionTypeHandlers,
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

import { Effect, Layer, Option } from "effect";
import type {
  ClientPacket,
  ExtensionPacket,
  ParsedPacket,
  ServerPacket,
} from "../PacketTypes";
import {
  parseClientPacket,
  parseExtensionPacket,
  parseServerPacket,
} from "../PacketParser";
import {
  Packet,
  type ClientPacketHandler,
  type ExtensionPacketHandler,
  type PacketListener,
  type PacketListenerDisposer,
  type PacketShape,
  type ServerPacketHandler,
} from "../Services/Packet";

type WindowPacketHandlerKey =
  | "onExtensionResponse"
  | "packetFromClient"
  | "packetFromServer";

type Handler<A> = (packet: A) => Effect.Effect<unknown, unknown, never>;

type HandlerMap<A> = Map<string, Set<Handler<A>>>;

const normalizePacketInput = (input: unknown): string | null => {
  if (typeof input === "string") {
    return input;
  }

  if (Array.isArray(input) && typeof input[0] === "string") {
    return input[0];
  }

  return null;
};

const registerSetHandler = <A>(
  handlers: Set<Handler<A>>,
  handler: Handler<A>,
): Effect.Effect<PacketListenerDisposer> =>
  Effect.sync(() => {
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
    };
  });

const registerMapHandler = <A>(
  handlers: HandlerMap<A>,
  cmd: string,
  handler: Handler<A>,
): Effect.Effect<PacketListenerDisposer> =>
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
        Effect.asVoid,
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
  const runFork = Effect.runForkWith(yield* Effect.services());

  const extensionRawHandlers = new Set<PacketListener>();
  const clientRawHandlers = new Set<PacketListener>();
  const serverRawHandlers = new Set<PacketListener>();

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

  const dispatchRawAndParsed = <A extends ParsedPacket>(
    channel: WindowPacketHandlerKey,
    raw: string,
    parser: (raw: string) => Option.Option<A>,
    rawHandlers: Set<PacketListener>,
    parsedDispatch: (packet: A) => Effect.Effect<void>,
  ) =>
    Effect.gen(function* () {
      yield* runHandlers(`raw:${channel}`, "*", raw, rawHandlers);

      const parsed = parser(raw);
      if (Option.isSome(parsed)) {
        yield* parsedDispatch(parsed.value);
      }
    });

  const setWindowPacketHandler = (
    key: WindowPacketHandlerKey,
    handler: (raw: string) => Effect.Effect<void>,
  ): Effect.Effect<() => void> =>
    Effect.sync(() => {
      const win = window as Record<
        WindowPacketHandlerKey,
        ((packet: string) => void) | undefined
      >;

      const previousHandler = win[key];

      const wrappedHandler = (raw: unknown) => {
        const packet = normalizePacketInput(raw);
        if (packet === null) {
          return;
        }

        runFork(
          handler(packet).pipe(
            Effect.catchCause((cause) =>
              Effect.logError({
                message: "packet dispatch failed",
                channel: key,
                cause,
              }),
            ),
          ),
        );
      };

      const wrappedForWindow = wrappedHandler as (packet: string) => void;
      win[key] = wrappedForWindow;

      return () => {
        if (win[key] === wrappedForWindow) {
          win[key] = previousHandler;
        }
      };
    });

  const releaseExtension = yield* setWindowPacketHandler(
    "onExtensionResponse",
    (raw) =>
      dispatchRawAndParsed(
        "onExtensionResponse",
        raw,
        parseExtensionPacket,
        extensionRawHandlers,
        dispatchExtension,
      ),
  );

  const releaseClient = yield* setWindowPacketHandler(
    "packetFromClient",
    (raw) =>
      dispatchRawAndParsed(
        "packetFromClient",
        raw,
        parseClientPacket,
        clientRawHandlers,
        dispatchClient,
      ),
  );

  const releaseServer = yield* setWindowPacketHandler(
    "packetFromServer",
    (raw) =>
      dispatchRawAndParsed(
        "packetFromServer",
        raw,
        parseServerPacket,
        serverRawHandlers,
        dispatchServer,
      ),
  );

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      releaseExtension();
      releaseClient();
      releaseServer();
    }),
  );

  const onExtensionResponse: PacketShape["onExtensionResponse"] = (handler) =>
    registerSetHandler(extensionRawHandlers, handler);

  const packetFromClient: PacketShape["packetFromClient"] = (handler) =>
    registerSetHandler(clientRawHandlers, handler);

  const packetFromServer: PacketShape["packetFromServer"] = (handler) =>
    registerSetHandler(serverRawHandlers, handler);

  // Non-scoped registrations return a disposer and require manual cleanup
  // (e.g. store return value, then call it in a finalizer).
  const client: PacketShape["client"] = (cmd, handler) =>
    registerMapHandler(clientHandlers, cmd, handler);

  const server: PacketShape["server"] = (cmd, handler) =>
    registerMapHandler(serverHandlers, cmd, handler);

  const extension: PacketShape["extension"] = (cmd, handler) =>
    registerMapHandler(extensionHandlers, cmd, handler);

  const extensionType: PacketShape["extensionType"] = (
    packetType,
    cmd,
    handler,
  ) =>
    registerMapHandler(
      extensionTypeHandlers,
      typedExtensionKey(packetType, cmd),
      handler,
    );

  const json: PacketShape["json"] = (cmd, handler) =>
    extensionType("json", cmd, handler);

  const str: PacketShape["str"] = (cmd, handler) =>
    extensionType("str", cmd, handler);

  // Scoped registrations attach cleanup to the current Effect scope.
  // Use these in Layers so handlers are automatically removed on shutdown.
  const scoped: PacketShape["scoped"] = (registration) =>
    Effect.acquireRelease(registration, (dispose) => Effect.sync(dispose)).pipe(
      Effect.asVoid,
    );

  const clientScoped: PacketShape["clientScoped"] = (cmd, handler) =>
    scoped(client(cmd, handler));

  const serverScoped: PacketShape["serverScoped"] = (cmd, handler) =>
    scoped(server(cmd, handler));

  const extensionScoped: PacketShape["extensionScoped"] = (cmd, handler) =>
    scoped(extension(cmd, handler));

  const extensionTypeScoped: PacketShape["extensionTypeScoped"] = (
    packetType,
    cmd,
    handler,
  ) => scoped(extensionType(packetType, cmd, handler));

  const jsonScoped: PacketShape["jsonScoped"] = (cmd, handler) =>
    extensionTypeScoped("json", cmd, handler);

  const strScoped: PacketShape["strScoped"] = (cmd, handler) =>
    extensionTypeScoped("str", cmd, handler);

  return {
    onExtensionResponse,
    packetFromClient,
    packetFromServer,
    client,
    server,
    extension,
    extensionType,
    json,
    str,
    scoped,
    clientScoped,
    serverScoped,
    extensionScoped,
    extensionTypeScoped,
    jsonScoped,
    strScoped,
  } satisfies PacketShape;
});

export const PacketLive = Layer.effect(Packet, make);

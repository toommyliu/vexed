import { Effect, Layer, Option, PubSub, Stream } from "effect";
import type {
  ClientPacket,
  ExtensionPacket,
  ParsedPacket,
  ServerPacket,
} from "../PacketTypes";
import { Packet } from "../Services/Packet";
import {
  parseClientPacket,
  parseExtensionPacket,
  parseServerPacket,
} from "../Services/PacketParser";
import { PacketRouter } from "../Services/PacketRouter";
import type { PacketRouterShape } from "../Services/PacketRouter";

type ParsedPacketParser<A extends ParsedPacket> = (
  raw: string,
) => Option.Option<A>;

const make = Effect.gen(function* () {
  const packet = yield* Packet;
  const pubSub = yield* PubSub.unbounded<ParsedPacket>();
  const runFork = Effect.runForkWith(yield* Effect.services());

  const subscribe = <A extends ParsedPacket>(
    register: (handler: (packet: string) => void) => Effect.Effect<() => void>,
    parser: ParsedPacketParser<A>,
  ) =>
    register((raw) => {
      const parsed = parser(raw);
      if (Option.isNone(parsed)) {
        return;
      }

      runFork(PubSub.publish(pubSub, parsed.value).pipe(Effect.asVoid));
    });

  const releaseExtension = yield* subscribe(
    packet.onExtensionResponse,
    parseExtensionPacket,
  );
  const releaseClient = yield* subscribe(
    packet.packetFromClient,
    parseClientPacket,
  );
  const releaseServer = yield* subscribe(
    packet.packetFromServer,
    parseServerPacket,
  );

  yield* Effect.addFinalizer(() => PubSub.shutdown(pubSub));

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      releaseExtension();
      releaseClient();
      releaseServer();
    }),
  );

  const packets = Stream.fromPubSub(pubSub);

  return {
    packets,
    clientPackets: Stream.filter(
      packets,
      (packet): packet is ClientPacket => packet.type === "client",
    ),
    serverPackets: Stream.filter(
      packets,
      (packet): packet is ServerPacket => packet.type === "server",
    ),
    extensionPackets: Stream.filter(
      packets,
      (packet): packet is ExtensionPacket => packet.type === "extension",
    ),
    emit: (packet: ParsedPacket) => PubSub.publish(pubSub, packet).pipe(Effect.asVoid),
  } satisfies PacketRouterShape;
});

export const PacketRouterLive = Layer.effect(PacketRouter, make);

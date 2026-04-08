import { Effect, Layer, Stream, Queue, Option, Schema } from "effect";
import { PacketRouter } from "../Services/PacketRouter";
import type { PacketRouterShape } from "../Services/PacketRouter";
import type { ParsedPacket, ClientPacket, ServerPacket, ExtensionPacket } from "../PacketTypes";
import { ClientPacketSchema, ServerPacketSchema, ExtensionPacketSchema } from "../PacketTypes";

const RawServerPacketSchema = Schema.Struct({
  t: Schema.Literal("xt"),
  b: Schema.Struct({
    o: Schema.Struct({
      cmd: Schema.Literal("ct"),
    }),
  }),
});

const RawExtensionPacketSchema = Schema.Union([
  Schema.Struct({
    params: Schema.Struct({
      type: Schema.Literal("str"),
      dataObj: Schema.Array(Schema.String),
    }),
  }),
  Schema.Struct({
    params: Schema.Struct({
      type: Schema.Literal("json"),
      dataObj: Schema.Struct({ cmd: Schema.String }),
    }),
  }),
]);

const safeDecode = <A>(schema: Schema.Schema<A>, value: unknown): Option.Option<A> => {
  try {
    return Option.some(Schema.decodeUnknownSync(schema)(value));
  } catch {
    return Option.none();
  }
};

const parseClientPacket = (raw: string): Option.Option<ClientPacket> => {
  const pkt = raw.slice("[Sending - STR]: ".length);
  if (!pkt.startsWith("%xt%")) return Option.none();

  const parts = pkt.split("%").filter(Boolean);
  const cmd = parts[2];
  if (!cmd) return Option.none();

  return safeDecode(ClientPacketSchema, { type: "client", raw, cmd, params: parts });
};

const parseServerPacket = (raw: string): Option.Option<ServerPacket> => {
  if (!raw.startsWith("{")) return Option.none();

  try {
    const parsed = JSON.parse(raw);

    if (Option.isNone(safeDecode(RawServerPacketSchema, parsed))) {
      return Option.none();
    }

    return safeDecode(ServerPacketSchema, {
      type: "server",
      raw,
      cmd: "ct",
      data: parsed.b.o,
    });
  } catch {
    return Option.none();
  }
};

const parseExtensionPacket = (raw: string): Option.Option<ExtensionPacket> => {
  try {
    const parsed = JSON.parse(raw);
    if (Option.isNone(safeDecode(RawExtensionPacketSchema, parsed))) {
      return Option.none();
    }

    const dataObj = parsed.params.dataObj;
    if (parsed.params.type === "str") {
      return safeDecode(ExtensionPacketSchema, {
        type: "extension",
        raw,
        packetType: "str",
        cmd: dataObj[0],
        data: dataObj,
      });
    } else {
      if (dataObj.cmd === "ct")
        return Option.none();
      return safeDecode(ExtensionPacketSchema, {
        type: "extension",
        raw,
        packetType: "json",
        cmd: dataObj.cmd,
        data: dataObj,
      });
    }
  } catch {
    return Option.none();
  }
};

const make = Effect.gen(function* () {
  const queue = yield* Queue.unbounded<ParsedPacket>();

  window.onExtensionResponse = (raw) => {
    const parsed = parseExtensionPacket(raw);
    if (Option.isSome(parsed)) {
      void Effect.runPromise(Queue.offer(queue, parsed.value));
    }
  };

  window.packetFromClient = (raw) => {
    const parsed = parseClientPacket(raw);
    if (Option.isSome(parsed)) {
      void Effect.runPromise(Queue.offer(queue, parsed.value));
    }
  };

  window.packetFromServer = (raw) => {
    const parsed = parseServerPacket(raw);
    if (Option.isSome(parsed)) {
      void Effect.runPromise(Queue.offer(queue, parsed.value));
    }
  };

  return {
    packets: Stream.fromQueue(queue),
    clientPackets: Stream.fromQueue(queue).pipe(
      Stream.filter((p): p is ClientPacket => p.type === "client")
    ),
    serverPackets: Stream.fromQueue(queue).pipe(
      Stream.filter((p): p is ServerPacket => p.type === "server")
    ),
    extensionPackets: Stream.fromQueue(queue).pipe(
      Stream.filter((p): p is ExtensionPacket => p.type === "extension")
    ),
    emit: (packet: ParsedPacket) => Queue.offer(queue, packet),
  } satisfies PacketRouterShape;
});

export const PacketRouterLive = Layer.effect(PacketRouter, make);

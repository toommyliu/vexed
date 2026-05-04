import { Option } from "effect";
import { isRecord } from "./PacketPayload";
import type {
  ClientPacket,
  ExtensionPacket,
  ServerPacket,
} from "./PacketTypes";

const CLIENT_PACKET_PREFIX = "[Sending - STR]: ";
const XT_PACKET_PREFIX = "%xt%";

const parseJson = (raw: string): Option.Option<unknown> => {
  try {
    return Option.some(JSON.parse(raw));
  } catch {
    return Option.none();
  }
};

const toClientPayload = (raw: string): string =>
  raw.startsWith(CLIENT_PACKET_PREFIX)
    ? raw.slice(CLIENT_PACKET_PREFIX.length)
    : raw;

export const parseClientPacket = (raw: string): Option.Option<ClientPacket> => {
  const payload = toClientPayload(raw);
  if (!payload.startsWith(XT_PACKET_PREFIX)) {
    return Option.none();
  }

  const params = payload.split("%").filter(Boolean);
  const cmd = params[2];
  if (!cmd) {
    return Option.none();
  }

  return Option.some({
    type: "client",
    raw,
    cmd,
    params,
  });
};

export const parseServerPacket = (raw: string): Option.Option<ServerPacket> => {
  const parsed = parseJson(raw);
  if (Option.isNone(parsed) || !isRecord(parsed.value)) {
    return Option.none();
  }

  const top = parsed.value;
  if (top["t"] !== "xt") {
    return Option.none();
  }

  const payload = top["b"];
  if (!isRecord(payload)) {
    return Option.none();
  }

  const data = payload["o"];
  if (!isRecord(data) || data["cmd"] !== "ct") {
    return Option.none();
  }

  return Option.some({
    type: "server",
    raw,
    cmd: "ct",
    data,
  });
};

export const parseExtensionPacket = (
  raw: string,
): Option.Option<ExtensionPacket> => {
  const parsed = parseJson(raw);
  if (Option.isNone(parsed) || !isRecord(parsed.value)) {
    return Option.none();
  }

  // AS3 currently emits `JSON.stringify(packet.params)`, while older/newer
  // bridges may emit the full packet (`{ params: ... }`). Support both.
  const top = parsed.value;
  const params = isRecord(top["params"]) ? top["params"] : top;

  if (params["type"] === "str") {
    const data = params["dataObj"];
    if (!Array.isArray(data) || typeof data[0] !== "string") {
      return Option.none();
    }

    return Option.some({
      type: "extension",
      raw,
      packetType: "str",
      cmd: data[0],
      data,
    });
  }

  if (params["type"] === "json") {
    const data = params["dataObj"];
    if (!isRecord(data) || typeof data["cmd"] !== "string") {
      return Option.none();
    }

    // The direct server bridge already handles `ct` packets.
    if (data["cmd"] === "ct") {
      return Option.none();
    }

    return Option.some({
      type: "extension",
      raw,
      packetType: "json",
      cmd: data["cmd"],
      data,
    });
  }

  return Option.none();
};

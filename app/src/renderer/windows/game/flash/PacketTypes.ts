import { Schema } from "effect";

export const ClientPacketSchema = Schema.Struct({
  type: Schema.Literal("client"),
  raw: Schema.String,
  cmd: Schema.String,
  params: Schema.Array(Schema.String),
});

export type ClientPacket = Schema.Schema.Type<typeof ClientPacketSchema>;

export const ServerPacketSchema = Schema.Struct({
  type: Schema.Literal("server"),
  raw: Schema.String,
  cmd: Schema.Literal("ct"),
  data: Schema.Unknown,
});

export type ServerPacket = Schema.Schema.Type<typeof ServerPacketSchema>;

export const ExtensionPacketSchema = Schema.Struct({
  type: Schema.Literal("extension"),
  raw: Schema.String,
  packetType: Schema.Literals(["str", "json"]),
  cmd: Schema.String,
  data: Schema.Unknown,
});

export type ExtensionPacket = Schema.Schema.Type<typeof ExtensionPacketSchema>;

export type ParsedPacket = ClientPacket | ServerPacket | ExtensionPacket;

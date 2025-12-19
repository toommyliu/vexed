import type { Bot } from "~/lib/Bot";

/**
 * Handler for JSON-type packets from pext.
 */
export type JsonPacketHandler<T = unknown> = {
  readonly cmd: string;
  run(bot: Bot, data: T): Promise<void> | void;
  readonly type: "json";
}

/**
 * Handler for string-type packets from pext (dataObj is string[]).
 */
export type StrPacketHandler = {
  readonly cmd: string;
  run(bot: Bot, data: string[]): Promise<void> | void;
  readonly type: "str";
}

export type PacketHandler<T = unknown> =
  | JsonPacketHandler<T>
  | StrPacketHandler;

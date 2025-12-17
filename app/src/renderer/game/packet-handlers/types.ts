import type { Bot } from "~/lib/Bot";

/**
 * Handler for JSON-type packets from pext.
 */
export interface JsonPacketHandler<T = unknown> {
  readonly cmd: string;
  readonly type: "json";
  run(bot: Bot, data: T): void | Promise<void>;
}

/**
 * Handler for string-type packets from pext (dataObj is string[]).
 */
export interface StrPacketHandler {
  readonly cmd: string;
  readonly type: "str";
  run(bot: Bot, data: string[]): void | Promise<void>;
}

export type PacketHandler<T = unknown> =
  | JsonPacketHandler<T>
  | StrPacketHandler;

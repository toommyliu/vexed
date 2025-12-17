import type { Bot } from "~/lib/Bot";
import { jsonHandlerMap } from "./json";
import { strHandlerMap } from "./str";

/**
 * Dispatch a JSON packet handler.
 */
export function dispatchJsonPacket(bot: Bot, cmd: string, data: unknown): void {
  void jsonHandlerMap.get(cmd)?.run(bot, data);
}

/**
 * Dispatch a string packet handler.
 */
export function dispatchStrPacket(bot: Bot, data: string[]): void {
  if (!data[0]) return;
  void strHandlerMap.get(data[0])?.run(bot, data);
}

export type {
  JsonPacketHandler,
  StrPacketHandler,
  PacketHandler,
} from "./types";
export { jsonHandlers, jsonHandlerMap } from "./json";
export { strHandlers, strHandlerMap } from "./str";

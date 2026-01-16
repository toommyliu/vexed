import type { Bot } from "~/lib/core/Bot";

/**
 * Handler function type for processing packets.
 */
type PacketHandler<T = unknown> = (bot: Bot, packet: T) => Promise<void> | void;

/**
 * Registry of JSON packet handlers, keyed by command name.
 */
const jsonHandlers = new Map<string, PacketHandler>();

/**
 * Registry of STR packet handlers, keyed by command name.
 */
const strHandlers = new Map<string, PacketHandler<string[]>>();

/**
 * Register a handler for a JSON packet command.
 *
 * @param cmd - The command name
 * @param handler - The handler function to invoke when this packet is received
 */
export function registerJsonHandler<T>(
  cmd: string,
  handler: PacketHandler<T>,
): void {
  if (jsonHandlers.has(cmd)) {
    console.warn(`[json] "${cmd}" is being overwritten...`);
  }

  console.log(`[json] registered :: ${cmd}`);
  jsonHandlers.set(cmd, handler as PacketHandler);
}

/**
 * Register a handler for a STR packet command.
 *
 * @param cmd - The command name
 * @param handler - The handler function to invoke when this packet is received
 */
export function registerStrHandler(
  cmd: string,
  handler: PacketHandler<string[]>,
): void {
  if (strHandlers.has(cmd)) {
    console.warn(`[str] "${cmd}" is being overwritten...`);
  }

  console.log(`[str] registered :: ${cmd}`);
  strHandlers.set(cmd, handler);
}

/**
 * Dispatch a JSON packet to its registered handler.
 *
 * @param bot - The bot instance
 * @param cmd - The command name from the packet
 * @param packet - The full packet object
 */
export function dispatchJson(bot: Bot, cmd: string, packet: unknown): void {
  const handler = jsonHandlers.get(cmd);
  if (handler) {
    try {
      void handler(bot, packet);
    } catch (error) {
      console.error(`[json] error in handler for "${cmd}":`, error);
    }
  }
}

/**
 * Dispatch a STR packet to its registered handler.
 *
 * @param bot - The bot instance
 * @param cmd - The command name (first element of the packet array)
 * @param packet - The packet data array
 */
export function dispatchStr(bot: Bot, cmd: string, packet: string[]): void {
  const handler = strHandlers.get(cmd);
  if (handler) {
    try {
      void handler(bot, packet);
    } catch (error) {
      console.error(`[str] error in handler for "${cmd}":`, error);
    }
  }
}

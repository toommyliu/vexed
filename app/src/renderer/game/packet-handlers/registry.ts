import log from "electron-log/renderer";
import type { Bot } from "~/lib/Bot";

const logger = log.scope("packet-handlers/registry");

/**
 * Handler function type for processing packets.
 * Can be sync or async, and receives the bot instance and packet data.
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
    logger.warn(`JSON handler for "${cmd}" is being overwritten`);
  }

  jsonHandlers.set(cmd, handler as PacketHandler);
}

/**
 * Register a handler for a STR packet command.
 *
 * @param cmd - The command name (e.g., "exitArea", "uotls")
 * @param handler - The handler function to invoke when this packet is received
 */
export function registerStrHandler(
  cmd: string,
  handler: PacketHandler<string[]>,
): void {
  if (strHandlers.has(cmd)) {
    logger.warn(`STR handler for "${cmd}" is being overwritten`);
  }

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
      logger.error(`Error in JSON handler for "${cmd}":`, error);
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
      logger.error(`Error in STR handler for "${cmd}":`, error);
    }
  }
}

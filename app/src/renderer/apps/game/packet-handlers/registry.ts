import type { Bot } from "../lib/Bot";

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
 * Registry of Client STR packet handlers, keyed by command name.
 */
const clientStrHandlers = new Map<string, PacketHandler<string[]>>();

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
    console.warn(`[server:json] "${cmd}" is being overwritten...`);
  }

  // console.log(`[server:json] registering handler for "${cmd}"`);

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
    console.warn(`[server:str] "${cmd}" is being overwritten...`);
  }

  // console.log(`[server:str] registering handler for "${cmd}"`);

  strHandlers.set(cmd, handler);
}

/**
 * Register a handler for a client STR packet command.
 *
 * @param cmd - The command name
 * @param handler - The handler function to invoke when this packet is sent
 */
export function registerClientStrHandler(
  cmd: string,
  handler: PacketHandler<string[]>,
): void {
  if (clientStrHandlers.has(cmd)) {
    console.warn(`[client:str] "${cmd}" is being overwritten...`);
  }

  // console.log(`[client:str] registering handler for "${cmd}"`);

  clientStrHandlers.set(cmd, handler);
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
      console.error(`[server:json] error in handler for "${cmd}":`, error);
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
      console.error(`[server:str] error in handler for "${cmd}":`, error);
    }
  }
}

/**
 * Dispatch a client STR packet to its registered handler.
 *
 * @param bot - The bot instance
 * @param cmd - The command name
 * @param packet - The packet data array
 */
export function dispatchClientStr(
  bot: Bot,
  cmd: string,
  packet: string[],
): void {
  const handler = clientStrHandlers.get(cmd);
  if (handler) {
    try {
      void handler(bot, packet);
    } catch (error) {
      console.error(`[client:str] error in handler for "${cmd}":`, error);
    }
  }
}

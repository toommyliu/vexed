import type { TipcInstance } from "@vexed/tipc";
import type { RendererHandlers } from "../tipc";
import { getGameWindow, getGameWindowId, windowStore } from "../windows";

export function createPacketLoggerTipcRouter(tipcInstance: TipcInstance) {
  return {
    packetLoggerStart: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const gameWindowId = getGameWindowId(senderWindow.id);
      if (!gameWindowId || !windowStore.has(gameWindowId)) return;

      const parent = getGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packetLogger.start.send();
    }),
    packetLoggerStop: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const gameWindowId = getGameWindowId(senderWindow.id);
      if (!gameWindowId || !windowStore.has(gameWindowId)) return;

      const parent = getGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packetLogger.stop.send();
    }),
    packetLoggerPacket: tipcInstance.procedure
      .input<{ packet: string; type: string }>()
      .action(async ({ input, context }) => {
        const browserWindow = context.senderWindow;
        if (!browserWindow) return;

        const packetLoggerWindow = windowStore.get(browserWindow.id)?.packets
          ?.logger;
        if (!packetLoggerWindow || packetLoggerWindow.isDestroyed()) return;

        const rendererHandler =
          context.getRendererHandlers<RendererHandlers>(packetLoggerWindow);
        rendererHandler.packetLogger.packet.send(input);
      }),
  };
}

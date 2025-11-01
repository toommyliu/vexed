import type { TipcInstance } from "@vexed/tipc";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

export function createPacketLoggerTipcRouter(tipcInstance: TipcInstance) {
  return {
    packetLoggerStart: tipcInstance.procedure.action(async ({ context }) => {
      const parent = context.senderParentWindow;
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packetLogger.start.send();
    }),
    packetLoggerStop: tipcInstance.procedure.action(async ({ context }) => {
      const parent = context.senderParentWindow;
      if (!parent || !windowStore.has(parent.id)) return;

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

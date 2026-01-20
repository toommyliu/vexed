import type { TipcInstance } from "@vexed/tipc";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

export function createPacketLoggerTipcRouter(tipcInstance: TipcInstance) {
  return {
    packetLoggerStart: tipcInstance.procedure.action(async ({ context }) => {
      const parent = context.senderParentWindow;
      if (!parent || !windowsService.getWindowStore().has(parent.id)) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packetLogger.start.send();
    }),
    packetLoggerStop: tipcInstance.procedure.action(async ({ context }) => {
      const parent = context.senderParentWindow;
      if (!parent || !windowsService.getWindowStore().has(parent.id)) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packetLogger.stop.send();
    }),
    packetLoggerPacket: tipcInstance.procedure
      .input<{ packet: string; type: string }>()
      .action(async ({ input, context }) => {
        const browserWindow = context.senderWindow;
        if (!browserWindow) return;

        const packetLoggerWindow = windowsService
          .getWindowStore()
          .get(browserWindow.id)?.packets?.logger;
        if (!packetLoggerWindow || packetLoggerWindow.isDestroyed()) return;

        const rendererHandler =
          context.getRendererHandlers<RendererHandlers>(packetLoggerWindow);
        rendererHandler.packetLogger.packet.send(input);
      }),
  };
}

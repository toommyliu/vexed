import type { TipcInstance } from "@vexed/tipc";
import { WindowIds } from "~/shared/types";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

export function createPacketLoggerTipcRouter(tipcInstance: TipcInstance) {
  return {
    packetLoggerStart: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const parent = windowsService.resolveGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packetLogger.start.send();
    }),
    packetLoggerStop: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const parent = windowsService.resolveGameWindow(senderWindow.id);
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

        const gameWindowId = windowsService.getGameWindowId(browserWindow.id);
        if (!gameWindowId) return;

        const packetLoggerWindow = windowsService.getSubwindow(
          gameWindowId,
          WindowIds.PacketLogger,
        );
        if (!packetLoggerWindow) return;

        const rendererHandler =
          context.getRendererHandlers<RendererHandlers>(packetLoggerWindow);
        rendererHandler.packetLogger.packet.send(input);
      }),
  };
}

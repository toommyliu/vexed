import type { TipcInstance } from "@vexed/tipc";
import { WindowIds } from "~/shared/types";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

export function createPacketTipcRouter(tipc: TipcInstance) {
  return {
    startLogger: tipc.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const parent = windowsService.resolveGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packets.startLogger.send();
    }),
    stopLogger: tipc.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const parent = windowsService.resolveGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packets.stopLogger.send();
    }),
    onPacket: tipc.procedure
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
        rendererHandler.packets.onPacket.send(input);
      }),

    startSpammer: tipc.procedure
      .input<{
        delay: number;
        packets: string[];
      }>()
      .action(async ({ input, context }) => {
        const senderWindow = context.senderWindow;
        if (!senderWindow) return;

        const parent = windowsService.resolveGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.packets.startSpammer.send(input);
      }),
    stopSpammer: tipc.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const parent = windowsService.resolveGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packets.stopSpammer.send();
    }),
  };
}

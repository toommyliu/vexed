import type { TipcInstance } from "@vexed/tipc";
import { getRendererHandlers } from "@vexed/tipc";
import { BrowserWindow } from "electron";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

export function createPacketLoggerTipcRouter(tipcInstance: TipcInstance) {
  return {
    packetLoggerStart: tipcInstance.procedure.action(async ({ context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );
      parentHandlers.packetLogger.start.send();
    }),
    packetLoggerStop: tipcInstance.procedure.action(async ({ context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );
      parentHandlers.packetLogger.stop.send();
    }),
    packetLoggerPacket: tipcInstance.procedure
      .input<{ packet: string; type: string }>()
      .action(async ({ input, context }) => {
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow) return;

        const packetLoggerWindow = windowStore.get(browserWindow.id)?.packets
          ?.logger;
        if (!packetLoggerWindow || packetLoggerWindow.isDestroyed()) return;

        const rendererHandler = getRendererHandlers<RendererHandlers>(
          packetLoggerWindow.webContents,
        );
        rendererHandler.packetLogger.packet.send(input);
      }),
  };
}

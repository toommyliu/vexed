import type { tipc } from "@vexed/tipc";
import { getRendererHandlers } from "@vexed/tipc";
import { BrowserWindow } from "electron";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

type TipcInstance = ReturnType<typeof tipc.create>;

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
      parentHandlers.packetLogger.packetLoggerStart.send();
    }),
    packetLoggerStop: tipcInstance.procedure.action(async ({ context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );
      parentHandlers.packetLogger.packetLoggerStop.send();
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
        rendererHandler.packetLogger.packetLoggerPacket.send(input);
      }),
  };
}

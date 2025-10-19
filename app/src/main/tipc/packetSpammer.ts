import type { TipcInstance } from "@vexed/tipc";
import { getRendererHandlers } from "@vexed/tipc";
import { BrowserWindow } from "electron";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

export function createPacketSpammerTipcRouter(tipcInstance: TipcInstance) {
  return {
    packetSpammerStart: tipcInstance.procedure
      .input<{
        delay: number;
        packets: string[];
      }>()
      .action(async ({ input, context }) => {
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow) return;

        const parent = browserWindow.getParentWindow();
        if (!parent || !windowStore.has(parent.id)) return;

        const parentHandlers = getRendererHandlers<RendererHandlers>(
          parent.webContents,
        );
        parentHandlers.packetSpammer.start.send(input);
      }),
    packetSpammerStop: tipcInstance.procedure.action(async ({ context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );
      parentHandlers.packetSpammer.stop.send();
    }),
  };
}

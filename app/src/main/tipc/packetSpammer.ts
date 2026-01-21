import type { TipcInstance } from "@vexed/tipc";
import type { RendererHandlers } from "../tipc";
import { getGameWindow, getGameWindowId, windowStore } from "../windows";

export function createPacketSpammerTipcRouter(tipcInstance: TipcInstance) {
  return {
    packetSpammerStart: tipcInstance.procedure
      .input<{
        delay: number;
        packets: string[];
      }>()
      .action(async ({ input, context }) => {
        const senderWindow = context.senderWindow;
        if (!senderWindow) return;

        const gameWindowId = getGameWindowId(senderWindow.id);
        if (!gameWindowId || !windowStore.has(gameWindowId)) return;

        const parent = getGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.packetSpammer.start.send(input);
      }),
    packetSpammerStop: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const gameWindowId = getGameWindowId(senderWindow.id);
      if (!gameWindowId || !windowStore.has(gameWindowId)) return;

      const parent = getGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packetSpammer.stop.send();
    }),
  };
}

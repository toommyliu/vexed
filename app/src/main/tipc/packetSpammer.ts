import type { TipcInstance } from "@vexed/tipc";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

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

        const parent = windowsService.resolveGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.packetSpammer.start.send(input);
      }),
    packetSpammerStop: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const parent = windowsService.resolveGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packetSpammer.stop.send();
    }),
  };
}

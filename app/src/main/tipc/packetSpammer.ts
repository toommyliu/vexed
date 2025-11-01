import type { TipcInstance } from "@vexed/tipc";
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
        const parent = context.senderParentWindow;
        if (!parent || !windowStore.has(parent.id)) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.packetSpammer.start.send(input);
      }),
    packetSpammerStop: tipcInstance.procedure.action(async ({ context }) => {
      const parent = context.senderParentWindow;
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.packetSpammer.stop.send();
    }),
  };
}

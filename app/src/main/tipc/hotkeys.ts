import type { TipcInstance } from "@vexed/tipc";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

export function createHotkeysTipcRouter(tipcInstance: TipcInstance) {
  return {
    updateHotkey: tipcInstance.procedure
      .input<{
        id: string;
        value: string;
      }>()
      .action(async ({ input, context }) => {
        const parent = context.senderParentWindow;
        if (!parent || !windowStore.has(parent?.id)) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        await parentHandlers.hotkeys.updateHotkey.invoke(input);
      }),
  };
}

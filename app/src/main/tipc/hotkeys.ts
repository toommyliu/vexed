import type { TipcInstance } from "@vexed/tipc";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

export function createHotkeysTipcRouter(tipcInstance: TipcInstance) {
  return {
    updateHotkey: tipcInstance.procedure
      .input<{
        id: string;
        value: string;
      }>()
      .action(async ({ input, context }) => {
        const senderWindow = context.senderWindow;
        if (!senderWindow) return;

        const parent = windowsService.resolveGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        await parentHandlers.hotkeys.updateHotkey.invoke(input);
      }),
    reloadHotkeys: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const parent = windowsService.resolveGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      await parentHandlers.hotkeys.reloadHotkeys.invoke();
    }),
  };
}

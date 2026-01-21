import type { TipcInstance } from "@vexed/tipc";
import type { RendererHandlers } from "../tipc";
import { getGameWindow, getGameWindowId, windowStore } from "../windows";

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

        const gameWindowId = getGameWindowId(senderWindow.id);
        if (!gameWindowId || !windowStore.has(gameWindowId)) return;

        const parent = getGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        await parentHandlers.hotkeys.updateHotkey.invoke(input);
      }),
    reloadHotkeys: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const gameWindowId = getGameWindowId(senderWindow.id);
      if (!gameWindowId || !windowStore.has(gameWindowId)) return;

      const parent = getGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      await parentHandlers.hotkeys.reloadHotkeys.invoke();
    }),
  };
}

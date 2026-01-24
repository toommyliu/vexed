import Config from "@vexed/config";
import type { TipcInstance } from "@vexed/tipc";
import { DEFAULT_HOTKEYS, DOCUMENTS_PATH } from "~/shared";
import type { HotkeyConfig } from "~/shared/types";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

const config = new Config<HotkeyConfig>({
  configName: "hotkeys",
  cwd: DOCUMENTS_PATH,
  defaults: DEFAULT_HOTKEYS,
});

export function createHotkeysTipcRouter(tipcInstance: TipcInstance) {
  return {
    all: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return null;
      return config.get();
    }),
    updateHotkey: tipcInstance.procedure
      .input<{
        configKey: string;
        id: string;
        value: string;
      }>()
      .action(async ({ input, context }) => {
        const senderWindow = context.senderWindow;
        if (!senderWindow) return;

        // @ts-expect-error - config.set is not typed for nested keys
        config.set(input.configKey, input.value);
        await config.save();

        const parent = windowsService.resolveGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        await parentHandlers.hotkeys.updateHotkey.invoke({
          id: input.id,
          value: input.value,
        });
      }),
    restoreDefaults: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      config.clear();
      await config.save();
      await config.reload();

      const parent = windowsService.resolveGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      await parentHandlers.hotkeys.reloadHotkeys.invoke();
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

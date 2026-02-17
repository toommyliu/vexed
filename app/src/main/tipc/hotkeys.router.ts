import Config from "@vexed/config";
import type { TipcInstance } from "@vexed/tipc";
import { DOCUMENTS_PATH } from "~/shared";
import { createDefaultHotkeyConfig } from "~/shared/hotkeys/schema";
import type { HotkeyConfig } from "~/shared/types";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";
import { withParentGameHandlers } from "./forwarding";
import { TipcResult } from "./result";

const config = new Config<HotkeyConfig>({
  configName: "hotkeys",
  cwd: DOCUMENTS_PATH,
  defaults: createDefaultHotkeyConfig(),
});

export function createHotkeysTipcRouter(tipc: TipcInstance) {
  return {
    all: tipc.procedure.requireSenderWindow().action(async () => {
      const result = await config.reload();
      if (result.isErr()) return TipcResult.err();
      const data = config.get();
      if (!data || typeof data !== "object")
        return TipcResult.ok(createDefaultHotkeyConfig());
      return TipcResult.ok(data);
    }),

    update: tipc.procedure
      .input<{
        configKey: string;
        id: string;
        value: string;
      }>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        config.set(input.configKey, input.value);
        const saveResult = await config.save();
        if (saveResult.isErr()) return TipcResult.err();

        await windowsService.forEachGameWindow(async (_, window) => {
          const handlers =
            context.getRendererHandlers<RendererHandlers>(window);
          await handlers.hotkeys.update.invoke({
            id: input.id,
            value: input.value,
            configKey: input.configKey,
          });
        });

        return TipcResult.ok();
      }),

    restore: tipc.procedure
      .requireSenderWindow()
      .action(async ({ context }) => {
        config.clear();
        const saveResult = await config.save();
        if (saveResult.isErr()) return;

        await config.reload();
        await withParentGameHandlers(context, async (parentHandlers) =>
          parentHandlers.hotkeys.reload.invoke(),
        );
      }),

    reload: tipc.procedure.requireSenderWindow().action(async ({ context }) => {
      await withParentGameHandlers(context, async (parentHandlers) =>
        parentHandlers.hotkeys.reload.invoke(),
      );
    }),
  };
}

import Config from "@vexed/config";
import type { TipcInstance } from "@vexed/tipc";
import { Result } from "better-result";
import { DOCUMENTS_PATH } from "~/shared";
import { createDefaultHotkeyConfig } from "~/shared/hotkeys/schema";
import type { HotkeyConfig } from "~/shared/types";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";
import { withParentGameHandlers } from "./forwarding";
import { PLATFORM } from "../constants";

const defaults = createDefaultHotkeyConfig(PLATFORM);
const config = new Config<HotkeyConfig>({
  configName: "hotkeys",
  cwd: DOCUMENTS_PATH,
  defaults,
});

export function createHotkeysTipcRouter(tipc: TipcInstance) {
  return {
    all: tipc.procedure.requireSenderWindow().action(async () => {
      const result = await config.reload();
      if (result.isErr()) return Result.serialize(Result.err(result.error));
      const data = config.get();
      if (!data || typeof data !== "object")
        return Result.serialize(Result.ok(defaults));
      return Result.serialize(Result.ok(data));
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
        if (saveResult.isErr())
          return Result.serialize(Result.err(saveResult.error));
        await windowsService.forEachGameWindow(async (_, window) => {
          const handlers =
            context.getRendererHandlers<RendererHandlers>(window);
          await handlers.hotkeys.update.invoke({
            id: input.id,
            value: input.value,
            configKey: input.configKey,
          });
        });
        return Result.serialize(Result.ok());
      }),

    restore: tipc.procedure
      .requireSenderWindow()
      .action(async ({ context }) => {
        config.clear();
        const saveResult = await config.save();
        if (saveResult.isErr())
          return Result.serialize(Result.err(saveResult.error));
        await config.reload();
        await withParentGameHandlers(context, async (parentHandlers) =>
          parentHandlers.hotkeys.reload.invoke(),
        );
        return Result.serialize(Result.ok());
      }),

    reload: tipc.procedure.requireSenderWindow().action(async ({ context }) => {
      await withParentGameHandlers(context, async (parentHandlers) =>
        parentHandlers.hotkeys.reload.invoke(),
      );
    }),
  };
}

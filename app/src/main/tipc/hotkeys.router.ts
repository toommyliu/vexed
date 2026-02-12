import Config from "@vexed/config";
import type { TipcInstance } from "@vexed/tipc";
import { Result } from "better-result";
import { DOCUMENTS_PATH } from "~/shared";
import { createDefaultHotkeyConfig } from "~/shared/hotkeys/schema";
import type { HotkeyConfig } from "~/shared/types";
import { createLogger } from "../services/logger";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";
import { TipcResult } from "./result";

const logger = createLogger("tipc:hotkeys");
const config = new Config<HotkeyConfig>({
  configName: "hotkeys",
  cwd: DOCUMENTS_PATH,
  defaults: createDefaultHotkeyConfig(),
});

export function createHotkeysTipcRouter(tipc: TipcInstance) {
  return {
    all: tipc.procedure.requireSenderWindow().action(async () => {
      const result = await Result.tryPromise({
        try: async () => {
          await config.reload();
          const get = config.get();
          if (!get || typeof get !== "object")
            return createDefaultHotkeyConfig();
          return get;
        },
        catch: (error) => {
          logger.error("Failed to get all hotkeys", error);
          return error;
        },
      });
      if (result.isErr()) return TipcResult.err();
      return TipcResult.ok(result.value);
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
        const result = await Result.tryPromise({
          try: async () => {
            await config.save();
            // Sync to all game windows
            await windowsService.forEachGameWindow(async (_, window) => {
              const handlers =
                context.getRendererHandlers<RendererHandlers>(window);
              await handlers.hotkeys.update.invoke({
                id: input.id,
                value: input.value,
                configKey: input.configKey,
              });
            });
          },
          catch: (error) => {
            logger.error(
              `Failed to update hotkey "${input.configKey}" with value "${input.value}"`,
              error,
            );
            return error;
          },
        });
        if (result.isErr()) return TipcResult.err();
        return TipcResult.ok();
      }),
    restore: tipc.procedure
      .requireSenderWindow()
      .action(async ({ context }) => {
        config.clear();
        const result = await Result.tryPromise({
          try: async () => {
            await config.save();
            await config.reload();
          },
          catch: (error) => {
            logger.error("Failed to restore default hotkeys", error);
          },
        });
        if (result.isErr()) return;

        const parent = windowsService.resolveGameWindow(
          context.senderWindowId,
        );
        if (!parent) return;
        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        await parentHandlers.hotkeys.reload.invoke();
      }),
    reload: tipc.procedure.requireSenderWindow().action(async ({ context }) => {
      const parent = windowsService.resolveGameWindow(context.senderWindowId);
      if (!parent) return;
      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      await parentHandlers.hotkeys.reload.invoke();
    }),
  };
}

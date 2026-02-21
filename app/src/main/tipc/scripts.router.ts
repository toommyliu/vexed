import type { TipcInstance } from "@vexed/tipc";
import { Result } from "better-result";
import { scriptService } from "../services/scripts";
import type { RendererHandlers } from "../tipc";

export function createScriptsTipcRouter(tipcInstance: TipcInstance) {
  return {
    loadScript: tipcInstance.procedure
      .input<{ scriptPath?: string }>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        const result = await scriptService.loadAndRun(
          context.senderWindow,
          input?.scriptPath,
        );

        if (result.isErr()) {
          return Result.serialize(Result.err(result.error));
        }

        const data = result.unwrap();
        if (data) {
          const handlers = context.getRendererHandlers<RendererHandlers>();
          handlers.scripts.scriptLoaded.send(data.fromManager);
        }

        return Result.serialize(Result.ok());
      }),

    // TODO: this should be more isolated
    gameReload: tipcInstance.procedure.action(async ({ context }) => {
      const browserWindow = context.senderWindow;
      if (!browserWindow) return;

      for (const child of browserWindow.getChildWindows()) {
        if (child && !child.isDestroyed()) {
          const rendererHandlers =
            context.getRendererHandlers<RendererHandlers>(child);
          rendererHandlers.game.gameReloaded.send();
        }
      }
    }),
  };
}

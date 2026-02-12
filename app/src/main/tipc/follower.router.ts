import type { TipcInstance } from "@vexed/tipc";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

export function createFollowerTipcRouter(tipcInstance: TipcInstance) {
  return {
    me: tipcInstance.procedure
      .requireSenderWindow()
      .action(async ({ context }) => {
        const parent = windowsService.resolveGameWindow(context.senderWindowId);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        return parentHandlers.follower.me.invoke();
      }),
    start: tipcInstance.procedure
      .input<{
        attackPriority: string;
        copyWalk: boolean;
        name: string;
        safeSkill: string;
        safeSkillEnabled: boolean;
        safeSkillHp: string;
        skillDelay: string;
        skillList: string;
        skillWait: boolean;
      }>()
      .requireSenderWindow()
      .action(async ({ context, input }) => {
        const parent = windowsService.resolveGameWindow(context.senderWindowId);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.follower.start.send(input);
      }),
    stop: tipcInstance.procedure
      .requireSenderWindow()
      .action(async ({ context }) => {
        const parent = windowsService.resolveGameWindow(context.senderWindowId);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.follower.stop.send();
      }),
  };
}

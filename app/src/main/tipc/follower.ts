import type { TipcInstance } from "@vexed/tipc";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

export function createFollowerTipcRouter(tipcInstance: TipcInstance) {
  return {
    me: tipcInstance.procedure.action(async ({ context }) => {
      const parent = context.senderParentWindow;
      if (!parent || !windowsService.getWindowStore().has(parent.id)) return;

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
      .action(async ({ context, input }) => {
        const parent = context.senderParentWindow;
        if (!parent || !windowsService.getWindowStore().has(parent.id)) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.follower.start.send(input);
      }),
    stop: tipcInstance.procedure.action(async ({ context }) => {
      const parent = context.senderParentWindow;
      if (!parent || !windowsService.getWindowStore().has(parent.id)) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.follower.stop.send();
    }),
  };
}

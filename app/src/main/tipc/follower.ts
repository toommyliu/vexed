import type { TipcInstance } from "@vexed/tipc";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

export function createFollowerTipcRouter(tipcInstance: TipcInstance) {
  return {
    me: tipcInstance.procedure.action(async ({ context }) => {
      const parent = context.senderParentWindow;
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      return parentHandlers.follower.me.invoke();
    }),
    start: tipcInstance.procedure
      .input<{
        antiCounter: boolean;
        attackPriority: string;
        copyWalk: boolean;
        drops: string;
        name: string;
        quests: string;
        rejectElse: boolean;
        safeSkill: string;
        safeSkillEnabled: boolean;
        safeSkillHp: string;
        skillDelay: string;
        skillList: string;
        skillWait: boolean;
      }>()
      .action(async ({ context, input }) => {
        const parent = context.senderParentWindow;
        if (!parent || !windowStore.has(parent.id)) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.follower.start.send(input);
      }),
    stop: tipcInstance.procedure.action(async ({ context }) => {
      const parent = context.senderParentWindow;
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.follower.stop.send();
    }),
  };
}

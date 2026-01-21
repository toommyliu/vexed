import type { TipcInstance } from "@vexed/tipc";
import type { RendererHandlers } from "../tipc";
import { getGameWindow, getGameWindowId, windowStore } from "../windows";

export function createFollowerTipcRouter(tipcInstance: TipcInstance) {
  return {
    me: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const gameWindowId = getGameWindowId(senderWindow.id);
      if (!gameWindowId || !windowStore.has(gameWindowId)) return;

      const parent = getGameWindow(senderWindow.id);
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
      .action(async ({ context, input }) => {
        const senderWindow = context.senderWindow;
        if (!senderWindow) return;

        const gameWindowId = getGameWindowId(senderWindow.id);
        if (!gameWindowId || !windowStore.has(gameWindowId)) return;

        const parent = getGameWindow(senderWindow.id);
        if (!parent) return;

        const parentHandlers =
          context.getRendererHandlers<RendererHandlers>(parent);
        parentHandlers.follower.start.send(input);
      }),
    stop: tipcInstance.procedure.action(async ({ context }) => {
      const senderWindow = context.senderWindow;
      if (!senderWindow) return;

      const gameWindowId = getGameWindowId(senderWindow.id);
      if (!gameWindowId || !windowStore.has(gameWindowId)) return;

      const parent = getGameWindow(senderWindow.id);
      if (!parent) return;

      const parentHandlers =
        context.getRendererHandlers<RendererHandlers>(parent);
      parentHandlers.follower.stop.send();
    }),
  };
}

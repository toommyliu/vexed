import type { tipc } from "@vexed/tipc";
import { getRendererHandlers } from "@vexed/tipc";
import { BrowserWindow } from "electron";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

type TipcInstance = ReturnType<typeof tipc.create>;

export function createFollowerTipcRouter(tipcInstance: TipcInstance) {
  return {
    me: tipcInstance.procedure.action(async ({ context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );

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
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow) return;

        const parent = browserWindow.getParentWindow();
        if (!parent || !windowStore.has(parent.id)) return;

        const parentHandlers = getRendererHandlers<RendererHandlers>(
          parent.webContents,
        );
        parentHandlers.follower.start.send(input);
      }),
    stop: tipcInstance.procedure.action(async ({ context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );
      parentHandlers.follower.stop.send();
    }),
  };
}

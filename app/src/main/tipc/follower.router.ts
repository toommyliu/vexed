import type { TipcInstance } from "@vexed/tipc";
import { withParentGameHandlers } from "./forwarding";

export function createFollowerTipcRouter(tipcInstance: TipcInstance) {
  return {
    me: tipcInstance.procedure
      .requireSenderWindow()
      .action(async ({ context }) =>
        withParentGameHandlers(context, async (parentHandlers) =>
          parentHandlers.follower.me.invoke(),
        ),
      ),
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
        await withParentGameHandlers(context, (parentHandlers) =>
          parentHandlers.follower.start.send(input),
        );
      }),
    stop: tipcInstance.procedure
      .requireSenderWindow()
      .action(async ({ context }) => {
        await withParentGameHandlers(context, (parentHandlers) =>
          parentHandlers.follower.stop.send(),
        );
      }),
  };
}

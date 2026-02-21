import type { TipcInstance } from "@vexed/tipc";
import type { RawFollowerConfig } from "~/shared/follower/types";
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
      .input<RawFollowerConfig>()
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

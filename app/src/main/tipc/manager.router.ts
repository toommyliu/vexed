import type { TipcInstance } from "@vexed/tipc";
import { matchErrorPartial } from "better-result";
import type { Account } from "~/shared/types";
import { accounts } from "../services/accounts";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";
import { TipcResult } from "./result";

export function createManagerTipcRouter(tipc: TipcInstance) {
  return {
    getAccounts: tipc.procedure.action(async () => {
      const result = await accounts.getAll();
      return result.unwrapOr([] as Account[]);
    }),

    addAccount: tipc.procedure.input<Account>().action(async ({ input }) => {
      const result = await accounts.add(input);
      if (result.isErr()) {
        return matchErrorPartial(
          result.error,
          {
            DuplicateUsernameError: () =>
              TipcResult.err("USERNAME_ALREADY_EXISTS"),
          },
          () => TipcResult.err("FAILED"),
        );
      }

      return TipcResult.ok();
    }),

    removeAccount: tipc.procedure
      .input<{
        username: string;
      }>()
      .action(async ({ input }) => {
        const result = await accounts.remove(input.username);
        if (result.isErr()) {
          return matchErrorPartial(
            result.error,
            {
              AccountNotFoundError: () => TipcResult.err("ACCOUNT_NOT_FOUND"),
            },
            () => TipcResult.err("FAILED"),
          );
        }

        return TipcResult.ok();
      }),

    updateAccount: tipc.procedure
      .input<{
        originalUsername: string;
        updatedAccount: Account;
      }>()
      .action(async ({ input }) => {
        const result = await accounts.update(
          input.originalUsername,
          input.updatedAccount,
        );
        if (result.isErr()) {
          return matchErrorPartial(
            result.error,
            {
              AccountNotFoundError: () => TipcResult.err("ACCOUNT_NOT_FOUND"),
              DuplicateUsernameError: () =>
                TipcResult.err("USERNAME_ALREADY_EXISTS"),
            },
            () => TipcResult.err("FAILED"),
          );
        }

        return TipcResult.ok();
      }),

    // Game login completes, notify the manager window to update UI
    onLogin: tipc.procedure
      .input<{ username: string }>()
      .action(async ({ input, context }) => {
        const mgrWindow = windowsService.getManagerWindow();
        if (!mgrWindow) return;
        const handlers =
          context.getRendererHandlers<RendererHandlers>(mgrWindow);
        handlers.manager.onLogin.send(input.username);
      }),
  };
}

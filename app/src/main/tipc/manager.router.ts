import type { TipcInstance } from "@vexed/tipc";
import { Result, matchErrorPartial } from "better-result";
import {
  ManagerAccountNotFoundError,
  ManagerDuplicateUsernameError,
  type ManagerIpcError,
  ManagerOperationFailedError,
  type ManagerOperation,
} from "~/shared/manager/errors";
import type { Account } from "~/shared/types";
import { accounts } from "../services/accounts";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";

const operationFailedError = (
  operation: ManagerOperation,
  cause?: string,
): ManagerIpcError => new ManagerOperationFailedError({ cause, operation });

export function createManagerTipcRouter(tipc: TipcInstance) {
  return {
    getAccounts: tipc.procedure.action(async () => {
      const result = await accounts.getAll();
      if (result.isErr())
        return Result.serialize(
          Result.err(
            operationFailedError("getAccounts", result.error.message),
          ),
        );
      return Result.serialize(Result.ok(result.value));
    }),

    addAccount: tipc.procedure.input<Account>().action(async ({ input }) => {
      const result = await accounts.add(input);
      if (result.isErr()) {
        return matchErrorPartial(
          result.error,
          {
            DuplicateUsernameError: () =>
              Result.serialize(
                Result.err(
                  new ManagerDuplicateUsernameError({
                    username: input.username,
                  }),
                ),
              ),
          },
          () =>
            Result.serialize(
              Result.err(
                operationFailedError("addAccount", result.error.message),
              ),
            ),
        );
      }

      return Result.serialize(Result.ok());
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
              AccountNotFoundError: () =>
                Result.serialize(
                  Result.err(
                    new ManagerAccountNotFoundError({
                      username: input.username,
                    }),
                  ),
                ),
            },
            () =>
              Result.serialize(
                Result.err(
                  operationFailedError("removeAccount", result.error.message),
                ),
              ),
          );
        }

        return Result.serialize(Result.ok());
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
              AccountNotFoundError: () =>
                Result.serialize(
                  Result.err(
                    new ManagerAccountNotFoundError({
                      username: input.originalUsername,
                    }),
                  ),
                ),
              DuplicateUsernameError: () =>
                Result.serialize(
                  Result.err(
                    new ManagerDuplicateUsernameError({
                      username: input.updatedAccount.username,
                    }),
                  ),
                ),
            },
            () =>
              Result.serialize(
                Result.err(
                  operationFailedError("updateAccount", result.error.message),
                ),
              ),
          );
        }

        return Result.serialize(Result.ok());
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

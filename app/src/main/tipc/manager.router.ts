import { join } from "path";
import type { TipcInstance } from "@vexed/tipc";
import { matchErrorPartial } from "better-result";
import { dialog } from "electron";
import type { BrowserWindow, OpenDialogOptions } from "electron";
import { DOCUMENTS_PATH } from "~/shared/constants";
import type { Account, AccountWithScript } from "~/shared/types";
import { accounts } from "../services/accounts";
import { createLogger } from "../services/logger";
import { windowsService } from "../services/windows";
import type { RendererHandlers } from "../tipc";
import { TipcResult } from "./result";

const logger = createLogger("tipc:manager");

export function createManagerTipcRouter(tipc: TipcInstance) {
  return {
    getAccounts: tipc.procedure.action(async () => {
      const result = await accounts.getAll();
      return result.unwrapOr([] as Account[]);
    }),

    addAccount: tipc.procedure.input<Account>().action(async ({ input }) => {
      const result = await accounts.add(input);
      if (result.isErr()) {
        logger.error(result.error);
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
          logger.error(result.error);
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
          logger.error(result.error);
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
    mgrLoadScript: tipc.procedure.action(async ({ context }) => {
      try {
        const browserWindow: BrowserWindow | undefined =
          context.senderWindow ?? undefined;
        const dialogOptions: OpenDialogOptions = {
          defaultPath: join(DOCUMENTS_PATH, "Bots"),
          properties: ["openFile"],
          filters: [{ name: "Bots", extensions: ["js"] }],
          message: "Select a script to load",
          title: "Select a script to load",
        };

        const res = browserWindow
          ? await dialog.showOpenDialog(browserWindow, dialogOptions)
          : await dialog.showOpenDialog(dialogOptions);

        if (res?.canceled || !res?.filePaths?.length) return "";

        return res?.filePaths[0] ?? "";
      } catch (error) {
        logger.error("Failed to load script", error);
        return "";
      }
    }),
    launchGame: tipc.procedure
      .input<AccountWithScript>()
      .action(async ({ input }) => {
        windowsService.game(input);
      }),
    managerLoginSuccess: tipc.procedure
      .input<{ username: string }>()
      .action(async ({ input, context }) => {
        const result = windowsService.manager();
        if (result.isErr()) return;

        const mgrWindow = result.value;
        const handlers =
          context.getRendererHandlers<RendererHandlers>(mgrWindow);
        handlers.manager.enableButton.send(input.username);
      }),
  };
}

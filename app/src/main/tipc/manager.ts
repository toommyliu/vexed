import { join } from "path";
import Config from "@vexed/config";
import { readJson, writeJson } from "@vexed/fs-utils";
import type { TipcInstance } from "@vexed/tipc";
import { dialog } from "electron";
import type { BrowserWindow, OpenDialogOptions } from "electron";
import { ACCOUNTS_PATH, DEFAULT_ACCOUNTS, DOCUMENTS_PATH } from "../../shared/constants";
import type { Account, AccountWithScript } from "../../shared/types";
import { logger } from "../constants";
import type { RendererHandlers } from "../tipc";
import { createGame, getManagerWindow } from "../windows";

export function createManagerTipcRouter(tipcInstance: TipcInstance) {
  return {
    getAccounts: tipcInstance.procedure.action(async () => {
      try {
        const config = new Config<Account[]>({
          configName: "accounts",
          cwd: DOCUMENTS_PATH,
          defaults: DEFAULT_ACCOUNTS,
        });
        await config.load();
        console.log('accounts', config.get());
        return config.get();
      } catch (error) {
        logger.error("Failed to get accounts.", error);
        return DEFAULT_ACCOUNTS;
      }
    }),
    addAccount: tipcInstance.procedure
      .input<Account>()
      .action(async ({ input }) => {
        try {
          const accounts = (await readJson<Account[]>(ACCOUNTS_PATH)) ?? DEFAULT_ACCOUNTS;

          const idx = accounts.findIndex(
            (acc) => acc.username === input.username,
          );
          if (idx !== -1) return { msg: "USERNAME_ALREADY_EXISTS" } as const;

          accounts.push(input);
          await writeJson(ACCOUNTS_PATH, accounts);
          return { msg: "SUCCESS" } as const;
        } catch (error) {
          logger.error("Failed to add account.", error);
          return { msg: "FAILED" } as const;
        }
      }),
    removeAccount: tipcInstance.procedure
      .input<{
        username: string;
      }>()
      .action(async ({ input }) => {
        try {
          const accounts = (await readJson<Account[]>(ACCOUNTS_PATH)) ?? DEFAULT_ACCOUNTS;

          const idx = accounts.findIndex(
            (acc) => acc.username === input.username,
          );
          if (idx === -1) return false;

          accounts.splice(idx, 1);
          await writeJson(ACCOUNTS_PATH, accounts);
          return true;
        } catch (error) {
          logger.error("Failed to remove account.", error);
          return false;
        }
      }),
    updateAccount: tipcInstance.procedure
      .input<{
        originalUsername: string;
        updatedAccount: Account;
      }>()
      .action(async ({ input }) => {
        try {
          const accounts = (await readJson<Account[]>(ACCOUNTS_PATH)) ?? DEFAULT_ACCOUNTS;

          const idx = accounts.findIndex(
            (acc) => acc.username === input.originalUsername,
          );
          if (idx === -1) return { msg: "ACCOUNT_NOT_FOUND" } as const;

          if (input.updatedAccount.username !== input.originalUsername) {
            const existingIdx = accounts.findIndex(
              (acc) => acc.username === input.updatedAccount.username,
            );
            if (existingIdx !== -1)
              return { msg: "USERNAME_ALREADY_EXISTS" } as const;
          }

          accounts[idx] = input.updatedAccount;
          await writeJson(ACCOUNTS_PATH, accounts);
          return { msg: "SUCCESS" } as const;
        } catch (error) {
          logger.error("Failed to update account.", error);
          return { msg: "FAILED" } as const;
        }
      }),
    mgrLoadScript: tipcInstance.procedure.action(async ({ context }) => {
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
        logger.error("Manager: failed to load script.", error);
        return "";
      }
    }),
    launchGame: tipcInstance.procedure
      .input<AccountWithScript>()
      .action(async ({ input }) => {
        await createGame(input);
      }),
    managerLoginSuccess: tipcInstance.procedure
      .input<{ username: string }>()
      .action(async ({ input, context }) => {
        const mgrWindow = getManagerWindow();
        if (!mgrWindow) return;

        const handlers =
          context.getRendererHandlers<RendererHandlers>(mgrWindow);
        handlers.manager.enableButton.send(input.username);
      }),
  };
}

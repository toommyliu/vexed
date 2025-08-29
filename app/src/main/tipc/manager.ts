import { join } from "path";
import Config from "@vexed/config";
import { readJson, writeJson } from "@vexed/fs-utils";
import { Logger } from "@vexed/logger";
import type { tipc } from "@vexed/tipc";
import { getRendererHandlers } from "@vexed/tipc";
import { dialog, BrowserWindow } from "electron";
import { ACCOUNTS_PATH, DOCUMENTS_PATH } from "../../shared/constants";
import type { Account, AccountWithScript } from "../../shared/types";
import type { RendererHandlers } from "../tipc";
import { createGame, getManagerWindow } from "../windows";

const logger = Logger.get("IpcMain");

type TipcInstance = ReturnType<typeof tipc.create>;

export function createManagerTipcRouter(tipcInstance: TipcInstance) {
  return {
    getAccounts: tipcInstance.procedure.action(async () => {
      try {
        const config = new Config({
          configName: "accounts",
          cwd: DOCUMENTS_PATH,
        });
        await config.load();
        return config.get() as Account[];
      } catch {
        return [];
      }
    }),
    addAccount: tipcInstance.procedure
      .input<Account>()
      .action(async ({ input }) => {
        try {
          const accounts = (await readJson<Account[]>(ACCOUNTS_PATH)) ?? [];

          const idx = accounts.findIndex(
            (acc) => acc.username === input.username,
          );
          if (idx !== -1) return false;

          accounts.push(input);
          await writeJson(ACCOUNTS_PATH, accounts);
          return true;
        } catch (error) {
          logger.error("Failed to add account", error);
          return false;
        }
      }),
    removeAccount: tipcInstance.procedure
      .input<{
        username: string;
      }>()
      .action(async ({ input }) => {
        try {
          const accounts = (await readJson<Account[]>(ACCOUNTS_PATH)) ?? [];

          const idx = accounts.findIndex(
            (acc) => acc.username === input.username,
          );
          if (idx === -1) return false;

          accounts.splice(idx, 1);
          await writeJson(ACCOUNTS_PATH, accounts);
          return true;
        } catch (error) {
          logger.error("Failed to remove account", error);
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
          const accounts = (await readJson<Account[]>(ACCOUNTS_PATH)) ?? [];

          const idx = accounts.findIndex(
            (acc) => acc.username === input.originalUsername,
          );
          if (idx === -1) return false;

          if (input.updatedAccount.username !== input.originalUsername) {
            const existingIdx = accounts.findIndex(
              (acc) => acc.username === input.updatedAccount.username,
            );
            if (existingIdx !== -1) return false;
          }

          accounts[idx] = input.updatedAccount;
          await writeJson(ACCOUNTS_PATH, accounts);
          return true;
        } catch (error) {
          logger.error("Failed to update account", error);
          return false;
        }
      }),
    mgrLoadScript: tipcInstance.procedure.action(async ({ context }) => {
      try {
        const res = await dialog.showOpenDialog(
          BrowserWindow.fromWebContents(context.sender),
          {
            defaultPath: join(DOCUMENTS_PATH, "Bots"),
            properties: ["openFile"],
            filters: [{ name: "Bots", extensions: ["js"] }],
            message: "Select a script to load",
            title: "Select a script to load",
          },
        );

        if (res?.canceled || !res?.filePaths?.length) return "";

        return res?.filePaths[0] ?? "";
      } catch {
        return "";
      }
    }),
    launchGame: tipcInstance.procedure
      .input<AccountWithScript>()
      .action(async ({ input }) => {
        logger.info(`Launching game for: ${input.username}`);
        await createGame(input);
      }),
    managerLoginSuccess: tipcInstance.procedure
      .input<{ username: string }>()
      .action(async ({ input, context }) => {
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow) return;

        const window = getManagerWindow();
        if (!window) return;

        const handlers = getRendererHandlers<RendererHandlers>(
          window.webContents,
        );
        handlers.manager.enableButton.send(input.username);

        logger.info(`User ${input.username} logged in successfully`);
      }),
  };
}

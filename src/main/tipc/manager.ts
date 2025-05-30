import { tipc } from "@egoist/tipc";
import { FileManager } from "../../common/FileManager";
import { Logger } from "../../common/logger";

const tipcInstance = tipc.create();
const logger = Logger.get("IpcManager");

export const router = {
  // #region Manager
  getAccounts: tipcInstance.procedure.action(async () => {
    try {
      return await FileManager.readJson<Account[]>(FileManager.accountsPath);
    } catch {
      return [];
    }
  }),
  addAccount: tipcInstance.procedure
    .input<Account>()
    .action(async ({ input }) => {
      try {
        console.log("call to addAccount with input:", input);

        const accounts =
          (await FileManager.readJson<Account[]>(FileManager.accountsPath)) ??
          [];

        const idx = accounts.findIndex(
          (acc) => acc.username === input.username,
        );
        if (idx !== -1) return false;

        accounts.push(input);
        await FileManager.writeJson(FileManager.accountsPath, accounts);
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
        const accounts =
          (await FileManager.readJson<Account[]>(FileManager.accountsPath)) ??
          [];

        const idx = accounts.findIndex(
          (acc) => acc.username === input.username,
        );
        if (idx === -1) return false;

        accounts.splice(idx, 1);
        await FileManager.writeJson(FileManager.accountsPath, accounts);
        return true;
      } catch (error) {
        logger.error("Failed to remove account", error);
        return false;
      }
    }),
  // #endregion
};

export type Router = typeof router;

import { join } from "path";
import { tipc } from "@egoist/tipc";
import { BrowserWindow, dialog } from "electron";
import { FileManager } from "../../common/FileManager";
import { Logger } from "../../common/logger";
import { createGame } from "../windows";

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
  mgrLoadScript: tipcInstance.procedure.action(async ({ context }) => {
    try {
      const res = await dialog.showOpenDialog(
        BrowserWindow.fromWebContents(context.sender),
        {
          defaultPath: join(FileManager.basePath, "Bots"),
          properties: ["openFile"],
          filters: [{ name: "Bots", extensions: ["js"] }],
          message: "Select a script to load",
          title: "Select a script to load",
        },
      );

      if (res?.canceled || !res?.filePaths?.length) return "";

      const filePath = res.filePaths[0];
      if (!filePath) return "";

      console.log("Selected script:", filePath);
      return filePath;
    } catch {
      return "";
    }
  }),
  launchGame: tipcInstance.procedure
    .input<AccountWithServer>()
    .action(async ({ input }) => {
      logger.info(`Launching game for: ${input.username}`);
      await createGame(input);
    }),
  // #endregion
};

export type TipcRouter = typeof router;

export type RendererHandlers = {
  /**
   * Enables the start button for the provided username.
   */
  enableButton(username: string): Promise<void>;
};

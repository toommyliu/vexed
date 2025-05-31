import { join } from "path";
import { getRendererHandlers, tipc } from "@egoist/tipc";
import { BrowserWindow, dialog } from "electron";
import { FileManager } from "../common/FileManager";
import { Logger } from "../common/logger";
import { createGame } from "./windows";

const tipcInstance = tipc.create();
const logger = Logger.get("IpcMain");

// Renderer calls to main (1.)
export const router = {
  // #region Game
  // #region Scripts
  loadScript: tipcInstance.procedure
    .input<{ scriptPath: string }>()
    .action(async ({ input, context }) => {
      try {
        const scriptPath = input?.scriptPath;
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        const handlers = getRendererHandlers<RendererHandlers>(context.sender);

        let file: string;
        let fromManager = false;

        if (scriptPath) {
          file = scriptPath;
          fromManager = true;
        } else {
          const res = await dialog
            .showOpenDialog(browserWindow, {
              defaultPath: join(FileManager.basePath, "Bots"),
              properties: ["openFile"],
              filters: [{ name: "Bots", extensions: ["js"] }],
              message: "Select a script to load",
              title: "Select a script to load",
            })
            .catch(() => ({ canceled: true, filePaths: [] }));
          if (res?.canceled || !res?.filePaths?.[0]) return;
          file = res.filePaths[0];
        }

        const content = await FileManager.readFile(file);
        if (!content) return;

        // The error is thrown in the renderer
        // So we need to listen for it here and handle it
        browserWindow.webContents.once(
          "console-message",
          async (_, level, message, line) => {
            if (!message.startsWith("Uncaught") || level !== 3) {
              return;
            }

            const args = message.slice("Uncaught".length).split(":");

            const err = args[0]!; // Error
            const _msg = args
              .join(" ")
              .slice(err!.length + 1)
              .trim();

            // ArgsError
            if (level === 3 && _msg.startsWith("Invalid args")) {
              const split = _msg.split(";"); // Invalid args;delay;ms is required
              const cmd = split[1]!; // delay
              const cmd_msg = split[2]!; // ms is required

              try {
                // Reset the commands
                await browserWindow.webContents.executeJavaScript(
                  "window.context.setCommands([])",
                );

                // Ideally, this traces to the line of the (user) script back to
                // where the error occurred, not where the error is thrown internally
                await dialog.showMessageBox(browserWindow, {
                  message: `"cmd.${cmd}()" threw an error: ${cmd_msg}`,
                  type: "error",
                });
              } catch {}
            } else {
              // Some generic error (SyntaxError, ReferenceError, etc.)
              await dialog.showMessageBox(browserWindow, {
                message: err,
                detail: `${_msg} (line ${line})`,
                type: "error",
              });
            }
          },
        );

        // Reset to clean state
        await context.sender.executeJavaScript(
          "window.context.setCommands([]);window.context.commandIndex=0;",
        );

        // Load the script
        await context.sender.executeJavaScript(content!);
        handlers.scriptLoaded.send(fromManager);

        browserWindow.webContents.removeAllListeners("console-message");
      } catch {}
    }),
  toggleDevTools: tipcInstance.procedure.action(async ({ context }) => {
    const browserWindow = BrowserWindow.fromWebContents(context.sender);
    browserWindow?.webContents?.toggleDevTools();
  }),
  // #endregion
  // #endregion
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

      return res?.filePaths[0] ?? "";
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

// Main calls back to renderer (2.)
export type RendererHandlers = {
  /**
   * Enables the start button for the provided username.
   */
  enableButton(username: string): Promise<void>;
  scriptLoaded(fromManager: boolean): void;
};

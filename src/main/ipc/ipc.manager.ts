import { join } from "path";
import { dialog } from "electron";
import { FileManager } from "../../common/FileManager";
import { ipcMain } from "../../common/ipc";
import { IPC_EVENTS } from "../../common/ipc-events";
import { Logger } from "../../common/logger";
import { createGame } from "../windows";

const logger = Logger.get("IpcManager");

ipcMain.answerRenderer(IPC_EVENTS.GET_ACCOUNTS, async () => {
  try {
    return (await FileManager.readJson<Account[]>(
      FileManager.accountsPath,
    )) as Account[];
  } catch {
    return [];
  }
});

ipcMain.answerRenderer(IPC_EVENTS.ADD_ACCOUNT, async (account) => {
  try {
    const accounts =
      (await FileManager.readJson<Account[]>(FileManager.accountsPath)) ?? [];

    accounts.push(account);

    await FileManager.writeJson(FileManager.accountsPath, accounts);
    return { success: true, msg: "" };
  } catch (error) {
    const err = error as Error;
    return { success: false, msg: err.message };
  }
});

ipcMain.answerRenderer(IPC_EVENTS.REMOVE_ACCOUNT, async ({ username }) => {
  try {
    const accounts =
      (await FileManager.readJson<Account[]>(FileManager.accountsPath)) ?? [];

    const idx = accounts.findIndex((acc) => acc.username === username);
    if (idx === -1) {
      return false;
    }

    accounts.splice(idx, 1);

    await FileManager.writeJson(FileManager.accountsPath, accounts);
    return true;
  } catch (error) {
    logger.error("failed to remove account:", error);
    return false;
  }
});

ipcMain.answerRenderer(IPC_EVENTS.LAUNCH_GAME, async (account) => {
  logger.info(`launching game for: ${account.username}`);
  await createGame(account);
});

ipcMain.answerRenderer(IPC_EVENTS.MGR_LOAD_SCRIPT, async (_, browserWindow) => {
  try {
    const res = await dialog.showOpenDialog(browserWindow, {
      defaultPath: join(FileManager.basePath, "Bots"),
      properties: ["openFile"],
      filters: [{ name: "Bots", extensions: ["js"] }],
      message: "Select a script to load",
      title: "Select a script to load",
    });

    if (res?.canceled || !res?.filePaths?.length) return "";

    const filePath = res.filePaths[0];
    if (!filePath) return "";

    console.log("Selected script:", filePath);
    return filePath;
  } catch {
    return "";
  }
});

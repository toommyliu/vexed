import { ipcMain } from '../../common/ipc';
import { IPC_EVENTS } from '../../common/ipc-events';
import { FileManager } from '../FileManager';
import { createGame } from '../windows';
import { Logger } from '../../common/logger';

const fileMgr = FileManager.getInstance();
const logger = Logger.get('IpcManager');

ipcMain.answerRenderer(IPC_EVENTS.GET_ACCOUNTS, async () => {
  try {
    return (await fileMgr.readJson<Account[]>(
      fileMgr.accountsPath,
    )) as Account[];
  } catch (error) {
    logger.error('failed to read accounts.json:', error);
    return [];
  }
});

ipcMain.answerRenderer(IPC_EVENTS.ADD_ACCOUNT, async (account) => {
  try {
    const accounts =
      (await fileMgr.readJson<Account[]>(fileMgr.accountsPath)) ?? [];

    accounts.push(account);

    await fileMgr.writeJson(fileMgr.accountsPath, accounts);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { success: false, msg: err.message };
  }
});

ipcMain.answerRenderer(IPC_EVENTS.REMOVE_ACCOUNT, async ({ username }) => {
  try {
    const accounts =
      (await fileMgr.readJson<Account[]>(fileMgr.accountsPath)) ?? [];

    const idx = accounts.findIndex((acc) => acc.username === username);
    if (idx === -1) {
      return false;
    }

    accounts.splice(idx, 1);

    await fileMgr.writeJson(fileMgr.accountsPath, accounts);
    return true;
  } catch (error) {
    logger.error('failed to remove account:', error);
    return false;
  }
});

ipcMain.answerRenderer(IPC_EVENTS.LAUNCH_GAME, async (account) => {
  logger.info(`launching game for: ${account.username}`);
  await createGame(account);
});

import { ipcMain } from 'electron/main';
import { IPC_EVENTS } from '../../common/ipc-events';
import { FileManager } from '../FileManager';
import { createGame } from '../windows';

const fileMgr = FileManager.getInstance();

ipcMain.handle(IPC_EVENTS.GET_ACCOUNTS, async () => {
	try {
		return await fileMgr.readJson<Account[]>(fileMgr.accountsPath);
	} catch (error) {
		console.log(
			'An error occurred while reading accounts.json (1):',
			error,
		);
		return [];
	}
});

ipcMain.handle(IPC_EVENTS.ADD_ACCOUNT, async (_, account: Account) => {
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

ipcMain.handle(IPC_EVENTS.REMOVE_ACCOUNT, async (_, username: string) => {
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
		console.error('Failed to remove account:', error);
		return false;
	}
});

ipcMain.handle(
	IPC_EVENTS.LAUNCH_GAME,
	async (_, account: AccountWithServer) => {
		console.log('Launching game for:', account.username);
		await createGame(account);
	},
);

type AccountWithServer = Account & { server: string };

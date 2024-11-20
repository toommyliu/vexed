import { ipcMain } from 'electron';
import { FileManager } from '../FileManager';
import { createGame } from '../windows';

const fileMgr = FileManager.getInstance();

ipcMain.handle('manager:get_accounts', async () => {
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

ipcMain.handle('manager:add_account', async (_, account: Account) => {});

ipcMain.handle('manager:remove_account', async (_, username: string) => {
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
	'manager:launch_game',
	async (ev, account: AccountWithServer) => {
		console.log('launching game window for', account);
		await createGame(account);
		ev.sender.send('manager:enable_button', account.username);
	},
);

type AccountWithServer = Account & { server: string };

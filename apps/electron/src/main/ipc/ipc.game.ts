import { ipcMain } from 'electron/main';
import { mgrWindow } from '../windows';

ipcMain.on('root:login_success', async (_, username: string) => {
	if (!mgrWindow) {
		return;
	}

	console.log(`${username} successfully logged in`);

	mgrWindow.webContents.send('manager:enable_button', username);
});

import { ipcMain } from 'electron';

ipcMain.on('root:login_success', async (_, username: string) => {
	console.log(`${username} successfully logged in`);
});

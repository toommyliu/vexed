const { ipcMain, app, BrowserWindow, dialog } = require('electron');
const { join } = require('path');
const fs = require('fs-extra');

const ROOT = join(app.getPath('documents'), 'Vexed');

ipcMain.handle('root:get_documents_path', async () => {
	return ROOT;
});

//#region scripts
ipcMain.handle('root:load_script', async (ev) => {
	const window = BrowserWindow.fromWebContents(ev.sender);

	const res = await dialog
		.showOpenDialog(window, {
			filters: [{ name: 'JavaScript Files', extensions: ['js'] }],
			properties: ['openFile'],
			defaultPath: join(ROOT, 'Scripts'),
		})
		.catch(() => null);

	if (!dialog || res.canceled) {
		return null;
	}

	const scriptPath = res.filePaths[0];
	const scriptBody = await fs.readFile(scriptPath, 'utf8').catch(() => null);

	if (!scriptBody?.toString()) {
		return null;
	}

	return Buffer.from(scriptBody, 'utf-8').toString('base64');
});

ipcMain.on('root:toggle-dev-tools', async (ev) => {
	ev.sender.toggleDevTools();
});
//#endregion

ipcMain.on('packets:save', async (_, data) => {
	const path = join(ROOT, 'packets.txt');
	try {
		await fs.writeFile(path, data.join('\n'), {
			encoding: 'utf-8',
		});
	} catch (error) {
		// TODO: make this dialog reusable
		console.log('Failed to write packets to file', error.stack);
		dialog.showErrorBox('Failed to write packets to file', error.stack);
	}
});

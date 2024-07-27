const { ipcMain, app, dialog } = require('electron');
const { join } = require('path');
const fs = require('fs-extra');

const ROOT = join(app.getPath('documents'), 'Vexed');

ipcMain.handle('root:get_documents_path', async () => {
	return ROOT;
});

ipcMain.on('packets:save', async (_, data) => {
	const path = join(ROOT, 'packets.txt');
	try {
		await fs.writeFile(path, data.join('\n'), {
			encoding: 'utf-8',
		});
	} catch (error) {
		// TODO: make this dialog a util
		console.log('Failed to write packets to file', error.stack);
		dialog.showErrorBox('Failed to write packets to file', error.stack);
	}
});

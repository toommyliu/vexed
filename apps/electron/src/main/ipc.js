const { ipcMain, app } = require('electron');
const { join } = require('path');

ipcMain.handle('root:get_documents_path', async () => {
	return join(app.getPath('documents'), 'Vexed');
});

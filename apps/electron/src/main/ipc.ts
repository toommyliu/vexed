import { join } from 'path';
import { ipcMain, app, BrowserWindow, dialog } from 'electron';
import fs from 'fs-extra';
import { showErrorDialog, type ErrorDialogOptions } from './utils';

const ROOT = join(app.getPath('documents'), 'Vexed');

ipcMain.handle('root:get_documents_path', async () => ROOT);

// #region scripts
ipcMain.handle('root:load_script', async (ev) => {
	const window = BrowserWindow.fromWebContents(ev.sender);
	if (window) {
		const res = await dialog
			.showOpenDialog(window, {
				filters: [{ name: 'JavaScript Files', extensions: ['js'] }],
				properties: ['openFile'],
				defaultPath: join(ROOT, 'Scripts'),
			})
			.catch(() => null);

		if (!dialog || res?.canceled) {
			return null;
		}

		const scriptPath = res!.filePaths[0]!;
		const scriptBody = await fs
			.readFile(scriptPath, 'utf8')
			.catch(() => null);

		if (!scriptBody) {
			return null;
		}

		return Buffer.from(scriptBody, 'utf8').toString('base64');
	}

	return null;
});

ipcMain.on('root:toggle-dev-tools', async (ev) => {
	ev.sender.toggleDevTools();
});
// #endregion

ipcMain.on('tools:loadergrabber:export', async (_, data) => {
	const path = join(ROOT, 'grabber.json');
	try {
		await fs.ensureFile(path);
		await fs.writeFile(path, JSON.stringify(data, null, 2), {
			encoding: 'utf8',
		});
		throw new Error('hello world');
	} catch (error) {
		const err = error as Error;
		showErrorDialog(
			{ message: 'Failed to export grabber data', error: err },
			false,
		);
	}
});

ipcMain.on('packets:save', async (_, data) => {
	const path = join(ROOT, 'packets.txt');
	try {
		await fs.ensureFile(path);
		await fs.writeFile(path, data.join('\n'), {
			encoding: 'utf8',
		});
	} catch (error) {
		const err = error as Error;
		showErrorDialog(
			{ message: 'Failed to write packets to file', error: err },
			false,
		);
	}
});

ipcMain.on(
	'root:show_error_dialog',
	async (_, error: ErrorDialogOptions, quit = false) => {
		showErrorDialog(error, quit);
	},
);

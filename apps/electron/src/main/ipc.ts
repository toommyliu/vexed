import { join } from 'path';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs-extra';
import { DOCUMENTS_PATH } from '../common/constants';
import { IPC_EVENTS } from '../common/ipc-events';
import { showErrorDialog, type ErrorDialogOptions } from './utils';

ipcMain.handle(IPC_EVENTS.GET_DOCUMENTS_PATH, () => DOCUMENTS_PATH);

// #region scripts
ipcMain.handle(IPC_EVENTS.LOAD_SCRIPT, async (ev) => {
	const window = BrowserWindow.fromWebContents(ev.sender);
	if (window) {
		const res = await dialog
			.showOpenDialog(window, {
				filters: [{ name: 'JavaScript Files', extensions: ['js'] }],
				properties: ['openFile'],
				defaultPath: join(DOCUMENTS_PATH, 'Scripts'),
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

ipcMain.on(IPC_EVENTS.TOGGLE_DEV_TOOLS, async (ev) => {
	ev.sender.toggleDevTools();
});
// #endregion

// ipcMain.on('tools:loadergrabber:export', async (_, data) => {
// 	try {
// 		const dialogPath = await dialog
// 			.showSaveDialog({
// 				defaultPath: join(DOCUMENTS_PATH, 'grabber.json'),
// 				filters: [{ name: 'JSON', extensions: ['json'] }],
// 			})
// 			.catch(() => null);

// 		if (!dialogPath || dialogPath.canceled) {
// 			return;
// 		}

// 		const { filePath } = dialogPath;

// 		await fs.ensureFile(filePath!);
// 		await fs.writeFile(filePath!, JSON.stringify(data, null, 2), {
// 			encoding: 'utf8',
// 		});
// 	} catch (error) {
// 		const err = error as Error;
// 		showErrorDialog(
// 			{ message: 'Failed to export grabber data.', error: err },
// 			false,
// 		);
// 	}
// });

// ipcMain.on('packets:save', async (_, data) => {
// 	const path = join(DOCUMENTS_PATH, 'packets.txt');
// 	try {
// 		await fs.ensureFile(path);
// 		await fs.writeFile(path, data.join('\n'), {
// 			encoding: 'utf8',
// 		});
// 	} catch (error) {
// 		const err = error as Error;
// 		showErrorDialog(
// 			{ message: 'Failed to write packets to file', error: err },
// 			false,
// 		);
// 	}
// });

ipcMain.on(
	'root:show_error_dialog',
	async (_, error: ErrorDialogOptions, quit = false) => {
		showErrorDialog(error, quit);
	},
);

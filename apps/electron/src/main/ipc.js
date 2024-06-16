const { app, ipcMain: ipc, BrowserWindow, dialog } = require('electron');
const { createGame, assignWindowID, getGameWindow } = require('./windows');
const { nanoid } = require('nanoid');

const fs = require('fs-extra');
const { join } = require('path');

const ROOT = join(app.getPath('documents'), 'Vexed');

ipc.handle('manager:get_path', function (event) {
	return ROOT;
});

ipc.handle('manager:launch_game', async function (event, launchOptions) {
	await createGame(launchOptions);
});

ipc.on('game:generate_id', function (event) {
	const window = BrowserWindow.fromWebContents(event.sender);
	const windowID = nanoid();
	assignWindowID(window, windowID);
});

ipc.handle('game:load_script', async function (event, windowID) {
	const scriptsWindow = BrowserWindow.fromWebContents(event.sender);
	const gameWindow = getGameWindow(windowID);

	if (!gameWindow) {
		return;
	}

	const dialog_ = await dialog
		.showOpenDialog(scriptsWindow, {
			filters: [{ name: 'JavaScript Files', extensions: ['js'] }],
			properties: ['openFile'],
			defaultPath: join(ROOT, 'Scripts'),
		})
		.catch(() => null);

	if (!dialog || dialog_.canceled) {
		return null;
	}

	const scriptPath = dialog_.filePaths[0];
	const scriptBody = await fs.readFile(scriptPath, 'utf8').catch(() => null);

	if (!scriptBody?.toString()) {
		return null;
	}

	const escapedScriptBody = scriptBody
		.replace(/\\/g, '\\\\')
		.replace(/`/g, '\\`')
		.replace(/\$/g, '\\$')
		.replace(/\r?\n/g, '\\n');

	gameWindow.webContents.executeJavaScript(`
		document.getElementById('loaded-script')?.remove();
		var script = document.createElement('script');
		script.id = 'loaded-script';
		script.textContent = \`(async () => {
			console.log("script started", new Date());
			${escapedScriptBody}
			console.log("script finished", new Date());
		})();\`;
		document.body.appendChild(script);
	`);
});

ipc.on('packets:save', async function (event, packets) {
	try {
		await fs.writeFile(join(ROOT, 'packets.txt'), packets.join('\n'), {
			encoding: 'utf-8',
		});
	} catch {
		dialog.showErrorBox('error', 'failed to write packets to file.');
	}
});

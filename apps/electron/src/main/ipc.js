const { ipcMain, app, BrowserWindow, dialog } = require('electron');
const { join } = require('path');
const fs = require('fs-extra');
const { getWindows } = require('./windows');

const RENDERER = join(__dirname, '../renderer');
const ROOT = join(app.getPath('documents'), 'Vexed');

ipcMain.handle('root:get_documents_path', async () => {
	return ROOT;
});

//#region window management
ipcMain.on('root:create_or_focus_window', async (ev, id) => {
	const window = BrowserWindow.fromWebContents(ev.sender);
	const windows = getWindows(window.id);

	if (!windows) {
		console.log('Parent store not found');
		return;
	}

	/**
	 * @type {Electron.BrowserWindow|null}
	 */
	let wnd = null;
	let path = null;
	let w, h;

	switch (id) {
		case 'tools:fast-travels':
			wnd = windows.tools.fastTravels;
			path = join(RENDERER, 'game/pages/tools/fast-travels/index.html');
			w = 510;
			h = 494;
			break;
		case 'tools:loader-grabber':
			wnd = windows.tools.loaderGrabber;
			path = join(RENDERER, 'game/pages/tools/loader-grabber/index.html');
			w = 427;
			h = 582;
			break;
		case 'tools:follower':
			wnd = windows.tools.follower;
			path = join(RENDERER, 'game/pages/tools/follower/index.html');
			w = 402;
			h = 466;
			break;
		case 'packets:logger':
			wnd = windows.packets.logger;
			path = join(RENDERER, 'game/pages/packets/logger/index.html');
			w = 605;
			h = 286;
			break;
		case 'packets:spammer':
			wnd = windows.packets.spammer;
			path = join(RENDERER, 'game/pages/packets/spammer/index.html');
			w = 496;
			h = 170;
			break;
	}

	// Restore the previously created window
	if (wnd && !wnd.isDestroyed()) {
		wnd.show();
		wnd.focus();
		return;
	}

	// Create it
	const newWindow = new BrowserWindow({
		title: '',
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
		},
		// Moving the parent also moves the child, as well as minimizing it
		parent: window,
		width: w,
		height: h,
	});
	newWindow.on('close', (ev) => {
		ev.preventDefault();
		newWindow.hide();
	});

	await newWindow.loadFile(path);

	switch (id) {
		//#region tools
		case 'tools:fast-travels':
			windows.tools.fastTravels = newWindow;
			break;
		case 'tools:loader-grabber':
			windows.tools.loaderGrabber = newWindow;
			break;
		case 'tools:follower':
			windows.tools.follower = newWindow;
			break;
		//#endregion
		//#region packets
		case 'packets:logger':
			windows.packets.logger = newWindow;
			break;
		case 'packets:spammer':
			windows.packets.spammer = newWindow;
			break;
		//#endregion
	}
});
ipcMain.on('root:window_postmessage', async (ev, id, args) => {
	const window = BrowserWindow.fromWebContents(ev.sender);
	const windows = getWindows(window.id);

	if (!windows) {
		console.log('Parent store not found');
		return;
	}

	let wnd = null;
	switch (id) {
		case 'tools:fast-travels':
			wnd = windows.tools.fastTravels;
			break;
		case 'tools:loader-grabber':
			wnd = windows.tools.loaderGrabber;
			break;
		case 'tools:follower':
			wnd = windows.tools.follower;
			break;
		case 'packets:logger':
			wnd = windows.packets.logger;
			break;
		case 'packets:spammer':
			wnd = windows.packets.spammer;
			break;
	}

	if (wnd) {
		wnd.webContents.send('root:window_postmessage', args);
	}
});
//#endregion

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

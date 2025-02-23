import { join } from 'path';
import {
	app,
	BrowserWindow,
	ipcMain,
	dialog,
	type IpcMainEvent,
} from 'electron/main';
import { readFile } from 'fs-extra';
import { WINDOW_IDS } from '../../common/constants';
import { IPC_EVENTS } from '../../common/ipc-events';
import { FileManager } from '../FileManager';
import { applySecurity } from '../util/applySecurity';
import { mgrWindow, store } from '../windows';

const fm = FileManager.getInstance();

const PUBLIC = join(__dirname, '../../../public');

ipcMain.on(IPC_EVENTS.LOGIN_SUCCESS, async (_, username: string) => {
	if (!mgrWindow) {
		return;
	}

	console.log(`${username} successfully logged in`);

	mgrWindow.webContents.send('manager:enable_button', username);
});

ipcMain.on(
	IPC_EVENTS.ACTIVATE_WINDOW,
	async (ev: IpcMainEvent, windowId: string) => {
		const sender = BrowserWindow.fromWebContents(ev.sender);
		if (!sender || !windowId) {
			return false;
		}

		const windows = store.get(sender.id);
		if (!windows) {
			console.log(`${sender.id} was not found in store?`);
			return false;
		}

		let ref: BrowserWindow | null = null;
		let path: string | null = null;
		let width: number;
		let height: number;

		switch (windowId) {
			case WINDOW_IDS.FAST_TRAVELS:
				ref = windows.tools.fastTravels;
				path = join(PUBLIC, 'game/tools/fast-travels/index.html');
				width = 510;
				height = 494;
				break;
			case WINDOW_IDS.LOADER_GRABBER:
				ref = windows.tools.loaderGrabber;
				path = join(PUBLIC, 'game/tools/loader-grabber/index.html');
				width = 478;
				height = 689;
				break;
			case WINDOW_IDS.FOLLOWER:
				ref = windows.tools.follower;
				path = join(PUBLIC, 'game/tools/follower/index.html');
				width = 402;
				height = 499;
				break;
			case WINDOW_IDS.PACKETS_LOGGER:
				ref = windows.packets.logger;
				path = join(PUBLIC, 'game/packets/logger/index.html');
				width = 560;
				height = 286;
				break;
			case WINDOW_IDS.PACKETS_SPAMMER:
				ref = windows.packets.spammer;
				path = join(PUBLIC, 'game/packets/spammer/index.html');
				width = 596;
				height = 325;
				break;
		}

		// Restore the previously created window
		if (ref && !ref?.isDestroyed()) {
			console.log(`Restoring window for ${windowId}.`);
			ref.show();
			ref.focus();
			return true;
		}

		console.log(`Creating new window for ${windowId}.`);

		// Create it
		const window = new BrowserWindow({
			title: '',
			webPreferences: {
				contextIsolation: false,
				nodeIntegration: true,
			},
			// Parent is required in order to maintain parent-child relationships and for ipc calls
			// Moving the parent also moves the child, as well as minimizing it
			parent: sender,
			width: width!,
			minWidth: width!,
			minHeight: height!,
			height: height!,
			// When a child window is minimized, the parent window is also minimized,
			// which is not desired. See https://github.com/electron/electron/issues/26031
			minimizable: false,
		});

		// Update the store immediately, to ensure window can get its string id ASAP through IPC
		switch (windowId) {
			case WINDOW_IDS.FAST_TRAVELS:
				windows.tools.fastTravels = window;
				break;
			case WINDOW_IDS.LOADER_GRABBER:
				windows.tools.loaderGrabber = window;
				break;
			case WINDOW_IDS.FOLLOWER:
				windows.tools.follower = window;
				break;
			case WINDOW_IDS.PACKETS_LOGGER:
				windows.packets.logger = window;
				break;
			case WINDOW_IDS.PACKETS_SPAMMER:
				windows.packets.spammer = window;
				break;
		}

		if (!app.isPackaged) {
			window.webContents.openDevTools({ mode: 'right' });
		}

		applySecurity(window);

		// don't close the window, just hide it
		window.on('close', (ev) => {
			ev.preventDefault();
			window.hide();
		});

		// child forwarded a message to main
		window.webContents.on('ipc-message', (_ev, channel, args) => {
			console.log(
				`[child:ipc-message] ${channel} : ${JSON.stringify(args)}`,
			);
			// forward the message back to the game window
			windows?.game?.webContents?.send(channel, args);
		});

		await window.loadFile(path!);
		return true;
	},
);

ipcMain.on(IPC_EVENTS.LOAD_SCRIPT, async (ev) => {
	const browserWindow = BrowserWindow.fromWebContents(ev.sender);
	if (!browserWindow) return;

	try {
		const res = await dialog.showOpenDialog(browserWindow, {
			defaultPath: join(fm.basePath, 'Bots'),
			properties: ['openFile'],
			filters: [{ name: 'Bots', extensions: ['js'] }],
			message: 'Select a script to load',
			title: 'Select a script to load',
		});

		if (res.canceled || !res.filePaths[0]) return;

		const file = res.filePaths[0]!;
		const content = await readFile(file, 'utf8');

		await browserWindow.webContents
			.executeJavaScript(content)
			.then(() => {
				browserWindow.webContents.send(IPC_EVENTS.SCRIPT_LOADED);
			})
			.catch(async () => {
				// some commands might have loaded before the error, clear them
				await browserWindow.webContents.executeJavaScript(
					'window.context._commands = []',
				);

				await dialog.showMessageBox(browserWindow, {
					message:
						'An error occured while trying to load the script.\n\nAre you missing any arguments?',
					title: 'Error',
				});
			});
	} catch {}
});

ipcMain.handle(IPC_EVENTS.READ_FAST_TRAVELS, async () => {
	try {
		return await fm.readJson(fm.fastTravelsPath);
	} catch {
		return fm.defaultFastTravels;
	}
});

ipcMain.on(IPC_EVENTS.TOGGLE_DEV_TOOLS, (ev) => {
	try {
		if (!ev.sender?.isDestroyed()) ev.sender.toggleDevTools();
	} catch {}
});

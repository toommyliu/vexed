import { join } from 'path';
import {
	app,
	BrowserWindow,
	dialog,
	ipcMain,
	type IpcMainEvent,
	type IpcMainInvokeEvent,
} from 'electron/main';
import fs from 'fs-extra';
import { WINDOW_IDS, DOCUMENTS_PATH } from '../../common/constants';
import { IPC_EVENTS } from '../../common/ipc-events';
import { FileManager } from '../FileManager';
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
				width = 363;
				height = 542;
				break;
			case WINDOW_IDS.FOLLOWER:
				ref = windows.tools.follower;
				path = join(PUBLIC, 'game/tools/follower/index.html');
				width = 402;
				height = 466;
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
		const newWindow = new BrowserWindow({
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
		});

		// Update the store immediately, to ensure window can get its string id ASAP through IPC
		switch (windowId) {
			case WINDOW_IDS.FAST_TRAVELS:
				windows.tools.fastTravels = newWindow;
				break;
			case WINDOW_IDS.LOADER_GRABBER:
				windows.tools.loaderGrabber = newWindow;
				break;
			case WINDOW_IDS.FOLLOWER:
				windows.tools.follower = newWindow;
				break;
			case WINDOW_IDS.PACKETS_LOGGER:
				windows.packets.logger = newWindow;
				break;
			case WINDOW_IDS.PACKETS_SPAMMER:
				windows.packets.spammer = newWindow;
				break;
		}

		if (!app.isPackaged) {
			newWindow.webContents.openDevTools({ mode: 'right' });
		}

		// Don't close the window, just hide it to be reused later
		newWindow.on('close', (ev) => {
			ev.preventDefault();
			newWindow.hide();
		});

		await newWindow.loadFile(path!);

		return true;
	},
);

ipcMain.handle(IPC_EVENTS.READ_FAST_TRAVELS, async () => {
	try {
		return await fm.readJson(fm.fastTravelsPath);
	} catch {
		return fm.defaultFastTravels;
	}
});

ipcMain.on(IPC_EVENTS.SETUP_IPC, (ev: IpcMainEvent, windowId: string) => {
	const sender = BrowserWindow.fromWebContents(ev.sender);
	const parent = sender?.getParentWindow();

	if (!sender || !parent || !windowId) {
		return;
	}

	console.log(`Setting up ipc for ${windowId}.`);

	parent.webContents.postMessage(IPC_EVENTS.SETUP_IPC, windowId, [
		ev.ports[0]!,
	]);
});

ipcMain.handle(IPC_EVENTS.GET_WINDOW_ID, (ev: IpcMainInvokeEvent) => {
	const sender = BrowserWindow.fromWebContents(ev.sender);
	const parent = sender?.getParentWindow();

	if (!sender || !parent) {
		return null;
	}

	const windows = store.get(parent.id);

	if (sender.id === windows?.tools.fastTravels?.id) {
		return WINDOW_IDS.FAST_TRAVELS;
	} else if (sender.id === windows?.tools.loaderGrabber?.id) {
		return WINDOW_IDS.LOADER_GRABBER;
	} else if (sender.id === windows?.tools.follower?.id) {
		return WINDOW_IDS.FOLLOWER;
	} else if (sender.id === windows?.packets.logger?.id) {
		return WINDOW_IDS.PACKETS_LOGGER;
	} else if (sender.id === windows?.packets.spammer?.id) {
		return WINDOW_IDS.PACKETS_SPAMMER;
	}

	return null;
});

ipcMain.handle(IPC_EVENTS.LOAD_SCRIPT, async (ev) => {
	const window = BrowserWindow.fromWebContents(ev.sender);
	if (window && !window?.isDestroyed()) {
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

ipcMain.on(IPC_EVENTS.TOGGLE_DEV_TOOLS, (ev) => {
	try {
		if (!ev.sender?.isDestroyed()) ev.sender.toggleDevTools();
	} catch {}
});

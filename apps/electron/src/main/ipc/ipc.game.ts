import { join } from 'path';
import { BrowserWindow, ipcMain, type IpcMainEvent } from 'electron/main';
import { IPC_EVENTS } from '../../common/ipc-events';
import { mgrWindow, store } from '../windows';

const PUBLIC = join(__dirname, '../../../public');

ipcMain.on(IPC_EVENTS.LOGIN_SUCCESS, async (_, username: string) => {
	if (!mgrWindow) {
		return;
	}

	console.log(`${username} successfully logged in`);

	mgrWindow.webContents.send('manager:enable_button', username);
});

ipcMain.on(IPC_EVENTS.ACTIVATE_WINDOW, async (ev: IpcMainEvent, id: string) => {
	const sender = BrowserWindow.fromWebContents(ev.sender);
	if (!sender || !id) {
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

	switch (id) {
		case 'tools:fast-travels':
			ref = windows.tools.fastTravels;
			path = join(PUBLIC, 'game/packets/logger/index.html');
			width = 510;
			height = 494;
			break;
		case 'tools:loader-grabber':
			ref = windows.tools.loaderGrabber;
			path = join(PUBLIC, 'game/tools/loader-grabber/index.html');
			width = 427;
			height = 582;
			break;
		case 'tools:follower':
			ref = windows.tools.follower;
			path = join(PUBLIC, 'game/tools/follower/index.html');
			width = 402;
			height = 466;
			break;
		case 'packets:logger':
			ref = windows.packets.logger;
			path = join(PUBLIC, 'game/packets/logger/index.html');
			width = 605;
			height = 286;
			break;
		case 'packets:spammer':
			ref = windows.packets.spammer;
			path = join(PUBLIC, 'game/packets/spammer/index.html');
			width = 496;
			height = 170;
			break;
	}

	// Restore the previously created window
	if (ref && !ref?.isDestroyed()) {
		ref.show();
		ref.focus();
		return true;
	}

	// Create it
	const newWindow = new BrowserWindow({
		title: '',
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
		},
		// Moving the parent also moves the child, as well as minimizing it
		parent: sender,
		width: width!,
		minWidth: width!,
		minHeight: height!,
		height: height!,
	});

	// Don't close the window, just hide it to be reused later
	newWindow.on('close', (ev) => {
		ev.preventDefault();
		newWindow.hide();
	});

	await newWindow.loadFile(path!);

	// Update the store
	switch (id) {
		case 'tools:fast-travels':
			windows.tools.fastTravels = newWindow;
			break;
		case 'tools:loader-grabber':
			windows.tools.loaderGrabber = newWindow;
			break;
		case 'tools:follower':
			windows.tools.follower = newWindow;
			break;
		case 'packets:logger':
			windows.packets.logger = newWindow;
			break;
		case 'packets:spammer':
			windows.packets.spammer = newWindow;
			break;
	}

	return true;
});

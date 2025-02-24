import { join, resolve } from 'path';
import { app, BrowserWindow, session } from 'electron';
import { ARTIX_USERAGENT, BRAND } from '../common/constants';
import { IPC_EVENTS } from '../common/ipc-events';
import type { Account } from '../common/types';
import { applySecurity } from './util/applySecurity';

const PUBLIC = join(__dirname, '../../public/');
const PUBLIC_GAME = join(PUBLIC, 'game/');
const PUBLIC_MANAGER = join(PUBLIC, 'manager/');

export const store: WindowStore = new Map();

// eslint-disable-next-line import-x/no-mutable-exports
export let mgrWindow: BrowserWindow | null;

export async function createAccountManager(): Promise<void> {
	if (mgrWindow) {
		mgrWindow.show();
		mgrWindow.focus();
		return;
	}

	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: BRAND,
		webPreferences: {
			nodeIntegration: true,
		},
	});
	window.on('close', (ev) => {
		ev.preventDefault();
		window.hide();
	});

	window.webContents.userAgent = ARTIX_USERAGENT;
	session.defaultSession.webRequest.onBeforeSendHeaders((details, fn) => {
		details.requestHeaders['User-Agent'] = ARTIX_USERAGENT;
		details.requestHeaders['artixmode'] = 'launcher';
		details.requestHeaders['x-requested-with'] =
			'ShockwaveFlash/32.0.0.371';
		fn({ requestHeaders: details.requestHeaders, cancel: false });
	});

	mgrWindow = window;

	await window.loadURL(`file://${resolve(PUBLIC_MANAGER, 'index.html')}`);

	if (!app.isPackaged) {
		window.webContents.openDevTools({ mode: 'right' });
	}
}

export async function createGame(
	account: AccountWithServer | null = null,
): Promise<void> {
	const args: string[] = [];
	if (account?.username) {
		args.push(`--username=${account.username}`);
	}

	if (account?.password) {
		args.push(`--password=${account.password}`);
	}

	if (account?.server) {
		args.push(`--server=${account.server}`);
	}

	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: BRAND,
		webPreferences: {
			backgroundThrottling: false,
			nodeIntegration: true,
			plugins: true,
			additionalArguments: args,
			// disable unuseful features
			enableWebSQL: false,
			spellcheck: false,
			webgl: false,
		},
	});

	await window.loadURL(`file://${resolve(PUBLIC_GAME, 'index.html')}`);
	applySecurity(window);

	if (!app.isPackaged) {
		window.webContents.openDevTools({ mode: 'right' });
	}

	if (account) {
		window.webContents.send(IPC_EVENTS.LOGIN, account);
	}

	window.on('close', () => {
		const windows = store.get(window.id);
		if (windows) {
			for (const child of Object.values(windows.tools)) {
				if (child && !child.isDestroyed()) {
					child.destroy();
				}
			}

			for (const child of Object.values(windows.packets)) {
				if (child && !child.isDestroyed()) {
					child.destroy();
				}
			}
		}
	});

	store.set(window.id, {
		game: window,
		tools: { fastTravels: null, loaderGrabber: null, follower: null },
		packets: { logger: null, spammer: null },
	});
}

type WindowStore = Map<
	number,
	{
		game: Electron.BrowserWindow;
		packets: {
			logger: Electron.BrowserWindow | null;
			spammer: Electron.BrowserWindow | null;
		};
		tools: {
			fastTravels: Electron.BrowserWindow | null;
			follower: Electron.BrowserWindow | null;
			loaderGrabber: Electron.BrowserWindow | null;
		};
	}
>;

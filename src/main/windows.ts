import { join, resolve } from 'path';
import { app, BrowserWindow, session } from 'electron';
import {
	ARTIX_USERAGENT,
	BRAND,
	WHITELISTED_DOMAINS,
} from '../common/constants';
import { IPC_EVENTS } from '../common/ipc-events';
import type { Account } from '../common/types';

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
	session.defaultSession.webRequest.onBeforeSendHeaders(
		// eslint-disable-next-line promise/prefer-await-to-callbacks
		(details, callback) => {
			details.requestHeaders['User-Agent'] = ARTIX_USERAGENT;
			details.requestHeaders['artixmode'] = 'launcher';
			details.requestHeaders['x-requested-with'] =
				'ShockwaveFlash/32.0.0.371';
			// eslint-disable-next-line promise/prefer-await-to-callbacks
			callback({ requestHeaders: details.requestHeaders, cancel: false });
		},
	);

	mgrWindow = window;

	await window.loadURL(`file://${resolve(PUBLIC_MANAGER, 'index.html')}`);

	if (!app.isPackaged) {
		window.webContents.openDevTools({ mode: 'right' });
	}
}

export async function createGame(
	account: Account | null = null,
): Promise<void> {
	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: BRAND,
		webPreferences: {
			backgroundThrottling: false,
			enableWebSQL: false,
			webgl: false,
			nodeIntegration: true,
			plugins: true,
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

function applySecurity(window: BrowserWindow): void {
	window.webContents.userAgent = ARTIX_USERAGENT;
	session.defaultSession.webRequest.onBeforeSendHeaders(
		// eslint-disable-next-line promise/prefer-await-to-callbacks
		(details, callback) => {
			details.requestHeaders['User-Agent'] = ARTIX_USERAGENT;
			details.requestHeaders['artixmode'] = 'launcher';
			details.requestHeaders['x-requested-with'] =
				'ShockwaveFlash/32.0.0.371';
			// eslint-disable-next-line promise/prefer-await-to-callbacks
			callback({ requestHeaders: details.requestHeaders, cancel: false });
		},
	);

	window.webContents.on('will-navigate', (ev, url) => {
		const parsedUrl = new URL(url);
		if (!WHITELISTED_DOMAINS.includes(parsedUrl.hostname)) {
			console.log(`[will-navigate] blocking url: ${url}`);
			ev.preventDefault();
		}
	});

	window.webContents.on('will-redirect', (ev, url) => {
		const parsedUrl = new URL(url);
		if (!WHITELISTED_DOMAINS.includes(parsedUrl.hostname)) {
			console.log(`[will-redirect] blocking url: ${url}`);
			ev.preventDefault();
		}
	});

	window.webContents.on(
		'new-window',
		async (
			ev,
			url,
			_frameName,
			_disposition,
			_options,
			_additionalFeatures,
			_referrer,
		) => {
			const parsedUrl = new URL(url);

			if (
				parsedUrl.hostname === 'www.facebook.com' &&
				parsedUrl.searchParams.get('redirect_uri') ===
					'https://game.aq.com/game/AQWFB.html'
			) {
				return;
			}

			if (!WHITELISTED_DOMAINS.includes(parsedUrl.hostname)) {
				console.log(`[new-window] blocking url: ${url}`);
				ev.preventDefault();
				return null;
			}

			ev.preventDefault();

			const childWindow = new BrowserWindow({
				title: '',
				parent: window,
				webPreferences: {
					nodeIntegration: false, // some sites might use jquery, which conflict with nodeIntegration
					plugins: true,
				},
			});

			applySecurity(childWindow);

			ev.newGuest = childWindow;
			await childWindow.loadURL(url);
			return childWindow;
		},
	);
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

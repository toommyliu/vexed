import { join, resolve } from 'path';
import { app, BrowserWindow, session } from 'electron';
import { ARTIX_USERAGENT, WHITELISTED_DOMAINS } from '../common/constants';
import { IPC_EVENTS } from '../common/ipc-events';
import type { Account } from './FileManager';
import { showErrorDialog } from './utils';

const PUBLIC = join(__dirname, '../../public/');
const PUBLIC_GAME = join(PUBLIC, 'game/');
const PUBLIC_MANAGER = join(PUBLIC, 'manager/');

export const store: WindowStore = new Map();

// eslint-disable-next-line import-x/no-mutable-exports
export let mgrWindow: BrowserWindow | null;

export async function createAccountManager(): Promise<void> {
	if (mgrWindow) {
		mgrWindow.focus();
		return;
	}

	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: '',
		webPreferences: {
			nodeIntegration: true,
		},
	});

	// Spoof headers to make the game think we are running as Artix Game Launcher
	window.webContents.userAgent = ARTIX_USERAGENT;
	session.defaultSession.webRequest.onBeforeSendHeaders(
		// eslint-disable-next-line promise/prefer-await-to-callbacks
		(details, callback) => {
			details.requestHeaders['User-Agent'] = ARTIX_USERAGENT;
			details.requestHeaders['artixmode'] = 'launcher';
			details.requestHeaders['x-requested-with'] =
				'ShockwaveFlash/32.0.0.371';
			details.requestHeaders['origin'] = 'https://game.aq.com';
			details.requestHeaders['sec-fetch-site'] = 'same-origin';
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
		title: '',
		webPreferences: {
			backgroundThrottling: false,
			nodeIntegration: true,
			plugins: true,
		},
	});
	app.allowRendererProcessReuse = true;

	// Spoof headers to make the game think we are running as Artix Game Launcher
	window.webContents.userAgent = ARTIX_USERAGENT;
	session.defaultSession.webRequest.onBeforeSendHeaders(
		// eslint-disable-next-line promise/prefer-await-to-callbacks
		(details, callback) => {
			details.requestHeaders['User-Agent'] = ARTIX_USERAGENT;
			details.requestHeaders['artixmode'] = 'launcher';
			// The rest of these are probably redundant
			details.requestHeaders['x-requested-with'] =
				'ShockwaveFlash/32.0.0.371';
			details.requestHeaders['origin'] = 'https://game.aq.com';
			details.requestHeaders['sec-fetch-site'] = 'same-origin';
			// eslint-disable-next-line promise/prefer-await-to-callbacks
			callback({ requestHeaders: details.requestHeaders, cancel: false });
		},
	);

	await window.loadURL(`file://${resolve(PUBLIC_GAME, 'index.html')}`);
	if (!app.isPackaged) {
		window.webContents.openDevTools({ mode: 'right' });
	}

	if (account) {
		window.webContents.send(IPC_EVENTS.LOGIN, account);
	}

	window.on('close', () => {
		const windows = store.get(window.id);
		if (!windows) {
			showErrorDialog({ message: 'Failed to find store (1).' }, true);
			return;
		}

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
			const _url = new URL(url);

			if (_url.protocol === 'https:' || _url.protocol === 'http:') {
				if (!WHITELISTED_DOMAINS.includes(_url.hostname)) {
					if (
						_url.hostname === 'www.facebook.com' &&
						_url.searchParams.get('redirect_uri') ===
							'https://game.aq.com/game/AQWFB.html'
					) {
						return;
					}

					console.log('Blocking url (1)', _url);
					ev.preventDefault();
					// This doesn't seem to be needed, anymore?
					// ev.newGuest = null;
					return null;
				}

				ev.preventDefault();

				const newWindow = new BrowserWindow({
					title: '',
					webPreferences: {
						nodeIntegration: false,
						plugins: true,
					},
					parent: window,
				});

				ev.newGuest = newWindow;

				newWindow.webContents.on('will-navigate', (event, url) => {
					if (
						!WHITELISTED_DOMAINS.some((domain) =>
							url.includes(domain),
						)
					) {
						event.preventDefault();
						console.log('Blocking url (2)', url);
					}
				});

				await newWindow.webContents.loadURL(_url.toString());

				return newWindow;
			} else {
				ev.preventDefault();
				return null;
			}
		},
	);
	// window.maximize();

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

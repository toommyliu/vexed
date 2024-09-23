import { join, resolve } from 'path';
import { app, BrowserWindow, session } from 'electron';
import { showErrorDialog } from './utils';

const RENDERER = join(__dirname, '../renderer');

const store: WindowStore = new Map();

const userAgent =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36';

async function createGame(account: Account | null = null): Promise<void> {
	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: '',
		webPreferences: {
			nodeIntegration: true,
			plugins: true,
		},
	});

	window.webContents.userAgent = userAgent;
	session.defaultSession.webRequest.onBeforeSendHeaders(
		// eslint-disable-next-line promise/prefer-await-to-callbacks
		(details, callback) => {
			details.requestHeaders['User-Agent'] = userAgent;
			details.requestHeaders['artixmode'] = 'launcher';
			details.requestHeaders['x-requested-with'] =
				'ShockwaveFlash/32.0.0.371';
			details.requestHeaders['origin'] = 'https://game.aq.com';
			details.requestHeaders['sec-fetch-site'] = 'same-origin';
			// eslint-disable-next-line promise/prefer-await-to-callbacks
			callback({ requestHeaders: details.requestHeaders, cancel: false });
		},
	);

	await window.loadURL(`file://${resolve(RENDERER, 'index.html')}`);
	if (!app.isPackaged) {
		window.webContents.openDevTools({ mode: 'right' });
	}

	if (account) {
		window.webContents.send('root:login', account);
	}

	window.on('close', () => {
		const windows = store.get(window.id);
		if (!windows) {
			showErrorDialog({ message: 'Failed to find store (1).' }, true);
			return;
		}

		if (
			windows.tools.fastTravels &&
			!windows.tools.fastTravels.isDestroyed()
		) {
			windows.tools.fastTravels.destroy();
		}

		if (
			windows.tools.loaderGrabber &&
			!windows.tools.loaderGrabber.isDestroyed()
		) {
			windows.tools.loaderGrabber.destroy();
		}

		if (windows.tools.follower && !windows.tools.follower.isDestroyed()) {
			windows.tools.follower.destroy();
		}

		if (windows.packets.logger && !windows.packets.logger.isDestroyed()) {
			windows.packets.logger.destroy();
		}

		if (windows.packets.spammer && !windows.packets.spammer.isDestroyed()) {
			windows.packets.spammer.destroy();
		}
	});

	// Creates a child window, memoizing the instance
	window.webContents.on(
		'new-window',
		async (
			ev,
			url,
			_frameName,
			_disposition,
			options,
			_additionalFeatures,
			_referrer,
		) => {
			const _url = new URL(url);

			if (_url.protocol === 'https:' || _url.protocol === 'http:') {
				const domains = [
					'www.aq.com',
					'aq.com',
					'www.artix.com',
					'artix.com',
					'www.account.aq.com',
					'account.aq.com',
					'www.aqwwiki.wikidot.com',
					'aqwwiki.wikidot.com',
					'heromart.com',
					'www.heromart.com',
				];
				if (!domains.includes(_url.hostname)) {
					console.log('Blocking url', _url);
					ev.preventDefault();
					// @ts-expect-error this is ok
					ev.newGuest = null;
					return null;
				}

				ev.preventDefault();

				const newWindow = new BrowserWindow({
					webPreferences: {
						nodeIntegration: false,
						plugins: true,
					},
					parent: window,
				});
				// @ts-expect-error this is ok
				ev.newGuest = newWindow;

				await newWindow.webContents.loadURL(_url.toString());

				return newWindow;
			} else if (_url.protocol === 'file:') {
				ev.preventDefault();

				const file = url.slice(
					url.lastIndexOf('/', url.lastIndexOf('/') - 1) + 1,
					url.length,
				);

				const windows = store.get(window.id);
				if (!windows) {
					showErrorDialog(
						{ message: 'Failed to find store (2).' },
						true,
					);
					return;
				}

				let ref = null;

				switch (file) {
					// #region tools
					case 'fast-travels/index.html':
						ref = windows.tools.fastTravels;
						break;
					case 'loader-grabber/index.html':
						ref = windows.tools.loaderGrabber;
						break;
					case 'follower/index.html':
						ref = windows.tools.follower;
						break;
					// #endregion
					// #region packets
					case 'logger/index.html':
						ref = windows.packets.logger;
						break;
					case 'spammer/index.html':
						ref = windows.packets.spammer;
						break;
					// #endregion
				}

				// Return the previously created window
				if (ref && !ref?.isDestroyed()) {
					ref.show();
					ref.focus();
					return ref;
				}

				const newWindow = new BrowserWindow({
					...options,
					// Moving the parent also moves the child, as well as minimizing it
					parent: window,
				});
				// @ts-expect-error this is ok
				ev.newGuest = newWindow;
				newWindow.on('close', (ev) => {
					ev.preventDefault();
					newWindow.hide();
				});

				await newWindow.loadFile(
					`${join(RENDERER, 'pages/')}` +
						(url.includes('scripts')
							? `scripts/${file}`
							: url.includes('tools')
								? `tools/${file}`
								: url.includes('packets')
									? `packets/${file}`
									: null),
				);

				switch (file) {
					// #region tools
					case 'fast-travels/index.html':
						windows.tools.fastTravels = newWindow;
						break;
					case 'loader-grabber/index.html':
						windows.tools.loaderGrabber = newWindow;
						break;
					case 'follower/index.html':
						windows.tools.follower = newWindow;
						break;
					// #endregion
					// #region packets
					case 'logger/index.html':
						windows.packets.logger = newWindow;
						break;
					case 'spammer/index.html':
						windows.packets.spammer = newWindow;
						break;
					// #endregion
				}

				return newWindow;
			}

			return null;
		},
	);
	// window.maximize();

	store.set(window.id, {
		game: window,
		tools: { fastTravels: null, loaderGrabber: null, follower: null },
		packets: { logger: null, spammer: null },
	});
}

export { createGame };

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

type Account = {
	password: string;
	username: string;
};

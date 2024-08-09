const { join } = require('path');
const { BrowserWindow, session } = require('electron');

const RENDERER = join(__dirname, '../renderer');

/**
 * @type {Map<number, {
 *   game: Electron.BrowserWindow,
 *   tools: {
 *     fastTravels: Electron.BrowserWindow,
 *     loaderGrabber: Electron.BrowserWindow,
 *     follower: Electron.BrowserWindow
 *   },
 *   packets: {
 *     logger: Electron.BrowserWindow,
 *     spammer: Electron.BrowserWindow
 *   }
 * }}
 */
const store = new Map();

const userAgent =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36';

async function createGame() {
	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: '',
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			plugins: true,
		},
	});

	window.webContents.setUserAgent(userAgent);
	session.defaultSession.webRequest.onBeforeSendHeaders(
		(details, callback) => {
			details.requestHeaders['User-Agent'] = userAgent;
			details.requestHeaders.artixmode = 'launcher';
			details.requestHeaders['x-requested-with'] =
				'ShockwaveFlash/32.0.0.371';
			details.requestHeaders['origin'] = 'https://game.aq.com';
			details.requestHeaders['sec-fetch-site'] = 'same-origin';
			callback({ requestHeaders: details.requestHeaders, cancel: false });
		},
	);

	await window.loadFile(join(RENDERER, 'game/game.html'));
	window.webContents.openDevTools({ mode: 'right' });

	window.on('close', () => {
		const windows = store.get(window.id);

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
				];
				if (!domains.includes(_url.hostname)) {
					console.log('Blocking url', _url);
					ev.preventDefault();
					ev.newGuest = null;
					return null;
				}
			} else if (_url.protocol === 'file:') {
				ev.preventDefault();

				const file = url.substring(
					url.lastIndexOf('/', url.lastIndexOf('/') - 1) + 1,
					url.length,
				);

				const windows = store.get(window.id);
				let ref = null;

				switch (file) {
					//#region tools
					case 'fast-travels/index.html':
						ref = windows.tools.fastTravels;
						break;
					case 'loader-grabber/index.html':
						ref = windows.tools.loaderGrabber;
						break;
					case 'follower/index.html':
						ref = windows.tools.follower;
						break;
					//#endregion
					//#region packets
					case 'logger/index.html':
						ref = windows.packets.logger;
						break;
					case 'spammer/index.html':
						ref = windows.packets.spammer;
						break;
					//#endregion
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
				ev.newGuest = newWindow;
				newWindow.on('close', (ev) => {
					ev.preventDefault();
					newWindow.hide();
				});

				await newWindow.loadFile(
					`${join(RENDERER, 'game/pages/')}` +
						(url.includes('scripts')
							? `scripts/${file}`
							: url.includes('tools')
								? `tools/${file}`
								: url.includes('packets')
									? `packets/${file}`
									: null),
				);

				switch (file) {
					//#region tools
					case 'fast-travels/index.html':
						windows.tools.fastTravels = newWindow;
						break;
					case 'loader-grabber/index.html':
						windows.tools.loaderGrabber = newWindow;
						break;
					case 'follower/index.html':
						windows.tools.follower = newWindow;
						break;
					//#endregion
					//#region packets
					case 'logger/index.html':
						windows.packets.logger = newWindow;
						break;
					case 'spammer/index.html':
						windows.packets.spammer = newWindow;
						break;
					//#endregion
				}

				return newWindow;
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

module.exports = {
	createGame,
};

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

async function createGame(account = null) {
	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: account?.username ?? '',
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			plugins: true,
		},
	});
	const gameWindow = window;

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

	await window
		.loadFile(join(RENDERER, 'game/game.html'))
		.catch((error) => console.log('error', error));
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
	// TODO: window instances dont persist across refreshes
	// TODO: refactor
	window.webContents.on(
		'new-window',
		async (
			event,
			url,
			_frameName,
			_disposition,
			options,
			_additionalFeatures,
			_referrer,
		) => {
			event.preventDefault();

			const { id } = event.sender;
			const file = url.substring(
				url.lastIndexOf('/', url.lastIndexOf('/') - 1) + 1,
				url.length,
			);

			const windows = store.get(id);
			let ret = false;

			switch (file) {
				//#region tools
				case 'fast-travels/index.html':
					if (
						windows.tools.fastTravels &&
						!windows.tools.fastTravels.isDestroyed()
					) {
						windows.tools.fastTravels.show();
						windows.tools.fastTravels.focus();
						ret = true;
					}
					break;
				case 'loader-grabber/index.html':
					if (
						windows.tools.loaderGrabber &&
						!windows.tools.loaderGrabber.isDestroyed()
					) {
						windows.tools.loaderGrabber.show();
						windows.tools.loaderGrabber.focus();
						ret = true;
					}
					break;
				case 'follower/index.html':
					if (
						windows.tools.follower &&
						!windows.tools.follower.isDestroyed()
					) {
						windows.tools.follower.show();
						windows.tools.follower.focus();
						ret = true;
					}
					break;
				//#endregion
				//#region packets
				case 'logger/index.html':
					if (
						windows.packets.logger &&
						!windows.packets.logger.isDestroyed()
					) {
						windows.packets.logger.show();
						windows.packets.logger.focus();
						ret = true;
					}
					break;
				case 'spammer/index.html':
					if (
						windows.packets.spammer &&
						!windows.packets.spammer.isDestroyed()
					) {
						windows.packets.spammer.show();
						windows.packets.spammer.focus();
						ret = true;
					}
					break;
				//#endregion
			}

			if (ret) {
				return;
			}

			const newWindow = new BrowserWindow({
				...options,
				parent: windows.game,
			});
			event.newGuest = newWindow;

			newWindow.on('close', (event) => {
				event.preventDefault();
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
		},
	);
	window.maximize();

	store.set(window.id, {
		game: window,
		tools: { fastTravels: null, loaderGrabber: null, follower: null },
		packets: { logger: null, spammer: null },
	});
}

module.exports = {
	createGame,
};

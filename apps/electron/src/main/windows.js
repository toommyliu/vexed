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

	store.set(window.id, {
		game: window,
		tools: { fastTravels: null, loaderGrabber: null, follower: null },
		packets: { logger: null, spammer: null },
	});
}

function getWindows(id) {
	return store.get(id) ?? null;
}

module.exports = {
	createGame,
	getWindows,
};

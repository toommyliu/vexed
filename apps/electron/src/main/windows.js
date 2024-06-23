const { join, parse } = require('path');
const { BrowserWindow, session } = require('electron');
const { nanoid } = require('nanoid');

const RENDERER = join(__dirname, '../renderer');

// The account manager window (limit: 1)
let managerWindow = null;

const windows = new Map();

const userAgent =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36';

async function createManager() {
	if (managerWindow) {
		managerWindow.focus();
		return;
	}

	const window = new BrowserWindow({
		width: 966,
		height: 552,
		title: 'Account Manager',
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
		},
	});

	window.on('closed', function () {
		managerWindow = null;
	});

	await window.loadFile(join(RENDERER, 'manager/manager.html'));
	managerWindow = window;
}

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
	// window.webContents.openDevTools({ mode: 'right' });
	// window.maximize();

	// TODO: race condition
	const windowID = nanoid();
	assignWindowID(window, windowID);

	console.log(`Created a family with windowID: "${windowID}"`);

	if (account) {
		window.webContents.send('game:login', account);
	}

	window.on('closed', () => {
		console.log(`Removing family of windows under: "${windowID}".`);

		if (!windows.has(windowID)) {
			return;
		}

		const _windows = windows.get(windowID);

		for (const [k, v] of Object.entries(_windows)) {
			try {
				if (v !== null && !v?.isDestroyed()) {
					v.close();
					console.log(`Removing window "${k}" under: "${windowID}".`);
				} else {
					console.log(
						`Window "${k}" does not exist under "${windowID}", skipping.`,
					);
				}
			} catch (error) {
				console.log(
					`An error occurred while trying to remove "${k}" under: "${windowID}".`,
					error,
				);
			}
		}
	});

	window.webContents.on('new-window', async (event, url, _, __, options) => {
		const _url = new URL(url);
		if (
			_url.hostname === 'account.aq.com' ||
			_url.hostname === 'www.aq.com' ||
			_url.hostname === 'www.artix.com'
		) {
			return;
		}

		if (url.startsWith('http')) {
			event.preventDefault();
			return;
		}

		event.preventDefault();

		// *.html
		const { base: file, dir } = parse(url);
		const page = file.split('.')[0];
		const dir_ = dir.substring(dir.lastIndexOf('/') + 1);

		const _windows = windows.get(windowID);
		const prevWindow = _windows[page];

		if (prevWindow && !prevWindow?.webContents?.isDestroyed()) {
			prevWindow.show();
			return;
		}

		console.log(`Creating detour "${page}" window for "${windowID}".`);

		const window = new BrowserWindow({ ...options });

		event.newGuest = window;
		_windows[page] = window;

		await window.loadFile(
			join(
				RENDERER,
				`game/pages/${dir_ === 'pages' ? '' : `${dir_}/`}${file}`,
			),
		);

		//window.webContents.openDevTools({ mode: 'right' });

		window.on('closed', () => {
			console.log(`Closing "${page}" window under: "${windowID}".`);
			_windows[page] = null;
		});

		// TODO: when parent is closed/closing, children should close
		// window.on('close', (event) => {
		// 	event.preventDefault();
		// 	window.blur();

		// 	console.log(
		// 		`Blocked window "${page}" from closing because parent is not closed: "${windowID}".`,
		// 	);
		// });

		return window;
	});

	// window refreshed?
	window.webContents.on('did-finish-load', () => {
		// send the window id again to avoid re-creation
		window.webContents.send('generate-id', windowID);
	});
}

function assignWindowID(window, windowID) {
	windows.set(windowID, {
		game: window,
		scripts: null,
		tools: null,
		fastTravels: null,
		loaderGrabber: null,
		maid: null,
		packets: null,
	});
	window.webContents.send('generate-id', windowID);
}

function getGameWindow(windowID) {
	const _windows = windows.get(windowID);
	return _windows.game ?? null;
}

module.exports = {
	createManager,
	createGame,
	assignWindowID,
	getGameWindow,
};

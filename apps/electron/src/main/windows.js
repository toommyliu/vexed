const { join, parse, relative } = require('path');
const { BrowserWindow, session, app } = require('electron');
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

	await window.loadFile(join(RENDERER, 'game/game.html'));
	window.webContents.openDevTools({ mode: 'right' });
	// window.maximize();

	// TODO: race condition
	const windowID = nanoid();
	assignWindowID(window, windowID);

	console.log(`Created a family with windowID: "${windowID}"`);

	if (account) {
		window.webContents.send('game:login', account);
	}

	window.on('closed', function () {
		console.log(`Removing family of windows under: "${windowID}".`);

		if (!windows.has(windowID)) {
			return;
		}

		const _windows = windows.get(windowID);

		for (const [_, v] of Object.entries(_windows)) {
			try {
				v?.close();
			} catch {}
		}
	});

	window.webContents.on('new-window', async (event, url, _, __, options) => {
		event.preventDefault();

		// *.html
		const { base: file } = parse(url);
		const page = file.split('.')[0];

		const _windows = windows.get(windowID);
		const prevWindow = _windows[page];

		if (prevWindow) {
			prevWindow.show();
			return;
		}

		const window = new BrowserWindow({ ...options, alwaysOnTop: true });
		event.newGuest = window;
		_windows[page] = window;

		await window.loadFile(join(RENDERER, `game/pages/${file}`));
		window.on('closed', () => {
			_windows[page] = null;
		});

		window.on('close', (event) => {
			event.preventDefault();
			event.sender.hide();
		});
	});
}

function assignWindowID(window, windowID) {
	windows.set(windowID, {
		game: window,
		scripts: null,
		tools: null,
		packets: null,
	});
	window.webContents.send('generate-id', windowID);
}

function getGameWindow(windowID) {
	return windows.get(windowID) ?? null;
}

module.exports = {
	createManager,
	createGame,
	assignWindowID,
	getGameWindow,
};

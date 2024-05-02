const fs = require('fs');
const { join } = require('path');
const { app, BrowserWindow, session } = require('electron');

const userAgent =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36';

const BRAND = 'Vexed';

function registerFlashPlugin() {
	const flashTrust = require('nw-flash-trust');
	// TODO: add checks for app.isPackaged
	app.commandLine.appendSwitch('ppapi-flash-path', join(__dirname, '../vendor/PepperFlashPlayer.plugin'));

	const flashPath = join(app.getPath('userData'), 'Pepper Data', 'Shockwave Flash', 'WritableRoot');

	// eslint-disable-next-line n/no-sync
	const trustManager = flashTrust.initSync(BRAND, flashPath);
	trustManager.empty();
	trustManager.add(join(__dirname, '../grimoire.swf'));
}

registerFlashPlugin();

app.once('ready', async () => {
	await fs.promises.mkdir(join(app.getPath('documents'), BRAND, 'Scripts'), { recursive: true });

	const window = new BrowserWindow({
		width: 1_024,
		height: 576,
		title: '',
		webPreferences: {
			plugins: true,
			nodeIntegration: true,
		},
	});

	window.webContents.setUserAgent(userAgent);
	// eslint-disable-next-line promise/prefer-await-to-callbacks
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['User-Agent'] = userAgent;
		details.requestHeaders.artixmode = 'launcher';
		// eslint-disable-next-line promise/prefer-await-to-callbacks
		callback({ requestHeaders: details.requestHeaders, cancel: false });
	});

	await window.loadFile(join(__dirname, '../index.html'));

	window.webContents.openDevTools({ mode: 'detach' });
});

app.on('window-all-closed', app.quit);

try {
	require('electron-reload')(__dirname, {
		electron: join(__dirname, 'node_modules', '.bin', 'electron'),
		paths: [join(__dirname, '../src/renderer')],
	});
} catch {}

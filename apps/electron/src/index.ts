import { join } from 'path';
import { app, BrowserWindow, session } from 'electron';

const userAgent =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.0.9 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36';

const BRAND = 'Vexed';

function registerFlashPlugin() {
	const flashTrust = require('nw-flash-trust');
	// TODO: add checks for app.isPackaged
	app.commandLine.appendSwitch('ppapi-flash-path', join(__dirname, '../vendor/PepperFlashPlayer.plugin'));

	const flashPath = join(app.getPath('userData'), 'Pepper Data', 'Shockwave Flash', 'WritableRoot');

	const trustManager = flashTrust.initSync(BRAND, flashPath);
	trustManager.empty();
	trustManager.add(join(__dirname, '../grimoire.swf'));
}

registerFlashPlugin();

app.once('ready', async () => {
	const window = new BrowserWindow({
		width: 1024,
		height: 576,
		webPreferences: {
			plugins: true,
		},
		title: '',
	});

	window.webContents.setUserAgent(userAgent);
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['User-Agent'] = userAgent;
		callback({ requestHeaders: details.requestHeaders, cancel: false });
	});

	await window.loadFile(join(__dirname, '../index.html'));

	window.webContents.openDevTools({ mode: 'detach' });
});

app.on('window-all-closed', app.quit);

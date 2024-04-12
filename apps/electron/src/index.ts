import { join } from 'path';
import { app, BrowserWindow, session } from 'electron';

{
	const flashTrust = require('nw-flash-trust');
	// TODO: add checks for app.isPackaged
	app.commandLine.appendSwitch('ppapi-flash-path', join(__dirname, '../vendor/PepperFlashPlayer.plugin'));

	const flashPath = join(app.getPath('userData'), 'Pepper Data', 'Shockwave Flash', 'WritableRoot');

	const trustManager = flashTrust.initSync('Vexed', flashPath);
	trustManager.empty();
	trustManager.add(join(__dirname, '../public/'));
}

app.once('ready', async () => {
	const window = new BrowserWindow({
		width: 1024,
		height: 576,
		webPreferences: {
			contextIsolation: true,
			sandbox: true,
			plugins: true,
		},
	});

	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['User-Agent'] =
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.0.9 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36';
		callback({ requestHeaders: details.requestHeaders });
	});

	await window.loadFile(join(__dirname, '../public/index.html'));

	window.setTitle('');

	window.webContents.openDevTools({ mode: 'detach' });
});

app.on('window-all-closed', () => {
	app.quit();
});

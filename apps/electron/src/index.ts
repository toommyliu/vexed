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

	session

	await window.loadFile(join(__dirname, '../public/index.html'));

	window.setTitle('');

	window.webContents.openDevTools({ mode: 'detach' });
});

app.on('window-all-closed', () => {
	app.quit();
});

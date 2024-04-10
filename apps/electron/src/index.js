const { join } = require('path');
const { app, BrowserWindow } = require('electron');

{
	const packageJson = require('../package.json');
	const flashTrust = require('nw-flash-trust');

	app.commandLine.appendSwitch('ppapi-flash-path', join(__dirname, '../vendor/PepperFlashPlayer.plugin'));
	const flashPath = join(app.getPath('userData'), 'Pepper Data', 'Shockwave Flash', 'WritableRoot');

	const trustManager = flashTrust.initSync(packageJson.name, flashPath);
	trustManager.empty();
	trustManager.add(join(__dirname, '../public/'));
}

app.once('ready', async () => {
	const window = new BrowserWindow({
		width: 960,
		height: 550,
		webPreferences: {
			contextIsolation: false,
			enableRemoteModule: true,
			nodeIntegration: true,
			plugins: true,
		},
	});

	await window.loadFile(join(__dirname, '../public/index.html'));

	window.webContents.openDevTools({ mode: 'detach' });
});

app.on('window-all-closed', () => {
	app.quit();
});

const fs = require('fs');
const { join } = require('path');
const { app, BrowserWindow, session } = require('electron');

require('./util/setupMenu')();

const userAgent =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36';

function registerFlashPlugin() {
	const flashTrust = require('nw-flash-trust');
	// TODO: add checks for app.isPackaged
	app.commandLine.appendSwitch('ppapi-flash-path', join(__dirname, '../../vendor/PepperFlashPlayer.plugin'));

	const flashPath = join(app.getPath('userData'), 'Pepper Data', 'Shockwave Flash', 'WritableRoot');

	const trustManager = flashTrust.initSync('Vexed', flashPath);
	trustManager.empty();
	trustManager.add(join(__dirname, '../../grimoire.swf'));
}

registerFlashPlugin();

app.once('ready', async () => {
	await fs.promises.mkdir(join(app.getPath('documents'), 'Vexed/Scripts'), { recursive: true });

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
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['User-Agent'] = userAgent;
		details.requestHeaders['artixmode'] = 'launcher';
		callback({ requestHeaders: details.requestHeaders, cancel: false });
	});

	await window.loadFile(join(__dirname, '../../index.html'));
	window.webContents.openDevTools({ mode: 'right' });
	window.webContents.executeJavaScript(String.raw`
		window.rootDir = ${JSON.stringify(join(app.getPath('documents'), 'Vexed'))};
		window.scriptsDir = ${JSON.stringify(join(app.getPath('documents'), 'Vexed/Scripts'))};
	`);
	window.focus();
	window.maximize();
});

app.on('window-all-closed', app.quit);
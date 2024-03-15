const { join } = require('path');
const { app, BrowserWindow, session } = require('electron');

require('./proxy');

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

	session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
		if (details.url.startsWith('https://game.aq.com')) {
			console.log(details);
		}

		callback({});
	});

	await window.loadFile(join(__dirname, '../public/index.html'));

	window.webContents.openDevTools({ mode: 'detach' });
});

app.on('window-all-closed', () => {
	app.quit();
});

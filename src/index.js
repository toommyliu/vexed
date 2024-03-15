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
			const url = new URL('http://localhost:3000/proxy');
			url.searchParams.append('url', details.url);

			callback({ redirectURL: url.toString() });
		} else {
			callback({});
		}
	});

	await window.loadFile(join(__dirname, '../public/index.html'));

	window.webContents.openDevTools({ mode: 'detach' });
});

app.on('window-all-closed', () => {
	app.quit();
});

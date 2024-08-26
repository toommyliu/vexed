const { join } = require('path');
const { app } = require('electron');

const { createGame } = require('./windows');

require('./tray');
require('./ipc');

function registerFlashPlugin() {
	const flashTrust = require('nw-flash-trust');
	// TODO: add checks for app.isPackaged
	const assetsPath = join(__dirname, '../../assets');
	let pluginName;
	switch (process.platform) {
		case 'win32':
			pluginName = 'pepflashplayer.dll';
			break;
		case 'darwin':
			pluginName = 'PepperFlashPlayer.plugin';
			break;
	}

	app.commandLine.appendSwitch(
		'ppapi-flash-path',
		join(assetsPath, pluginName),
	);

	const flashPath = join(
		app.getPath('userData'),
		'Pepper Data',
		'Shockwave Flash',
		'WritableRoot',
	);

	const trustManager = flashTrust.initSync('Vexed', flashPath);
	trustManager.empty();
	trustManager.add(join(assetsPath, 'grimoire.swf'));
}

registerFlashPlugin();

app.once('ready', async () => {
	await createGame();
});

app.on('window-all-closed', app.quit);

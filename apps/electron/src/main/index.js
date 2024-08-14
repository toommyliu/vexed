const { join } = require('path');
const { app } = require('electron');

const { createGame } = require('./windows');

require('./tray');
require('./ipc');

function registerFlashPlugin() {
	const flashTrust = require('nw-flash-trust');
	// TODO: add checks for app.isPackaged
	app.commandLine.appendSwitch(
		'ppapi-flash-path',
		join(__dirname, '../../build/PepperFlashPlayer.plugin'),
	);

	const flashPath = join(
		app.getPath('userData'),
		'Pepper Data',
		'Shockwave Flash',
		'WritableRoot',
	);

	const trustManager = flashTrust.initSync('Vexed', flashPath);
	trustManager.empty();
	trustManager.add(join(__dirname, '../../build/grimoire.swf'));
}

registerFlashPlugin();

app.once('ready', async () => {
	await createGame();
});

app.on('window-all-closed', app.quit);

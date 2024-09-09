import { join } from 'path';
import { app } from 'electron';
import { showErrorDialog } from './utils';
import { createGame } from './windows';

import './tray';
import './ipc';

function registerFlashPlugin() {
	// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
	const flashTrust = require('nw-flash-trust');
	// TODO: add checks for app.isPackaged
	const assetsPath = join(__dirname, '../../assets');
	let pluginName;

	if (process.platform === 'win32') {
		pluginName = 'pepflashplayer.dll';
	} else if (process.platform === 'darwin') {
		pluginName = 'PepperFlashPlayer.plugin';
	}

	if (!pluginName) {
		showErrorDialog({ message: 'Unsupported platform.' });
		return;
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

app.on('window-all-closed', () => app.quit());

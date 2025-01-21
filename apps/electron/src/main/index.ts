import './ipc/ipc.game';
import './ipc/ipc.manager';
import './tray';

import { join } from 'path';
import { app } from 'electron';
import { BRAND } from '../common/constants';
import { FileManager } from './FileManager';
import { showErrorDialog } from './utils';
import { createAccountManager, createGame } from './windows';

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

	const trustManager = flashTrust.initSync(BRAND, flashPath);
	trustManager.empty();
	trustManager.add(join(assetsPath, 'grimoire.swf'));
}

registerFlashPlugin();
app.disableHardwareAcceleration();

app.once('ready', async () => {
	const fm = FileManager.getInstance();
	await fm.initialize();

	const settings = await fm
		.readJson<typeof fm.defaultSettings>(fm.settingsPath)
		.catch(() => fm.defaultSettings);

	if (settings?.launchMode?.toLowerCase() === 'manager') {
		await createAccountManager();
	} else {
		await createGame();
	}
});

app.on('window-all-closed', () => app.quit());

const fs = require('fs-extra');
const { join } = require('path');
const { app, dialog } = require('electron');

const { createManager, createGame } = require('./windows');

require('./ipc');

const ARTIX_LAUNCHER = '/Applications/Artix Game Launcher.app';
const PPFLASH_PLUGIN = join(
	ARTIX_LAUNCHER,
	'Contents/Resources/plugins/PepperFlashPlayer.plugin',
);

function registerFlashPlugin() {
	const flashTrust = require('nw-flash-trust');

	app.commandLine.appendSwitch('ppapi-flash-path', PPFLASH_PLUGIN);

	const flashPath = join(
		app.getPath('userData'),
		'Pepper Data',
		'Shockwave Flash',
		'WritableRoot',
	);

	const trustManager = flashTrust.initSync('Vexed', flashPath);
	trustManager.empty();
	trustManager.add(join(__dirname, '../renderer/game/grimoire.swf'));
}

registerFlashPlugin();

app.once('ready', async () => {
	const launcher = await fs
		.pathExists(ARTIX_LAUNCHER)
		.then((ret) => ret)
		.catch(() => false);

	if (!launcher) {
		dialog.showErrorBox('Error', 'Artix Game Launcher must be installed in the Applications Folder to make use of its Flash Player plugin.');
		process.exit(1);
	}

	const ppflash = await fs
		.pathExists(PPFLASH_PLUGIN)
		.then((ret) => ret)
		.catch(() => false);

	if (!ppflash) {
		dialog.showErrorBox('Error', 'Artix Game Launcher was found but no PepperFlashPlugin.plugin was found.');
		process.exit(1);
	}

	const base = join(app.getPath('documents'), 'Vexed');
	const preferencesPath = join(base, 'preferences.json');

	await fs.ensureDir(join(base, 'Scripts'));
	await fs.ensureFile(preferencesPath);

	const preferences = await fs.readJSON(preferencesPath).catch(async () => {
		const def = { launch: 'manager' };
		await fs.writeJSON(preferencesPath, def, { spaces: 4 });
		return def;
	});

	if (
		'launch' in preferences &&
		typeof preferences.launch === 'string' &&
		preferences.launch.toLowerCase() === 'game'
	) {
		await createGame();
	} else {
		await createManager();
	}
});

app.on('window-all-closed', app.quit);

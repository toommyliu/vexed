import { Menu, Tray, app, nativeImage } from 'electron';
import { join, resolve } from 'path';
import { BRAND } from '../common/constants';
import { createAccountManager, createGame } from './windows';

let tray: Tray | null = null;

const contextMenu = Menu.buildFromTemplate([
	{
		label: 'Open Account Manager',
		click: () => void createAccountManager(),
	},
	{
		label: 'Open Game',
		click: () => void createGame(),
	},
	{ type: 'separator' },
	{
		label: 'Quit',
		click: () => app.quit(),
	},
]);

app.on('ready', () => {
	// menu bar on mac, tray icon on windows
	const path = resolve(join(__dirname, '../../assets/16.png'));
	const icon = nativeImage.createFromPath(path);

	tray = new Tray(icon);
	tray.setToolTip(BRAND);
	tray.setContextMenu(contextMenu);

	if (process.platform === 'darwin') {
		const path = resolve(join(__dirname, '../../assets/1024.png'));
		app.dock.setIcon(path);
	}
});

app.on('before-quit', () => {
	if (tray) {
		tray.destroy();
		tray = null;
	}
});

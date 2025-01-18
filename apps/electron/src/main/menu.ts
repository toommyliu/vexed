import { Menu, Tray, app, nativeImage } from 'electron';
import process from 'process';
import { DOCK_ICON, TRAY_ICON, BRAND } from '../common/constants';
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

app.once('ready', () => {
	if (process.platform === 'darwin') {
		app.dock.setIcon(nativeImage.createFromPath(DOCK_ICON));
	}

	tray = new Tray(nativeImage.createFromPath(TRAY_ICON));
	tray.setToolTip(BRAND);
	tray.setContextMenu(contextMenu);
});

app.on('before-quit', () => {
	if (tray) {
		tray.destroy();
		tray = null;
	}
});

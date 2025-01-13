import process from 'process';
import { Menu, app } from 'electron';
import { createAccountManager, createGame } from './windows';

const menu = Menu.buildFromTemplate([
	{
		label: 'Open Account Manager',
		click: () => void createAccountManager(),
	},
	{
		label: 'Open Game',
		click: () => void createGame(),
	},
]);

app.once('ready', () => {
	if (process.platform === 'darwin') app.dock.setMenu(menu);
});

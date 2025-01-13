import { Menu, app } from 'electron';
import { createAccountManager, createGame } from './windows';

const menu = Menu.buildFromTemplate([
	{
		label: 'Account Manager',
		click: () => void createAccountManager(),
	},
	{
		label: 'Game',
		click: () => void createGame(),
	},
]);

app.once('ready', () => app.dock.setMenu(menu));

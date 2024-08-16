const { nativeImage, Tray, Menu, dialog } = require('electron');
const { app } = require('electron');
const { join } = require('path');
const fs = require('fs-extra');
const fetch = require('node-fetch');

const { createGame } = require('./windows');

const ROOT = join(app.getPath('documents'), 'Vexed');

let tray;
let server;

app.on('ready', async () => {
	tray = new Tray(
		nativeImage.createFromPath(join(__dirname, '../../build/logo.png')),
	);

	const exists = await fs
		.pathExists(join(ROOT, 'accounts.json'))
		.catch(() => {
			dialog.showErrorBox('Failed to read accounts (1).');
			app.quit();
			return false;
		});

	if (exists) {
		const accounts = await fs
			.readJSON(join(ROOT, 'accounts.json'))
			.catch(() => {
				dialog.showErrorBox('Failed to read accounts (2).');
				return [];
			});

		const menu = [
			{ label: 'Launch New Window', click: createGame },
			{
				label: 'Launch All',
				click: async () => {
					for (const account of accounts) {
						if ('username' in account && 'password' in account) {
							await createGame({ ...account, server });
							await new Promise((resolve) =>
								setTimeout(resolve, 1500),
							);
						}
					}
				},
			},
			{ type: 'separator' },
		];

		await fetch('https://game.aq.com/game/api/data/servers')
			.then(async (res) => {
				const json = await res.json();
				menu.push({
					label: 'Login server',
					submenu: json.map((srv) => {
						return {
							label: srv.sName,
							type: 'radio',
							click: () => (server = srv.sName),
						};
					}),
				});
			})
			.catch(() => {
				dialog.showErrorBox('Failed to fetch servers.');
				return [];
			});

		menu.push({ type: 'separator' });

		for (const account of accounts) {
			if ('username' in account && 'password' in account) {
				menu.push({
					label: account.username,
					click: async () => await createGame({ ...account, server }),
				});
			}
		}

		tray.setContextMenu(Menu.buildFromTemplate(menu));
	}
});

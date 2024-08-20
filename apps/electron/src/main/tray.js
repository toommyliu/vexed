const { nativeImage, Tray, Menu, dialog } = require('electron');
const { app } = require('electron');
const { join } = require('path');
const fs = require('fs-extra');
const fetch = require('node-fetch');
const prompt = require('electron-prompt');

const { createGame } = require('./windows');

const ROOT = join(app.getPath('documents'), 'Vexed');
const accountsPath = join(ROOT, 'accounts.json');

let tray;
let server;

app.on('ready', async () => {
	tray = new Tray(
		nativeImage.createFromPath(join(__dirname, '../../build/logo.png')),
	);

	const exists = await fs.pathExists(accountsPath).catch(() => {
		dialog.showErrorBox('Failed to read accounts (1).');
		app.quit();
		return false;
	});

	if (exists) {
		const accounts = await fs.readJSON(accountsPath).catch(() => {
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
			{
				label: 'Add Account',
				click: async () => {
					const username = await prompt({
						title: 'Add Account',
						label: 'Username',
						value: '',
						inputAttrs: {
							type: 'text',
						},
						type: 'input',
					}).catch(() => null);

					if (!username) {
						return;
					}

					const password = await prompt({
						title: 'Add Account',
						label: 'Password',
						value: '',
						inputAttrs: {
							type: 'password',
						},
						type: 'input',
					}).catch(() => null);

					if (!password) {
						return;
					}

					const account = {
						username,
						password,
					};

					await fs
						.writeJSON(
							accountsPath,
							[...(await fs.readJSON(accountsPath)), account],
							{ spaces: 4 },
						)
						.catch(() => {
							dialog.showErrorBox('Failed to write accounts.');
							app.quit();
						});
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

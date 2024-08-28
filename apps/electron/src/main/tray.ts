import { nativeImage, Tray, Menu } from 'electron';
import { app } from 'electron';
import { join } from 'path';
import fs from 'fs-extra';
import fetch from 'node-fetch';
import prompt from 'electron-prompt';

import { createGame } from './windows';
import { showErrorDialog } from './utils';

const ROOT = join(app.getPath('documents'), 'Vexed');
const accountsPath = join(ROOT, 'accounts.json');

let tray: Tray | null = null;
let server: string | null = null;

app.on('ready', async () => {
	tray = new Tray(
		nativeImage.createFromPath(join(__dirname, '../../assets/logo.png')),
	);

	const exists = await fs.pathExists(accountsPath).catch((error) => {
		showErrorDialog(
			{ message: 'Failed to read accounts (1).', error },
			false,
		);
		return false;
	});

	if (exists) {
		const accounts = await fs.readJSON(accountsPath).catch((error) => {
			showErrorDialog(
				{ message: 'Failed to read accounts (2).', error },
				false,
			);
			return [];
		});

		const updateMenu = async () => {
			const menu = [
				{ label: 'Launch New Window', click: createGame },
				{
					label: 'Launch All',
					click: async () => {
						for (const account of accounts) {
							if (
								'username' in account &&
								'password' in account
							) {
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
							.catch((error) => {
								showErrorDialog({
									message: 'Failed to write accounts.',
									error,
								});
							});
					},
				},
				{
					label: 'Remove Account',
					submenu: accounts
						.filter(
							(account: Object) =>
								'username' in account && 'password' in account,
						)
						.map((account: Account, index: number) => ({
							label: account.username,
							click: async () => {
								accounts.splice(index, 1);

								await fs
									.writeJSON(accountsPath, accounts, {
										spaces: 4,
									})
									.catch((error) => {
										showErrorDialog(
											{
												message:
													'Failed to update accounts.',
												error,
											},
											true,
										);
									});
								await updateMenu();
							},
						})),
				},
				{ type: 'separator' },
			];

			await fetch('https://game.aq.com/game/api/data/servers')
				.then(async (res) => {
					const json = await res.json();
					menu.push({
						label: 'Login Server',
						submenu: [
							{
								label: 'None',
								type: 'radio',
								click: () => (server = null),
								checked: true,
							},
							...json.map((srv: Server) => {
								return {
									label: srv.sName,
									type: 'radio',
									click: () => (server = srv.sName),
								};
							}),
						],
					});
				})
				.catch(() => {
					showErrorDialog(
						{ message: 'Failed to fetch servers.' },
						false,
					);
					return [];
				});

			menu.push({ type: 'separator' });

			for (const account of accounts) {
				if ('username' in account && 'password' in account) {
					menu.push({
						label: account.username,
						click: async () =>
							await createGame({ ...account, server }),
					});
				}
			}

			// @ts-expect-error
			tray!.setContextMenu(Menu.buildFromTemplate(menu));
		};

		await updateMenu();
	}
});

type Account = {
	username: string;
	password: string;
};

type Server = {
	sName: string;
};

import { ipcRenderer } from 'electron/renderer';

const accounts: Account[] = [];
const servers: Server[] = [];

const timeouts = new Map<string, NodeJS.Timeout>();

ipcRenderer.on('manager:enable_button', async (_, username) => {
	const timeout = timeouts.get(username);
	if (timeout) {
		clearTimeout(timeout);
		timeouts.delete(username);
	}

	await new Promise((resolve) => {
		setTimeout(resolve, 500);
	});

	enableAccount(username);
});

function enableAccount(username: string) {
	for (const el of document.querySelectorAll<HTMLButtonElement>('#start')) {
		if (el.dataset['username'] === username) {
			el.disabled = false;
			el.classList.remove('w3-disabled');
		}
	}
}

async function startAccount({ username, password }: Account) {
	const serversSelect =
		document.querySelector<HTMLSelectElement>('#servers')!;

	const timeout = setTimeout(() => {
		enableAccount(username);
		timeouts.delete(username);
	}, 10_000); // 10 seconds should be long enough for an account to login

	timeouts.set(username, timeout);

	await ipcRenderer.invoke('manager:launch_game', {
		username,
		password,
		server: serversSelect.value,
	});
}

async function removeAccount({ username }: Pick<Account, 'username'>) {
	const timeout = timeouts.get(username);
	if (timeout) {
		clearTimeout(timeout);
		timeouts.delete(username);
	}

	await ipcRenderer.invoke('manager:remove_account', username);
}

function toggleAccountState(ev: MouseEvent) {
	const checkbox = (ev.target as Element)!
		.closest('.w3-card')!
		.querySelector('input') as HTMLInputElement;

	checkbox.checked = !checkbox.checked;
	checkbox.dispatchEvent(new Event('change', { bubbles: true }));
}

function updateAccounts() {
	for (const timeout of timeouts.values()) {
		clearTimeout(timeout);
	}

	timeouts.clear();

	const accountsContainer = document.querySelector('#accounts')!;
	accountsContainer.innerHTML = accounts
		.map(
			(account) => `
                <div class="w3-card w3-round-medium" style="border:0px !important;">
                    <div class="account-bar">
                        <div class="account-info">
                            <input
                                type="checkbox"
                                class="account-checkbox"
                                data-username="${account.username}"
                                data-password="${account.password}"
                            />
                            <h4 class="username-toggle">
                                ${account.username}
                            </h4>
                        </div>
                        <div class="account-actions">
                            <button class="w3-button w3-round-medium" id="remove"
                            data-username="${account.username}"
                            data-password="${account.password}">Remove</button>
                            <button class="w3-button w3-round-medium" id="start"
                            data-username="${account.username}"
                            data-password="${account.password}"
                            >Start</button>
                        </div>
                    </div>
                </div>
            `,
		)
		.join('');

	for (const el of document.querySelectorAll('.username-toggle')) {
		(el as HTMLSpanElement).onclick = toggleAccountState;
	}

	const removeBtns = document.querySelectorAll<HTMLButtonElement>('#remove');
	for (const el of removeBtns) {
		el.onclick = async () => {
			const username = el.dataset['username']!;

			const idx = accounts.findIndex((acc) => acc.username === username);
			if (idx !== -1) {
				accounts.splice(idx, 1);
				await removeAccount({ username });
				updateAccounts();
			}
		};
	}

	const startBtns = document.querySelectorAll<HTMLButtonElement>('#start');
	for (const el of startBtns) {
		el.onclick = async () => {
			el.disabled = true;
			el.classList.add('w3-disabled');

			const username = el.dataset['username']!;
			const password = el.dataset['password']!;

			await startAccount({ username, password });
		};
	}
}

function updateServers() {
	const select = document.querySelector<HTMLSelectElement>('#servers')!;
	select.innerHTML = servers
		.map(
			(server) => `
				<option value="${server.sName}">${server.sName} (${server.iCount})</option>
			`,
		)
		.join('');
}

window.addEventListener('DOMContentLoaded', async () => {
	{
		const btn = document.querySelector('#accordion-toggle')!;
		btn.addEventListener('click', () => {
			const nextEl = btn.nextElementSibling;
			if (nextEl) nextEl.classList.toggle('w3-show');
		});
	}

	{
		const form = document.querySelector('#account-form') as HTMLFormElement;
		const btn = document.querySelector(
			'button[type=submit]',
		) as HTMLButtonElement;

		form.addEventListener('submit', async (ev) => {
			btn.classList.add('w3-disabled');

			ev.preventDefault();

			const formData = new FormData(ev.target as HTMLFormElement);

			const username = formData.get('username');
			const password = formData.get('password');

			if (!username || !password) {
				return;
			}

			const el = document.querySelector('#alert') as HTMLElement;
			const cl = el.classList;

			try {
				el.innerHTML = '';
				cl.remove('w3-green', 'w3-red', 'w3-hide', 'w3-show');

				const account = {
					username: String(username),
					password: String(password),
				};

				const res = await ipcRenderer.invoke(
					'manager:add_account',
					account,
				);

				if (res?.success) {
					// eslint-disable-next-line require-atomic-updates
					el.innerText = 'Account added successfully';
					accounts.push(account);
					updateAccounts();
				} else {
					// eslint-disable-next-line require-atomic-updates
					el.innerText =
						'An error occurred while trying to add the account';
				}

				el!.style.display = 'block';
				cl.remove('w3-hide');

				cl.add(
					res?.success ? 'w3-green' : 'w3-red',
					'w3-animate-opacity',
				);

				cl.remove('w3-hide');
				setTimeout(
					() => {
						cl.add('w3-hide');
						el.style.display = 'none';
						setTimeout(() => {
							el.innerText = '';
							cl.remove(
								'w3-show',
								'w3-hide',
								'w3-green',
								'w3-red',
							);
						}, 400);
					},
					res?.success ? 1_000 : 2_000,
				);
			} catch (error) {
				console.log(
					'An error occurred while trying to add the account',
					error,
				);

				el.innerText = `An error occurred while trying to add the account${error instanceof Error && error.message ? `: ${error.message}` : ''}`;

				cl.add('w3-red', 'show');
				cl.remove('w3-hide');

				setTimeout(() => {
					cl.add('w3-hide');
					el.style.display = 'none';
					setTimeout(() => {
						el.innerText = '';
						cl.remove('w3-show', 'w3-hide', 'w3-green', 'w3-red');
					}, 400);
				}, 2_000);
			} finally {
				btn.classList.remove('w3-disabled');
			}
		});
	}

	const [accountsOut, serversOut] = await Promise.all([
		ipcRenderer.invoke('manager:get_accounts'),
		fetch('https://game.aq.com/game/api/data/servers').then(async (resp) =>
			resp.json(),
		),
	]);

	try {
		accounts.push(...accountsOut);
	} catch (error) {
		console.error(error);
		// eslint-disable-next-line no-alert
		alert('An error occured trying to read accounts file');
	}

	servers.push(...serversOut);

	updateAccounts();
	updateServers();

	const removeSelectedBtn =
		document.querySelector<HTMLButtonElement>('#remove-selected')!;
	removeSelectedBtn.addEventListener('click', async () => {
		for (const el of document.querySelectorAll<HTMLButtonElement>(
			'#remove',
		)) {
			const input = el
				.closest('.w3-card')!
				.querySelector<HTMLInputElement>('input')!;
			if (!input.checked) {
				continue;
			}

			const username = el.dataset['username']!;
			await removeAccount({ username });

			const idx = accounts.findIndex((acc) => acc.username === username);
			if (idx !== -1) {
				accounts.splice(idx, 1);
			}
		}

		updateAccounts();
	});

	const startSelectedBtn =
		document.querySelector<HTMLButtonElement>('#start-selected')!;
	startSelectedBtn.addEventListener('click', async () => {
		for (const el of document.querySelectorAll<HTMLInputElement>(
			'#start',
		)) {
			const input = (el
				.closest('.w3-card') as HTMLDivElement)
				.querySelector('input') as HTMLInputElement;

			if (!input.checked) {
				continue;
			}

			el.disabled = true;

			await startAccount({
				username: el.dataset['username']!,
				password: el.dataset['password']!,
			});

			// eslint-disable-next-line @typescript-eslint/no-loop-func
			await new Promise((resolve) => {
				setTimeout(resolve, 1_000);
			});
		}
	});
});

type Server = {
	bOnline: number;
	bUpg: number;
	iChat: number;
	iCount: number;
	iLevel: number;
	iMax: number;
	iPort: number;
	sIP: string;
	sLang: string;
	sName: string;
};

type Account = {
	password: string;
	username: string;
};

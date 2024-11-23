import { ipcRenderer } from 'electron/renderer';

const accounts: Account[] = [];
const servers: RawServer[] = [];

ipcRenderer.on('manager:enable_button', async (_, username: string) => {
	await new Promise((resolve) => {
		setTimeout(resolve, 500);
	});

	for (const el of document.querySelectorAll<HTMLButtonElement>('#start')) {
		if (el.dataset['username'] === username) {
			el.disabled = false;
			el.classList.remove('disabled');
		}
	}
});

async function startAccount({ username, password }: Account) {
	const serversSelect =
		document.querySelector<HTMLSelectElement>('#servers')!;

	await ipcRenderer.invoke('manager:launch_game', {
		username,
		password,
		server: serversSelect.value,
	});
}

async function removeAccount({ username }: Pick<Account, 'username'>) {
	await ipcRenderer.invoke('manager:remove_account', username);
}

function toggleAccountState(ev: MouseEvent) {
	const checkbox = (ev.target as Element)!
		.closest('.card')!
		.querySelector('input') as HTMLInputElement;

	checkbox.checked = !checkbox.checked;
}

function updateAccounts() {
	const accountsContainer =
		document.querySelector<HTMLDivElement>('#accounts')!;
	accountsContainer.innerHTML = '';
	accountsContainer.innerHTML = accounts
		.map(
			(account) => `
					<div class="col-12 col-sm-6">
						<div class="card h-100">
							<div class="card-body d-flex flex-column flex-md-row justify-content-md-between" style="margin-top: auto;">
								<div class="d-flex align-items-center mb-3 mb-md-0">
									<input
										type="checkbox"
										class="form-check-input me-2"
										data-username="${account.username}"
										data-password="${account.password}"
									/>
									<h5 class="card-title m-0">
										<span class="username-toggle" style="cursor: pointer;">
											${account.username}
										</span>
									</h5>
								</div>
								<div class="d-flex flex-column flex-md-row align-items-md-center gap-2">
									<button class="btn btn-secondary" id="remove"
										data-username="${account.username}"
										data-password="${account.password}">Remove</button>
									<button class="btn btn-info" id="start"
										data-username="${account.username}"
										data-password="${account.password}"
									>Start</button>
								</div>
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
		// eslint-disable-next-line @typescript-eslint/no-loop-func
		el.onclick = async () => {
			el.disabled = true;
			el.classList.add('disabled');

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

document.addEventListener('DOMContentLoaded', async () => {
	{
		const form = document.querySelector<HTMLFormElement>('#form')!;
		const btn = document.querySelector<HTMLButtonElement>(
			'button[type=submit]',
		)!;

		form.onsubmit = async (ev: SubmitEvent) => {
			btn.classList.add('disabled');

			ev.preventDefault();

			const formData = new FormData(ev.target as HTMLFormElement);

			const username = formData.get('username');
			const password = formData.get('password');

			if (!username || !password) {
				return;
			}

			const el = document.querySelector('#alert') as HTMLDivElement;
			const cl = el.classList;

			try {
				el.innerHTML = '';
				cl.remove(
					'alert-success',
					'alert-danger',
					'alert-dismissible',
					'show',
				);

				const account = {
					username: String(username),
					password: String(password),
				};

				const res = await ipcRenderer.invoke(
					'manager:add_account',
					account,
				);

				if (res?.success) {
					el.innerText = 'Account added successfully';
					accounts.push(account);
					updateAccounts();
				} else {
					el.innerText =
						'An error occured while trying to add the account';
				}

				cl.add(res?.success ? 'alert-success' : 'alert-danger', 'show');
				cl.remove('d-none');

				setTimeout(
					() => {
						cl.add('hide');
						setTimeout(() => {
							cl.add('d-none');
							cl.remove(
								'show',
								'hide',
								'alert-success',
								'alert-danger',
							);
						}, 400);
					},
					res?.success ? 1_000 : 2_000,
				);
			} catch (error) {
				const err = error as Error;

				console.log(
					'An error occured while trying to add the account',
					err,
				);

				el.innerText = `An error occured while trying to add the account${err.message ? `: ${err.message}` : ''}`;
				el.innerHTML +=
					'<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

				cl.add('alert-danger', 'alert-dismissable', 'show');
				cl.remove('d-none');
			} finally {
				btn.classList.remove('disabled');
			}
		};
	}

	const [accountsOut, serversOut] = await Promise.all([
		ipcRenderer.invoke('manager:get_accounts'),
		fetch('https://game.aq.com/game/api/data/servers').then(async (resp) =>
			resp.json(),
		),
	]);

	accounts.push(...accountsOut);
	servers.push(...serversOut);

	updateAccounts();
	updateServers();

	{
		const btn =
			document.querySelector<HTMLButtonElement>('#remove-selected')!;
		btn.onclick = async () => {
			for (const el of document.querySelectorAll<HTMLButtonElement>(
				'#remove',
			)) {
				const checkbox = el.closest('.card')!.querySelector('input')!;
				if (!checkbox.checked) {
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
		};
	}

	{
		const btn =
			document.querySelector<HTMLButtonElement>('#start-selected')!;
		btn.onclick = async () => {
			for (const el of document.querySelectorAll<HTMLButtonElement>(
				'#start',
			)) {
				const checkbox = el.closest('.card')!.querySelector('input')!;
				if (!checkbox.checked) {
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
		};
	}
});

type RawServer = {
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

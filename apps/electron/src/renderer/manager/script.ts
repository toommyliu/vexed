import { ipcRenderer } from 'electron';

const accounts: Account[] = [];
const servers: RawServer[] = [];

async function init() {
	const [accountsOut, serversOut] = await Promise.all([
		ipcRenderer.invoke('manager:get_accounts'),
		fetch('https://game.aq.com/game/api/data/servers').then(async (resp) =>
			resp.json(),
		),
	]);

	accounts.push(...accountsOut);
	servers.push(...serversOut);

	// console.log('accounts', accounts);
	// console.log('servers', servers);

	renderAccounts();

	// {
	// 	const select = document.querySelector('#servers') as HTMLSelectElement;

	// 	select.innerHTML = servers
	// 		.map(
	// 			(server: RawServer) =>
	// 				`<option value="${server.sName}">${server.sName} (${server.iCount})</option>`,
	// 		)
	// 		.join('');
	// }

	ipcRenderer.on('manager:enable_button', (_, username: string) => {
		console.log(`enable button for ${username}`);
	});
}

function getActiveAccounts() {
	return Array.from(
		document.querySelectorAll<HTMLInputElement>(
			'input[type="checkbox"]:checked',
		),
	).map((el, idx) => ({
		username: el.dataset['username'],
		password: el.dataset['password'],
		idx,
	}));
}

function renderAccounts() {
	const accountsDiv = document.querySelector('#accounts')!;
	accountsDiv.innerHTML = '';

	for (const account of accounts) {
		if (!account?.username && !account?.password) {
			continue;
		}

		const { username, password } = account;

		const div = document.createElement('div');
		div.innerHTML = `
    <div class="col">
        <div class="card h-100 p-2" style="background-color: #111416">
            <div class="card-body">
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                    <div class="d-flex align-items-center">
                        <div class="form-check">
                            <input type="checkbox"
                                id="checkbox-${username}"
                                data-username="${username}"
                                data-password="${password}"
                                class="form-check-input"
                            >
                            <label for="checkbox-${username}" class="form-check-label">${username}</label>
                        </div>
                    </div>

					<div class="d-grid d-md-flex">
						<button class="btnRemove btn btn-secondary btn-sm mb-2 mb-md-0">Remove</button>
						<button class="btnStart btn btn-primary btn-sm">Start</button>
					</div>
                </div>
            </div>
        </div>
    </div>
`;

		{
			const btn = div.querySelector('.btnRemove') as HTMLButtonElement;
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			btn.onclick = async () => {
				console.log(account);
			};
		}

		{
			const btn = div.querySelector('.btnStart') as HTMLButtonElement;
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			btn.onclick = async () => {
				// const server = (
				// 	document.querySelector('#servers') as HTMLSelectElement
				// ).value;
				await ipcRenderer.invoke('manager:launch_game', {
					...account,
					// server,
				});
			};
		}

		accountsDiv.appendChild(div);
	}

	// {
	// 	const btn = document.querySelector(
	// 		'#remove-selected',
	// 	)! as HTMLButtonElement;
	// 	btn.onclick = async () => {
	// 		const selectedAccounts = getActiveAccounts();
	// 		if (selectedAccounts.length === 0) return;

	// 		if (
	// 			// eslint-disable-next-line no-alert
	// 			confirm(
	// 				`Are you sure you want to remove ${selectedAccounts.length} account(s)?`,
	// 			)
	// 		) {
	// 			for (let idx = accounts.length - 1; idx >= 0; idx--) {
	// 				if (
	// 					selectedAccounts.some(
	// 						(selected) =>
	// 							selected.username === accounts[idx]?.username,
	// 					)
	// 				) {
	// 					await ipcRenderer.invoke(
	// 						'manager:remove_account',
	// 						accounts[idx]?.username,
	// 					);
	// 					accounts.splice(idx, 1);
	// 				}
	// 			}

	// 			renderAccounts();
	// 		}
	// 	};
	// }

	// {
	// 	const btn = document.querySelector('#start-selected');
	// 	btn!.addEventListener('click', async () => {
	// 		const accounts = Array.from(
	// 			document.querySelectorAll<HTMLInputElement>(
	// 				'input[type="checkbox"]:checked',
	// 			),
	// 		).map((el) => ({
	// 			username: el.dataset['username'],
	// 			password: el.dataset['password'],
	// 		}));

	// 		// Disable all buttons
	// 		const buttons = document.querySelectorAll('button');
	// 		for (const button of buttons) {
	// 			button.setAttribute('disabled', 'true');
	// 		}

	// 		for (const account of accounts) {
	// 			await ipcRenderer.invoke('manager:launch_game', account);
	// 			// eslint-disable-next-line @typescript-eslint/no-loop-func
	// 			await new Promise((resolve) => {
	// 				setTimeout(resolve, 1_000);
	// 			});
	// 		}

	// 		// Enable all buttons
	// 		for (const button of buttons) {
	// 			button.removeAttribute('disabled');
	// 		}
	// 	});
	// }
}

document.addEventListener('DOMContentLoaded', init);

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

type Server = { name: string };

type Account = {
	password: string;
	username: string;
};

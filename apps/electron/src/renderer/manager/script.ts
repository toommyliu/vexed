const accounts = [
	{ username: 'user1', password: 'password123' },
	{ username: 'user2', password: 'securePassword!' },
	{ username: 'user3', password: 'myPassword456' },
	{ username: 'user4', password: 'qwerty789' },
	{ username: 'user5', password: 'passw0rd!@' },
	{ username: 'user6', password: 'helloWorld99' },
	{ username: 'user7', password: 'sunshine123' },
	{ username: 'user8', password: 'ilovepassword' },
	{ username: 'user9', password: 'password789' },
	{ username: 'user10', password: 'welcome2024' },
];

const serverList: { sName: string }[] = [];

async function renderServerList() {
	const response = await fetch('https://game.aq.com/game/api/data/servers');

	if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

	const data = await response.json();

	serverList.splice(0, serverList.length, ...data);

	const serversSelect = document.querySelector('#servers')!;

	serversSelect.innerHTML = data
		.map(
			(server) =>
				`<option value="${server.sName}">${server.sName}</option>`,
		)
		.join('');
}

function renderAccounts() {
	const $div = document.querySelector('#accounts')!;
	$div.innerHTML = '';

	for (const account of accounts) {
		const div = document.createElement('div');

		div.className = 'col';
		div.style.cursor = 'pointer';

		div.innerHTML += `
            <div class="card bg-dark text-white h-100">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-2">
                            <div class="form-check">
                                <input class="form-check-input mt-2" type="checkbox" id="check-${account.username}">
                            </div>
                            <h5 class="card-title mb-0">${account.username}</h5>
                        </div>
                        <button class="btn btn-link text-danger p-0" data-username="${account.username}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

		div.addEventListener('click', () => {
			const input = div.querySelector(
				`#check-${account.username}`,
			) as HTMLInputElement;
			input.checked = !input.checked;
		});

		div
			.querySelector(`button[data-username="${account.username}"]`)
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			?.addEventListener('click', (ev) => {
				ev.stopPropagation();

				const username2 = (ev.target as HTMLElement)
					.closest('button')
					?.getAttribute('data-username');

				console.log('Delete account:', username2);
			});

		$div.appendChild(div);
	}
}

void renderServerList();
renderAccounts();

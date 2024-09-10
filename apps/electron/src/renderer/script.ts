import './scripts/fast-travels';
import './scripts/follower';
import './scripts/loader-grabber';
import './scripts/packet-spammer';

import { ipcRenderer } from 'electron';

const { settings, auth, world, player, flash, bank } = bot;

const mapping: Map<string, HTMLElement> = new Map();

let lastRoomID: number | undefined;

window.windows = {
	game: window,
	tools: { fastTravels: null, loaderGrabber: null, follower: null },
	packets: { logger: null, spammer: null },
};

// #region dom manipulation
window.addEventListener('DOMContentLoaded', async () => {
	{
		const keys = ['scripts', 'tools', 'packets', 'options'];
		for (const key of keys) {
			const element = document.querySelector(
				`#${key}-dropdowncontent`,
			) as HTMLElement;
			mapping.set(key, element);
		}
	}

	{
		const $btn: HTMLButtonElement =
			document.querySelector('#scripts-load')!;
		$btn.addEventListener('click', async () => {
			const scriptBody = await ipcRenderer.invoke('root:load_script');
			if (!scriptBody) {
				return;
			}

			const b64_out = Buffer.from(scriptBody, 'base64').toString('utf8');

			const script = document.createElement('script');
			script.type = 'module';
			script.textContent = `(async () => {
			console.log('[' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + '] Script started');
			${b64_out}
			console.log('[' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + '] Script finished');
			})();`;
			document.body.appendChild(script);
		});
	}

	{
		const $btn: HTMLButtonElement = document.querySelector(
			'#scripts-toggle-dev-tools',
		)!;
		$btn.addEventListener('click', () => {
			ipcRenderer.send('root:toggle-dev-tools');
		});
	}

	{
		const $btn: HTMLButtonElement = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(1)',
		)!;
		$btn.addEventListener('click', () => {
			window.windows.tools.fastTravels = window.open(
				'./pages/tools/fast-travels/index.html',
				undefined,
				'width=510,height=494',
			);
		});
	}

	{
		const $btn: HTMLButtonElement = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(2)',
		)!;
		$btn.addEventListener('click', () => {
			window.windows.tools.loaderGrabber = window.open(
				'./pages/tools/loader-grabber/index.html',
				undefined,
				'width=363,height=542',
			);
		});
	}

	{
		const $btn: HTMLButtonElement = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(3)',
		)!;
		$btn.addEventListener('click', () => {
			window.windows.tools.follower = window.open(
				'./pages/tools/follower/index.html',
				undefined,
				'width=402,height=466',
			);
		});
	}

	{
		const $btn: HTMLButtonElement = document.querySelector(
			'#packets-dropdowncontent > button:nth-child(1)',
		)!;
		$btn.addEventListener('click', () => {
			window.windows.packets.logger = window.open(
				'./pages/packets/logger/index.html',
				undefined,
				'width=560,height=286',
			);
		});
	}

	{
		const $btn: HTMLButtonElement = document.querySelector(
			'#packets-dropdowncontent > button:nth-child(2)',
		)!;
		$btn.addEventListener('click', () => {
			window.windows.packets.spammer = window.open(
				'./pages/packets/spammer/index.html',
				undefined,
				'width=596,height=325',
			);
		});
	}

	const options = document.querySelectorAll('[id^="option-"]');
	for (const option of options) {
		switch (option.tagName) {
			case 'INPUT':
				option.addEventListener('change', (ev) => {
					settings.walkSpeed = Number.parseInt(
						(ev.target as HTMLInputElement).value,
						10,
					);
				});
				break;
			case 'BUTTON':
				option.addEventListener('click', (ev) => {
					// Prevent the dropdown from closing when an option is clicked
					ev.stopPropagation();

					const checked =
						option.getAttribute('data-checked') === 'true';
					option.setAttribute(
						'data-checked',
						checked ? 'false' : 'true',
					);
					(
						option.querySelector('.checkmark') as HTMLElement
					).style.display = checked ? 'none' : 'block';

					if (option.textContent!.trim() === 'Infinite Range') {
						settings.infiniteRange = !checked;
					} else if (option.textContent!.trim() === 'Provoke Map') {
						settings.provokeMap = !checked;
					} else if (option.textContent!.trim() === 'Provoke Cell') {
						settings.provokeCell = !checked;
					} else if (option.textContent!.trim() === 'Enemy Magnet') {
						settings.enemyMagnet = !checked;
					} else if (option.textContent!.trim() === 'Lag Killer') {
						settings.lagKiller = !checked;
					} else if (option.textContent!.trim() === 'Hide Players') {
						settings.hidePlayers = !checked;
					} else if (
						option.textContent!.trim() === 'Skip Cutscenes'
					) {
						settings.skipCutscenes = !checked;
					}
				});
				break;
		}
	}

	const $cells: HTMLSelectElement = document.querySelector('#cells')!;
	const $pads: HTMLSelectElement = document.querySelector('#pads')!;
	const $x: HTMLButtonElement = document.querySelector('#x')!;
	const $bank: HTMLButtonElement = document.querySelector('#bank')!;

	const update = (force = false) => {
		if (
			!force &&
			(!auth.loggedIn ||
				world.loading ||
				!player.isLoaded() ||
				world.roomID === lastRoomID)
		) {
			return;
		}

		$cells.innerHTML = '';

		for (const cell of world.cells) {
			const option = document.createElement('option');
			option.value = cell;
			option.textContent = cell;
			$cells.appendChild(option);
		}

		$cells.value = player.cell;
		$pads.value = player.pad;

		lastRoomID = world.roomID;
	};

	const jump = () => {
		const cell = $cells.value ?? 'Enter';
		const pad = $pads.value ?? 'Spawn';
		flash.call(() => swf.Jump(cell, pad));
	};

	$cells.addEventListener('click', () => update(false));
	$cells.addEventListener('change', jump);
	$pads.addEventListener('change', jump);
	$x.addEventListener('click', () => update(true));

	$bank.addEventListener('click', async () => {
		if (!player.isReady()) {
			return;
		}

		await bank.open();
	});
});

// #region input
window.addEventListener('click', (ev) => {
	for (const [key, el] of mapping.entries()) {
		if ((ev.target as HTMLElement).id === key) {
			// Show the selected dropdown
			el.classList.toggle('w3-show');
		} else if ((ev.target as HTMLElement).id !== 'option-walkspeed') {
			// Hide the other dropdowns
			el.classList.remove('w3-show');
		}
	}
});

window.addEventListener('mousedown', (ev) => {
	// Close all dropdowns when the game is focused
	if ((ev.target as HTMLElement).id === 'swf') {
		for (const el of mapping.values()) {
			el.classList.remove('w3-show');
		}
	}
});

window.addEventListener('keydown', (ev) => {
	// Allow certain shortcuts while the game is focused
	if (ev.metaKey /* CMD */ && (ev.target as HTMLElement).id === 'swf') {
		switch (ev.key.toLowerCase()) {
			case 'w': // CMD+W
			case 'q': // CMD+Q
				window.close();
				break;
			case 'r': // CMD+SHIFT+R
				if (ev.shiftKey) {
					window.location.reload();
				}

				break;
		}
	}
});
// #endregion

// #region account manager
ipcRenderer.on('root:login', (_, account: Account) => {
	window.account = account;
});

window.progress = async ([percentage]: [number]) => {
	if (
		percentage === 100 &&
		window?.account &&
		'username' in window.account &&
		'password' in window.account
	) {
		await bot.sleep(1_000);
		auth.login(window.account.username, window.account.password);
		if (window.account.server) {
			await bot.waitUntil(() => auth.servers.length > 0);
			auth.connectTo(window.account.server);
			await bot.waitUntil(() => player.isReady());
		}

		delete window.account;
	}
};
// #endregion

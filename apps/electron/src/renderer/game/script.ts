require('./scripts/fast-travels');
require('./scripts/follower');
require('./scripts/loader-grabber');
require('./scripts/packet-spammer');

const { ipcRenderer } = require('electron');

/**
 * @type {import('./botting/api/Bot')}
 */
const bot = Bot.getInstance();
const { settings, auth, world, player, flash, bank } = bot;

const mapping = new Map();

// room jump
let lastRoomID;

window.windows = {
	game: window,
	tools: { fastTravels: null, loaderGrabber: null, follower: null },
	packets: { logger: null, spammer: null },
};

//#region dom manipulation
window.addEventListener('DOMContentLoaded', async () => {
	const keys = ['scripts', 'tools', 'packets', 'options'];
	for (const k of keys) {
		mapping.set(k, document.getElementById(`${k}-dropdowncontent`));
	}

	{
		const $btn = document.querySelector('#scripts-load');
		$btn.addEventListener('click', async () => {
			const scriptBody = await ipcRenderer.invoke('root:load_script');
			if (!scriptBody) {
				return;
			}

			const b64_out = Buffer.from(scriptBody, 'base64').toString('utf-8');

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
		const $btn = document.querySelector('#scripts-toggle-dev-tools');
		$btn.addEventListener('click', () => {
			ipcRenderer.send('root:toggle-dev-tools');
		});
	}

	{
		const $btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(1)',
		);
		$btn.addEventListener('click', () => {
			window.windows.tools.fastTravels = window.open(
				'./pages/tools/fast-travels/index.html',
				null,
				'width=510,height=494',
			);
		});
	}
	{
		const $btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(2)',
		);
		$btn.addEventListener('click', () => {
			window.windows.tools.loaderGrabber = window.open(
				'./pages/tools/loader-grabber/index.html',
				null,
				'width=363,height=542',
			);
		});
	}
	{
		const $btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(3)',
		);
		$btn.addEventListener('click', () => {
			window.windows.tools.follower = window.open(
				'./pages/tools/follower/index.html',
				null,
				'width=402,height=466',
			);
		});
	}

	{
		const $btn = document.querySelector(
			'#packets-dropdowncontent > button:nth-child(1)',
		);
		$btn.addEventListener('click', () => {
			window.windows.packets.logger = window.open(
				'./pages/packets/logger/index.html',
				null,
				'width=560,height=286',
			);
		});
	}

	{
		const $btn = document.querySelector(
			'#packets-dropdowncontent > button:nth-child(2)',
		);
		$btn.addEventListener('click', () => {
			window.windows.packets.spammer = window.open(
				'./pages/packets/spammer/index.html',
				null,
				'width=596,height=325',
			);
		});
	}

	const options = document.querySelectorAll('[id^="option-"]');
	for (const option of options) {
		switch (option.tagName) {
			case 'INPUT':
				option.addEventListener('change', (ev) => {
					settings.walkSpeed = ev.target.value;
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
					option.querySelector('.checkmark').style.display = checked
						? 'none'
						: 'block';

					switch (option.textContent.trim()) {
						case 'Infinite Range':
							settings.infiniteRange = !checked;
							break;
						case 'Provoke Map':
							settings.provokeMap = !checked;
							break;
						case 'Provoke Cell':
							settings.provokeCell = !checked;
							break;
						case 'Enemy Magnet':
							settings.enemyMagnet = !checked;
							break;
						case 'Lag Killer':
							settings.lagKiller = !checked;
							break;
						case 'Hide Players':
							settings.hidePlayers = !checked;
							break;
						case 'Skip Cutscenes':
							settings.skipCutscenes = !checked;
							break;
					}
				});
				break;
		}
	}

	const $cells = document.querySelector('#cells');
	const $pads = document.querySelector('#pads');
	const $x = document.querySelector('#x');
	const $bank = document.querySelector('#bank');

	const update = (force = false) => {
		if (
			!force &&
			(!auth.loggedIn ||
				world.loading ||
				!player.loaded ||
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
		flash.call(swf.Jump, cell, pad);
	};

	$cells.addEventListener('click', () => update(false));
	$cells.addEventListener('change', jump);
	$pads.addEventListener('change', jump);
	$x.addEventListener('click', () => update(true));

	$bank.addEventListener('click', async () => {
		if (!auth.loggedIn || world.loading || !player.loaded) {
			return;
		}

		await bank.open();
	});
});
//#endregion

//#region input
window.addEventListener('click', (ev) => {
	mapping.forEach((el, key) => {
		if (ev.target.id === key) {
			// Show the selected dropdown
			el.classList.toggle('w3-show');
		} else {
			// Don't close for this option
			if (ev.target.id !== 'option-walkspeed') {
				// Hide the other dropdowns
				el.classList.remove('w3-show');
			}
		}
	});
});

window.addEventListener('mousedown', (ev) => {
	// Close all dropdowns when the game is focused
	if (ev.target.id === 'swf') {
		mapping.forEach((el) => {
			el.classList.remove('w3-show');
		});
	}
});

window.addEventListener('keydown', (ev) => {
	// Allow certain shortcuts while the game is focused
	if (ev.metaKey /* CMD */ && ev.target.id === 'swf') {
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
//#endregion

//#region account manager
ipcRenderer.on('root:login', (ev, account) => {
	window.account = account;
});

window.progress = async ([percentage]) => {
	if (
		percentage === 100 &&
		window?.account &&
		'username' in window.account &&
		'password' in window.account
	) {
		await bot.sleep(1000);
		auth.login(window.account.username, window.account.password);
		if (window.account.server) {
			await bot.waitUntil(() => auth.servers.length > 0);
			auth.connectTo(window.account.server);
			await bot.waitUntil(
				() => auth.loggedIn && !world.loading && player.loaded,
			);
		}
		delete window.account;
	}
};
//#endregion

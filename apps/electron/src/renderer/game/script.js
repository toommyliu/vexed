const { ipcRenderer } = require('electron');

/**
 * @type {import('./botting/api/Bot')}
 */
const bot = Bot.getInstance();
const { settings } = bot;

const mapping = new Map();

// room jump
let roomID;

// follower
let f_intervalID;
let f_index = 0;
let f_config = {};

// packet spammer
let p_intervalID;
let p_index = 0;

window.windows = {
	game: window,
	tools: { fastTravels: null, loaderGrabber: null, follower: null },
	packets: { logger: null, spammer: null },
};

window.addEventListener('DOMContentLoaded', async () => {
	const keys = ['scripts', 'tools', 'packets', 'options'];
	for (const k of keys) {
		mapping.set(k, document.getElementById(`${k}-dropdowncontent`));
	}

	{
		const $btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(1)',
		);
		$btn.addEventListener('click', () => {
			window.windows.tools.fastTravels = window.open(
				'./pages/tools/fast-travels/index.html',
				null,
				'width=520,height=524',
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
				option.addEventListener('click', () => {
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
			(!bot.auth.loggedIn ||
				bot.world.loading ||
				!bot.player.loaded ||
				bot.world.roomID === roomID)
		) {
			return;
		}

		$cells.innerHTML = '';

		for (const cell of bot.world.cells) {
			const option = document.createElement('option');
			option.value = cell;
			option.textContent = cell;
			$cells.appendChild(option);
		}

		$cells.value = bot.player.cell;
		$pads.value = bot.player.pad;

		roomID = bot.world.roomID;
	};

	const jump = () => {
		const cell = $cells.value ?? 'Enter';
		const pad = $pads.value ?? 'Spawn';
		bot.flash.call(swf.Jump, cell, pad);
	};

	$cells.addEventListener('click', () => update(false));
	$cells.addEventListener('change', jump);
	$pads.addEventListener('change', jump);
	$x.addEventListener('click', () => update(true));

	$bank.addEventListener('click', async () => {
		if (!bot.auth.loggedIn || bot.world.loading || !bot.player.loaded) {
			return;
		}

		await bot.bank.open();
	});

	const $script_load = document.querySelector('#scripts-load');
	const $scripts_toggle_dev_tools = document.querySelector(
		'#scripts-toggle-dev-tools',
	);

	$script_load.addEventListener('click', async () => {
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

	$scripts_toggle_dev_tools.addEventListener('click', () => {
		ipcRenderer.send('root:toggle-dev-tools');
	});
});

window.addEventListener('click', (ev) => {
	mapping.forEach((el, key) => {
		if (ev.target.id === key) {
			// Show the selected dropdown
			el.classList.toggle('w3-show');
		} else {
			// Hide the other dropdowns
			el.classList.remove('w3-show');
		}
	});
});

window.addEventListener('message', async (ev) => {
	const {
		data: { event, args },
	} = ev;

	switch (event) {
		//#region fast travel
		case 'tools:fasttravel:join':
			if (!bot.auth.loggedIn || bot.world.loading || !bot.player.loaded) {
				return;
			}

			await bot.world.join(
				`${args.map}-${args.roomNumber}`,
				args.cell ?? 'Enter',
				args.pad ?? 'Spawn',
				1,
			);
			break;
		//#endregion
		// #region loader grabber
		case 'tools:loadergrabber:load':
			{
				if (!bot.auth.loggedIn) {
					return;
				}

				const { type, id } = args;

				switch (type) {
					case 0: // hair shop
						bot.flash.call(swf.LoadHairShop, id);
						break;
					case 1: // shop
						bot.flash.call(swf.LoadShop, id);
						break;
					case 2: // quest
						bot.flash.call(swf.LoadQuest, id);
						break;
					case 3: // armor customizer
						bot.flash.call(swf.LoadArmorCustomizer);
						break;
				}
			}
			break;
		case 'tools:loadergrabber:grab':
			{
				if (!bot.auth.loggedIn) {
					return;
				}

				const { type } = args;

				let ret;

				switch (type) {
					case 0: // shop
						if (!bot.shops.loaded || !bot.shops.info) {
							return;
						}

						ret = bot.shops.info;
						break;
					case 1: // quests
						ev.source.postMessage({
							event: 'tools:loadergrabber:grab',
							args: {
								data: bot.flash.call(swf.GetQuestTree),
								type: 1,
							},
						});
						break;
					case 2: // inventory
						if (!bot.player.loaded || !bot.inventory.items.length) {
							return;
						}

						ret = bot.flash.call(swf.GetInventoryItems);
						break;
					case 3: // temp. inventory
						if (!bot.player.loaded) {
							return;
						}

						ret = bot.flash.call(swf.GetTempItems);
						break;
					case 4: // bank
						if (!bot.player.loaded) {
							return;
						}

						ret = bot.flash.call(window.swf.GetBankItems);
						break;
					case 5: // cell monsters
					case 6: // map monsters
						if (bot.world.loading) {
							return;
						}

						// prettier-ignore
						ret = type === 5
							? bot.flash.call(swf.GetMonstersInCell)
							: bot.world.monsters;
						break;
				}

				if (ret) {
					ev.source.postMessage({
						event: 'tools:loadergrabber:grab',
						args: { data: ret, type: type },
					});
				}
			}
			break;
		//#endregion
		//#region follower
		case 'follower:start':
			if (f_intervalID) {
				await bot.timerManager.clearInterval(f_intervalID);
				f_intervalID = null;
				await bot.sleep(1000);
			}

			if (!args.player || args.player === '') {
				args.player = bot.auth.username;
			}

			f_config = args;

			f_intervalID = bot.timerManager.setInterval(async () => {
				if (
					!bot.auth.loggedIn ||
					bot.world.loading ||
					!bot.player.loaded
				) {
					return;
				}

				const isTargetInMap = bot.flash.call(
					swf.GetCellPlayers,
					f_config,
				);
				if (
					!isTargetInMap &&
					f_config.player.toLowerCase() !==
						bot.auth.username.toLowerCase()
				) {
					bot.world.goto(f_config.player);
					await bot.waitUntil(
						() => !bot.world.loading && bot.player.loaded,
					);
				}

				await bot.waitUntil(() => {
					return flash
						.call(swf.PlayersInMap)
						?.some(
							(p) =>
								p.toLowerCase() ===
								f_config.player.toLowerCase(),
						);
				});

				bot.world.setSpawnPoint();

				if (f_config.attackPriority.length > 0) {
					for (const mon of f_config.attackPriority) {
						if (bot.world.isMonsterAvailable(mon)) {
							bot.world.attack(mon);
							break;
						}
					}
				}

				if (!bot.combat.hasTarget()) {
					bot.combat.attack('*');
				}

				if (bot.combat.hasTarget()) {
					await combat.useSkill(f_config.skills[f_index]);
					f_index = (f_index + 1) % f_config.skills.length;
					await bot.sleep(f_config.skillDelay);
				}
			}, 1000);

			break;
		case 'follower:stop':
			if (f_intervalID) {
				await bot.timerManager.clearInterval(f_intervalID);
				f_intervalID = null;
				f_config = {};
				f_index = 0;
			}
			break;
		case 'follower:me':
			ev.source.postMessage({
				event: 'follower:me',
				args: bot.auth.username,
			});
			break;
		//#endregion
		//#region packets
		case 'packets:spammer:on':
			if (p_intervalID) {
				await bot.timerManager.clearInterval(p_intervalID);
				p_intervalID = null;
				await bot.sleep(1000);
			}

			if (args.packets[0] === '') {
				return;
			}

			p_intervalID = bot.timerManager.setInterval(
				async () => {
					if (
						!bot.auth.loggedIn ||
						bot.world.loading ||
						!bot.player.loaded
					) {
						return;
					}

					bot.packets.sendServer(args.packets[p_index]);
					p_index = (p_index + 1) % args.packets.length;
				},
				Number.parseInt(args.delay) ?? 1000,
			);
			break;
		case 'packets:spammer:off':
			if (p_intervalID) {
				await bot.timerManager.clearInterval(p_intervalID);
				p_intervalID = null;
				p_index = 0;
			}
			break;
		//#endregion
		default:
			console.log('Unhandled event', event);
			break;
	}
});

/**
 * @type {import('./botting/api/Bot')}
 */
const bot = Bot.getInstance();
const { settings } = bot;

const mapping = new Map();

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
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(1)',
		);
		btn.addEventListener('click', () => {
			if (window.windows.tools.fastTravels && !window.windows.tools.fastTravels.closed) {
				window.windows.tools.fastTravels.focus();
			} else {
				window.windows.tools.fastTravels = window.open(
					'./pages/tools/fast-travels/index.html',
					null,
					'width=520,height=524',
				);
			}
		});
	}
	{
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(2)',
		);
		btn.addEventListener('click', () => {
			if (window.windows.tools.loaderGrabber && !window.windows.tools.loaderGrabber.closed) {
				window.windows.tools.loaderGrabber.focus();
			} else {
				window.windows.tools.loaderGrabber = window.open(
					'./pages/tools/loader-grabber/index.html',
					null,
				);
			}
		});
	}
	{
		const btn = document.querySelector(
			'#tools-dropdowncontent > button:nth-child(3)',
		);
		btn.addEventListener('click', () => {
			if (window.windows.tools.follower && !window.windows.tools.follower.closed) {
				window.windows.tools.follower.focus();
			} else {
				window.windows.tools.follower = window.open(
					'./pages/tools/follower/index.html',
					null,
				);
			}
		});
	}

	{
		const btn = document.querySelector(
			'#packets-dropdowncontent > button:nth-child(1)',
		);
		btn.addEventListener('click', () => {
			if (window.windows.packets.logger && !window.windows.packets.logger.closed) {
				window.windows.packets.logger.focus();
			} else {
				window.windows.packets.logger = window.open(
					'./pages/packets/logger/index.html',
					null,
				);
			}
		});
	}

	{
		const btn = document.querySelector(
			'#packets-dropdowncontent > button:nth-child(2)',
		);
		btn.addEventListener('click', () => {
			if (window.windows.packets.spammer && !window.windows.packets.spammer.closed) {
				window.windows.packets.spammer.focus();
			} else {
				window.windows.packets.spammer = window.open(
					'./pages/packets/spammer/index.html',
					null,
				);
			}
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

/**
 * @param {Event} ev
 */
window.onmessage = async (ev) => {
	const {
		data: { event, args },
	} = ev;

	switch (event) {
		//#region fast travel
		case 'fast-travel':
			await bot.world.join(
				`${args.map}-${args.roomNumber}`,
				args.cell ?? 'Enter',
				args.pad ?? 'Spawn',
				1,
			);
			break;
		//#endregion
		// #region loader grabber
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

				const isTargetInMap = bot.flash.call(swf.GetCellPlayers, f_config);
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
};

var {
	setIntervalAsync,
	clearIntervalAsync,
} = require('set-interval-async/fixed');
var { ipcRenderer: ipc } = require('electron');

ipc.on('generate-id', (event, windowID) => {
	console.log(`Your shared ID is: "${windowID}"`);
	window.id = windowID;
});

ipc.on('game:login', function (event, account) {
	window.account = account;
});

let maid = {
	on: false,
	player: null,
	skills: null,
	skillDelay: -1,
	skillWait: false,
	attackPriority: [],
};
let m_intervalID = null;
let skillIdx = 0;

let p_intervalID = null;
let p_idx = 0;
let p_packets = [];

$(window).on('message', async function (event) {
	console.log('Received message', event.originalEvent.data);

	switch (event.originalEvent.data.event) {
		case 'tools:fast_travels:generate_id':
		case 'tools:loader_grabber:generate_id':
		case 'packets:logger:generate_id':
		case 'packets:spammer:generate_id':
		case 'tools:maid:generate_id':
			{
				event.originalEvent.source.postMessage({
					event: event.originalEvent.data.event,
					resp: window.id,
				});
			}
			//#region packets
			break;
		case 'packets:logger:save':
			{
				const { packets } = event.originalEvent.data;
				ipc.send('packets:logger:save', packets);
			}
			break;
		case 'packets:spammer:start':
			{
				const { packets, delay } = event.originalEvent.data;

				p_packets = packets;

				if (!p_intervalID) {
					p_intervalID = setIntervalAsync(function () {
						if (!auth.loggedIn || world.loading) {
							return;
						}

						Bot.getInstance().packets.sendServer(
							p_packets[p_idx++],
						);
						if (p_idx >= p_packets.length) {
							p_idx = 0;
						}
					}, delay);
				}
			}
			break;
		case 'packets:spammer:stop':
			{
				if (p_intervalID) {
					clearIntervalAsync(p_intervalID);
					p_intervalID = null;
				}
				p_packets = [];
				p_idx = 0;
			}
			break;
		//#endregion
		//#region tools
		//#region fast travels
		case 'tools:fast_travels:join':
			{
				if (!auth.loggedIn) {
					return;
				}

				await Bot.getInstance().waitUntil(() =>
					world.isActionAvailable(GameAction.Transfer),
				);

				const { map, cell, pad, roomNumber } =
					event.originalEvent.data.data;
				const _roomNumber = Number.parseInt(roomNumber, 10);

				Bot.getInstance().flash.call(
					window.swf.Join,
					`${map}-${_roomNumber}`,
					cell ?? 'Enter',
					pad ?? 'Spawn',
				);
			}
			break;
		//#endregion
		case 'tools:fast_travel:join':
			{
				if (!auth.loggedIn) {
					return;
				}

				const { map, cell, pad, roomNumber } =
					event.originalEvent.data.data;
				const _roomNumber = Number.parseInt(roomNumber, 10);

				Bot.getInstance().flash.call(
					window.swf.Join,
					`${map}-${_roomNumber}`,
					cell ?? 'Enter',
					pad ?? 'Spawn',
				);
				// await Bot.getInstance().world.join(`${map}-${_roomNumber}`, cell ?? "Enter", pad ?? "Spawn");
			}
			break;
		case 'tools:loader_grabber:load_hair_shop':
			Bot.getInstance().shops.loadHairShop(event.originalEvent.data.resp);
			break;
		case 'tools:loader_grabber:load_shop':
			await Bot.getInstance().shops.load(event.originalEvent.data.resp);
			break;
		case 'tools:loader_grabber:load_quest':
			await Bot.getInstance().quests.load(event.originalEvent.data.resp);
			break;
		case 'tools:loader_grabber:grab_shop':
			event.originalEvent.source.postMessage(
				{
					event: event.originalEvent.data.event,
					resp: Bot.getInstance().shops.info,
				},
				'*',
			);
			break;
		case 'tools:loader_grabber:grab_quests':
			event.originalEvent.source.postMessage(
				{
					event: event.originalEvent.data.event,
					resp: Bot.getInstance().flash.call(window.swf.GetQuestTree),
				},
				'*',
			);
			break;
		case 'tools:loader_grabber:grab_inventory':
			event.originalEvent.source.postMessage(
				{
					event: event.originalEvent.data.event,
					resp: Bot.getInstance().flash.call(
						window.swf.GetInventoryItems,
					),
				},
				'*',
			);
			break;
		case 'tools:loader_grabber:grab_temp_inventory':
			event.originalEvent.source.postMessage(
				{
					event: event.originalEvent.data.event,
					resp: Bot.getInstance().flash.call(window.swf.GetTempItems),
				},
				'*',
			);
			break;
		case 'tools:loader_grabber:grab_bank':
			event.originalEvent.source.postMessage(
				{
					event: event.originalEvent.data.event,
					resp: Bot.getInstance().flash.call(window.swf.GetBankItems),
				},
				'*',
			);
			break;
		case 'tools:loader_grabber:grab_cell_monsters':
			event.originalEvent.source.postMessage({
				event: event.originalEvent.data.event,
				resp: Bot.getInstance().flash.call(
					window.swf.GetMonstersInCell,
				),
			});
			break;
		case 'tools:loader_grabber:grab_map_monsters':
			event.originalEvent.source.postMessage({
				event: event.originalEvent.data.event,
				resp: Bot.getInstance().world.monsters,
			});
			break;
		case 'tools:loader_grabber:load_armor_customize':
			Bot.getInstance().shops.loadArmorCustomise();
			break;
		case 'tools:loader_grabber:grab_quests':
			event.originalEvent.source.postMessage(
				{
					event: event.originalEvent.data.event,
					resp: flash.call(window.swf.GetQuestTree),
				},
				'*',
			);
			break;
		case 'tools:maid:me':
			event.originalEvent.source.postMessage(
				{
					event: event.originalEvent.data.event,
					resp: Bot.getInstance().auth.username,
				},
				'*',
			);
			break;
		case 'tools:maid:start': {
			const {
				player,
				skillSet,
				skillDelay,
				skillWait,
				attackPriority,
				copyWalk,
			} = event.originalEvent.data;
			maid.on = true;
			maid.skills = skillSet;
			maid.player = player === '' ? auth.username : player;
			maid.player = maid.player.toLowerCase();
			maid.skillDelay = Number.parseInt(skillDelay);
			maid.skillWait = skillWait;
			maid.attackPriority = attackPriority;
			maid.copyWalk = copyWalk;

			if (!maid.skills.includes(',')) {
				maid.skills = '1,2,3,4';
			}

			const skills = maid.skills
				.split(',')
				.map((s) => Number.parseInt(s.trim(), 10))
				.filter((n) => !Number.isNaN(n) && n >= 0 && n <= 5);
			maid.skills = skills;

			m_intervalID = setIntervalAsync(async function () {
				if (maid.on) {
					await bot.waitUntil(() => auth.loggedIn && !world.loading);

					if (
						auth.username.toLowerCase() !==
						maid.player.toLowerCase()
					) {
						world.goto(maid.player);
					}

					await bot.waitUntil(() => {
						return flash
							.call(window.swf.PlayersInMap)
							?.some(
								(p) =>
									p.toLowerCase() ===
									maid.player.toLowerCase(),
							);
					});

					world.setSpawnpoint();

					if (maid.attackPriority.length > 0) {
						for (const mon of maid.attackPriority) {
							if (world.isMonsterAvailable(mon)) {
								combat.attack(mon);
								break;
							}
						}
					}

					if (!combat.hasTarget()) {
						if (world.isMonsterAvailable('*')) {
							combat.attack('*');
						}
					}

					if (combat.hasTarget()) {
						await combat.useSkill(
							maid.skills[skillIdx],
							false,
							maid.skillWait,
						);
						await bot.sleep(maid.skillDelay);

						if (++skillIdx >= maid.skills.length) {
							skillIdx = 0;
						}
					}
				}
			}, 1000);

			break;
		}
		case 'tools:maid:stop':
			maid.on = false;
			if (m_intervalID) {
				await clearIntervalAsync(m_intervalID);
			}
			break;
		//#endregion
	}
});

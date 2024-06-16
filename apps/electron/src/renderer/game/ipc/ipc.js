var {
	setIntervalAsync,
	clearIntervalAsync,
} = require('set-interval-async/fixed');
var { ipcRenderer: ipc, dialog } = require('electron');

ipc.on('generate-id', (event, windowID) => {
	console.log(`Your shared ID is: "${windowID}"`);
	window.id = windowID;
});

ipc.on('game:login', function (event, account) {
	window.account = account;
});

const windows = {};

let maid = { on: false, player: null, skill_set: null };
let skillIdx = 0;

let p_intervalID = null;
let p_idx = 0;
let p_packets = [];

$(window).on('message', async function (event) {
	console.log('Received message', event.originalEvent.data);

	switch (event.originalEvent.data.event) {
		case 'packets:close':
			{
				windows.packets = null;
				if (p_intervalID) {
					clearIntervalAsync(p_intervalID);
					p_packets = [];
					p_idx = 0;
					p_intervalID = null;
				}
			}
			break;
		case 'tools:close':
			{
				windows.tools = null;
				maid.on = false;
			}
			break;
		case 'packets:generate_id':
		case 'tools:generate_id':
			{
				const wnd = event.originalEvent.data.event.split(':')[0];
				windows[wnd] = event.originalEvent.source;
				event.originalEvent.source.postMessage(
					{ event: event.originalEvent.data.event, resp: window.id },
					'*',
				);
			}
			//#region packets
			break;
		case 'packets:save':
			{
				const { packets } = event.originalEvent.data;
				require('electron').ipcRenderer.send('packets:save', packets);
			}
			break;
		case 'packets:spam_start':
			{
				const { packets, delay } = event.originalEvent.data;

				p_packets = packets;

				if (!p_intervalID) {
					p_intervalID = setIntervalAsync(function () {
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
		case 'packets:spam_stop':
			{
				if (p_intervalID) {
					clearIntervalAsync(p_intervalID);
					p_packets = [];
					p_idx = 0;
					p_intervalID = null;
				}
			}
			break;
		//#endregion
		//#region tools
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
		case 'tools:loader_grabber:grab_monsters':
			event.originalEvent.source.postMessage(
				{
					event: event.originalEvent.data.event,
					resp: Bot.getInstance().flash.call(
						window.swf.GetMonstersInCell,
					),
				},
				'*',
			);
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
			const { player, skill_set } = event.originalEvent.data;
			maid.on = true;
			maid.player = player;
			maid.skill_set = skill_set;

			if (!maid.skill_set.includes(',')) {
				maid.skill_set = '1,2,3,4';
			}

			const skills = maid.skill_set
				.split(',')
				.map((s) => Number.parseInt(s.trim(), 10))
				.filter((n) => !Number.isNaN(n) && n >= 0 && n <= 5);
			maid.skill_set = skills;

			p_intervalID = setIntervalAsync(async function () {
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

					if (world.isMonsterAvailable('*')) {
						if (!combat.hasTarget()) {
							combat.attack('*');
						}

						await combat.useSkill(maid.skill_set[skillIdx]);
						await bot.sleep(150);

						if (++skillIdx >= maid.skill_set.length) {
							skillIdx = 0;
						}
					}
				}
			}, 1000);

			break;
		}
		case 'tools:maid:stop':
			maid.on = false;
			await clearIntervalAsync(p_intervalID);
			break;
		//#endregion
	}
});

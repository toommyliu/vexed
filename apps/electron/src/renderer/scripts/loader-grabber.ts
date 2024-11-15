import { ipcRenderer } from 'electron';

window.addEventListener('message', async (ev) => {
	if (!ev.data?.event?.startsWith('tools:loadergrabber')) {
		return;
	}

	const {
		data: { event, args },
	} = ev;

	const eventName = event.split(':')[2];

	if (eventName === 'load') {
		if (!bot.player.isReady()) {
			return;
		}

		const { type, id } = args;

		switch (type) {
			case 0: // hair shop
				bot.flash.call(() => swf.LoadHairShop(id));
				break;
			case 1: // shop
				bot.flash.call(() => swf.LoadShop(id));
				break;
			case 2: // quest
				bot.flash.call(() => swf.LoadQuest(id));
				break;
			case 3: // armor customizer
				bot.flash.call(() => swf.LoadArmorCustomizer());
				break;
		}
	} else if (eventName === 'grab') {
		if (!bot.player.isReady()) {
			return;
		}

		const { type } = args;

		let ret;

		switch (type) {
			case 0: // shop
				if (!bot.shops.isShopLoaded || !bot.shops.info) {
					return;
				}

				ret = bot.shops.info;
				break;
			case 1: // quests
				ret = bot.flash.call(() => swf.GetQuestTree());
				break;
			case 2: // inventory
				ret = bot.flash.call(() => swf.GetInventoryItems());
				break;
			case 3: // temp. inventory
				ret = bot.flash.call(() => swf.GetTempItems());
				break;
			case 4: // bank
				ret = bot.flash.call(() => swf.GetBankItems());
				break;
			case 5: // cell monsters
			case 6: // map monsters
				// prettier-ignore
				ret = type === 5
							? bot.flash.call(() => swf.GetMonstersInCell())
							: bot.world.monsters;
				break;
		}

		if (ret) {
			ev.source!.postMessage({
				event: 'tools:loadergrabber:grab',
				args: { data: ret, type },
			});
		}
	} else if (eventName === 'export') {
		const { data } = args;
		ipcRenderer.send('tools:loadergrabber:export', data);
	}
});

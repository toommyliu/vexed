import { IPC_EVENTS } from '../../../common/ipc-events';

export default async function handler(ev: MessageEvent) {
	const port = ev.target as MessagePort;

	if (ev.data.event === IPC_EVENTS.LOADER_GRABBER_LOAD) {
		if (!bot.player.isReady()) {
			return;
		}

		const {
			args: { type, id },
		} = ev.data;

		switch (type) {
			case '0': // Hair shop
				bot.shops.loadHairShop(String(id));
				break;
			case '1': // Shop
				void bot.shops.load(String(id));
				break;
			case '2': // Quest
				void bot.quests.load(String(id));
				break;
			case '3': // Armor Customizer
				bot.shops.openArmorCustomizer();
				break;
		}
	} else if (ev.data.event === IPC_EVENTS.LOADER_GRABBER_GRAB) {
		if (!bot.player.isReady()) return;

		const {
			args: { type },
		} = ev.data;

		let ret: unknown;

		if (type === '0') {
			if (!bot.shops.isShopLoaded() || !bot.shops.info) return;

			ret = bot.shops.info;
		} else if (type === '1') {
			ret = bot.flash.call(() => swf.questsGetTree());
		} else if (type === '2') {
			ret = bot.flash.call(() => swf.inventoryGetItems());
		} else if (type === '3') {
			ret = bot.flash.call(() => swf.tempInventoryGetItems());
		} else if (type === '4') {
			ret = bot.flash.call(() => swf.bankGetItems());
		} else if (type === '5') {
			ret = bot.flash.call(() => swf.worldGetCellMonsters());
		} else if (type === '6') {
			ret = bot.world.monsters;
		}

		if (ret) {
			port.postMessage({
				event: IPC_EVENTS.LOADER_GRABBER_GRAB,
				args: { data: ret, type },
			});
		}
	}
}

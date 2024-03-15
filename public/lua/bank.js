const inventory = require('./inventory');
const map = require('./map');
const packet = require('./packet');

class bank {
	static get_items() {
		try {
			return JSON.parse(window.swf.getGameObject('world.bankinfo.items'));
		} catch {
			return [];
		}
	}

	static get_total_slots() {
		try {
			return Number.parseInt(window.swf.getGameObject('world.myAvatar.objData.iBankSlots'), 10);
		} catch {
			return -1;
		}
	}

	static get_used_slots() {
		try {
			return Number.parseInt(window.swf.getGameObject('world.myAvatar.iBankCount'), 10);
		} catch {
			return -1;
		}
	}

	static is_open() {
		try {
			const lbl = JSON.parse(window.swf.getGameObject('ui.mcPopup.currentLabel'));
			return lbl === 'Bank';
		} catch {
			return false;
		}
	}

	static open() {
		try {
			window.swf.callGameFunction('world.toggleBank');
		} catch {}
	}

	static load() {
		packet.send(`%xt%zm%loadBank%${map.get_id()}%All%`);
	}

	static to_inventory(name) {
		const item = bank.get_item(name);
		if (item) {
			packet.send(`%xt%zm%bankToInv%${map.get_id()}%${item.ItemID}%${item.CharItemID}%`);
		}
	}

	static swap(name_1 /* bank */, name_2 /* inventory */) {
		const item_1 = bank.get_item(name_1);
		const item_2 = inventory.get_item(name_2);

		if (item_1 && item_2) {
			packet.send(
				`%xt%zm%bankSwapInv%${map.get_id()}%${item_2.ItemID}%${item_2.CharItemID}%${item_1.ItemID}%${item_1.CharItemID}%`,
			);
		}
	}

	static get_item(name) {
		const items = bank.get_items();
		return items.find((item) => item?.sName?.toLowerCase() === name?.toLowerCase());
	}
}

module.exports = bank;

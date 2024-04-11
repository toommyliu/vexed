const bank = require('./bank');
const map = require('./map');
const packet = require('./packet');

class inventory {
	static get_items() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.items'));
		} catch {
			return [];
		}
	}

	static get_item(name) {
		const items = inventory.get_items();
		return items.find((item) => {
			if (typeof name === 'string' && item.sName.toLowerCase() === name.toLowerCase()) {
				return item;
			}

			if (typeof name === 'number' && item.ItemID === name) {
				return item;
			}
		});
	}

	static get_total_slots() {
		try {
			return Number.parseInt(window.swf.getGameObject('world.myAvatar.objData.iBagSlots'), 10);
		} catch {
			return -1;
		}
	}

	static get_used_slots() {
		try {
			return Number.parseInt(window.swf.getGameObject('world.myAvatar.items.length'), 10);
		} catch {
			return -1;
		}
	}

	static equip(name) {
		const item = inventory.get_item(name);
		if (item) {
			const item_json = { ItemID: Number.parseInt(item.ItemID, 10) };
			try {
				window.swf.callGameFunction('world.sendEquipItemRequest', item_json);
			} catch {}
		}
	}

	static to_bank(name) {
		const item = inventory.get_item(name);
		if (item) {
			packet.send(`%xt%zm%bankFromInv%${map.get_id()}%${item.ItemID}%${item.CharItemID}%`);
		}
	}

	static swap(name_1 /* inventory */, name_2 /* bank */) {
		bank.swap(name_2, name_1);
	}
}

module.exports = inventory;

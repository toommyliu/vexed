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
		for (const item of items) {
			if (typeof name === 'string' && item.sName.toLowerCase() === name.toLowerCase()) {
				return item;
			}

			if (typeof name === 'number' && item.ItemID === name) {
				return item;
			}
		}

		return null;
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
}

module.exports = inventory;

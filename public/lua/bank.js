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

	static to_bank(name) {
		// TODO: implement
	}

	static to_inventory(name) {
		// TODO: implement
	}

	static swap(item_1, item_2) {
		// TODO: implement
	}

	static get_item(name) {
		const items = bank.get_items();
		for (const item of items) {
			if (items.sName?.toLowerCase() === name?.toLowerCase()) {
				return item;
			}
		}
		
		return null;
	}

	static render() {
		try {
			window.swf.callGameFunction('world.toggleBank');
		} catch {}
	}
}

module.exports = bank;

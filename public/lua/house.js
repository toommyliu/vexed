class house {
	static get_items() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.houseitems'));
		} catch {
			return [];
		}
	}

	static get_total_slots() {
		try {
			return Number.parseInt(window.swf.getGameObject('world.myAvatar.objData.iHouseSlots'), 10);
		} catch {
			return -1;
		}
	}

	static get_item(name) {
		const items = house.get_items();
		for (const item of items) {
			if (item.sName?.toLowerCase() === name?.toLowerCase()) {
				return item;
			}
		}
	
		return null;
	}
}

module.exports = house;

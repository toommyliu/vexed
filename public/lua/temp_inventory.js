class temp_inventory {
	static get() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.tempitems'));
		} catch {
			return [];
		}
	}
}

module.exports = temp_inventory;
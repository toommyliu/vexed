class factions {
	static get() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.factions'));
		} catch {
			return [];
		}
	}
}

module.exports = factions;
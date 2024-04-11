class monsters {
	static get_in_cell() {
		try {
			return JSON.parse(window.swf.availableMonsters());
		} catch {
			return undefined;
		}
	}
}

module.exports = monsters;

const HouseItem = require('./struct/HouseItem');

class House {
	constructor(bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * Gets house items of the current player.
	 * @returns {HouseItem[]}
	 */
	get items() {
		const ret = this.bot.flash.call(window.swf.GetHouseItems);
		if (Array.isArray(ret)) {
			return ret.map((data) => new HouseItem(data));
		}
		return [];
	}

	/**
	 * Gets the total number of house item slots.
	 * @returns {number}
	 */
	get totalSlots() {
		return this.bot.flash.call(window.swf.HouseSlots);
	}
}

module.exports = House;

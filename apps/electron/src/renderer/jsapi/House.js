class House {
	/**
	 * @param {Bot} bot
	 */
	constructor(bot) {
		/**
		 * @type {Bot}
		 */
		this.bot = bot;
	}

	/**
	 * Gets house items of the current player.
	 * @returns {HouseItem[]}
	 */
	get items() {
		return (
			this.bot.flash.call(window.swf.GetHouseItems)?.map((data) => new HouseItem(data)) ?? []
		);
	}

	/**
	 * Gets the total number of house item slots.
	 * @returns {number}
	 */
	get totalSlots() {
		return this.bot.flash.call(window.swf.HouseSlots);
	}
}

class HouseItem extends ItemBase {}

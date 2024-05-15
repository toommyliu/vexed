class House {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		/**
		 * @type {Bot}
		 */
		this.instance = instance;
	}

	/**
	 * Gets house items of the current player.
	 * @returns {HouseItem[]}
	 */
	get items() {
		return this.instance.flash.call(window.swf.GetHouseItems)?.map((data) => new HouseItem(data)) ?? [];
	}

	/**
	 * Gets the total number of house item slots.
	 * @returns {number}
	 */
	get totalSlots() {
		return this.instance.flash.call(window.swf.HouseSlots);
	}
}

class HouseItem extends ItemBase {}
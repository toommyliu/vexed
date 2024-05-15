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

class HouseItem {
	/**
	 * @param {HouseItemData} data
	 */
	constructor(data) {
		/**
		 * @type {ItemBase}
		 */
		this.data = data;
	}

	/**
	 * The ID of the item.
	 * @type {number}
	 */
	get itemId() {
		return this.data.ItemID;
	}

	/**
	 * The name of the item.
	 * @type {string}
	 */
	get name() {
		return this.data.sName;
	}

	/**
	 * The description of the item.
	 * @type {string}
	 */
	get description() {
		return this.data.sDesc;
	}

	/**
	 * The quantity of the item.
	 * @type {number}
	 */
	get quantity() {
		return this.data.iQty;
	}

	/**
	 * The maximum stack size this item can exist in.
	 * @type {number}
	 */
	get maxStack() {
		return this.data.iStk;
	}

	/**
	 * Indicates if the item is a member/upgrade only item.
	 * @type {boolean}
	 */
	get isUpgrade() {
		return this.data.bUpg;
	}

	/**
	 * Indicates if the item is an AC item.
	 * @type {boolean}
	 */
	get isAc() {
		return this.data.bCoins;
	}

	/**
	 * The category of the item.
	 * @type {string}
	 */
	get type() {
		return this.data.sType;
	}

	/**
	 * The category of the item as an enum value.
	 * @type {ItemCategory}
	 */
	get category() {
		return this.data.sType;
	}

	/**
	 * Indicates if the item is a temporary item.
	 * @type {boolean}
	 */
	get isTemp() {
		return this.data.bTemp;
	}

	/**
	 * The group of the item.
	 * @type {string}
	 */
	get group() {
		switch (this.data.sES) {
			case 'co':
				return 'Armor';
			case 'ba':
				return 'Cape';
			case 'he':
				return 'Helm';
			case 'pe':
				return 'Pet';
			case 'Weapon':
				return 'Weapon';
			default:
				return this.data.sES;
		}
	}

	/**
	 * The name of the source file of the item.
	 * @type {string}
	 */
	get sLink() {
		return this.data.sLink;
	}

	/**
	 * The link to the source file of the item.
	 * @type {string}
	 */
	get sFile() {
		return this.data.sFile;
	}

	/**
	 * The meta value of the item.
	 * @type {string}
	 */
	get meta() {
		return this.data.sMeta;
	}
}

/**
 * Represents an item.
 * @typedef {Object} HouseItemData
 * @property {number} ItemID The ID of the item.
 * @property {string} sName The name of the item.
 * @property {string} sDesc The description of the item.
 * @property {number} iQty The quantity of the item in this stack.
 * @property {number} iStk The maximum stack size this item can exist in.
 * @property {boolean} bUpg Indicates if the item is a member/upgrade only item.
 * @property {boolean} bCoins Indicates if the item is an AC item.
 * @property {string} sType The category of the item.
 * @property {string} CategoryString The category of the item as string.
 * @property {ItemCategory} Category The category of the item as an enum value.
 * @property {boolean} bTemp Indicates if the item is a temporary item.
 * @property {string} sES The group of the item. co = Armor; ba = Cape; he = Helm; pe = Pet; Weapon = Weapon.
 * @property {string} sLink The name of the source file of the item.
 * @property {string} sFile The link to the source file of the item.
 * @property {string} sMeta The meta value of the item. This is used to link buffs (xp boosts etc).
 */

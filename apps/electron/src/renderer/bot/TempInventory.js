class TempInventory {
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
	 * Gets items in the Temp Inventory of the current player.
	 * @returns {TempInventoryItem[]}
	 */
	get items() {
		return this.instance.flash.call(window.swf.GetTempItems)?.map((data) => new TempInventoryItem(data));
	}

	/**
	 * Checks if the Temp Inventory contains an item with some desired quantity.
	 * @param {string} itemName - The name of the item.
	 * @param {string|number} [quantity="*"] - The quantity of the item to match against.
	 * @returns {boolean}
	 */
	contains(itemName, quantity = '*') {
		if (!this.items?.length) return false;

		const item = this.items.find((i) => i.name.toLowerCase() === itemName.toLowerCase());
		if (item) {
			// Match any quantity
			if (quantity === '*') return true;

			// Match max quantity
			if (quantity?.toLowerCase() === 'max') return item.quantity === item.maxStack;

			// Match quantity
			const quantity_ = Number.parseInt(quantity, 10);
			return quantity_ === item.quantity;
		}

		return false;
	}
}

class TempInventoryItem {
	/**
	 * @param {TempInventoryItemData} data
	 */
	constructor(data) {
		this.data = data;
	}

	/**
	 * The name of this item.
	 * @returns {string}
	 */
	get name() {
		return this.data.sName;
	}

	/**
	 * The quantity of this item.
	 * @returns {number}
	 */
	get quantity() {
		return this.data.iQty;
	}

	/**
	 * The maximum quantity of this item in a stack.
	 * @returns {number}
	 */
	get maxStack() {
		return this.data.iStk;
	}
}

/**
 * @typedef {Object} TempInventoryItemData
 * @property {number} ItemID
 * @property {number} iQty
 * @property {number} iRng
 * @property {number} iRty
 * @property {number} iStk
 * @property {number} iLvl
 * @property {string} sName
 * @property {string} sType
 * @property {string} sDesc
 * @property {string} sES
 * @property {string} sIcon
 * @property {string} sLink
 * @property {Object} metaValues
 * @property {number} bCoins
 * @property {number} bHouse
 * @property {number} bPTR
 * @property {number} bStaff
 * @property {number} bTemp
 * @property {number} bUpg
 */

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
	 * @returns {TempInventoryItem[]}
	 */
	get items() {
		return this.instance.flash.call(window.swf.GetTempItems);
	}

	/**
	 * @param {string} [quantity="*"]
	 * @returns {boolean}
	 */
	contains(itemName, quantity = '*') {
		if (!this.items?.length) return false;

		const item = this.items.find((i) => i.sName.toLowerCase() === itemName.toLowerCase());
		if (item) {
			// Match any quantity
			if (quantity === '*') return true;

			// Match max quantity
			if (quantity?.toLowerCase() === 'max') return item.iQty === item.iStk;

			// Match quantity
			const quantity_ = Number.parseInt(quantity, 10);
			return quantity_ === item.iQty;
		}

		return false;
	}
}

/**
 * @typedef {Object} TempInventoryItem
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

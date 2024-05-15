class Inventory {
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
	 * Gets items in the Inventory of the current player.
	 * @returns {InventoryItem[]}
	 */
	get items() {
		return this.instance.flash.call(window.swf.GetInventoryItems)?.map((data) => new InventoryItem(data)) ?? [];
	}

	/**
	 * Checks if the Inventory contains an item with some desired quantity.
	 * @param {string} itemName - The name of the item.
	 * @param {string|number} [quantity="*"] - The quantity of the item to match against.
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

	/**
	 * Gets the total number of slots in the Inventory of the current player.
	 * @returns {number}
	 */
	get totalSlots() {
		return this.instance.flash.call(window.swf.InventorySlots);
	}

	/**
	 * Gets the number of used slots in the Inventory of the current player.
	 * @returns {number}
	 */
	get usedSlots() {
		return this.instance.flash.call(window.swf.UsedInventorySlots);
	}

	/**
	 * Gets the number of available slots in the Inventory of the current player.
	 * @returns {number}
	 */
	get availableSlots() {
		return this.totalSlots - this.usedSlots;
	}
}

class InventoryItem {
	/**
	 * @param {InventoryItemData} data
	 */
	constructor(data) {
		this.data = data;
	}
}

/**
 * @typedef {Object} InventoryItemData
 * @property {number} bPTR
 * @property {string} sName
 * @property {number} iStk
 * @property {number} bUpg
 * @property {number} ItemID
 * @property {number} bEquip
 * @property {number} iDPS
 * @property {Object} metaValues
 * @property {number} iHrs
 * @property {string} sES
 * @property {number} iLvl
 * @property {number} EnhID
 * @property {number} iRng
 * @property {string} sDesc
 * @property {number} iHrs
 * @property {string} sReqQuests
 * @property {string} sType
 * @property {string} sElmt
 * @property {number} bCoins
 * @property {number} iCost
 * @property {string} sIcon
 * @property {number} bHouse
 * @property {number} iQSValue
 * @property {number} iRty
 * @property {number} bStaff
 * @property {string} sFile
 * @property {number} bBank
 * @property {string} sDesc
 * @property {string} sReqQuests
 * @property {number} CharItemID
 * @property {number} iQSValue
 * @property {number} iQty
 */

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
	 * @returns {InventoryItemData[]}
	 */
	get items() {
		return this.instance.flash.call(window.swf.GetInventoryItems);
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

	/**
	 * @returns {number}
	 */
	get totalSlots() {
		return this.instance.flash.call(window.swf.InventorySlots);
	}

	/**
	 * @returns {number}
	 */
	get usedSlots() {
		return this.instance.flash.call(window.swf.UsedInventorySlots);
	}

	/**
	 * @returns {number}
	 */
	get availableSlots() {
		return this.totalSlots - this.usedSlots;
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

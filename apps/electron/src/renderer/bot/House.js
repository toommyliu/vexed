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
	 * @returns {HouseItem[]}
	 */
	get items() {
		return this.instance.flash.call(window.swf.GetHouseItems);
	}

	/**
	 * @returns {number}
	 */
	get totalSlots() {
		return this.instance.flash.call(window.swf.HouseSlots);
	}
}

/**
 * @typedef {Object} HouseItem
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
 * @property {number} bTemp
 * @property {string} sLink
 * @property {number} iQSIndex
 * @property {string} sType
 * @property {string} sElmt
 * @property {number} bCoins
 * @property {number} iCost
 * @property {string} sIcon
 * @property {number} bHouse
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

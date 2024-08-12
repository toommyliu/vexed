/**
 * The base for all things item-related.
 */
class Item {
	constructor(data) {
		/**
		 * @type {ItemData}
		 */
		this.data = data;
	}

	/**
	 * The ID of the item.
	 * @returns {number}
	 */
	get id() {
		return this.data.ItemID;
	}

	/**
	 * The name of the item.
	 * @returns {string}
	 */
	get name() {
		return this.data.sName;
	}

	/**
	 * The description of the item.
	 * @returns {string}
	 */
	get description() {
		return this.data.sDesc;
	}

	/**
	 * The quantity of the item in this stack.
	 * @returns {number}
	 */
	get quantity() {
		return this.data.iQty;
	}

	/**
	 * The maximum stack size this item can exist in.
	 * @returns {number}
	 */
	get maxStack() {
		return this.data.iStk;
	}

	/**
	 * Indicates if the item is a member/upgrade only item.
	 * @returns {boolean}
	 */
	isUpgrade() {
		return this.data.bUpg === 1;
	}

	/**
	 * Indicates if the item is an AC item.
	 * @returns {boolean}
	 */
	isAC() {
		return this.data.bCoins === 1;
	}

	/**
	 * The category of the item.
	 * @returns {string}
	 */
	get category() {
		return this.data.sType;
	}

	/**
	 * Whether the item is a temporary item.
	 * @returns {boolean}
	 */
	isTemp() {
		return this.data.bTemp === 1;
	}

	/**
	 * The group of the item.
	 * co = Armor, ba = Cape, he = Helm, pe = Pet, Weapon = Weapon
	 * @returns {string}
	 */
	get itemGroup() {
		return this.data.sES;
	}

	/**
	 * The name of the source file of the item.
	 * @returns {string}
	 */
	get fileName() {
		return this.data.sLink;
	}

	/**
	 * The link to the source file of the item
	 * @returns {string}
	 */
	get fileLink() {
		return this.data.sFile;
	}

	/**
	 * The meta value of the item (used for boosts).
	 * @returns {string}
	 */
	get meta() {
		return this.data.sMeta;
	}

	isMaxed() {
		return this.quantity === this.maxStack;
	}
}

module.exports = Item;

/**
 * @typedef {Object} ItemData
 * @property {number} CharID
 * @property {number} CharItemID
 * @property {number} EnhDPS
 * @property {number} EnhID
 * @property {number} EnhLvl
 * @property {number} EnhPatternID
 * @property {number} EnhRng
 * @property {number} EnhRty
 * @property {number} ItemID
 * @property {boolean} bBank
 * @property {boolean} bCoins
 * @property {boolean} bEquip
 * @property {boolean} bStaff
 * @property {boolean} bTemp
 * @property {boolean} bUpg
 * @property {string} dPurchase
 * @property {number} iCost
 * @property {number} iDPS
 * @property {number} iHrs
 * @property {number} iLvl
 * @property {number} iQty
 * @property {number} iRng
 * @property {number} iRty
 * @property {number} iStk
 * @property {number} iType
 * @property {string} sDesc
 * @property {string} sES
 * @property {string} sElmt
 * @property {string} sFile
 * @property {string} sIcon
 * @property {string} sLink
 * @property {string} sName
 * @property {string} sType
 */


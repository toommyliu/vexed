/**
 * The base for all things item-related.
 */
class Item {
	data: ItemData;

	constructor(data: ItemData) {
		/**
		 * Data about this item
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
		// TODO:
		// @ts-expect-error
		return this.data.sMeta;
	}

	/**
	 * Whether the item is at its maximum stack size.
	 * @returns {boolean}
	 */
	isMaxed() {
		return this.quantity === this.maxStack;
	}
}

export { Item };
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
 * @property {number} bBank
 * @property {number} bCoins
 * @property {number} bEquip
 * @property {number} bStaff
 * @property {number} bTemp
 * @property {number} bUpg
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
export type ItemData = {
	CharID: number;
	CharItemID: number;
	EnhDPS: number;
	EnhID: number;
	EnhLvl: number;
	EnhPatternID: number;
	EnhRng: number;
	EnhRty: number;
	ItemID: number;
	bBank: number;
	bCoins: number;
	bEquip: number;
	bStaff: number;
	bTemp: number;
	bUpg: number;
	dPurchase: string;
	iCost: number;
	iDPS: number;
	iHrs: number;
	iLvl: number;
	iQty: number;
	iRng: number;
	iRty: number;
	iStk: number;
	iType: number;
	sDesc: string;
	sES: string;
	sElmt: string;
	sFile: string;
	sIcon: string;
	sLink: string;
	sName: string;
	sType: string;
};
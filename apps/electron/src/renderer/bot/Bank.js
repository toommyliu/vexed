class Bank {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		this.instance = instance;
	}

	/**
	 * @returns {BankItemData[]}
	 */
	get items() {
		return this.instance.flash.call(window.swf.GetBankItems);
	}

	/**
	 * @param {string} name
	 * @param {string} [quantity="*"]
	 * @returns {boolean}
	 */
	contains(name, quantity = '*') {
		const item = this.items.find((i) => i.sName.toLowerCase() === name.toLowerCase());
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
	get availableSlots() {
		return this.instance.flash.call(window.swf.BankSlots);
	}

	/**
	 * @returns {number}
	 */
	get usedSlots() {
		return this.instance.flash.call(window.swf.UsedBankSlots);
	}

	/**
	 * @returns {number}
	 */
	get totalSlots() {
		return this.availableSlots - this.usedSlots;
	}

	/**
	 * @param {string} name
	 * @returns {void}
	 */
	deposit(name) {
		this.instance.flash.call(window.swf.TransferToBank, name);
	}

	/**
	 * @param {string} name
	 * @returns {void}
	 */
	withdraw(name) {
		this.instance.flash.call(window.swf.TransferToInventory, name);
	}

	/**
	 * @param {string} out_item
	 * @param {string} in_item
	 * @returns {void}
	 */
	swap(out_item, in_item) {
		this.instance.flash.call(window.swf.BankSwap, in_item, out_item);
	}

	/**
	 * @returns {Promise<void>}
	 */
	async open() {
		this.instance.flash.call(window.swf.ShowBank);

		await this.instance.waitUntil(() => Flash.get('ui.mcPopup.currentLabel') === '"Bank"');

		await this.instance.sleep(2000);
	}
}

/**
 * @typedef {Object} BankItemData
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

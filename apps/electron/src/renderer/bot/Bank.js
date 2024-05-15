class Bank {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		this.instance = instance;
	}

	/**
	 * Gets items in the Bank of the current player.
	 * @returns {BankItem[]}
	 */
	get items() {
		return this.instance.flash.call(window.swf.GetBankItems)?.map((data) => new BankItem(data)) ?? [];
	}

	/**
	 * Checks if the Bank contains an item with some desired quantity.
	 * @param {string} itemName - The name of the item.
	 * @param {string|number} [quantity="*"] - The quantity of the item to match against.
	 * @returns {boolean}
	 */
	contains(itemName, quantity = '*') {
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
	 * Gets the count of available slots of bankable non-AC items.
	 * @returns {number}
	 */
	get availableSlots() {
		return this.instance.flash.call(window.swf.BankSlots);
	}

	/**
	 * Gets the count of used slots of bankable non-AC items.
	 * @returns {number}
	 */
	get usedSlots() {
		return this.instance.flash.call(window.swf.UsedBankSlots);
	}

	/**
	 * Gets the total slots of bankable non-AC items.
	 * @returns {number}
	 */
	get totalSlots() {
		return this.availableSlots - this.usedSlots;
	}

	/**
	 * Deposits an item into the bank.
	 * @param {string} name - The name of the item.
	 * @returns {void}
	 */
	deposit(name) {
		this.instance.flash.call(window.swf.TransferToBank, name);
	}

	/**
	 * Takes an item out of the bank.
	 * @param {string} name - The name of the item.
	 * @returns {void}
	 */
	withdraw(name) {
		this.instance.flash.call(window.swf.TransferToInventory, name);
	}

	/**
	 * Swaps an item from the bank with an item from the inventory.
	 * @param {string} out_item - The name of the item in the bank.
	 * @param {string} in_item - The name of the item in the inventory.
	 * @returns {void}
	 */
	swap(out_item, in_item) {
		this.instance.flash.call(window.swf.BankSwap, in_item, out_item);
	}

	/**
	 * Opens the bank.
	 * @returns {Promise<void>}
	 */
	async open() {
		this.instance.flash.call(window.swf.ShowBank);

		await this.instance.waitUntil(() => this.instance.flash.get('ui.mcPopup.currentLabel') === '"Bank"');

		await this.instance.sleep(2000);
	}
}

class BankItem {
	/**
	 * @param {BankItemData} data
	 */
	constructor(data) {
		this.data = data;
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

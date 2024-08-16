const BankItem = require('./struct/BankItem');

class Bank {
	constructor(bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * The list of items in the bank.
	 * @returns {BankItem[]}
	 */
	get items() {
		const ret = this.bot.flash.call(swf.GetBankItems);
		if (Array.isArray(ret)) {
			return ret.map((item) => new BankItem(item));
		}
		return [];
	}

	/**
	 * Gets an item from the Bank, items should be loaded beforehand.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @returns {?BankItem}
	 */
	get(itemKey) {
		if (typeof itemKey === 'string') {
			itemKey = itemKey.toLowerCase();
		}

		return (
			this.items.find((item) => {
				if (typeof itemKey === 'string') {
					return item.name.toLowerCase() === itemKey;
				}

				if (typeof itemKey === 'number') {
					return item.id === itemKey;
				}
			}) ?? null
		);
	}

	/**
	 * Whether the item meets some quantity in this store.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @param {number} quantity The quantity of the item.
	 * @returns {boolean}
	 */
	contains(itemKey, quantity) {
		const item = this.get(itemKey);
		if (!item) {
			return false;
		}

		return item.quantity >= quantity;
	}

	/**
	 * Gets the count of available slots of bankable non-AC items.
	 * @returns {number}
	 */
	get availableSlots() {
		return this.bot.flash.call(swf.BankSlots);
	}

	/**
	 * Gets the count of used slots of bankable non-AC items.
	 * @returns {number}
	 */
	get usedSlots() {
		return this.bot.flash.call(swf.UsedBankSlots);
	}

	/**
	 * Gets the total slots of bankable non-AC items.
	 * @returns {number}
	 */
	get totalSlots() {
		return this.availableSlots - this.usedSlots;
	}

	/**
	 * Puts an item into the Bank.
	 * @param {string} itemKey The name or ID of the item.
	 * @returns {Promise<boolean>} Whether the operation was successful.
	 */
	async deposit(itemKey) {
		if (!this.bot.inventory.get(itemKey)) {
			return false;
		}

		this.bot.flash.call(swf.TransferToBank, itemKey);
		await this.bot.waitUntil(
			() => this.get(itemKey) && !this.bot.inventory.get(itemKey),
			() => this.bot.auth.loggedIn,
		);
		return true;
	}

	/**
	 * Takes an item out of the bank.
	 * @param {string} itemKey The name or ID of the item.
	 * @returns {Promise<boolean>} Whether the operation was successful.
	 */
	async withdraw(itemKey) {
		if (!this.get(itemKey)) {
			return false;
		}

		this.bot.flash.call(swf.TransferToInventory, itemKey);
		await this.bot.waitUntil(
			() => !this.get(itemKey) && this.bot.inventory.get(itemKey),
			() => this.bot.auth.loggedIn,
		);
		return true;
	}

	/**
	 * Swaps an item from the bank with an item from the inventory.
	 * @param {string} bankItem The name or ID of the item from the Bank.
	 * @param {string} inventoryItem The name or ID of the item from the Inventory.
	 * @returns {Promise<void>} Whether the operation was successful.
	 */
	async swap(bankItem, inventoryItem) {
		const inBank = () => this.get(bankItem);
		const inInventory = () => this.bot.inventory.get(inventoryItem);

		if (!inBank() || !inInventory()) {
			return false;
		}

		this.bot.flash.call(swf.BankSwap, inventoryItem, bankItem);
		await this.bot.waitUntil(
			() => !inBank() && !inInventory(),
			() => this.bot.auth.loggedIn,
		);
		return true;
	}

	/**
	 * Opens the bank ui, and loads all items.
	 * @returns {Promise<void>}
	 */
	async open() {
		if (this.isOpen()) {
			return;
		}

		this.bot.flash.call(swf.ShowBank);
		await this.bot.waitUntil(() => this.isOpen());
		this.bot.flash.call(swf.LoadBankItems);
		await this.bot.waitUntil(
			() => this.items.length >= 0,
			() => this.bot.auth.loggedIn && this.isOpen(),
			10,
		);
	}

	/**
	 * Whether the bank ui is open.
	 * @returns {boolean}
	 */
	isOpen() {
		return this.bot.flash.get('ui.mcPopup.currentLabel', true) === 'Bank';
	}
}

module.exports = Bank;

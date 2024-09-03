import type Bot from './Bot';
import BankItem from './struct/BankItem';

class Bank {
	bot: Bot;

	constructor(bot: Bot) {
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
	get(itemKey: string | number): BankItem | null {
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

				return null;
			}) ?? null
		);
	}

	/**
	 * Whether the item meets some quantity in this store.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @param {number} quantity The quantity of the item.
	 * @returns {boolean}
	 */
	contains(itemKey: string | number, quantity: number): boolean {
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
	async deposit(itemKey: string | number): Promise<boolean> {
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
	 * @param {string|number} itemKey The name or ID of the item.
	 * @returns {Promise<boolean>} Whether the operation was successful.
	 */
	async withdraw(itemKey: string | number): Promise<boolean> {
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
	 * @param {string|number} bankItem The name or ID of the item from the Bank.
	 * @param {string|number} inventoryItem The name or ID of the item from the Inventory.
	 * @returns {Promise<boolean>} Whether the operation was successful.
	 */
	async swap(
		bankItem: string | number,
		inventoryItem: string | number,
	): Promise<boolean> {
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
	 * @param {boolean} force Whether to force open the bank ui.
	 * @returns {Promise<void>}
	 */
	async open(force: boolean = false) {
		if (!force && this.isOpen()) {
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

export default Bank;

class Bank {
	/**
	 * @param {Bot} bot
	 */
	constructor(bot) {
		this.bot = bot;
	}

	/**
	 * Gets the items in the Bank of the current player. The Bank must have been loaded before.
	 * @returns {BankItem[]}
	 */
	get items() {
		return (
			this.bot.flash.call(window.swf.GetBankItems)?.map((data) => new BankItem(data)) ?? []
		);
	}

	/**
	 * Resolves an item from the Bank.
	 * @param {string|number} itemResolvable The name or ID of the item.
	 * @returns {BankItem?}
	 */
	resolve(itemResolvable) {
		return this.items.find((i) => {
			if (typeof itemResolvable === "string")
				return i.name.toLowerCase() === itemResolvable.toLowerCase();
			if (typeof itemResolvable === "number") return i.id === itemResolvable;
		});
	}

	/**
	 * Gets the count of available slots of bankable non-AC items.
	 * @returns {number}
	 */
	get availableSlots() {
		return this.bot.flash.call(window.swf.BankSlots);
	}

	/**
	 * Gets the count of used slots of bankable non-AC items.
	 * @returns {number}
	 */
	get usedSlots() {
		return this.bot.flash.call(window.swf.UsedBankSlots);
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
	 * @param {string} itemName - The name of the item.
	 * @returns {Promise<void>}
	 */
	async deposit(itemName) {
		if (!this.bot.inventory.resolve(itemName)) return;

		this.bot.flash.call(window.swf.TransferToBank, itemName);
		await this.bot.sleep(500);
	}

	/**
	 * Takes an item out of the bank.
	 * @param {string} itemName - The name of the item.
	 * @returns {Promise<void>}
	 */
	async withdraw(itemName) {
		if (!this.resolve(itemName)) return;

		this.bot.flash.call(window.swf.TransferToInventory, itemName);
		await this.bot.sleep(500);
	}

	/**
	 * Swaps an item from the bank with an item from the inventory.
	 * @param {string} outItem - The name of the item in the bank.
	 * @param {string} inItem - The name of the item in the inventory.
	 * @returns {Promise<void>}
	 */
	async swap(outItem, inItem) {
		const inBank = () => this.bot.bank.contains(outItem);
		const inInventory = () => this.bot.inventory.contains(inItem);

		if (!inBank() || !inInventory()) return;

		this.bot.flash.call(window.swf.BankSwap, inItem, outItem);
		await this.bot.waitUntil(() => !inBank() && !inInventory());
	}

	/**
	 * Opens the bank.
	 * @returns {Promise<void>}
	 */
	async open() {
		const isOpen = () => this.bot.flash.get("ui.mcPopup.currentLabel", true) === "Bank";

		if (isOpen()) return;

		this.bot.flash.call(window.swf.ShowBank);
		await this.bot.waitUntil(isOpen);
		await this.bot.sleep(2000);
	}
}

class BankItem extends ItemBase {}

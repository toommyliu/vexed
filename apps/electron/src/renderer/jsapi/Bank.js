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
		return this.bot.flash.call(window.swf.GetBankItems)?.map((data) => new BankItem(data)) ?? [];
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
			if (typeof itemResolvable === "number")
				return i.id === itemResolvable;
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
		if (!this.bot.inventory.resolve(itemName))
			return;

		this.bot.flash.call(window.swf.TransferToBank, itemName);
		await this.bot.sleep(500);
	}

	/**
	 * Takes an item out of the bank.
	 * @param {string} itemName - The name of the item.
	 * @returns {Promise<void>}
	 */
	async withdraw(itemName) {
		if (!this.resolve(itemName))
			return;

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

		if (!inBank() || !inInventory())
			return;

		this.bot.flash.call(window.swf.BankSwap, inItem, outItem);
		await this.bot.waitUntil(() => !inBank() && !inInventory());
	}

	/**
	 * Opens the bank.
	 * @returns {Promise<void>}
	 */
	async open() {
		const isOpen = () => this.bot.flash.get('ui.mcPopup.currentLabel', true) === "Bank";

		if (isOpen())
			return;

		this.bot.flash.call(window.swf.ShowBank);
		await this.bot.waitUntil(isOpen);
		await this.bot.sleep(2000);
	}
}

class ItemBase {
	/**
	 * @param {ItemData} data
	 */
	constructor(data) {
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
	get isUpgrade() {
		return this.data.bUpg;
	}

	/**
	 * Indicates if the item is an AC item.
	 * @returns {boolean}
	 */
	get isAC() {
		return this.data.bCoins;
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
	get isTemp() {
		return this.data.bTemp;
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

class BankItem extends ItemBase { }

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
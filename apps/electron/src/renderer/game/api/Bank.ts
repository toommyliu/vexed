import type { Bot } from './Bot';
import { BankItem } from './struct/BankItem';
import type { ItemData } from './struct/Item';

export class Bank {
	// Whether bank items have loaded.
	private isLoaded = false;

	public constructor(public bot: Bot) {}

	/**
	 * The list of items in the bank.
	 */
	public get items(): BankItem[] {
		const ret = this.bot.flash.call(() => swf.GetBankItems());
		return Array.isArray(ret)
			? ret.map((item) => new BankItem(item as unknown as ItemData))
			: [];
	}

	/**
	 * Gets an item from the Bank.
	 *
	 * @remarks
	 * Bank items must have been loaded beforehand to retrieve an item.
	 * @param itemKey - The name or ID of the item.
	 */
	public get(itemKey: number | string): BankItem | null {
		const val =
			typeof itemKey === 'string' ? itemKey.toLowerCase() : itemKey;

		return (
			this.items.find((item) => {
				if (typeof val === 'string') {
					return item.name.toLowerCase() === val;
				} else if (typeof val === 'number') {
					return item.id === val;
				}

				return false;
			}) ?? null
		);
	}

	/**
	 * Whether the item meets some quantity in this store.
	 *
	 * @param itemKey - The name or ID of the item.
	 * @param quantity - The quantity of the item.
	 * @returns True if the item is found with the specified quantity, false otherwise.
	 */
	public contains(itemKey: number | string, quantity: number = 1): boolean {
		const item = this.get(itemKey);
		return (
			item !== null &&
			(item.quantity >= quantity || item.category === 'Class')
		);
	}

	/**
	 * The number of bank slots.
	 */
	public get totalSlots(): number {
		return this.bot.flash.call(() => swf.BankSlots());
	}

	/**
	 * The number of bank slots currently in use.
	 */
	public get usedSlots(): number {
		return this.bot.flash.call(() => swf.UsedBankSlots());
	}

	/**
	 * The number of bank slots available.
	 */
	public get availableSlots(): number {
		return this.totalSlots - this.usedSlots;
	}

	/**
	 * Puts an item into the Bank.
	 *
	 * @param item - The name or ID of the item.
	 * @returns Whether the operation was successful.
	 */
	public async deposit(item: number | string): Promise<boolean> {
		if (!this.bot.inventory.get(item)) {
			return false;
		}

		this.bot.flash.call(() => swf.TransferToBank(String(item)));
		await this.bot.waitUntil(
			() =>
				this.get(item) !== null &&
				this.bot.inventory.get(item) === null,
			() => this.bot.auth.isLoggedIn(),
		);
		return true;
	}

	/**
	 * Takes an item out of the bank.
	 *
	 * @param item - The name or ID of the item.
	 * @returns Whether the operation was successful.
	 */
	public async withdraw(item: number | string): Promise<boolean> {
		if (!this.get(item)) {
			return false;
		}

		this.bot.flash.call(() => swf.TransferToInventory(String(item)));
		await this.bot.waitUntil(
			() =>
				this.get(item) === null &&
				this.bot.inventory.get(item) !== null,
			() => this.bot.auth.isLoggedIn(),
		);
		return true;
	}

	/**
	 * Swaps an item from the bank with an item from the inventory.
	 *
	 * @param bankItem - The name or ID of the item from the Bank.
	 * @param inventoryItem - The name or ID of the item from the Inventory.
	 * @returns Whether the operation was successful.
	 */
	public async swap(
		bankItem: number | string,
		inventoryItem: number | string,
	): Promise<boolean> {
		const isInBank = () => Boolean(this.get(bankItem));
		const isInInventory = () =>
			Boolean(this.bot.inventory.get(inventoryItem));

		if (!isInBank() || !isInInventory()) {
			return false;
		}

		this.bot.flash.call(() =>
			swf.BankSwap(String(inventoryItem), String(bankItem)),
		);
		await this.bot.waitUntil(
			() => !isInBank() && !isInInventory(),
			() => this.bot.player.isReady(),
		);
		return true;
	}

	/**
	 * Opens the bank ui, and loads all items if needed.
	 *
	 * @param force - Whether to force open the bank ui, regardless of whether it's open.
	 * @param loadItems - Whether to load all items in the bank, regardless of whether they've been loaded.
	 */
	public async open(
		force: boolean = false,
		loadItems: boolean = false,
	): Promise<void> {
		if (!force && this.isOpen()) {
			return;
		}

		// If it's already open, close it first
		if (this.isOpen()) {
			this.bot.flash.call(() => swf.ShowBank());
			await this.bot.waitUntil(() => !this.isOpen());
			await this.bot.sleep(500);
		}

		// Open the ui
		this.bot.flash.call(() => swf.ShowBank());
		await this.bot.waitUntil(() => this.isOpen());

		// Load items if needed
		if (!this.isLoaded || loadItems) {
			this.bot.flash.call(() => swf.LoadBankItems());
			this.isLoaded = true;
		}

		await this.bot.waitUntil(
			// eslint-disable-next-line sonarjs/no-collection-size-mischeck
			() => this.items.length >= 0 /* wait until something is loaded */,
			() => this.bot.player.isReady() && this.isOpen(),
			10,
		);
	}

	/**
	 * Whether the bank ui is open.
	 */
	public isOpen(): boolean {
		return this.bot.flash.get('ui.mcPopup.currentLabel') === '"Bank"';
	}
}

import type { Bot } from './Bot';
import { BankItem } from './struct/BankItem';
import type { ItemData } from './struct/Item';

export class Bank {
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
	 * Gets an item from the Bank, items should be loaded beforehand.
	 *
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
	 */
	public contains(itemKey: number | string, quantity: number = 1): boolean {
		const item = this.get(itemKey);
		return (
			item !== null &&
			(item.quantity >= quantity || item.category === 'Class')
		);
	}

	/**
	 * Gets the count of available slots of bankable non-AC items.
	 */
	public get availableSlots(): number {
		return this.bot.flash.call(() => swf.BankSlots());
	}

	/**
	 * Gets the count of used slots of bankable non-AC items.
	 */
	public get usedSlots(): number {
		return this.bot.flash.call(() => swf.UsedBankSlots());
	}

	/**
	 * Gets the total slots of bankable non-AC items.
	 */
	public get totalSlots(): number {
		return this.availableSlots - this.usedSlots;
	}

	/**
	 * Puts an item into the Bank.
	 *
	 * @param itemKey - The name or ID of the item.
	 * @returns Whether the operation was successful.
	 */
	public async deposit(itemKey: number | string): Promise<boolean> {
		if (!this.bot.inventory.get(itemKey)) {
			return false;
		}

		this.bot.flash.call(() => swf.TransferToBank(String(itemKey)));
		await this.bot.waitUntil(
			() =>
				this.get(itemKey) !== null &&
				this.bot.inventory.get(itemKey) === null,
			() => this.bot.auth.loggedIn,
		);
		return true;
	}

	/**
	 * Takes an item out of the bank.
	 *
	 * @param itemKey - The name or ID of the item.
	 * @returns Whether the operation was successful.
	 */
	public async withdraw(itemKey: number | string): Promise<boolean> {
		if (!this.get(itemKey)) {
			return false;
		}

		this.bot.flash.call(() => swf.TransferToInventory(String(itemKey)));
		await this.bot.waitUntil(
			() =>
				this.get(itemKey) === null &&
				this.bot.inventory.get(itemKey) !== null,
			() => this.bot.auth.loggedIn,
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
		const inBank = () => Boolean(this.get(bankItem));
		const inInventory = () =>
			Boolean(this.bot.inventory.get(inventoryItem));

		if (!inBank() || !inInventory()) {
			return false;
		}

		this.bot.flash.call(() =>
			swf.BankSwap(String(inventoryItem), String(bankItem)),
		);
		await this.bot.waitUntil(
			() => !inBank() && !inInventory(),
			() => this.bot.auth.loggedIn,
		);
		return true;
	}

	/**
	 * Opens the bank ui, and loads all items.
	 *
	 * @param force - Whether to force open the bank ui, regardless of whether it's open.
	 */
	public async open(force: boolean = false): Promise<void> {
		if (!force && this.isOpen()) {
			return;
		}

		// If it's already open, close it first
		if (this.isOpen()) {
			this.bot.flash.call(() => swf.ShowBank());
			await this.bot.waitUntil(() => !this.isOpen());
			await this.bot.sleep(500);
		}

		// Load the items
		this.bot.flash.call(() => swf.ShowBank());
		await this.bot.waitUntil(() => this.isOpen());
		// Should only need to load once?
		this.bot.flash.call(() => swf.LoadBankItems());
		await this.bot.waitUntil(
			// eslint-disable-next-line sonarjs/no-collection-size-mischeck
			() => this.items.length >= 0 /* wait until something is loaded */,
			() => this.bot.auth.loggedIn && this.isOpen(),
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

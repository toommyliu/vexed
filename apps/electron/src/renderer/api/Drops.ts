import { Mutex } from 'async-mutex';
import type { Bot } from './Bot';
import type { ItemData } from './struct/Item';

export class Drops {
	#mutex = new Mutex();

	#data: Set<ItemData> = new Set();

	#drops: Record<number, number> = {};

	public constructor(public bot: Bot) {}

	/**
	 * The drop stack as shown to the client. The mapping is of the form `itemID -> count`. The value is -1 if the item has not been dropped.
	 */
	public get stack(): Record<number, number> {
		return this.#drops;
	}

	/**
	 * @param itemID - The ID of the item.
	 */
	public getItemFromID(itemID: number): ItemData | null {
		return [...this.#data].find((item) => item.ItemID === itemID) ?? null;
	}

	/**
	 * @param itemName - The name of the item.
	 */
	public getItemFromName(itemName: string): ItemData | null {
		// eslint-disable-next-line no-param-reassign
		itemName = itemName.toLowerCase();
		return (
			[...this.#data].find(
				(item) => item.sName.toLowerCase() === itemName,
			) ?? null
		);
	}

	/**
	 * @param itemID - The ID of the item.
	 */
	public getNameFromID(itemID: number): string | null {
		return this.getItemFromID(itemID)?.sName ?? null;
	}

	/**
	 * @param itemName - The name of the item.
	 */
	public getIDFromName(itemName: string): number | null {
		return this.getItemFromName(itemName)?.ItemID ?? null;
	}

	/**
	 * Retrieves the count of the item in the drop stack.
	 *
	 * @param itemID - The ID of the item.
	 */
	public getDropCount(itemID: number): number {
		return this.#drops[itemID] ?? -1;
	}

	/**
	 * Adds an item to the internal store and the stack as visible to the client.
	 *
	 * @param itemData - The data of the item to add.
	 */
	public addDrop(itemData: ItemData): void {
		this.#data.add(itemData);

		const { ItemID: itemID, iQty: quantity } = itemData;

		this.#drops[itemID] ??= 0;
		this.#drops[itemID] += quantity;
	}

	/**
	 * Removes an item from the drop stack. This does not reject the drop.
	 *
	 * @param itemID - The ID of the item to remove.
	 */
	private removeDrop(itemID: number): void {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete this.#drops[itemID];
	}

	/**
	 * Accepts the drop for an item in the stack.
	 *
	 * @param itemKey - The name or ID of the item.
	 * @returns Whether the operation was successful.
	 */
	public async pickup(itemKey: number | string): Promise<boolean> {
		const item = this.#resolveItem(itemKey);
		if (item && this.getDropCount(item.ItemID) > 0) {
			const { ItemID: itemID } = item;
			await this.#mutex.runExclusive(async () => {
				this.bot.packets.sendServer(
					`%xt%zm%getDrop%${this.bot.world.roomID}%${itemID}%`,
				);
				this.removeDrop(itemID);
				await this.bot.waitUntil(
					() => this.bot.inventory.get(itemKey) !== null,
					() => this.bot.auth.loggedIn,
					-1,
				);
				return true;
			});
		}

		return false;
	}

	/**
	 * Rejects the drop, effectively removing from the stack. Items can still be picked up with a getDrop packet.
	 *
	 * @param itemKey - The name or ID of the item.
	 * @param removeFromStore - Whether to delete the item entry from the store.
	 * @returns Whether the operation was successful.
	 */
	public async reject(
		itemKey: number | string,
		removeFromStore: boolean = false,
	): Promise<boolean> {
		const item = this.#resolveItem(itemKey);
		if (item) {
			this.bot.flash.call(() =>
				swf.RejectDrop(item.sName, String(item.ItemID)),
			);
			if (removeFromStore) {
				this.removeDrop(item.ItemID);
			}

			return true;
		}

		return false;
	}

	/**
	 * Resolves for an item by its' name or itemID.
	 *
	 * @param itemKey - The name or ID of the item.
	 */
	#resolveItem(itemKey: number | string): ItemData | null {
		if (typeof itemKey === 'string') {
			return this.getItemFromName(itemKey);
		} else if (typeof itemKey === 'number') {
			return this.getItemFromID(itemKey);
		}

		return null;
	}
}

import { Mutex } from 'async-mutex';
import type { Bot } from './Bot';
import type { ItemData } from './struct/Item';

export class Drops {
	private readonly mutex = new Mutex();

	private readonly items = new Map<number, ItemData>();

	private drops = new Map<number, number>();

	public constructor(public readonly bot: Bot) {}

	/**
	 * The drop stack as shown to the client. The mapping is of the form `itemID -> count`.
	 */
	public get stack(): Record<number, number> {
		return Object.fromEntries(this.drops.entries());
	}

	/**
	 * @param itemId - The ID of the item.
	 */
	public getItemFromId(itemId: number): ItemData | null {
		return this.items.get(itemId) ?? null;
	}

	/**
	 * @param itemName - The name of the item.
	 */
	public getItemFromName(itemName: string): ItemData | null {
		const val = itemName.toLowerCase();
		for (const item of this.items.values()) {
			if (item.sName.toLowerCase() === val) {
				return item;
			}
		}

		return null;
	}

	/**
	 * @param itemId - The ID of the item.
	 */
	public getItemName(itemId: number): string | null {
		return this.getItemFromId(itemId)?.sName ?? null;
	}

	/**
	 * @param itemName - The name of the item.
	 */
	public getItemId(itemName: string): number | null {
		return this.getItemFromName(itemName)?.ItemID ?? null;
	}

	/**
	 * @param itemId - The ID of the item.
	 * @returns The count of the item in the drop stack. -1 if the item has not been dropped.
	 */
	public getDropCount(itemId: number): number {
		return this.drops.get(itemId) ?? -1;
	}

	/**
	 * Adds an item to the internal store and the stack as visible to the client.
	 *
	 * @param item - The item that was dropped.
	 */
	public addDrop(item: ItemData): void {
		if (!this.items.has(item.ItemID)) {
			this.items.set(item.ItemID, item);
		}

		const count = this.getDropCount(item.ItemID);
		this.drops.set(
			item.ItemID,
			count === -1 ? item.iQty : count + item.iQty,
		);
	}

	/**
	 * Removes an item from the drop stack. This does not reject the drop.
	 *
	 * @param itemId - The ID of the item to remove.
	 */
	private removeDrop(itemId: number): void {
		this.drops.delete(itemId);
	}

	/**
	 * Accepts the drop for an item in the stack.
	 *
	 * @param itemKey - The name or ID of the item.
	 */
	public async pickup(itemKey: number | string) {
		const item = this.resolveItem(itemKey);
		if (!item || this.getDropCount(item.ItemID) <= 0) {
			return;
		}

		const { ItemID: itemId } = item;
		return this.mutex.runExclusive(async () => {
			this.bot.packets.sendServer(
				`%xt%zm%getDrop%${this.bot.world.roomId}%${itemId}%`,
			);
			this.removeDrop(itemId);
			await this.bot.waitUntil(
				() => this.bot.inventory.get(itemKey) !== null,
				() => this.bot.auth.isLoggedIn(),
				-1,
			);
		});
	}

	/**
	 * Rejects the drop, effectively removing from the stack. Items can still be picked up with a getDrop packet.
	 *
	 * @param itemKey - The name or ID of the item.
	 * @param removeFromStore - Whether to delete the item entry from the store.
	 */
	public async reject(
		itemKey: number | string,
		removeFromStore: boolean = false,
	) {
		const item = this.resolveItem(itemKey);
		if (item) {
			this.bot.flash.call(() =>
				swf.RejectDrop(item.sName, String(item.ItemID)),
			);

			if (removeFromStore) {
				this.removeDrop(item.ItemID);
			}
		}
	}

	/**
	 * Resolves for an item by its' name or item id.
	 *
	 * @param itemKey - The name or ID of the item.
	 */
	private resolveItem(itemKey: number | string): ItemData | null {
		if (typeof itemKey === 'string') {
			return this.getItemFromName(itemKey);
		} else if (typeof itemKey === 'number') {
			return this.getItemFromId(itemKey);
		}

		return null;
	}
}

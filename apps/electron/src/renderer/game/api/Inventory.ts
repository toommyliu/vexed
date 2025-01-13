import type { Bot } from './Bot';
import { GameAction } from './World';
import { InventoryItem } from './struct/InventoryItem';
import type { ItemData } from './struct/Item';

export class Inventory {
	public constructor(public readonly bot: Bot) {}

	/**
	 * Gets items in the Inventory of the current player.
	 */
	public get items(): InventoryItem[] {
		const ret = this.bot.flash.call(() => swf.GetInventoryItems());
		return Array.isArray(ret)
			? ret.map((data) => new InventoryItem(data as unknown as ItemData))
			: [];
	}

	/**
	 * Resolves for an Item in the Inventory.
	 *
	 * @param item - The name or ID of the item.
	 */
	public get(item: number | string): InventoryItem | null {
		const val = typeof item === 'string' ? item.toLowerCase() : item;

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
	 * Whether an item meets the quantity in the inventory.
	 *
	 * @remarks If the item is a Class, the quantity is ignored.
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
	 * The total slots available in the player's inventory.
	 */
	public get totalSlots(): number {
		return this.bot.flash.call(() => swf.InventorySlots());
	}

	/**
	 * The number of used slots in the player's inventory.
	 */
	public get usedSlots(): number {
		return this.bot.flash.call(() => swf.UsedInventorySlots());
	}

	/**
	 * The number of available slots in the player's inventory.
	 */
	public get availableSlots(): number {
		return this.totalSlots - this.usedSlots;
	}

	/**
	 * Equips an item from the inventory.
	 *
	 * @param itemKey - The name or ID of the item.
	 */
	public async equip(itemKey: number | string): Promise<void> {
		const item = this.get(itemKey);

		if (!item || item.isEquipped()) return;

		await this.bot.waitUntil(() =>
			this.bot.world.isActionAvailable(GameAction.EquipItem),
		);

		if (item.category === 'Item') {
			// potion / consumable
			this.bot.flash.call(() =>
				swf.EquipPotion(
					item.id.toString(),
					item.description,
					item.fileLink,
					item.name,
				),
			);
		} else {
			this.bot.flash.call(() => swf.Equip(item.id.toString()));
		}

		await this.bot.waitUntil(
			() => Boolean(this.get(itemKey)?.isEquipped()),
			() => this.bot.player.isReady(),
			10,
		);
	}
}

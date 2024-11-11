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
	 * @param itemKey - The name or ID of the item.
	 */
	public get(itemKey: number | string): InventoryItem | null {
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
	public contains(itemKey: number | string, quantity: number): boolean {
		const item = this.get(itemKey);
		return item !== null && item.quantity >= quantity;
	}

	/**
	 * Gets the total number of slots in the Inventory of the current player.
	 */
	public get totalSlots(): number {
		return this.bot.flash.call(() => swf.InventorySlots());
	}

	/**
	 * Gets the number of used slots in the Inventory of the current player.
	 */
	public get usedSlots(): number {
		return this.bot.flash.call(() => swf.UsedInventorySlots());
	}

	/**
	 * Gets the number of available slots in the Inventory of the current player.
	 */
	public get availableSlots(): number {
		return this.totalSlots - this.usedSlots;
	}

	/**
	 * Equips an item from the Inventory.
	 *
	 * @param itemKey - The name or ID of the item.
	 * @returns Whether the operation was successful.
	 */
	public async equip(itemKey: number | string): Promise<boolean> {
		const getItem = () => this.get(itemKey);

		if (getItem()) {
			const equipped = () => getItem()?.isEquipped();

			// eslint-disable-next-line no-unreachable-loop, sonarjs/no-one-iteration-loop
			while (!equipped()) {
				await this.bot.combat.exit();
				await this.bot.waitUntil(() =>
					this.bot.world.isActionAvailable(GameAction.EquipItem),
				);

				const item = getItem()!;
				if (item.category === 'Item') {
					// eslint-disable-next-line @typescript-eslint/no-loop-func
					this.bot.flash.call(() =>
						swf.EquipPotion(
							item.id.toString(),
							item.description,
							item.fileLink,
							item.name,
						),
					);
				} else {
					// eslint-disable-next-line @typescript-eslint/no-loop-func
					this.bot.flash.call(() => swf.Equip(item.id.toString()));
				}

				return true;
			}
		}

		return false;
	}
}

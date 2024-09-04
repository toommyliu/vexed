import type Bot from './Bot';
import InventoryItem from './struct/InventoryItem';
import { GameAction } from './World';

class Inventory {
	public bot: Bot;

	constructor(bot: Bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * Gets items in the Inventory of the current player.
	 * @returns {InventoryItem[]}
	 */
	public get items(): InventoryItem[] {
		const ret = this.bot.flash.call(swf.GetInventoryItems);
		if (Array.isArray(ret)) {
			return ret.map((data) => new InventoryItem(data));
		}
		return [];
	}

	/**
	 * Resolves for an Item in the Inventory.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @returns {InventoryItem|null}
	 */
	public get(itemKey: string | number): InventoryItem | null {
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

				return undefined;
			}) ?? null
		);
	}

	/**
	 * Whether the item meets some quantity in this store.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @param {number} quantity The quantity of the item.
	 * @returns {boolean}
	 */
	public contains(itemKey: string | number, quantity: number): boolean {
		const item = this.get(itemKey);
		if (!item) {
			return false;
		}

		return item.quantity >= quantity;
	}

	/**
	 * Gets the total number of slots in the Inventory of the current player.
	 * @returns {number}
	 */
	public get totalSlots(): number {
		return this.bot.flash.call(swf.InventorySlots);
	}

	/**
	 * Gets the number of used slots in the Inventory of the current player.
	 * @returns {number}
	 */
	public get usedSlots(): number {
		return this.bot.flash.call(swf.UsedInventorySlots);
	}

	/**
	 * Gets the number of available slots in the Inventory of the current player.
	 * @returns {number}
	 */
	public get availableSlots(): number {
		return this.totalSlots - this.usedSlots;
	}

	/**
	 * Equips an item from the Inventory.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @returns {Promise<boolean>} Whether the operation was successful.
	 */
	public async equip(itemKey: string | number): Promise<boolean> {
		const getItem = () => this.get(itemKey);

		if (getItem()) {
			const equipped = () => getItem()?.equipped;

			while (!equipped()) {
				await this.bot.combat.exit();
				await this.bot.waitUntil(() =>
					this.bot.world.isActionAvailable(GameAction.EquipItem),
				);

				const item = getItem()!;
				if (item.category === 'Item') {
					this.bot.flash.call(
						swf.EquipPotion,
						item.id.toString(),
						item.description,
						item.fileLink,
						item.name,
					);
				} else {
					this.bot.flash.call(swf.Equip, item.id.toString());
				}
				return true;
			}
		}
		return false;
	}
}

export default Inventory;

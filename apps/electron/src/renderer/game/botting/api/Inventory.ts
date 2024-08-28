import InventoryItem from './struct/InventoryItem';

class Inventory {
	constructor(bot) {
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
	get items() {
		const ret = this.bot.flash.call(swf.GetInventoryItems);
		if (Array.isArray(ret)) {
			return ret.map((data) => new InventoryItem(data));
		}
		return [];
	}

	/**
	 * Resolves an item from the Inventory.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @returns {InventoryItem?}
	 */
	get(itemKey) {
		if (typeof itemKey === 'string') {
			itemKey = itemKey.toLowerCase();
		}

		return this.items.find((item) => {
			if (typeof itemKey === 'string') {
				return item.name.toLowerCase() === itemKey;
			}
			if (typeof itemKey === 'number') {
				return item.id === itemKey;
			}
		});
	}

	/**
	 * Whether the item meets some quantity in this store.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @param {number} quantity The quantity of the item.
	 * @returns {boolean}
	 */
	contains(itemKey, quantity) {
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
	get totalSlots() {
		return this.bot.flash.call(swf.InventorySlots);
	}

	/**
	 * Gets the number of used slots in the Inventory of the current player.
	 * @returns {number}
	 */
	get usedSlots() {
		return this.bot.flash.call(swf.UsedInventorySlots);
	}

	/**
	 * Gets the number of available slots in the Inventory of the current player.
	 * @returns {number}
	 */
	get availableSlots() {
		return this.totalSlots - this.usedSlots;
	}

	/**
	 * Equips an item from the Inventory.
	 * @param {string|number} itemKey The name or ID of the item.
	 * @returns {Promise<void>}
	 */
	async equip(itemKey) {
		const getItem = () => this.get(itemKey);

		if (getItem()) {
			const equipped = () => getItem()?.equipped;

			while (!equipped()) {
				await this.bot.combat.exit();
				await this.bot.waitUntil(() =>
					this.bot.world.isActionAvailable(GameAction.EquipItem),
				);

				const item = getItem();
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
			}
		}
	}
}

export default Inventory;

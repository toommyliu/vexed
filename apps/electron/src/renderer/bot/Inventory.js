class Inventory {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		/**
		 * @type {Bot}
		 */
		this.instance = instance;
	}

	/**
	 * Gets items in the Inventory of the current player.
	 * @returns {InventoryItem[]}
	 */
	get items() {
		return this.instance.flash.call(window.swf.GetInventoryItems)?.map((data) => new InventoryItem(data)) ?? [];
	}

	/**
	 * Checks if the Inventory contains an item with some desired quantity.
	 * @param {string} itemName - The name of the item.
	 * @param {string|number} [quantity="*"] - The quantity of the item to match against.
	 * @returns {boolean}
	 */
	contains(itemName, quantity = '*') {
		if (!this.items?.length) return false;

		const item = this.items.find((i) => i.name.toLowerCase() === itemName.toLowerCase());
		if (item) {
			// Match any quantity
			if (quantity === '*') return true;

			// Match max quantity
			if (quantity?.toLowerCase() === 'max') return item.quantity === item.maxStack;

			// Match quantity
			const quantity_ = Number.parseInt(quantity, 10);
			return quantity_ === item.quantity;
		}

		return false;
	}

	/**
	 * Gets the total number of slots in the Inventory of the current player.
	 * @returns {number}
	 */
	get totalSlots() {
		return this.instance.flash.call(window.swf.InventorySlots);
	}

	/**
	 * Gets the number of used slots in the Inventory of the current player.
	 * @returns {number}
	 */
	get usedSlots() {
		return this.instance.flash.call(window.swf.UsedInventorySlots);
	}

	/**
	 * Gets the number of available slots in the Inventory of the current player.
	 * @returns {number}
	 */
	get availableSlots() {
		return this.totalSlots - this.usedSlots;
	}
}

class InventoryItem extends ItemBase {
	/**
	 * The character ID of this item.
	 * @returns {number}
	 */
	get charItemId() {
		return this.data.CharItemID;
	}

	/**
	 * Whether the item is equipped.
	 * @returns {boolean}
	 */
	get isEquipped() {
		return this.data.bEquip;
	}

	/**
	 * The level of the item.
	 * @returns {number}
	 */
	get level() {
		return this.data.iLvl;
	}

	/**
	 * The enhancement level of the item.
	 * @returns {number}
	 */
	get enhancementLevel() {
		return this.data.EnhLvl;
	}

	/**
	 * The enhancement pattern ID of the item.
	 * 1: Adventurer
	 * 2: Fighter
	 * 3: Thief
	 * 4: Armsman
	 * 5: Hybrid
	 * 6: Wizard
	 * 7: Healer
	 * 8: Spellbreaker
	 * 9: Lucky
	 * @returns {number}
	 */
	get enhancementPatternId() {
		return this.data.InvEnhPatternID;
	}
}

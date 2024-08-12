const Item = require('./Item');

/**
 * Represents an item in the inventory.
 */
class InventoryItem extends Item {
	/**
	 * The character ID of this item.
	 * @returns {number}
	 */
	get charItemID() {
		return this.data.CharItemID;
	}

	/**
	 * Whether the item is equipped.
	 * @returns {boolean}
	 */
	get equipped() {
		return this.data.bEquip === 1;
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
	 * 10: Forge (?)
	 * @returns {number}
	 */
	get enhancementPatternID() {
		return this.data.EnhPatternID;
	}
}

module.exports = InventoryItem;
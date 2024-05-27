class ScriptInventory {
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
	 * Gets an item in the Inventory.
	 * @param {string|number} itemResolvable The name or ID of the item.
	 * @returns {InventoryItem|undefined}
	 */
	get(itemResolvable) {
		return this.items.find((item) => {
			if (typeof itemResolvable === 'string')
				return item.name.toLowerCase() === itemResolvable.toLowerCase();
			else if (typeof itemResolvable === 'number')
				return item.id === itemResolvable;
		});
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

	/**
	 * Equips an item from the Inventory.
	 * @param {string} itemName 
	 * @returns {Promise<void>}
	 */
	async equip(itemName) {
		const getItem = () => this.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
		if (getItem()) {
			const equipped = () => getItem()?.equipped;

			while (this.instance.isRunning && !equipped()) {
				while (this.instance.isRunning && this.instance.player.state === 2) {
					this.instance.flash.call(window.swf.Jump, this.instance.player.cell, this.instance.player.pad);
					await this.instance.sleep(1000);
				}
				await this.instance.waitUntil(() => this.instance.world.isActionAvailable(GameAction.EquipItem));

				const item = getItem();
				if (item.category === "Item")
					this.instance.flash.call(window.swf.EquipPotion, item.id.toString(), item.description, item.fileLink, item.name);
				else
					this.instance.flash.call(window.swf.Equip, item.id.toString());
			}
		}
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
	 * @returns {number}
	 */
	get enhancementPatternId() {
		return this.data.InvEnhPatternID;
	}
}
class Inventory {
	constructor(bot) {
		/**
		 * @type {Bot}
		 */
		this.bot = bot;
	}

	/**
	 * Gets items in the Inventory of the current player.
	 * @returns {InventoryItem[]}
	 */
	get items() {
		return (
			this.bot.flash
				.call(window.swf.GetInventoryItems)
				?.map((data) => new InventoryItem(data)) ?? []
		);
	}

	/**
	 * Resolves an item from the Inventory.
	 * @param {string|number} itemResolvable The name or ID of the item.
	 * @returns {InventoryItem?}
	 */
	resolve(itemResolvable) {
		return this.items.find((i) => {
			if (typeof itemResolvable === "string")
				return i.name.toLowerCase() === itemResolvable.toLowerCase();
			if (typeof itemResolvable === "number") return i.id === itemResolvable;
		});
	}

	/**
	 * Gets the total number of slots in the Inventory of the current player.
	 * @returns {number}
	 */
	get totalSlots() {
		return this.bot.flash.call(window.swf.InventorySlots);
	}

	/**
	 * Gets the number of used slots in the Inventory of the current player.
	 * @returns {number}
	 */
	get usedSlots() {
		return this.bot.flash.call(window.swf.UsedInventorySlots);
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
	 * @param {string|number} itemResolvable The name or ID of the item.
	 * @returns {Promise<void>}
	 */
	async equip(itemResolvable) {
		const getItem = () => this.resolve(itemResolvable);

		if (getItem()) {
			const equipped = () => getItem()?.equipped;

			while (!equipped()) {
				while (this.bot.player.state === PlayerState.InCombat) {
					await this.bot.world.jump(this.bot.player.cell, this.bot.player.pad, true);
					await this.bot.sleep(1000);
				}
				await this.bot.waitUntil(() =>
					this.bot.world.isActionAvailable(GameAction.EquipItem)
				);

				const item = getItem();
				if (item.category === "Item")
					this.bot.flash.call(
						window.swf.EquipPotion,
						item.id.toString(),
						item.description,
						item.fileLink,
						item.name
					);
				else this.bot.flash.call(window.swf.Equip, item.id.toString());
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
	 * 10: Forge (?)
	 * @returns {number}
	 */
	get enhancementPatternID() {
		return this.data.EnhPatternID;
	}
}

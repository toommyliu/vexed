class World {
	/**
	 * @param {Bot} bot
	 */
	constructor(bot) {
		this.bot = bot;
	}

	/**
	 * Gets all players in the current map.
	 * @returns {Avatar[]}
	 */
	get players() {
		const _players = this.bot.flash.call(window.swf.Players) ?? [];
		if (Object.keys(_players).length > 0) {
			return Object.values(_players).map((data) => new Avatar(data));
		}
		return [];
	}

	/**
	 * Gets all visible monsters in the current cell.
	 * @returns {Monster[]}
	 */
	get visibleMonsters() {
		const monsters = this.bot.flash.call(window.swf.GetVisibleMonstersInCell);
		return monsters.map((data) => new Monster(data));
	}

	/**
	 * Gets all available monsters in the current cell.
	 * @returns {Monster[]}
	 */
	get availableMonsters() {
		const monsters = this.bot.flash.call(window.swf.GetMonstersInCell);
		return monsters.map((data) => new Monster(data));
	}

	/**
	 * Whether a monster is available.
	 * @param {string} monsterResolvable The name of the monster or in monMapID format.
	 * @returns {boolean}
	 */
	isMonsterAvailable(monsterResolvable) {
		if (["id'", "id.", "id:", "id-"].some((prefix) => monsterResolvable.startsWith(prefix))) {
			const monMapID = monsterResolvable.substring(3);
			return this.bot.flash.call(window.swf.IsMonsterAvailableByMonMapID, monMapID);
		}
		return this.bot.flash.call(window.swf.IsMonsterAvailable, monsterResolvable);
	}

	/**
	 * Reloads the map.
	 * @returns {void}
	 */
	reload() {
		this.bot.flash.call(window.swf.ReloadMap);
	}

	/**
	 * Checks if the map is still loading.
	 * @returns {boolean}
	 */
	get loading() {
		return !this.bot.flash.call(window.swf.MapLoadComplete);
	}

	/**
	 * Gets all cells of the map.
	 * @returns {string[]}
	 */
	get cells() {
		return this.bot.flash.call(window.swf.GetCells);
	}

	/**
	 * Sets the player's spawnpoint to the current cell and pad.
	 * @returns {void}
	 */
	setSpawnpoint() {
		this.bot.flash.call(window.swf.SetSpawnPoint);
	}

	/**
	 * Gets the internal room ID of the current map.
	 * @returns {number}
	 */
	get roomId() {
		return this.bot.flash.call(window.swf.RoomId);
	}

	/**
	 * Gets the room number of the current map.
	 * @returns {number}
	 */
	get roomNumber() {
		return this.bot.flash.call(window.swf.RoomNumber);
	}

	/**
	 * Gets the name of the current map.
	 * @returns {string}
	 */
	get name() {
		return this.bot.flash.call(window.swf.Map);
	}

	/**
	 * Jump to the specified cell and pad of the current map.
	 * @param {string} cell - The cell to jump to.
	 * @param {string} [pad="Spawn"] - The pad to jump to.
	 * @param {boolean} [force=false] - Whether to allow jumping to the same cell.
	 * @returns {Promise<void>}
	 */
	async jump(cell, pad = "Spawn", force = false) {
		const isSameCell = () => this.bot.player.cell.toLowerCase() === cell.toLowerCase();
		while (!isSameCell() || force) {
			this.bot.flash.call(window.swf.Jump, cell, pad);
			await this.bot.sleep(500);
			if (force && isSameCell()) {
				break;
			}
		}
	}

	/**
	 * Joins a map.
	 * @param {string} mapName - The name of the map to join.
	 * @param {string} [cell="Enter"] - The cell to jump to.
	 * @param {string} [pad="Spawn"] - The pad to jump to.
	 * @returns {Promise<void>}
	 */
	async join(mapName, cell = "Enter", pad = "Spawn") {
		await this.bot.waitUntil(() => this.isActionAvailable(GameAction.Transfer));
		if (this.bot.player.state === PlayerState.InCombat) {
			this.jump("Enter", "Spawn");
			await this.bot.waitUntil(() => this.bot.player.state !== PlayerState.InCombat);
			await this.bot.sleep(1500);
		}

		let map_str = mapName;
		let [map_name, map_number] = map_str.split("-");

		if (map_number === "1e9" || map_number === "1e99") map_number = "100000";
		map_str = `${map_name}${map_number ? `-${map_number}` : ""}`;

		if (this.name.toLowerCase() === map_name.toLowerCase()) {
			this.jump(cell, pad);
			return;
		}

		while (this.name.toLowerCase() !== map_name.toLowerCase()) {
			this.bot.flash.call(window.swf.Join, map_str, cell, pad);
			await this.bot.sleep(1000);
		}

		await this.jump(cell, pad);
		await this.bot.waitUntil(() => !this.loading);
	}

	/**
	 * Goto the specified player.
	 * @param {string} name - The name of the player to goto.
	 * @returns {void}
	 */
	goto(name) {
		this.bot.flash.call(window.swf.GoTo, name);
	}

	/**
	 * @returns {InventoryItemData[]}
	 */
	get itemTree() {
		return this.bot.flash.call(window.swf.GetItemTree);
	}

	/**
	 * Whether the game action has cooled down.
	 * @param {GameAction} action - The game action to check.
	 * @returns {boolean}
	 */
	isActionAvailable(action) {
		return this.bot.flash.call(window.swf.IsActionAvailable, action);
	}

	/**
	 * Gets a item in the world.
	 * @param {string} itemId
	 * @returns {Promise<void>}
	 */
	async getMapItem(itemId) {
		await this.bot.waitUntil(() => this.isActionAvailable(GameAction.GetMapItem));
		this.bot.flash.call(window.swf.GetMapItem, itemId);
		await this.bot.sleep(2000);
	}

	/**
	 * Loads a particular swf of the map.
	 * @param {string} swf The swf to load
	 * @returns {void}
	 */
	loadSWF(swf) {
		this.bot.flash.call(window.swf.LoadMap, swf);
	}
}

/**
 * Enum representing game actions.
 * @readonly
 * @enum {string}
 */
const GameAction = Object.freeze({
	/** Loading a shop. */
	LoadShop: "loadShop",
	/** Loading an enhancement shop. */
	LoadEnhShop: "loadEnhShop",
	/** Loading a hair shop. */
	LoadHairShop: "loadHairShop",
	/** Equipping an item. */
	EquipItem: "equipItem",
	/** Unequipping an item. */
	UnequipItem: "unequipItem",
	/** Buying an item. */
	BuyItem: "buyItem",
	/** Selling an item. */
	SellItem: "sellItem",
	/** Getting a map item (i.e. via the getMapItem packet). */
	GetMapItem: "getMapItem",
	/** Sending a quest completion packet. */
	TryQuestComplete: "tryQuestComplete",
	/** Accepting a quest. */
	AcceptQuest: "acceptQuest",
	/** I don't know... */
	DoIA: "doIA",
	/** Resting. */
	Rest: "rest",
	/** I don't know... */
	Who: "who",
	/** Joining another map. */
	Transfer: "tfer"
});

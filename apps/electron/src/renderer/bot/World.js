class World {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		/**
		 * @type {Bot}
		 */
		this.instance = instance;

		/**
		 * @type {DropStack}
		 */
		this.dropStack = new DropStack();
	}

	/**
	 * Gets all players in the current map.
	 * @returns {Avatar[]}
	 */
	get players() {
		return this.instance.flash.call(window.swf.Players)?.map((data) => new Avatar(data)) ?? [];
	}

	/**
	 * Gets all visible monsters in the current cell.
	 * @returns {MonsterData[]}
	 */
	get visibleMonsters() {
		const monsters = this.instance.flash.call(window.swf.GetVisibleMonstersInCell);
		return monsters.map((data) => new Monster(data));
	}

	/**
	 * Gets all available monsters in the current cell.
	 * @returns {MonsterData[]}
	 */
	get availableMonsters() {
		const monsters = this.instance.flash.call(window.swf.GetMonstersInCell);
		return monsters.map((data) => new Monster(data));
	}

	/**
	 * Reloads the map.
	 * @returns {void}
	 */
	reload() {
		this.instance.flash.call(window.swf.ReloadMap);
	}

	/**
	 * Checks if the map is still loading.
	 * @returns {boolean}
	 */
	get loading() {
		return !this.instance.flash.call(window.swf.MapLoadComplete);
	}

	/**
	 * Gets all cells of the map.
	 * @returns {string[]}
	 */
	get cells() {
		return this.instance.flash.call(window.swf.GetCells);
	}

	/**
	 * Sets the player's spawnpoint to the current cell and pad.
	 * @returns {void}
	 */
	setSpawnpoint() {
		this.instance.flash.call(window.swf.SetSpawnPoint);
	}

	/**
	 * Gets the internal room ID of the current map.
	 * @returns {number}
	 */
	get roomId() {
		return this.instance.flash.call(window.swf.RoomId);
	}

	/**
	 * Gets the room number of the current map.
	 * @returns {number}
	 */
	get roomNumber() {
		return this.instance.flash.call(window.swf.RoomNumber);
	}

	/**
	 * Gets the name of the current map.
	 * @returns {string}
	 */
	get name() {
		return this.instance.flash.call(window.swf.Map);
	}

	/**
	 * Jump to the specified cell and pad of the current map.
	 * @param {string} cell - The cell to jump to.
	 * @param {string} [pad="Spawn"] - The pad to jump to.
	 * @returns {void}
	 */
	jump(cell, pad = 'Spawn') {
		this.instance.flash.call(window.swf.Jump, cell, pad);
	}

	/**
	 * Join the specified map, jumping to the specified cell and pad.
	 * @param {string} mapName - The name of the map to join.
	 * @param {string} [cell="Enter"] - The cell to jump to.
	 * @param {string} [pad="Spawn"] - The pad to jump to.
	 * @returns {void}
	 */
	join(mapName, cell = 'Enter', pad = 'Spawn') {
		if (this.name.toLowerCase() === mapName.toLowerCase()) {
			this.jump(cell, pad);
			return;
		}

		let map_str = mapName;
		let map_number = mapName.includes('-')
			? mapName.split('-')[1]
			: this.instance.options.privateRooms
				? String(this.instance.options.roomNumber)
				: '1';

		// Random room number
		if (map_number === '1e9' || map_number === '1e99') {
			map_number = '100000';
		}

		map_str = `${mapName}-${map_number}`;
		this.instance.flash.call(window.swf.Join, map_str, cell, pad);
	}

	/**
	 * Goto the specified player.
	 * @param {string} name - The name of the player to goto.
	 * @returns {void}
	 */
	goto(name) {
		this.instance.flash.call(window.swf.GoTo, name);
	}

	/**
	 * @returns {InventoryItemData[]}
	 */
	get itemTree() {
		return this.instance.flash.call(window.swf.GetItemTree);
	}
}

class DropStack {
	constructor() {
		/**
		 * @type {Object.<string, [ItemData, number]>}
		 */
		this.drops = {};
	}

	add(item) {
		this.drops[item.ItemID] ??= [item, 0];
		this.drops[item.ItemID][1]++;
	}

	remove(itemID) {
		if (!this.drops[itemID]) return;
		delete this.drops[itemID];
	}

	async collect(itemID) {
		this.remove(itemID);
		const bot = Bot.getInstance();
		bot.packet.sendServer(`%xt%zm%getDrop%${bot.world.roomId}%${itemID}%`);
		await bot.sleep(300);
	}
}

class Avatar {
	/**
	 * @param {PlayerData} data
	 */
	constructor(data) {
		this.data = data;
	}
}

/**
 * @typedef {Object} PlayerData
 * @property {any[]} auras
 * @property {number} intMP
 * @property {number} entID
 * @property {boolean} afk
 * @property {number} tx
 * @property {string} uoName
 * @property {string} entType
 * @property {string} strPad
 * @property {Object.<string, any>} targets
 * @property {number} ty
 * @property {number} intLevel
 * @property {boolean} showHelm
 * @property {number} intMPMax
 * @property {number} intState
 * @property {number} intSP
 * @property {string} strUsername
 * @property {number} intHP
 * @property {boolean} showCloak
 * @property {string} strFrame
 * @property {number} intHPMax
 */

class Monster {
	/**
	 * @param {MonsterData} data
	 */
	constructor(data) {
		/**
		 * @type {MonsterData}
		 */
		this.data = data;
	}

	/**
	 * The map ID of the monster.
	 * @returns {number}
	 */
	get monMapId() {
		return this.data.MonMapID;
	}

	/**
	 * The global ID of the monster.
	 * @returns {number}
	 */
	get id() {
		return this.data.MonID;
	}

	/**
	 * The level of the monster.
	 * @returns {number}
	 */
	get level() {
		return this.data.iLvl;
	}

	/**
	 * The state of the monster.
	 * @returns {number}
	 */
	get state() {
		return this.data.intState;
	}

	/**
	 * The race of the monster.
	 * @returns {string}
	 */
	get race() {
		return this.data.sRace;
	}

	/**
	 * The name of the monster.
	 * @returns {string}
	 */
	get name() {
		return this.data.strMonName;
	}

	/**
	 * The monster's current HP.
	 * @returns {number}
	 */
	get hp() {
		return this.data.intHP;
	}

	/**
	 * The monster's max HP.
	 * @returns {number}
	 */
	get maxHp() {
		return this.data.intHPMax;
	}

	/**
	 * Whether the monster is alive.
	 * @returns {boolean}
	 */
	get alive() {
		return this.hp > 0;
	}
}

/**
 * @typedef {Object} MonsterData
 * @property {number} MonMapID
 * @property {number} iLvl
 * @property {number} intState
 * @property {string} sRace
 * @property {string} strMonName
 * @property {number} intHP
 * @property {number} MonID
 * @property {number} intHPMax
 */

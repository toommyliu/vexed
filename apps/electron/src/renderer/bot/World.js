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
	 * @returns {Avatar[]}
	 */
	get players() {
		return this.instance.flash.call(window.swf.Players);
	}

	/**
	 * @returns {MonsterData[]}
	 */
	get visibleMonsters() {
		const monsters = this.instance.flash.call(window.swf.GetVisibleMonstersInCell);
		return monsters.map((data) => new Monster(data));
	}

	/**
	 * @returns {MonsterData[]}
	 */
	get availableMonsters() {
		const monsters = this.instance.flash.call(window.swf.GetMonstersInCell);
		return monsters.map((data) => new Monster(data));
	}

	/**
	 * @returns {void}
	 */
	reload() {
		this.instance.flash.call(window.swf.ReloadMap);
	}

	/**
	 * @returns {boolean}
	 */
	get loading() {
		return !this.instance.flash.call(window.swf.MapLoadComplete);
	}

	/**
	 * @returns {string[]}
	 */
	get cells() {
		return this.instance.flash.call(window.swf.GetCells);
	}

	/**
	 * @returns {void}
	 */
	setSpawnpoint() {
		this.instance.flash.call(window.swf.SetSpawnPoint);
	}

	/**
	 * @returns {number}
	 */
	get roomId() {
		return this.instance.flash.call(window.swf.RoomId);
	}

	/**
	 * @returns {number}
	 */
	get roomNumber() {
		return this.instance.flash.call(window.swf.RoomNumber);
	}

	/**
	 * @returns {string}
	 */
	get name() {
		return this.instance.flash.call(window.swf.Map);
	}

	/**
	 * @param {string} cell
	 * @param {string} [pad="Spawn"]
	 * @returns {void}
	 */
	jump(cell, pad = 'Spawn') {
		this.instance.flash.call(window.swf.Jump, cell, pad);
	}

	/**
	 *
	 * @param {string} map_name
	 * @param {string} [cell="Enter"]
	 * @param {string} [pad="Spawn"]
	 * @returns {void}
	 */
	join(map_name, cell = 'Enter', pad = 'Spawn') {
		if (this.name.toLowerCase() === map_name.toLowerCase()) {
			this.jump(cell, pad);
			return;
		}

		let map_str = map_name;

		// Use random room number ?
		if (map_name.endsWith('-1e9') || map_name.endsWith('-1e99')) {
			map_str = map_name.replace('1e99', '100000').replace('1e9', '100000');
		}

		this.instance.flash.call(window.swf.Join, map_str, cell, pad);
	}

	/**
	 * @param {string} name
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
		 * @type {Object.<string, [BankItemData, number]>}
		 */
		this.drops = {};
	}

	add(item) {
		this.drops[item.ItemID] ??= [item, 0];
		this.drops[item.ItemID][1]++;
	}

	async collect(itemID) {
		if (this.drops[itemID]) {
			const item = this.drops[itemID][0];
			const bot = Bot.getInstance();
			bot.packet.sendServer(`%xt%zm%getDrop%${bot.world.roomId}%${itemID}%`);
			await bot.sleep(300);
			delete this.drops[itemID];
		}
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

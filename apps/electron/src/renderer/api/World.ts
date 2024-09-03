import Avatar from './struct/Avatar';
import Monster from './struct/Monster';
import type Bot from './Bot';

class World {
	bot: Bot;

	constructor(bot: Bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * Gets all players in the current map.
	 * @returns {Avatar[]}
	 */
	get players() {
		const _players = this.bot.flash.call(swf.Players) ?? [];
		if (Object.keys(_players).length > 0) {
			return Object.values(_players).map((data) => new Avatar(data));
		}
		return [];
	}

	/**
	 * The monsters in the map.
	 * @returns {MonsterData[]}
	 */
	get monsters() {
		try {
			return JSON.parse(
				swf.selectArrayObjects('world.monsters', 'objData'),
			);
		} catch {
			return [];
		}
	}

	/**
	 * Gets all visible monsters in the current cell.
	 * @returns {Monster[]}
	 */
	get visibleMonsters() {
		const ret = this.bot.flash.call(swf.GetVisibleMonstersInCell);
		if (Array.isArray(ret)) {
			return ret.map((data) => new Monster(data));
		}
		return [];
	}

	/**
	 * Gets all available monsters in the current cell.
	 * @returns {Monster[]}
	 */
	get availableMonsters() {
		const ret = this.bot.flash.call(swf.GetMonstersInCell);
		if (Array.isArray(ret)) {
			return ret.map((data) => new Monster(data));
		}
		return [];
	}

	/**
	 * Whether a monster is available.
	 * @param {string} monsterResolvable The name of the monster or in monMapID format.
	 * @returns {boolean}
	 */
	isMonsterAvailable(monsterResolvable: string) {
		// prettier-ignore
		if (["id'", 'id.', 'id:', 'id-'].some((prefix) => monsterResolvable.startsWith(prefix))) {
			const monMapID = monsterResolvable.substring(3);
		 	this.bot.flash.call(
				swf.IsMonsterAvailableByMonMapID,
				monMapID,
			)
			return;
		}
		this.bot.flash.call(swf.IsMonsterAvailable, monsterResolvable);
	}

	/**
	 * Reloads the map.
	 * @returns {void}
	 */
	reload() {
		this.bot.flash.call(swf.ReloadMap);
	}

	/**
	 * Checks if the map is still loading.
	 * @returns {boolean}
	 */
	get loading() {
		return !this.bot.flash.call(swf.MapLoadComplete);
	}

	/**
	 * Gets all cells of the map.
	 * @returns {string[]}
	 */
	get cells() {
		return this.bot.flash.call(swf.GetCells);
	}

	/**
	 * Get cell pads.
	 * @returns {string[]}
	 */
	get cellPads() {
		return this.bot.flash.call(swf.GetCellPads);
	}

	/**
	 * Sets the local player's spawnpoint to the current cell and pad.
	 * @returns {void}
	 */
	setSpawnPoint() {
		this.bot.flash.call(swf.SetSpawnPoint);
	}

	/**
	 * Gets the internal room ID of the current map.
	 * @returns {number}
	 */
	get roomID() {
		return this.bot.flash.call(swf.RoomId);
	}

	/**
	 * Gets the room number of the current map.
	 * @returns {number}
	 */
	get roomNumber() {
		return this.bot.flash.call(swf.RoomNumber);
	}

	/**
	 * Gets the name of the current map.
	 * @returns {string}
	 */
	get name() {
		return this.bot.flash.call(swf.Map);
	}

	/**
	 * Jump to the specified cell and pad of the current map.
	 * @param {string} cell The cell to jump to.
	 * @param {string} [pad="Spawn"] The pad to jump to.
	 * @param {boolean} [force=false] Whether to allow jumping to the same cell.
	 * @param {number} [tries=5] The number of times to try jumping.
	 * @returns {Promise<void>}
	 */
	async jump(
		cell: string,
		pad = 'Spawn',
		force = false,
		tries = 5,
	): Promise<void> {
		const isSameCell = () =>
			this.bot.player.cell.toLowerCase() === cell.toLowerCase();

		let i = tries;

		while ((!isSameCell() || force) && i > 0) {
			this.bot.flash.call(swf.Jump, cell, pad);
			await this.bot.sleep(1000);

			if (isSameCell() && force) {
				break;
			}

			i--;
		}
	}

	/**
	 * Joins a map.
	 * @param {string} mapName The name of the map to join.
	 * @param {string} [cell="Enter"] The cell to jump to.
	 * @param {string} [pad="Spawn"] The pad to jump to.
	 * @param {number} [tries=5] Number of attempts to try and join the map
	 * @returns {Promise<void>}
	 */
	async join(mapName: string, cell = 'Enter', pad = 'Spawn', tries = 5) {
		await this.bot.waitUntil(
			() => this.isActionAvailable(GameAction.Transfer),
			null,
			15,
		);

		let attempts = tries;
		let map_str = mapName;
		let [map_name, map_number] = map_str.split('-');

		if (
			map_number === '1e9' ||
			map_number === '1e99' ||
			Number.isNaN(
				Number.parseInt(map_number!),
			) /* any non-number, e.g yulgar-a*/
		) {
			map_number = '100000';
		}

		map_str = `${map_name}${map_number ? `-${map_number}` : ''}`;

		while (
			attempts > 0 &&
			this.name.toLowerCase() !== map_name!.toLowerCase()
		) {
			await this.bot.waitUntil(
				() => this.isActionAvailable(GameAction.Transfer),
				null,
				15,
			);
			await this.bot.combat.exit();
			this.bot.flash.call(swf.Join, map_str, cell, pad);
			await this.bot.waitUntil(
				() => this.name.toLowerCase() === map_name!.toLowerCase(),
				null,
				10,
			);
			await this.bot.waitUntil(() => !this.loading, null, 40);

			attempts--;
		}

		await this.jump(cell, pad);
		this.setSpawnPoint();
	}

	/**
	 * Goto the specified player.
	 * @param {string} name The name of the player to goto.
	 * @returns {void}
	 */
	goto(name: string) {
		this.bot.flash.call(swf.GoTo, name);
	}

	/**
	 * The list of all items in the world.
	 * @returns {InventoryItemData[]}
	 */
	get itemTree() {
		return this.bot.flash.call(swf.GetItemTree);
	}

	/**
	 * Whether the game action has cooled down.
	 * @param {typeof GameAction} action The game action to check.
	 * @returns {boolean}
	 */
	isActionAvailable(action: GameAction): boolean {
		return this.bot.flash.call(swf.IsActionAvailable, action);
	}

	/**
	 * Gets a item in the world.
	 * @param {string} itemID The ID of the item.
	 * @returns {Promise<void>}
	 */
	async getMapItem(itemID: string) {
		await this.bot.waitUntil(() =>
			this.isActionAvailable(GameAction.GetMapItem),
		);
		this.bot.flash.call(swf.GetMapItem, itemID);
		await this.bot.sleep(2000);
	}

	/**
	 * Loads a particular swf of the map.
	 * @param {string} mapSWF The swf to load.
	 * @returns {void}
	 */
	loadMap(mapSWF: string) {
		if (!mapSWF.endsWith('.swf')) {
			mapSWF += '.swf';
		}
		this.bot.flash.call(swf.LoadMap, mapSWF);
	}
}

enum GameAction {
	/**
	 * Loading a shop.
	 * @memberof GameAction
	 * @type {string}
	 */
	LoadShop = 'loadShop',
	/**
	 * Loading an enhancement shop.
	 * @memberof GameAction
	 * @type {string}
	 */
	LoadEnhShop = 'loadEnhShop',
	/**
	 * Loading a hair shop.
	 * @memberof GameAction
	 * @type {string}
	 */
	LoadHairShop = 'loadHairShop',
	/**
	 * Equipping an item.
	 * @memberof GameAction
	 * @type {string}
	 */
	EquipItem = 'equipItem',
	/**
	 * Unequipping an item.
	 * @memberof GameAction
	 * @type {string}
	 */
	UnequipItem = 'unequipItem',
	/**
	 * Buying an item.
	 * @memberof GameAction
	 * @type {string}
	 */
	BuyItem = 'buyItem',
	/**
	 * Selling an item.
	 * @memberof GameAction
	 * @type {string}
	 */
	SellItem = 'sellItem',
	/**
	 * Getting a map item (i.e. via the getMapItem packet).
	 * @memberof GameAction
	 * @type {string}
	 */
	GetMapItem = 'getMapItem',
	/**
	 * Sending a quest completion packet.
	 * @memberof GameAction
	 * @type {string}
	 */
	TryQuestComplete = 'tryQuestComplete',
	/**
	 * Accepting a quest.
	 * @memberof GameAction
	 * @type {string}
	 */
	AcceptQuest = 'acceptQuest',
	/**
	 * Do IA action.
	 * @memberof GameAction
	 * @type {string}
	 */
	DoIA = 'doIA',
	/**
	 * Resting.
	 * @memberof GameAction
	 * @type {string}
	 */
	Rest = 'rest',
	/**
	 * Who action.
	 * @memberof GameAction
	 * @type {string}
	 */
	Who = 'who',
	/**
	 * Joining another map.
	 * @memberof GameAction
	 * @type {string}
	 */
	Transfer = 'tfer',
}

Object.defineProperty(window, 'GameAction', {
	value: GameAction,
	writable: false,
});

export { World, GameAction };

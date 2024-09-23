import type { Bot } from './Bot';
import { Avatar, type AvatarData } from './struct/Avatar';
import type { ItemData } from './struct/Item';
import { Monster, type MonsterData } from './struct/Monster';

export class World {
	public constructor(public bot: Bot) {}

	/**
	 * Gets all players in the current map.
	 */
	public get players(): Avatar[] {
		const out = this.bot.flash.call(() => swf.Players()) ?? {};
		return Object.values(out).map(
			(data) => new Avatar(data as unknown as AvatarData),
		);
	}

	/**
	 * The monsters in the map.
	 */
	public get monsters(): MonsterData[] {
		try {
			return JSON.parse(
				swf.selectArrayObjects('world.monsters', 'objData'),
			) as MonsterData[];
		} catch {
			return [];
		}
	}

	/**
	 * Gets all visible monsters in the current cell.
	 */
	public get visibleMonsters() {
		const ret = this.bot.flash.call(() => swf.GetVisibleMonstersInCell());
		if (Array.isArray(ret)) {
			return ret.map(
				(data) => new Monster(data as unknown as MonsterData),
			);
		}

		return [];
	}

	/**
	 * Gets all available monsters in the current cell.
	 */
	public get availableMonsters() {
		const ret = this.bot.flash.call(() => swf.GetMonstersInCell());
		if (Array.isArray(ret)) {
			return ret.map(
				(data) => new Monster(data as unknown as MonsterData),
			);
		}

		return [];
	}

	/**
	 * Whether a monster is available.
	 *
	 * @param monsterResolvable - The name of the monster or in monMapID format.
	 */
	public isMonsterAvailable(monsterResolvable: string): boolean {
		// prettier-ignore
		if (["id'", 'id.', 'id:', 'id-'].some((prefix) => monsterResolvable.startsWith(prefix))) {
			const monMapID = monsterResolvable.slice(3);
		 	return this.bot.flash.call(() => swf.IsMonsterAvailableByMonMapID(monMapID));
		}

		return this.bot.flash.call(() =>
			swf.IsMonsterAvailable(monsterResolvable),
		);
	}

	/**
	 * Reloads the map.
	 */
	public reload(): void {
		this.bot.flash.call(() => swf.ReloadMap());
	}

	/**
	 * Checks if the map is still loading.
	 */
	public get loading(): boolean {
		return !this.bot.flash.call(() => swf.MapLoadComplete());
	}

	/**
	 * Gets all cells of the map.
	 */
	public get cells(): string[] {
		return this.bot.flash.call(() => swf.GetCells());
	}

	/**
	 * Get cell pads.
	 */
	public get cellPads(): string[] {
		return this.bot.flash.call(() => swf.GetCellPads());
	}

	/**
	 * Sets the local player's spawnpoint to the current cell and pad.
	 */
	public setSpawnPoint(): void {
		this.bot.flash.call(() => swf.SetSpawnPoint());
	}

	/**
	 * Gets the internal room ID of the current map.
	 */
	public get roomID(): number {
		return this.bot.flash.call(() => swf.RoomId());
	}

	/**
	 * Gets the room number of the current map.
	 */
	public get roomNumber(): number {
		return this.bot.flash.call(() => swf.RoomNumber());
	}

	/**
	 * Gets the name of the current map.
	 */
	public get name(): string {
		return this.bot.flash.call(() => swf.Map());
	}

	/**
	 * Jump to the specified cell and pad of the current map.
	 *
	 * @param cell - The cell to jump to.
	 * @param pad - The pad to jump to.
	 * @param force - Whether to allow jumping to the same cell.
	 * @param tries - The number of times to try jumping.
	 */
	public async jump(
		cell: string,
		pad = 'Spawn',
		force = false,
		tries = 5,
	): Promise<void> {
		const isSameCell = () =>
			this.bot.player.cell.toLowerCase() === cell.toLowerCase();

		let count = tries;

		// eslint-disable-next-line no-unmodified-loop-condition
		while ((!isSameCell() || force) && count > 0) {
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			this.bot.flash.call(() => swf.Jump(cell, pad));
			await this.bot.sleep(1_000);

			if (isSameCell() && force) {
				break;
			}

			count--;
		}
	}

	/**
	 * Joins a map.
	 *
	 * @param mapName - The name of the map to join.
	 * @param cell - The cell to jump to.
	 * @param pad - The pad to jump to.
	 * @param tries - Number of attempts to try and join the map.
	 */
	public async join(
		mapName: string,
		cell = 'Enter',
		pad = 'Spawn',
		tries = 5,
	): Promise<void> {
		await this.bot.waitUntil(
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			() => this.isActionAvailable(GameAction.Transfer),
			null,
			15,
		);

		let attempts = tries;
		let map_str = mapName;
		// eslint-disable-next-line prefer-const
		let [map_name, map_number] = map_str.split('-');

		if (
			map_number === '1e9' ||
			map_number === '1e99' ||
			Number.isNaN(
				Number.parseInt(map_number!, 10),
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
				// eslint-disable-next-line @typescript-eslint/no-use-before-define
				() => this.isActionAvailable(GameAction.Transfer),
				null,
				15,
			);
			await this.bot.combat.exit();
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			this.bot.flash.call(() => swf.Join(map_str, cell, pad));
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
	 *
	 * @param playerName - The name of the player to goto.
	 */
	public goto(playerName: string): void {
		this.bot.flash.call(() => swf.GoTo(playerName));
	}

	/**
	 * The list of all items in the world.
	 *
	 */
	public get itemTree(): ItemData[] {
		return this.bot.flash.call(() => swf.GetItemTree());
	}

	/**
	 * Whether the game action has cooled down.
	 *
	 * @param gameAction - The game action to check.
	 */
	public isActionAvailable(gameAction: GameAction): boolean {
		return this.bot.flash.call(() => swf.IsActionAvailable(gameAction));
	}

	/**
	 * Gets a item in the world.
	 *
	 * @param itemID - The ID of the item.
	 */
	public async getMapItem(itemID: string): Promise<void> {
		await this.bot.waitUntil(() =>
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			this.isActionAvailable(GameAction.GetMapItem),
		);
		this.bot.flash.call(() => swf.GetMapItem(itemID));
		await this.bot.sleep(2_000);
	}

	/**
	 * Loads a particular swf of the map.
	 *
	 * @param mapSWF - The swf to load.
	 */
	public loadMap(mapSWF: string): void {
		if (!mapSWF.endsWith('.swf')) {
			// eslint-disable-next-line no-param-reassign
			mapSWF += '.swf';
		}

		this.bot.flash.call(() => swf.LoadMap(mapSWF));
	}
}

export enum GameAction {
	/**
	 * Accepting a quest.
	 */
	AcceptQuest = 'acceptQuest',
	/**
	 * Buying an item.
	 */
	BuyItem = 'buyItem',
	/**
	 * Do IA action.
	 */
	DoIA = 'doIA',
	/**
	 * Equipping an item.
	 */
	EquipItem = 'equipItem',
	/**
	 * Getting a map item (i.e. via the getMapItem packet).
	 */
	GetMapItem = 'getMapItem',
	/**
	 * Loading an enhancement shop.
	 */
	LoadEnhShop = 'loadEnhShop',
	/**
	 * Loading a hair shop.
	 */
	LoadHairShop = 'loadHairShop',
	/**
	 * Loading a shop.
	 */
	LoadShop = 'loadShop',
	/**
	 * Resting.
	 */
	Rest = 'rest',
	/**
	 * Selling an item.
	 */
	SellItem = 'sellItem',
	/**
	 * Joining another map.
	 */
	Transfer = 'tfer',
	/**
	 * Sending a quest completion packet.
	 */
	TryQuestComplete = 'tryQuestComplete',
	/**
	 * Unequipping an item.
	 */
	UnequipItem = 'unequipItem',
	/**
	 * Who action.
	 */
	Who = 'who',
}

Object.defineProperty(window, 'GameAction', {
	value: GameAction,
	writable: false,
});

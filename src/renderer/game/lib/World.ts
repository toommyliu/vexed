import { isMonsterMapId } from '../util/isMonMapId';
import type { Bot } from './Bot';
import { Avatar, type AvatarData } from './models/Avatar';
import type { ItemData } from './models/Item';
import { Monster, type MonsterData } from './models/Monster';

export const GameAction = {
	/**
	 * Accepting a quest.
	 */
	AcceptQuest: 'acceptQuest',
	/**
	 * Buying an item.
	 */
	BuyItem: 'buyItem',
	/**
	 * Do IA action.
	 */
	DoIA: 'doIA',
	/**
	 * Equipping an item.
	 */
	EquipItem: 'equipItem',
	/**
	 * Getting a map item (i.e. via the getMapItem packet).
	 */
	GetMapItem: 'getMapItem',
	/**
	 * Loading an enhancement shop.
	 */
	LoadEnhShop: 'loadEnhShop',
	/**
	 * Loading a hair shop.
	 */
	LoadHairShop: 'loadHairShop',
	/**
	 * Loading a shop.
	 */
	LoadShop: 'loadShop',
	/**
	 * Resting.
	 */
	Rest: 'rest',
	/**
	 * Selling an item.
	 */
	SellItem: 'sellItem',
	/**
	 * Joining another map.
	 */
	Transfer: 'tfer',
	/**
	 * Sending a quest completion packet.
	 */
	TryQuestComplete: 'tryQuestComplete',
	/**
	 * Unequipping an item.
	 */
	UnequipItem: 'unequipItem',
	/**
	 * Who action.
	 */
	Who: 'who',
} as const;

export class World {
	public constructor(public readonly bot: Bot) {}

	/**
	 * A list of all player names in the map.
	 */
	public get playerNames(): string[] {
		return this.bot.flash.call(() => swf.worldGetPlayerNames()) ?? [];
	}

	/**
	 * Whether a player is in the map.
	 *
	 * @param name - The player name to check.
	 */
	public isPlayerInMap(name: string) {
		return this.playerNames.some((playerName) =>
			playerName.toLowerCase().includes(name.toLowerCase()),
		);
	}

	/**
	 * A list of all players in the map.
	 */
	public get players(): Map<string, Avatar> | null {
		const out = this.bot.flash.call<Record<string, AvatarData>>(() =>
			swf.worldGetPlayers(),
		);

		if (!out) return null;

		const map = new Map<string, Avatar>();
		for (const [name, data] of Object.entries(out)) {
			map.set(name, new Avatar(data));
		}

		return map;
	}

	/**
	 *  A list of monsters in the map.
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
	 * A list of monsters in the cell.
	 */
	public get availableMonsters() {
		const ret = this.bot.flash.call(() => swf.worldGetCellMonsters());
		return Array.isArray(ret) ? ret.map((data) => new Monster(data)) : [];
	}

	/**
	 * Whether a monster is available.
	 *
	 * @param monsterResolvable - The name of the monster or in monMapID format.
	 */
	public isMonsterAvailable(monsterResolvable: string): boolean {
		if (isMonsterMapId(monsterResolvable)) {
			return this.bot.flash.call(() =>
				swf.worldIsMonsterAvailable(monsterResolvable),
			);
		}

		return this.bot.flash.call(() =>
			swf.worldIsMonsterAvailable(monsterResolvable),
		);
	}

	/**
	 * Reloads the map.
	 */
	public reload(): void {
		this.bot.flash.call(() => swf.worldReload());
	}

	/**
	 * Whether the map is still being loaded.
	 */
	public isLoading(): boolean {
		return !this.bot.flash.call(() => swf.worldIsLoaded());
	}

	/**
	 * A list of all cells in the map.
	 */
	public get cells(): string[] {
		return this.bot.flash.call(() => swf.worldGetCells());
	}

	/**
	 * A list of valid pads for the current cell.
	 */
	public get cellPads(): string[] {
		return this.bot.flash.call(() => swf.worldGetCellPads());
	}

	/**
	 * Sets the player's spawnpoint.
	 */
	public setSpawnPoint(cell?: string, pad?: string): void {
		if (cell && pad) {
			this.bot.flash.call('world.setSpawnPoint', cell, pad);
			return;
		}

		this.bot.flash.call(() =>
			swf.worldSetSpawnPoint(this.bot.player.cell, this.bot.player.pad),
		);
	}

	/**
	 * The current room area id.
	 */
	public get roomId(): number {
		return this.bot.flash.call(() => swf.worldGetRoomId());
	}

	/**
	 * The room number of the map.
	 */
	public get roomNumber(): number {
		return this.bot.flash.call(() => swf.worldGetRoomNumber());
	}

	/**
	 * The name of the map.
	 */
	public get name(): string {
		return this.bot.flash.call(() => swf.playerGetMap());
	}

	/**
	 * Jump to the specified cell and pad of the current map.
	 *
	 * @param cell - The cell to jump to.
	 * @param pad - The pad to jump to.
	 */
	public async jump(cell: string, pad = 'Spawn'): Promise<void> {
		const isSameCell = () =>
			this.bot.player.cell.toLowerCase() === cell.toLowerCase();
		if (isSameCell()) return;

		this.bot.flash.call(() => swf.playerJump(cell, pad));
		await this.bot.waitUntil(isSameCell, null, 5);
	}

	/**
	 * Joins a map.
	 *
	 * @param mapName - The name of the map to join.
	 * @param cell - The cell to jump to.
	 * @param pad - The pad to jump to.
	 */
	public async join(
		mapName: string,
		cell = 'Enter',
		pad = 'Spawn',
	): Promise<void> {
		await this.bot.waitUntil(
			() => this.isActionAvailable(GameAction.Transfer),
			null,
			15,
		);

		let map_str = mapName;
		// eslint-disable-next-line prefer-const
		let [map_name, map_number] = map_str.split('-');

		if (this.name.toLowerCase() === map_name!.toLowerCase()) {
			await this.jump(cell, pad);
			return;
		}

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

		await this.bot.combat.exit();
		this.bot.flash.call(() => swf.playerJoinMap(map_str, cell, pad));
		await this.bot.waitUntil(
			() => this.name.toLowerCase() === map_name!.toLowerCase(),
			null,
			10,
		);
		await this.bot.waitUntil(() => !this.isLoading(), null, 40);

		if (
			this.bot.player.cell.toLowerCase() !== cell.toLowerCase() ||
			this.bot.player.pad.toLowerCase() !== pad.toLowerCase()
		) {
			await this.jump(cell, pad);
		}

		this.setSpawnPoint();
	}

	/**
	 * Goto the specified player.
	 *
	 * @param playerName - The name of the player to goto.
	 */
	public goto(playerName: string): void {
		this.bot.flash.call(() => swf.playerGoTo(playerName));
	}

	/**
	 * The list of all items in the world.
	 *
	 */
	public get itemTree(): ItemData[] {
		return this.bot.flash.call(() => swf.worldGetItemTree());
	}

	/**
	 * Whether the game action has cooled down.
	 *
	 * @param gameAction - The game action to check.
	 */
	public isActionAvailable(
		gameAction: (typeof GameAction)[keyof typeof GameAction],
	): boolean {
		return this.bot.flash.call(() =>
			swf.worldIsActionAvailable(gameAction),
		);
	}

	/**
	 * Gets a item in the world.
	 *
	 * @param itemId - The ID of the item.
	 */
	public async getMapItem(itemId: number): Promise<void> {
		await this.bot.waitUntil(() =>
			this.isActionAvailable(GameAction.GetMapItem),
		);
		this.bot.flash.call(() => swf.worldGetMapItem(itemId));
		await this.bot.sleep(2_000);
	}

	/**
	 * Loads a particular swf of a map.
	 *
	 * @param mapSwf - The swf to load.
	 */
	public loadMapSwf(mapSwf: string): void {
		this.bot.flash.call(() =>
			swf.worldLoadSwf(
				`${mapSwf}${mapSwf.endsWith('.swf') ? '' : '.swf'}`,
			),
		);
	}
}

import type { Bot } from './Bot';
import { Avatar, type AvatarData } from './struct/Avatar';
import type { ItemData } from './struct/Item';
import { Monster, type MonsterData } from './struct/Monster';
import { isMonsterMapId } from './util/utils';

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

export class World {
	public constructor(public readonly bot: Bot) {}

	/**
	 * A list of all players in the map.
	 */
	public get players(): Avatar[] {
		const out =
			this.bot.flash.call<Record<string, AvatarData>>(() =>
				swf.Players(),
			) ?? {};
		return Object.values(out).map((data) => new Avatar(data));
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
	 * A list of visible monsters in the cell.
	 */
	public get visibleMonsters() {
		const ret = this.bot.flash.call(() => swf.GetVisibleMonstersInCell());
		return Array.isArray(ret) ? ret.map((data) => new Monster(data)) : [];
	}

	/**
	 * A list of available monsters in the cell.
	 */
	public get availableMonsters() {
		const ret = this.bot.flash.call(() => swf.GetMonstersInCell());
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
				swf.IsMonsterAvailableByMonMapID(monsterResolvable),
			);
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
	 * Whether the map is still being loaded.
	 */
	public isLoading(): boolean {
		return !this.bot.flash.call(() => swf.MapLoadComplete());
	}

	/**
	 * A list of all cells in the map.
	 */
	public get cells(): string[] {
		return this.bot.flash.call(() => swf.GetCells());
	}

	/**
	 * A list of valid pads for the current cell.
	 */
	public get cellPads(): string[] {
		return this.bot.flash.call(() => swf.GetCellPads());
	}

	/**
	 * Sets the player's spawnpoint to the current cell and pad.
	 */
	public setSpawnPoint(cell?: string, pad?: string): void {
		if (cell && pad) {
			this.bot.flash.call('world.setSpawnPoint', cell, pad);
			return;
		}

		this.bot.flash.call(() => swf.SetSpawnPoint());
	}

	/**
	 * The current room area id.
	 */
	public get roomId(): number {
		return this.bot.flash.call(() => swf.RoomId());
	}

	/**
	 * The room number of the map.
	 */
	public get roomNumber(): number {
		return this.bot.flash.call(() => swf.RoomNumber());
	}

	/**
	 * The name of the map.
	 */
	public get name(): string {
		return this.bot.flash.call(() => swf.Map());
	}

	/**
	 * Jump to the specified cell and pad of the current map.
	 *
	 * @param cell - The cell to jump to.
	 * @param pad - The pad to jump to.
	 * @param options - Additional options.
	 */
	public async jump(
		cell: string,
		pad = 'Spawn',
		{
			autoCorrect = false,
			force = false,
			tries = 5,
		}: { autoCorrect?: boolean; force?: boolean; tries?: number } = {},
	): Promise<void> {
		const isSameCell = () =>
			this.bot.player.cell.toLowerCase() === cell.toLowerCase();

		let attempts = tries;

		while ((!isSameCell() || force) && attempts > 0) {
			this.bot.flash.call(() => swf.Jump(cell, pad));
			await this.bot.sleep(1_000);

			if (
				autoCorrect &&
				!this.cellPads.some(
					(pad_) => pad_.toLowerCase() === pad.toLowerCase(),
				)
			) {
				const randomPad =
					this.cellPads[
						Math.floor(Math.random() * this.cellPads.length)
					];
				this.bot.flash.call(() => swf.Jump(cell, randomPad));
			}

			if (isSameCell() && !force) {
				break;
			}

			attempts--;
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
	): Promise<void> {
		await this.bot.waitUntil(
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			() => this.isActionAvailable(GameAction.Transfer),
			null,
			15,
		);

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

		await this.bot.waitUntil(
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			() => this.isActionAvailable(GameAction.Transfer),
			null,
			15,
		);

		await this.bot.combat.exit();
		this.bot.flash.call(() => swf.Join(map_str, cell, pad));
		await this.bot.waitUntil(
			() => this.name.toLowerCase() === map_name!.toLowerCase(),
			null,
			10,
		);

		await this.bot.waitUntil(() => !this.isLoading(), null, 40);

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
	 * @param itemId - The ID of the item.
	 */
	public async getMapItem(itemId: string): Promise<void> {
		await this.bot.waitUntil(() =>
			this.isActionAvailable(GameAction.GetMapItem),
		);
		this.bot.flash.call(() => swf.GetMapItem(itemId));
		await this.bot.sleep(2_000);
	}

	/**
	 * Loads a particular swf of a map.
	 *
	 * @param mapSwf - The swf to load.
	 */
	public loadMapSwf(mapSwf: string): void {
		this.bot.flash.call(() =>
			swf.LoadMap(`${mapSwf}${mapSwf.endsWith('.swf') ? '' : '.swf'}`),
		);
	}
}

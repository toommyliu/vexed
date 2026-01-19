import { Monster, Avatar } from "@vexed/game";
import type { AvatarData, ItemData, MonsterData } from "@vexed/game";
import { extractMonsterMapId, isMonsterMapId } from "~/utils/isMonMapId";
import type { Bot } from "./Bot";

export enum GameAction {
  /**
   * Accepting a quest.
   */
  AcceptQuest = "acceptQuest",
  /**
   * Buying an item.
   */
  BuyItem = "buyItem",
  /**
   * Do IA action.
   */
  DoIA = "doIA",
  /**
   * Equipping an item.
   */
  EquipItem = "equipItem",
  /**
   * Getting a map item (i.e. via the getMapItem packet).
   */
  GetMapItem = "getMapItem",
  /**
   * Loading an enhancement shop.
   */
  LoadEnhShop = "loadEnhShop",
  /**
   * Loading a hair shop.
   */
  LoadHairShop = "loadHairShop",
  /**
   * Loading a shop.
   */
  LoadShop = "loadShop",
  /**
   * Resting.
   */
  Rest = "rest",
  /**
   * Selling an item.
   */
  SellItem = "sellItem",
  /**
   * Joining another map.
   */
  Transfer = "tfer",
  /**
   * Sending a quest completion packet.
   */
  TryQuestComplete = "tryQuestComplete",
  /**
   * Unequipping an item.
   */
  UnequipItem = "unequipItem",
  /**
   * Who action.
   */
  Who = "who",
}

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
   * Whether a player is in a given cell.
   *
   * @param name - The player name to check.
   * @param cell - The cell to check.
   */
  public isPlayerInCell(name: string, cell: string) {
    return this.bot.flash.call<boolean>(() =>
      swf.worldIsPlayerInCell(name, cell),
    );
  }

  /**
   * A list of all players in the map.
   */
  public get players(): Map<string, Avatar> | null {
    const out = this.bot.flash.call<string>(() => swf.worldGetPlayers());

    if (!out) return null;

    const parsedOut = out as unknown as Record<string, AvatarData>;

    const map = new Map<string, Avatar>();
    for (const [name, data] of Object.entries(parsedOut)) {
      try {
        map.set(
          name?.toLowerCase(),
          new Avatar(JSON.parse(data as unknown as string)),
        );
      } catch {
        console.warn(`failed to parse avatar for: ${name}`);
      }
    }

    return map;
  }

  /**
   *  A list of monsters in the map.
   */
  public get monsters(): MonsterData[] {
    try {
      return JSON.parse(
        swf.selectArrayObjects("world.monsters", "objData"),
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
      const monMapIdStr = extractMonsterMapId(monsterResolvable);
      const monMapId = Number.parseInt(monMapIdStr, 10);

      return this.availableMonsters.some((mon) => mon.monMapId === monMapId);
    }

    if (monsterResolvable === "*") {
      return this.availableMonsters.length > 0;
    }

    return this.availableMonsters.some((mon) =>
      mon.name.toLowerCase().includes(monsterResolvable.toLowerCase()),
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
      this.bot.flash.call("world.setSpawnPoint", cell, pad);
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
   * @param ignoreCheck - Whether to ignore the current cell check.
   */
  public async jump(
    cell: string,
    pad = "Spawn",
    ignoreCheck = false,
  ): Promise<void> {
    const isSameCell = () =>
      this.bot.player.cell.toLowerCase() === cell.toLowerCase();
    if (isSameCell() && !ignoreCheck) return;

    this.bot.flash.call(() => swf.playerJump(cell, pad));
    await this.bot.waitUntil(isSameCell);
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
    cell = "Enter",
    pad = "Spawn",
  ): Promise<void> {
    // Make sure the player is alive to be able to do the transfer.
    await this.bot.waitUntil(() => this.bot.player.alive);

    await this.bot.combat.exit();

    await this.bot.waitUntil(
      () => this.isActionAvailable(GameAction.Transfer),
      { timeout: 5_000 },
    );

    let mapStr = mapName;
    // eslint-disable-next-line prefer-const
    let [map_name, map_number] = mapStr.split("-");

    if (this.name.toLowerCase() === map_name!.toLowerCase()) {
      await this.jump(cell, pad);
      return;
    }

    // If for some reason, the provided map number is invalid, assume a random large number
    if (
      map_number === "1e9" ||
      map_number === "1e99" ||
      Number.isNaN(
        Number.parseInt(map_number!, 10),
      ) /* any non-number, e.g yulgar-a*/
    ) {
      map_number = "100000";
    }

    mapStr = `${map_name}${map_number ? `-${map_number}` : ""}`;

    this.bot.flash.call(() => swf.playerJoinMap(mapStr, cell, pad));
    await this.bot.waitUntil(
      () =>
        !this.isLoading() &&
        this.name.toLowerCase() === map_name!.toLowerCase(),
      { timeout: 10_000 },
    );

    // Sometimes, the player might not end up in the correct cell/pad, even if specified
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
  public isActionAvailable(gameAction: GameAction): boolean {
    return this.bot.flash.call(() => swf.worldIsActionAvailable(gameAction));
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
      swf.worldLoadSwf(`${mapSwf}${mapSwf.endsWith(".swf") ? "" : ".swf"}`),
    );
  }

  /**
   * Hunt for a monster in the map.
   *
   * @param target - The monster name or monMapId to hunt.
   * @param most - Whether to target the cell with the most monsters. Otherwise, it will target the cell with the first matching monster.
   */
  public async hunt(target: string, most = false): Promise<void> {
    const matchingMonsters = this.filterMonstersByTarget(this.monsters, target);

    if (matchingMonsters.length === 0) return;

    const monstersByCell = this.groupMonstersByCell(matchingMonsters);
    const targetCell = this.findBestCell(monstersByCell, most);

    if (!targetCell) {
      return;
    }

    await this.jump(targetCell);

    const cellPad =
      this.cellPads[Math.floor(Math.random() * this.cellPads.length)];
    await this.jump(targetCell, cellPad, true);
  }

  private filterMonstersByTarget(
    monsters: MonsterData[],
    target: string,
  ): MonsterData[] {
    if (isMonsterMapId(target)) {
      const monMapIdStr = extractMonsterMapId(target);
      const monMapId = Number.parseInt(monMapIdStr, 10);
      return monsters.filter((monster) => monster.monMapId === monMapId);
    }

    if (target === "*") return monsters;
    return monsters.filter((monster) =>
      monster.strMonName.toLowerCase().includes(target.toLowerCase()),
    );
  }

  private groupMonstersByCell(
    monsters: MonsterData[],
  ): Map<string, MonsterData[]> {
    const groups = new Map<string, MonsterData[]>();

    for (const monster of monsters) {
      const cell = monster.strFrame;
      if (!groups.has(cell)) groups.set(cell, []);

      groups.get(cell)!.push(monster);
    }

    return groups;
  }

  private findBestCell(
    monstersByCell: Map<string, MonsterData[]>,
    most: boolean,
  ): string | null {
    const cells = Array.from(monstersByCell.keys());

    if (cells.length === 0) return null;

    if (!most) return cells[0] ?? null;

    let bestCell = cells[0];
    if (!bestCell) return null;

    let maxCount = monstersByCell.get(bestCell)?.length ?? 0;

    for (const cell of cells) {
      const count = monstersByCell.get(cell)?.length ?? 0;
      if (count > maxCount) {
        maxCount = count;
        bestCell = cell;
      }
    }

    return bestCell ?? null;
  }
}

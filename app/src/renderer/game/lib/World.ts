import { Monster } from "@vexed/game";
import { extractMonsterMapId, isMonsterMapId } from "~/utils/isMonMapId";
import type { Bot } from "./Bot";
import { monsters } from "./stores/monster";
import { players } from "./stores/player";
import type { PlayersStore } from "./stores/store";
import { parseMapStr } from "./util/parse-map-str";
import { equalsIgnoreCase } from "@vexed/utils";

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
   * A store of the players in the map.
   */
  public get players(): PlayersStore {
    return players;
  }

  /**
   * A store of the monsters in the map.
   */
  public get monsters() {
    return monsters;
  }

  /**
   * A list of monsters in the cell.
   */
  public get availableMonsters(): Monster[] {
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

    const [roomName, roomNumber] = parseMapStr(mapName);
    if (equalsIgnoreCase(roomName, this.name)) {
      await this.jump(cell, pad);
      return;
    }

    const mapStr = `${roomName}${roomNumber ? `-${roomNumber}` : ""}`;
    this.bot.flash.call(() => swf.playerJoinMap(mapStr, cell, pad));
    await this.bot.waitUntil(
      () => !this.isLoading() && equalsIgnoreCase(this.name, roomName),
      { timeout: 10_000 },
    );

    // Sometimes, the player might not end up in the correct cell/pad, even if specified
    if (
      !equalsIgnoreCase(this.bot.player.cell, cell) ||
      !equalsIgnoreCase(this.bot.player.pad, pad)
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
    const matchingMonsters = this.filterMonstersByTarget(
      Array.from(this.monsters.all().values()),
      target,
    );

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
    monsters: Monster[],
    target: string,
  ): Monster[] {
    if (isMonsterMapId(target)) {
      const monMapIdStr = extractMonsterMapId(target);
      const monMapId = Number.parseInt(monMapIdStr, 10);
      return monsters.filter((monster) => monster.monMapId === monMapId);
    }

    if (target === "*") return monsters;
    return monsters.filter((monster) =>
      monster.name.toLowerCase().includes(target.toLowerCase()),
    );
  }

  private groupMonstersByCell(monsters: Monster[]): Map<string, Monster[]> {
    const groups = new Map<string, Monster[]>();

    for (const monster of monsters) {
      const cell = monster.cell;
      if (!groups.has(cell)) groups.set(cell, []);

      groups.get(cell)!.push(monster);
    }

    return groups;
  }

  private findBestCell(
    monstersByCell: Map<string, Monster[]>,
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

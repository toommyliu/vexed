import { exitFromCombat } from "@utils/exitFromCombat";
import { extractMonsterMapId, isMonsterMapId } from "@utils/isMonMapId";
import type { CtPacket } from "../packet-handlers/ct";
import type { MoveToAreaPacket } from "../packet-handlers/json/moveToArea";
import type { Bot } from "./Bot";
import { MonsterCollection } from "./collections/monsters";
import { PlayerCollection } from "./collections/players";
import { Avatar } from "./models/Avatar";
import { Monster } from "./models/Monster";

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
  #uids = new Map<string, number>(); // playerName -> uid

  #areaId: number | null = null;

  #mapName: string | null = null;

  #mapNumber: number | null = null;

  #players = new PlayerCollection();

  #monsters = new MonsterCollection();

  public constructor(public readonly bot: Bot) {
    this.bot.on("moveToArea", this.#moveToArea.bind(this));
    this.bot.on("ct", this.#ct.bind(this));
  }

  /**
   * A list of all player names in the map.
   */
  public get playerNames(): string[] {
    return this.#players.map((plyr) => plyr.username.toLowerCase());
  }

  /**
   * Whether a player is in the map.
   *
   * @param name - The player name to check.
   */
  public isPlayerInMap(name: string) {
    return this.playerNames.includes(name.toLowerCase());
  }

  /**
   * Whether a player is in a given cell.
   *
   * @param name - The player name to check.
   * @param cell - The cell to check.
   */
  public isPlayerInCell(name: string, cell: string) {
    return (
      this.#players.get(name.toLowerCase())?.cell?.toLowerCase() ===
      cell.toLowerCase()
    );
  }

  /**
   * Map of player names to their uid.
   */
  public get playerUids(): Map<string, number> {
    return this.#uids;
  }

  /**
   * A list of all players in the map.
   */
  public get players() {
    return this.#players;
  }

  /**
   *  A list of monsters in the map.
   */
  public get monsters() {
    return this.#monsters;
  }

  /**
   * A list of monsters in the cell.
   */
  public get availableMonsters() {
    return this.#monsters.filter((mon) => mon.cell === this.bot.player.cell);
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

    if (monsterResolvable === "*") return this.availableMonsters.size > 0;

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
    if (typeof cell === "string" && typeof pad === "string") {
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
    return this.#areaId!;
  }

  /**
   * The room number of the map.
   */
  public get roomNumber(): number {
    return this.#mapNumber!;
  }

  /**
   * The name of the map.
   */
  public get name(): string {
    return this.#mapName!;
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

    await exitFromCombat();

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

  #moveToArea(packet: MoveToAreaPacket) {
    const parts = packet.areaName.split("-");
    this.#mapName = parts[0]!;
    this.#mapNumber = Number(parts[1]) || 1;
    this.#areaId = packet.areaId;

    if (packet?.uoBranch?.length) {
      this.#players.clear();

      for (const avatar of packet.uoBranch)
        this.#players.set(avatar.strUsername, new Avatar(avatar));
    }

    if (
      packet?.monBranch?.length &&
      packet?.mondef?.length &&
      packet?.monmap?.length
    ) {
      this.#monsters.clear();

      for (const monData of packet.monBranch) {
        const monID = Number(monData.MonID);
        const monMapID = Number(monData.MonMapID);

        const monDef = packet.mondef.find((mon) => Number(mon.MonID) === monID);
        const monMap = packet.monmap.find(
          (mon) => Number(mon.MonMapID) === monMapID,
        );

        this.#monsters.set(
          monMapID,
          new Monster({
            iLvl: monData.iLvl ?? monDef?.intLevel ?? 0,
            intHP: monData.intHP,
            intHPMax: monData.intHPMax,
            intState: monData.intState,
            MonID: monID,
            MonMapID: monMapID,
            strFrame: monMap?.strFrame ?? "",
            sRace: monDef?.sRace ?? "",
            strMonName: monDef?.strMonName ?? "",
          }),
        );
      }
    }
  }

  #ct(packet: CtPacket) {
    if (!("m" in packet) || typeof packet.m !== "object") return;

    for (const [monMapId, data] of Object.entries(packet.m)) {
      const mon = this.#monsters.get(Number(monMapId));
      if (!mon) continue;

      if (data?.intState) mon.data.intState = data.intState;
      if (data?.intHP) mon.data.intHP = data.intHP;
    }
  }
}

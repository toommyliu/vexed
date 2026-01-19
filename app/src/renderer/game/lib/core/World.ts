import { Monster, GameAction } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/utils";
import { extractMonsterMapId, isMonsterMapId } from "~/utils/isMonMapId";
import type { MoveToAreaPacket } from "../../packet-handlers/json/move-to-area";
import { monsters } from "../stores/monster";
import { players } from "../stores/player";
import { parseMapStr } from "../util/parse-map-str";
import type { Bot } from "./Bot";

export class World {
  #roomId!: number;

  #roomName!: string;

  #roomNumber!: number;

  public constructor(public readonly bot: Bot) {}

  /**
   * A list of all player names in the map.
   */
  public get playerNames(): readonly string[] {
    return [...this.players.all().keys()];
  }

  /**
   * Whether a player is in the map.
   *
   * @param name - The player name to check.
   */
  public isPlayerInMap(name: string) {
    return this.players.has(name);
  }

  /**
   * Whether a player is in a given cell.
   *
   * @param name - The player name to check.
   * @param cell - The cell to check.
   */
  public isPlayerInCell(name: string, cell: string) {
    return this.players.get(name)?.isInCell(cell) ?? false;
  }

  /**
   * The available players in the map.
   */
  public get players() {
    return players;
  }

  /**
   * The available monsters in the map.
   */
  public get monsters() {
    return monsters;
  }

  /**
   * A list of monsters in the cell.
   */
  public get availableMonsters() {
    // TODO: need to update the type properly
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
    this.bot.flash.call("world.reloadCurrentMap");
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
    const cellToUse = cell ?? this.bot.player.cell;
    const padToUse = pad ?? this.bot.player.pad;
    this.bot.flash.call("world.setSpawnPoint", cellToUse, padToUse);
  }

  /**
   * The current room area id.
   */
  public get roomId(): number {
    return this.#roomId;
  }

  /**
   * The room number of the map.
   */
  public get roomNumber(): number {
    return this.#roomNumber;
  }

  /**
   * The name of the map.
   */
  public get name(): string {
    return this.#roomName;
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
    const isSameCell = () => equalsIgnoreCase(this.bot.player.cell, cell);
    if (isSameCell() && !ignoreCheck) return;

    this.bot.flash.call("world.moveToCell", cell, pad);
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

    const parsed = parseMapStr(mapName);
    if (parsed.length === 1 && equalsIgnoreCase(parsed[0], this.name)) {
      await this.jump(cell, pad);
      return;
    }

    let finalStr = parsed[0];
    if (parsed[1]) finalStr += `-${parsed[1]}`;

    this.bot.flash.call("world.gotoTown", finalStr, cell, pad);
    await this.bot.waitUntil(
      () => !this.isLoading() && equalsIgnoreCase(this.name, parsed[0]!),
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
    this.bot.flash.call("world.goto", playerName);
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
    this.bot.flash.call("world.getMapItem", itemId);
    await this.bot.sleep(2_000);
  }

  /**
   * Loads a particular swf of a map.
   *
   * @param mapSwf - The swf to load.
   */
  public loadMapSwf(mapSwf: string): void {
    let str = mapSwf;
    if (!str.endsWith(".swf")) {
      str += ".swf";
    }

    this.bot.flash.call("world.loadMap", str);
  }

  public _moveToArea(packet: MoveToAreaPacket): void {
    this.players.clear();
    this.monsters.clear();

    // save map data
    const [roomName, roomNumber] = parseMapStr(packet.areaName);
    this.#roomName = roomName;
    this.#roomNumber = Number(roomNumber);
    this.#roomId = packet.areaId;

    // save monster data
    const monDefMap = new Map(
      packet.mondef?.map((def) => [def.MonID, def]) ?? [],
    );
    const monMapMap = new Map(
      packet.monmap?.map((monMapInfo) => [monMapInfo.MonMapID, monMapInfo]) ??
        [],
    );
    for (const mon of packet.monBranch ?? []) {
      const def = monDefMap.get(mon.MonID);
      const mapInfo = monMapMap.get(String(mon.MonMapID));

      const obj = {
        monId: Number(mon.MonID),
        monMapId: mon.MonMapID,
        iLvl: mon.iLvl,
        intHP: mon.intHP,
        intHPMax: mon.intHPMax,
        intMP: mon.intMP,
        intMPMax: mon.intMPMax,
        intState: mon.intState,
        sRace: def?.sRace ?? "Unknown",
        strMonName: def?.strMonName ?? "Unknown",
        strFrame: mapInfo?.strFrame ?? "",
      };
      this.monsters.add(obj);
    }

    // save player data
    for (const plyr of packet.uoBranch ?? []) {
      const obj = {
        intHP: plyr.intHP,
        intHPMax: plyr.intHPMax,
        intMP: plyr.intMP,
        intMPMax: plyr.intMPMax,
        intState: plyr.intState,
        strFrame: plyr.strFrame,
        strUsername: plyr.strUsername,
        tx: plyr.tx,
        ty: plyr.ty,
        uoName: plyr.uoName,
        entID: plyr.entID,
        entType: plyr.entType,
        intLevel: plyr.intLevel,
        strPad: plyr.strPad,
        afk: plyr.afk,
      };
      this.players.add(obj);

      if (equalsIgnoreCase(plyr.strUsername, this.bot.auth.username))
        this.players.setMe(plyr.strUsername);
    }
  }
}

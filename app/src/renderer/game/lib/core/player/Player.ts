import { EntityState } from "@vexed/game";
import { factions } from "~/lib/stores/faction";
import type { Bot } from "../Bot";
import { Bank } from "./Bank";
import { House } from "./House";
import { Inventory } from "./Inventory";
import { TempInventory } from "./TempInventory";

export enum BoostType {
  ClassPoints = "classPoints",
  Exp = "exp",
  Gold = "gold",
  Rep = "rep",
}

export class Player {
  public readonly bank!: Bank;

  public readonly house!: House;

  public readonly inventory!: Inventory;

  public readonly tempInventory!: TempInventory;

  public constructor(public readonly bot: Bot) {
    this.bank = new Bank(bot);
    this.house = new House(bot);
    this.inventory = new Inventory(bot);
    this.tempInventory = new TempInventory(bot);
  }

  /**
   * The player's faction data.
   */
  public get factions() {
    return factions;
  }

  /**
   * The name of the player's equipped class.
   */
  public get className(): string {
    return this.bot.flash.call(() => swf.playerGetClassName());
  }

  /**
   * The state of the player.
   */
  public get state(): (typeof EntityState)[keyof typeof EntityState] {
    return this.bot.flash.call(() => swf.playerGetState());
  }

  /**
   * Whether the player is in combat.
   */
  public isInCombat() {
    return this.state === EntityState.InCombat;
  }

  /**
   * The health of the player.
   */
  public get hp(): number {
    return this.bot.flash.call(() => swf.playerGetHp());
  }

  /**
   * The maximum health of the player.
   */
  public get maxHp(): number {
    return this.bot.flash.call(() => swf.playerGetMaxHp());
  }

  /**
   * The health percentage of the player.
   */
  public get hpPercentage(): number {
    return (this.hp / this.maxHp) * 100;
  }

  /**
   * Whether the player is alive.
   */
  public get alive(): boolean {
    return this.hp > 0;
  }

  /**
   * The mana of the player.
   */
  public get mp(): number {
    return this.bot.flash.call(() => swf.playerGetMp());
  }

  /**
   * The maximum mana of the player.
   */
  public get maxMp(): number {
    return this.bot.flash.call(() => swf.playerGetMaxMp());
  }

  /**
   * The percentage of mana the player has.
   */
  public get mpPercentage(): number {
    return (this.mp / this.maxMp) * 100;
  }

  /**
   * The level of the player.
   */
  public get level(): number {
    return this.bot.flash.call(() => swf.playerGetLevel());
  }

  /**
   * The player's gold.
   */
  public get gold(): number {
    return this.bot.flash.call(() => swf.playerGetGold());
  }

  /**
   * Whether the player is AFK.
   */
  public isAFK(): boolean {
    return this.bot.flash.call(() => swf.playerIsAfk());
  }

  /**
   * Whether the player has an active membership.
   */
  public isMember(): boolean {
    return this.bot.flash.call(() => swf.playerIsMember());
  }

  /**
   * The player's current position.
   */
  public get position(): [number, number] {
    return this.bot.flash.call(() => swf.playerGetPosition());
  }

  /**
   * Walks to a position on the map.
   *
   * @param x - The x coordinate to walk to.
   * @param y - The y coordinate to walk to.
   * @param walkSpeed - The speed to walk at.
   */
  public walkTo(
    x: number | string,
    y: number | string,
    walkSpeed?: number | string,
  ): void {
    if (!this.bot.player.alive) return;

    this.bot.flash.call(() =>
      swf.playerWalkTo(Number(x), Number(y), Number(walkSpeed)),
    );

    const roomId = this.bot.world.roomId;
    this.bot.packets.sendServer(`%xt%zm%mv%${roomId}%${x}%${y}%${walkSpeed}%`);
  }

  /**
   * The cell the player is in, in the map.
   */
  public get cell(): string {
    return this.bot.flash.call(() => swf.playerGetCell());
  }

  /**
   * The pad the player is in, in the map.
   */
  public get pad(): string {
    return this.bot.flash.call(() => swf.playerGetPad());
  }

  /**
   * Whether the player has fully loaded in.
   */
  public isLoaded(): boolean {
    return Boolean(this.bot.flash.call<boolean>(() => swf.playerIsLoaded()));
  }

  /**
   * Comprehensive check to determine if the player is ready.
   *
   * @remarks
   * This checks if the player is logged in, the world has loaded, and the player has fully loaded in.
   */
  public isReady(): boolean {
    return (
      this.bot.auth.isLoggedIn() &&
      !this.bot.world.isLoading() &&
      this.isLoaded()
    );
  }

  /**
   * Checks if the player has an active boost.
   *
   * @param type - The type of boost to check.
   * @returns Whether the boost is active.
   */
  public isBoostActive(
    type: (typeof BoostType)[keyof typeof BoostType],
  ): boolean {
    switch (type) {
      case BoostType.Gold:
        return this.bot.flash.get("world.myAvatar.objData.iBoostG", true) > 0;
      case BoostType.Exp:
        return this.bot.flash.get("world.myAvatar.objData.iBoostXP", true) > 0;
      case BoostType.Rep:
        return this.bot.flash.get("world.myAvatar.objData.iBoostRep", true) > 0;
      case BoostType.ClassPoints:
        return this.bot.flash.get("world.myAvatar.objData.iBoostCP", true) > 0;
      default:
        return false;
    }
  }
}

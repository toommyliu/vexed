// import type { Loadout } from "../botting/util/LoadoutConfig";
import type { Bot } from "./Bot";
import { EntityState } from "./models/BaseEntity";
import { Faction } from "./models/Faction";

export enum BoostType {
  ClassPoints = "classPoints",
  Exp = "exp",
  Gold = "gold",
  Rep = "rep",
}

export class Player {
  /**
   * The state of the player.
   */
  public state!: (typeof EntityState)[keyof typeof EntityState];

  /**
   * The hp of the player.
   */
  public hp!: number;

  /**
   * The max hp of the player.
   */
  public maxHp!: number;

  /**
   * The mp of the player.
   */
  public mp!: number;

  /**
   * The max mp of the player.
   */
  public maxMp!: number;

  /**
   * The player's current gold amount.
   */
  public gold!: number;

  /**
   * The level of the player.
   */
  public level!: number;

  public constructor(public readonly bot: Bot) {}

  /**
   * The player's faction data.
   */
  public get factions(): Faction[] {
    return this.bot.flash.call(() =>
      swf.playerGetFactions().map((data) => new Faction(data)),
    );
  }

  /**
   * The name of the player's equipped class.
   */
  public get className(): string {
    return this.bot.flash.call(() => swf.playerGetClassName());
  }

  /**
   * Whether the player is in combat.
   */
  public isInCombat() {
    return this.state === EntityState.InCombat;
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
   * The percentage of mana the player has.
   */
  public get mpPercentage(): number {
    return (this.mp / this.maxMp) * 100;
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

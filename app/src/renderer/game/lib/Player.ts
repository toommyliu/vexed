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

  // /**
  //  * Equips a loadout for the player.
  //  *
  //  * @remarks
  //  * A loadout is to be read from file, not the player's outfits.
  //  * @param loadout - The loadout to equip.
  //  */
  // public async equipLoadout(loadout: Loadout) {
  //   const { Cape, Class, Helm, Pet, Weapon } = loadout;

  //   if (Cape) {
  //     await this.bot.inventory.equip(Cape);
  //   }

  //   if (Class) {
  //     await this.bot.inventory.equip(Class);
  //   }

  //   if (Helm) {
  //     await this.bot.inventory.equip(Helm);
  //   }

  //   if (Pet) {
  //     await this.bot.inventory.equip(Pet);
  //   }

  //   if (Weapon) {
  //     await this.bot.inventory.equip(Weapon);
  //   }
  // }
}

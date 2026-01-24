import { Avatar, BoostType, Faction, type AvatarData } from "@vexed/game";
import type { Bot } from "./Bot";

export class Player extends Avatar {
  public constructor(public readonly bot: Bot) {
    super({} as AvatarData);
  }

  public override get data(): AvatarData {
    return this.bot.world.players.me?.data ?? super.data;
  }

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
   * The player's gold.
   */
  public get gold(): number {
    return this.bot.flash.call(() => swf.playerGetGold());
  }

  /**
   * Whether the player has an active membership.
   */
  public isMember(): boolean {
    return this.bot.flash.call(() => swf.playerIsMember());
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
    if (!this.alive) return;

    this.bot.flash.call(() =>
      swf.playerWalkTo(Number(x), Number(y), Number(walkSpeed)),
    );

    const roomId = this.bot.world.roomId;
    this.bot.packets.sendServer(`%xt%zm%mv%${roomId}%${x}%${y}%${walkSpeed}%`);
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
  public isBoostActive(type: BoostType): boolean {
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

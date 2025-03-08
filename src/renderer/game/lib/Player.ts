import type { Bot } from './Bot';
import { Faction } from './models/Faction';

export const PlayerState = Object.freeze({
  /**
   * The player is dead.
   */
  Dead: 0,
  /**
   * The player is idle.
   */
  Idle: 1,
  /**
   * The player is in combat.
   */
  InCombat: 2,
});

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
  public get state(): (typeof PlayerState)[keyof typeof PlayerState] {
    return this.bot.flash.call(() => swf.playerGetState());
  }

  /**
   * Whether the player is in combat.
   */
  public isInCombat() {
    return this.state === PlayerState.InCombat;
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
}

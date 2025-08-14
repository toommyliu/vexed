import { interval } from "async-interval";
import { gameState } from "../state.svelte";
import type { Bot } from "./Bot";

export class Settings {
  /**
   * Whether to automatically stop attacking a Counter Attack is active.
   */
  public counterAttack = false;

  #customName: string | null = null;

  #customGuild: string | null = null;

  public constructor(public bot: Bot) {
    void interval(async () => {
      if (!this.bot.player.isReady()) {
        return;
      }

      if (this.infiniteRange) {
        this.bot.flash.call(() => swf.settingsInfiniteRange());
      }

      if (this.provokeMap) {
        this.bot.flash.call(() => swf.settingsProvokeMap());
      }

      if (this.provokeCell) {
        this.bot.flash.call(() => swf.settingsProvokeCell());
      }

      if (this.enemyMagnet) {
        this.bot.flash.call(() => swf.settingsEnemyMagnet());
      }

      if (this.skipCutscenes) {
        this.bot.flash.call(() => swf.settingsSkipCutscenes());
      }

      this.bot.flash.call(() => swf.settingsLagKiller(!this.lagKiller));

      this.bot.flash.call(() => swf.settingsSetHidePlayers(this.hidePlayers));

      if (this.walkSpeed !== 8) {
        this.bot.flash.call(() => swf.settingsSetWalkSpeed(this.walkSpeed));
      }

      this.bot.flash.call(() => swf.settingsSetDisableFX(this.disableFx));

      this.bot.flash.call(() =>
        swf.settingsSetDisableCollisions(this.disableCollisions),
      );
    }, 500);
  }

  /**
   * Whether Infinite Range is enabled.
   */
  public get infiniteRange(): boolean {
    return gameState.infiniteRange;
  }

  /**
   * Sets the state of Infinite Range.
   *
   * @param on - If true, enables Infinite Range. Otherwise, disables it.
   */
  public set infiniteRange(on: boolean) {
    gameState.infiniteRange = on;
  }

  /**
   * Whether Provoke Map is enabled.
   */
  public get provokeMap(): boolean {
    return gameState.provokeMap;
  }

  /**
   * Sets the state of Provoke Map.
   *
   * @param on - If true, enables Provoke Map. Otherwise, disables it.
   */
  public set provokeMap(on: boolean) {
    gameState.provokeMap = on;
  }

  /**
   * Whether Provoke Cell is enabled.
   */
  public get provokeCell(): boolean {
    return gameState.provokeCell;
  }

  /**
   * Sets the state of Provoke Cell.
   *
   * @param on - If true, enables Provoke Cell. Otherwise, disables it.
   */
  public set provokeCell(on: boolean) {
    gameState.provokeCell = on;
  }

  /**
   * Whether Enemy Magnet is enabled.
   */
  public get enemyMagnet(): boolean {
    return gameState.enemyMagnet;
  }

  /**
   * Sets the state of Enemy Magnet.
   *
   * @param on - If true, enables Enemy Magnet. Otherwise, disables it.
   */
  public set enemyMagnet(on: boolean) {
    gameState.enemyMagnet = on;
  }

  /**
   * Whether Lag Killer is enabled.
   */
  public get lagKiller(): boolean {
    return gameState.lagKiller;
  }

  /**
   * Sets the state of Lag Killer.
   *
   * @param on - If true, enables Lag Killer. Otherwise, disables it.
   */
  public set lagKiller(on: boolean) {
    gameState.lagKiller = on;
  }

  /**
   * Whether Hide Players is enabled.
   */
  public get hidePlayers(): boolean {
    return gameState.hidePlayers;
  }

  /**
   * Sets the state of Hide Players.
   *
   * @param on - If true, enables Hide Players. Otherwise, disables it.
   */
  public set hidePlayers(on: boolean) {
    gameState.hidePlayers = on;
  }

  /**
   * Whether Skip Cutscenes is enabled.
   */
  public get skipCutscenes(): boolean {
    return gameState.skipCutscenes;
  }

  /**
   * Sets the state of Skip Cutscenes.
   *
   * @param on - If true, enables Skip Cutscenes. Otherwise, disables it.
   */
  public set skipCutscenes(on: boolean) {
    gameState.skipCutscenes = on;
  }

  /**
   * The player's walk speed.
   */
  public get walkSpeed(): number {
    return gameState.walkSpeed;
  }

  /**
   * Sets the player's walk speed.
   *
   * @param speed - The walk speed.
   */
  public set walkSpeed(speed: number | string) {
    if (typeof speed === "number") {
      const val = Math.max(0, Math.min(99, speed));
      gameState.walkSpeed = val;
    } else if (typeof speed === "string") {
      const val = Number.parseInt(speed, 10);
      const tmp = Number.isNaN(val) ? 8 : Math.max(0, Math.min(99, val));
      gameState.walkSpeed = tmp;
    }
  }

  /**
   * The player's custom name.
   */
  public get customName(): string | null {
    return this.#customName;
  }

  /**
   * Sets the player's custom name.
   *
   * @param name - The custom name.
   */
  public set customName(name: string | null) {
    this.#customName = name;
    this.bot.flash.call(() => swf.settingsSetName(name ?? ""));
  }

  /**
   * The player's custom guild.
   */
  public get customGuild(): string | null {
    return this.#customGuild;
  }

  /**
   * Sets the player's custom guild.
   *
   * @param guild - The custom guild.
   */
  public set customGuild(guild: string | null) {
    this.#customGuild = guild;
    this.bot.flash.call(() => swf.settingsSetGuild(guild ?? ""));
  }

  /**
   * Sets the client target fps.
   *
   * @param fps - The target fps.
   */
  public setFps(fps: number | string): void {
    const val = typeof fps === "number" ? fps : Number.parseInt(fps, 10) || 24;
    this.bot.flash.call(() => swf.settingsSetFPS(val));
  }

  /**
   * Sets the visibility of death ads.
   *
   * @param on - If true, shows death ads. Otherwise, they are hidden.
   */
  public setDeathAds(on: boolean): void {
    this.bot.flash.set("userPreference.data.bDeathAd", on);
  }

  /**
   * Whether "Disable FX" is enabled.
   */
  public get disableFx(): boolean {
    return gameState.disableFx;
  }

  /**
   * Sets the state of "Disable FX".
   *
   * @param on - If true, disables most visual effects.
   */
  public set disableFx(on: boolean) {
    gameState.disableFx = on;
  }

  /**
   * Whether "Disable Collisions" is enabled.
   */
  public get disableCollisions(): boolean {
    return gameState.disableCollisions;
  }

  public set disableCollisions(on: boolean) {
    gameState.disableCollisions = on;
  }
}

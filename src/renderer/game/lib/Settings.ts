import { interval } from '../../../common/interval';
import type { Bot } from './Bot';

export class Settings {
  /**
   * Whether to automatically stop attacking a Counter Attack is active.
   */
  public counterAttack = false;

  #customName: string | null = null;

  #customGuild: string | null = null;

  #infiniteRange = false;

  #provokeMap = false;

  #provokeCell = false;

  #enemyMagnet = false;

  #lagKiller = false;

  #hidePlayers = false;

  #skipCutscenes = false;

  #walkSpeed = 8;

  #disableFx = false;

  #disableCollisions = false;

  #optionInfiniteRange: HTMLElement | null = null;

  #optionProvokeMap: HTMLElement | null = null;

  #optionProvokeCell: HTMLElement | null = null;

  #optionEnemyMagnet: HTMLElement | null = null;

  #optionLagKiller: HTMLElement | null = null;

  #optionHidePlayers: HTMLElement | null = null;

  #optionSkipCutscenes: HTMLElement | null = null;

  #optionWalkSpeed: HTMLElement | null = null;

  #optionDisableFX: HTMLElement | null = null;

  #optionDisableCollisions: HTMLElement | null = null;

  public constructor(public bot: Bot) {
    this.#optionInfiniteRange = document.querySelector(
      '#option-infinite-range',
    );
    this.#optionProvokeMap = document.querySelector('#option-provoke-map');
    this.#optionProvokeCell = document.querySelector('#option-provoke-cell');
    this.#optionEnemyMagnet = document.querySelector('#option-enemy-magnet');
    this.#optionLagKiller = document.querySelector('#option-lag-killer');
    this.#optionHidePlayers = document.querySelector('#option-hide-players');
    this.#optionSkipCutscenes = document.querySelector(
      '#option-skip-cutscenes',
    );
    this.#optionWalkSpeed = document.querySelector('#option-walkspeed');
    this.#optionDisableFX = document.querySelector('#option-disable-fx');
    this.#optionDisableCollisions = document.querySelector(
      '#option-disable-collisions',
    );

    void interval(async () => {
      if (!this.bot.player.isReady()) {
        return;
      }

      // this.bot.flash.call(() => swf.settingsSetName(this.#customName ?? ''));
      // this.bot.flash.call(() => swf.settingsSetGuild(this.#customGuild ?? ''));

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

      this.bot.flash.call(() => swf.settingsSetDisableFX(this.#disableFx));

      this.bot.flash.call(() =>
        swf.settingsSetDisableCollisions(this.#disableCollisions),
      );
    }, 500);
  }

  /**
   * Whether Infinite Range is enabled.
   */
  public get infiniteRange(): boolean {
    return this.#infiniteRange;
  }

  /**
   * Sets the state of Infinite Range.
   *
   * @param on - If true, enables Infinite Range. Otherwise, disables it.
   */
  public set infiniteRange(on: boolean) {
    this.#infiniteRange = on;
    this.#updateOption(this.#optionInfiniteRange!, on);
  }

  /**
   * Whether Provoke Map is enabled.
   */
  public get provokeMap(): boolean {
    return this.#provokeMap;
  }

  /**
   * Sets the state of Provoke Map.
   *
   * @param on - If true, enables Provoke Map. Otherwise, disables it.
   */
  public set provokeMap(on: boolean) {
    this.#provokeMap = on;
    this.#updateOption(this.#optionProvokeMap!, on);
  }

  /**
   * Whether Provoke Cell is enabled.
   */
  public get provokeCell(): boolean {
    return this.#provokeCell;
  }

  /**
   * Sets the state of Provoke Cell.
   *
   * @param on - If true, enables Provoke Cell. Otherwise, disables it.
   */
  public set provokeCell(on: boolean) {
    this.#provokeCell = on;
    this.#updateOption(this.#optionProvokeCell!, on);
  }

  /**
   * Whether Enemy Magnet is enabled.
   */
  public get enemyMagnet(): boolean {
    return this.#enemyMagnet;
  }

  /**
   * Sets the state of Enemy Magnet.
   *
   * @param on - If true, enables Enemy Magnet. Otherwise, disables it.
   */
  public set enemyMagnet(on: boolean) {
    this.#enemyMagnet = on;
    this.#updateOption(this.#optionEnemyMagnet!, on);
  }

  /**
   * Whether Lag Killer is enabled.
   */
  public get lagKiller(): boolean {
    return this.#lagKiller;
  }

  /**
   * Sets the state of Lag Killer.
   *
   * @param on - If true, enables Lag Killer. Otherwise, disables it.
   */
  public set lagKiller(on: boolean) {
    this.#lagKiller = on;
    this.#updateOption(this.#optionLagKiller!, on);
  }

  /**
   * Whether Hide Players is enabled.
   */
  public get hidePlayers(): boolean {
    return this.#hidePlayers;
  }

  /**
   * Sets the state of Hide Players.
   *
   * @param on - If true, enables Hide Players. Otherwise, disables it.
   */
  public set hidePlayers(on: boolean) {
    this.#hidePlayers = on;
    this.#updateOption(this.#optionHidePlayers!, on);
  }

  /**
   * Whether Skip Cutscenes is enabled.
   */
  public get skipCutscenes(): boolean {
    return this.#skipCutscenes;
  }

  /**
   * Sets the state of Skip Cutscenes.
   *
   * @param on - If true, enables Skip Cutscenes. Otherwise, disables it.
   */
  public set skipCutscenes(on: boolean) {
    this.#skipCutscenes = on;
    this.#updateOption(this.#optionSkipCutscenes!, on);
  }

  /**
   * The player's walk speed.
   */
  public get walkSpeed(): number {
    return this.#walkSpeed;
  }

  /**
   * Sets the player's walk speed.
   *
   * @param speed - The walk speed.
   */
  public set walkSpeed(speed: number | number) {
    if (typeof speed === 'number') {
      const val = Math.max(0, Math.min(99, speed));
      this.#walkSpeed = val;
      this.#updateOption(this.#optionWalkSpeed!, val);
    } else if (typeof speed === 'string') {
      const val = Number.parseInt(speed, 10);
      const tmp = Number.isNaN(val) ? 8 : Math.max(0, Math.min(99, val));
      this.#walkSpeed = tmp;
      this.#updateOption(this.#optionWalkSpeed!, tmp);
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
    this.bot.flash.call(() => swf.settingsSetName(name ?? ''));
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
    this.bot.flash.call(() => swf.settingsSetGuild(guild ?? ''));
  }

  /**
   * Sets the client target fps.
   *
   * @param fps - The target fps.
   */
  public setFps(fps: number | string): void {
    this.bot.flash.set('stg.frameRate', Number.parseInt(String(fps), 10));
  }

  /**
   * Sets the visibility of death ads.
   *
   * @param on - If true, shows death ads. Otherwise, they are hidden.
   */
  public setDeathAds(on: boolean): void {
    this.bot.flash.set('userPreference.data.bDeathAd', on);
  }

  /**
   * Whether "Disable FX" is enabled.
   */
  public get disableFx(): boolean {
    return this.#disableFx;
  }

  /**
   * Sets the state of "Disable FX".
   *
   * @param on - If true, disables most visual effects.
   */
  public set disableFx(on: boolean) {
    this.#disableFx = on;
    this.#updateOption(this.#optionDisableFX!, on);
  }

  /**
   * Whether "Disable Collisions" is enabled.
   */
  public get disableCollisions(): boolean {
    return this.#disableCollisions;
  }

  public set disableCollisions(on: boolean) {
    this.#disableCollisions = on;
    this.#updateOption(this.#optionDisableCollisions!, on);
  }

  #updateOption(option: HTMLElement, value: boolean | number | string): void {
    switch (option.tagName) {
      case 'INPUT':
        (option as HTMLInputElement).value = String(value);
        break;
      case 'BUTTON':
        option.setAttribute('data-checked', value ? 'true' : 'false');
        option.classList.toggle('option-active', Boolean(value));
        break;
    }
  }
}

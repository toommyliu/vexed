import { PlayerState } from "../Player";

/**
 * Represents a player in the world.
 */
export class Avatar {
  public constructor(
    /**
     * Data about this player.
     */
    public data: AvatarData,
  ) {}

  /**
   * The cell the player is in.
   */
  public get cell() {
    return this.data.strFrame;
  }

  /**
   * The pad the player is in.
   */
  public get pad() {
    return this.data.strPad;
  }

  /**
   * The player's current hp.
   */
  public get hp() {
    return this.data.intHP;
  }

  /**
   * The player's max hp.
   */
  public get maxHp() {
    return this.data.intHPMax;
  }

  /**
   * The player's current mp.
   */
  public get mp() {
    return this.data.intMP;
  }

  /**
   * The player's max mp.
   */
  public get maxMp() {
    return this.data.intMPMax;
  }

  /**
   * The player's level.
   */
  public get level() {
    return this.data.intLevel;
  }

  /**
   * The player's current state.
   */
  public get state(): (typeof PlayerState)[keyof typeof PlayerState] {
    return this.data.intState as (typeof PlayerState)[keyof typeof PlayerState];
  }

  /**
   * The player's username.
   */
  public get username() {
    return this.data.strUsername;
  }

  /**
   * The player's active auras.
   */
  public get auras() {
    return this.data.auras ?? [];
  }

  /**
   * Whether the player's hp is less than a value.
   *
   * @param value - The value to compare the player's hp to.
   * @returns True if the player's hp is less than the value, false otherwise.
   */
  public isHpLessThan(value: number) {
    return this.hp <= value;
  }

  /**
   * Whether the player's hp is greater than a value.
   *
   * @param value - The value to compare the player's hp to.
   * @returns True if the player's hp is greater than the value, false otherwise.
   */
  public isHpGreaterThan(value: number) {
    return this.hp >= value;
  }

  /**
   * Whether the player's hp is less than a percentage value.
   *
   * @param value - The percentage value to compare the player's hp to.
   * @returns True if the player's hp is less than the percentage value, false otherwise.
   */
  public isHpPercentageLessThan(value: number) {
    return (this.hp / this.maxHp) * 100 <= value;
  }

  /**
   * Whether the player's hp is greater than a percentage value.
   *
   * @param value - The percentage value to compare the player's hp to.
   * @returns True if the player's hp is greater than the percentage value, false otherwise.
   */
  public isHpPercentageGreaterThan(value: number) {
    return (this.hp / this.maxHp) * 100 >= value;
  }

  /**
   * Retrieves an aura active on the player.
   *
   * @param name - The aura name.
   * @returns The aura with the specified name, or undefined if the player does not have the aura.
   */
  public getAura(name: string) {
    return this.auras?.find(
      (aura) => aura.name.toLowerCase() === name.toLowerCase(),
    );
  }

  /**
   * Whether the player has the specified aura. If a value is provided,
   * it will check if the aura has the specified value.
   *
   * @param name - The aura name.
   * @param value - The value to check.
   * @returns True if the player has the specified aura, false otherwise. If a value is provided,
   * it will check if the aura has the specified value.
   */
  public hasAura(name: string, value?: number) {
    const aura = this.getAura(name);
    if (!aura) return false;
    if (typeof value === "number") return aura.value === value;
    return true;
  }

  /**
   * Whether the player is in the specified cell.
   *
   * @param cell - The cell to check.
   * @returns True if the player is in the specified cell, false otherwise.
   */
  public isInCell(cell: string) {
    return this.cell.toLowerCase() === cell.toLowerCase();
  }

  /**
   * Whether the player is in combat.
   *
   * @returns True if the player is in combat, false otherwise.
   */
  public isInCombat() {
    return this.state === PlayerState.InCombat;
  }
}

export type AvatarData = {
  ID: number;
  afk: boolean;
  auras: Aura[];
  bResting: boolean;
  entID: number;
  entType: string;
  intHP: number;
  intHPMax: number;
  intLevel: number;
  intMP: number;
  intMPMax: number;
  intSP: number;
  intSPMax: number;
  intState: number;
  mvtd: string;
  mvts: string;
  px: string;
  py: string;
  showCloak: boolean;
  showHelm: boolean;
  strFrame: string;
  strPad: string;
  strUsername: string; // respects casing
  uoName: string; // lowercased
};

export type Aura = {
  name: string;
  value: number;
};

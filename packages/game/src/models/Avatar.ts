import type { AvatarData } from "../types/AvatarData";
import { BaseEntity } from "./BaseEntity";

/**
 * Represents a player in the world.
 */
export class Avatar extends BaseEntity {
  #data: AvatarData;

  public constructor(
    /**
     * Data about this player.
     */
    data: AvatarData,
  ) {
    super(data);
    this.#data = data;
  }

  public override get data(): AvatarData {
    return this.#data;
  }

  /**
   * The pad the player is in.
   */
  public get pad() {
    return this.data.strPad;
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
   * The player's current MP percentage.
   */
  public get mpPercentage(): number {
    if (this.maxMp === 0) return 0;
    return (this.mp / this.maxMp) * 100;
  }

  /**
   * The player's level.
   */
  public get level() {
    return this.data.intLevel;
  }

  /**
   * The player's username.
   */
  public get username() {
    return this.data.strUsername;
  }

  /**
   * Whether the player is AFK.
   */
  public isAFK() {
    return this.data.afk;
  }

  /**
   * The player's position.
   */
  public get position(): [number, number] {
    return [this.data.tx, this.data.ty];
  }
}

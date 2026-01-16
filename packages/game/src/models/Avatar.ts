import type { AvatarData } from "../types/AvatarData";
import { BaseEntity } from "./BaseEntity";

/**
 * Represents a player in the world.
 */
export class Avatar extends BaseEntity {
  public constructor(
    /**
     * Data about this player.
     */
    public override data: AvatarData
  ) {
    super(data);
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
}

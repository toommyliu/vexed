import { BaseEntity, type BaseEntityData } from "./BaseEntity";

/**
 * Represents a player in the world.
 */
export class Avatar extends BaseEntity {
  /**
   * The player's x position.
   */
  public xPos: number;

  /**
   * The player's y position.
   */
  public yPos: number;

  public constructor(
    /**
     * Data about this player.
     */
    public override data: AvatarData,
  ) {
    super(data);

    this.xPos = data.tx ?? Number(data.px ?? 0);
    this.yPos = data.ty ?? Number(data.py ?? 0);
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

  /**
   * Whether the player is afk.
   */
  public isAfk() {
    return this.data.afk;
  }
}

export type AvatarData = BaseEntityData & {
  afk: boolean;
  entID: number;
  entType: string;
  intLevel: number;
  intMP: number;
  intMPMax: number;
  intSP: number;
  px?: string;
  py?: string;
  tx?: number;
  ty?: number;
  strFrame: string;
  strPad: string;
  strUsername: string; // respects casing
  uoName: string; // lowercased
};

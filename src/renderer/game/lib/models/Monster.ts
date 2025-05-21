import { BaseEntity, type BaseEntityData } from "./BaseEntity";

/**
 * Represents a monster.
 */
export class Monster extends BaseEntity {
  public constructor(
    /**
     * Data about this monster.
     */ public override data: MonsterData,
  ) {
    super(data);
  }

  /**
   * The monMapID of the monster.
   */
  public get monMapId(): number {
    return this.data.MonMapID;
  }

  /**
   * The global ID of the monster.
   */
  public get id(): number {
    return this.data.MonID;
  }

  /**
   * The level of the monster.
   */
  public get level(): number {
    return this.data.iLvl;
  }

  /**
   * The race of the monster.
   */
  public get race(): string {
    return this.data.sRace;
  }

  /**
   * The name of the monster.
   */
  public get name(): string {
    return this.data.strMonName;
  }
}

export type MonsterData = BaseEntityData & {
  MonID: number;
  MonMapID: number;
  iLvl: number;
  sRace: string;
  strFrame: string;
  strMonName: string;
};

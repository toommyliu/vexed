import { BaseEntity } from "./BaseEntity";
import type { BaseEntityData } from "../types/BaseEntityData";

/**
 * Represents a monster.
 */
export class Monster extends BaseEntity {
  public constructor(
    /**
     * Data about this monster.
     */ public override data: MonsterData
  ) {
    super(data);
  }

  /**
   * The monMapID of the monster.
   */
  public get monMapId(): number {
    return this.data.monMapId;
  }

  /**
   * The global ID of the monster.
   */
  public get id(): number {
    return this.data.monId;
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

  /**
   * The cell the monster is in.
   */
  public override get cell(): string {
    return this.data.strFrame;
  }
}

export type MonsterData = BaseEntityData & {
  iLvl: number;
  intMp: number;
  intMpMax: number;
  monId: number;
  monMapId: number;
  sRace: string;
  strFrame: string;
  strMonName: string;
};

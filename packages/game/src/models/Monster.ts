import { BaseEntity } from "./BaseEntity";
import type { MonsterData } from "../types/MonsterData";

/**
 * Represents a monster.
 */
export class Monster extends BaseEntity {
  #data: MonsterData;

  public constructor(
    /**
     * Data about this monster.
     */
    data: MonsterData,
  ) {
    super(data);
    this.#data = data;
  }

  public override get data(): MonsterData {
    return this.#data;
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
  public get cell(): string {
    return this.data.strFrame;
  }
}

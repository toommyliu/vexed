import type { Avatar } from "./Avatar";
import type { Monster } from "./Monster";

import { BaseEntityData } from "../types/BaseEntityData";
import { EntityState } from "../types/EntityState";

/**
 * Base class for entities in the game world.
 */
export abstract class BaseEntity {
  #data: BaseEntityData;

  protected constructor(data: BaseEntityData) {
    this.#data = data;
  }

  public get data(): BaseEntityData {
    return this.#data;
  }

  /**
   * The entity's current HP.
   */
  public get hp(): number {
    return this.data.intHP;
  }

  /**
   * The entity's max HP.
   */
  public get maxHp(): number {
    return this.data.intHPMax;
  }

  /**
   * The entity's current HP percentage.
   */
  public get hpPercentage(): number {
    if (this.maxHp === 0) return 0;
    return (this.hp / this.maxHp) * 100;
  }

  /**
   * The entity's state.
   */
  public get state(): (typeof EntityState)[keyof typeof EntityState] {
    return this.data.intState as (typeof EntityState)[keyof typeof EntityState];
  }

  /**
   * Whether the entity is alive.
   */
  public get alive(): boolean {
    return this.hp > 0;
  }

  /**
   * Whether the entity's hp is less than a value.
   *
   * @param value - The value to compare the entity's hp to.
   * @returns True if the entity's hp is less than the value, false otherwise.
   */
  public isHpLessThan(value: number) {
    return this.hp <= value && !this.isDead();
  }

  /**
   * Whether the entity's hp is greater than a value.
   *
   * @param value - The value to compare the entity's hp to.
   * @returns True if the entity's hp is greater than the value, false otherwise.
   */
  public isHpGreaterThan(value: number) {
    return this.hp >= value && !this.isDead();
  }

  /**
   * Whether the entity's hp is less than a percentage value.
   *
   * @param value - The percentage value to compare the entity's hp to.
   * @returns True if the entity's hp is less than the percentage value, false otherwise.
   */
  public isHpPercentageLessThan(value: number) {
    return (this.hp / this.maxHp) * 100 <= value && !this.isDead();
  }

  /**
   * Whether the entity's hp is greater than a percentage value.
   *
   * @param value - The percentage value to compare the entity's hp to.
   * @returns True if the entity's hp is greater than the percentage value, false otherwise.
   */
  public isHpPercentageGreaterThan(value: number) {
    return (this.hp / this.maxHp) * 100 >= value && !this.isDead();
  }

  /**
   * Whether the entity is in combat.
   *
   * @returns True if the entity is in combat, false otherwise.
   */
  public isInCombat() {
    return this.state === EntityState.InCombat;
  }

  public isDead() {
    return this.state === EntityState.Dead;
  }

  /**
   * Whether the entity is idle.
   */
  public isIdle() {
    return this.state === EntityState.Idle;
  }

  /**
   * Whether the entity is a player.
   *
   * @returns True if the entity is a player, false otherwise.
   */
  public isPlayer(): this is Avatar {
    return "strUsername" in this.data;
  }

  /**
   * Whether the entity is a monster.
   *
   * @returns True if the entity is a monster, false otherwise.
   */
  public isMonster(): this is Monster {
    return "MonMapID" in this.data;
  }

  /**
   * The cell the entity is in.
   */
  public get cell(): string {
    return this.data.strFrame;
  }

  /**
   * Whether the entity is in the specified cell.
   *
   * @param cell - The cell to check.
   * @returns True if the entity is in the specified cell, false otherwise.
   */
  public isInCell(cell: string) {
    return this.cell.toLowerCase() === cell.toLowerCase();
  }
}

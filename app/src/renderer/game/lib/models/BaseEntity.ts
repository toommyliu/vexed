import { AuraStore } from "../util/AuraStore";
import type { Avatar } from "./Avatar";
import type { Monster } from "./Monster";

export enum EntityState {
  /**
   * The entity is dead.
   */
  Dead = 0,
  /**
   * The entity is idle.
   */
  Idle = 1,
  /**
   * The entity is in combat.
   */
  InCombat = 2,
}

/**
 * Base class for entities in the game world.
 */
export abstract class BaseEntity {
  protected constructor(public data: BaseEntityData) {}

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
   * The entity's state.
   */
  public get state(): (typeof EntityState)[keyof typeof EntityState] {
    return this.data.intState as (typeof EntityState)[keyof typeof EntityState];
  }

  /**
   * The entity's auras.
   */
  public get auras(): Aura[] {
    if (this.isMonster()) {
      return AuraStore.getMonsterAuras(this.monMapId.toString());
    } else if (this.isPlayer()) {
      return AuraStore.getPlayerAuras(this.data.strUsername);
    }

    return [];
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
   * Retrieves an aura active on the entity.
   *
   * @param name - The aura name.
   * @returns The aura with the specified name, or undefined if the entity does not have the aura.
   */
  public getAura(name: string) {
    if (this.isMonster()) {
      return AuraStore.getMonsterAuras(this.monMapId.toString()).find(
        (aura) => aura.name.toLowerCase() === name.toLowerCase(),
      );
    } else if (this.isPlayer()) {
      return AuraStore.getPlayerAuras(this.data.strUsername).find(
        (aura) => aura.name.toLowerCase() === name.toLowerCase(),
      );
    }

    return null;
  }

  /**
   * Whether the entity has the specified aura. If a value is provided,
   * it will check if the aura has the specified value.
   *
   * @param name - The aura name.
   * @param value - The value to check.
   * @returns True if the entity has the specified aura, false otherwise. If a value is provided,
   * it will check if the aura has the specified value.
   */
  public hasAura(name: string, value?: number) {
    if (this.isMonster()) {
      return AuraStore.getMonsterAuras(this.monMapId.toString()).some(
        (aura) =>
          aura.name.toLowerCase() === name.toLowerCase() &&
          (value ? aura.value === value : true),
      );
    } else if (this.isPlayer()) {
      return AuraStore.getPlayerAuras(this.data.strUsername).some(
        (aura) =>
          aura.name.toLowerCase() === name.toLowerCase() &&
          (value ? aura.value === value : true),
      );
    }

    return false;
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

export type BaseEntityData = {
  auras: Aura[];
  intHP: number;
  intHPMax: number;
  intState: number;
  strFrame: string;
};

export type Aura = {
  name: string;
  value?: number; // aura might exist but not have a value
};

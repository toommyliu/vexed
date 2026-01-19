import { Collection } from "@vexed/collection";
import type { Aura } from "@vexed/game";

export type StoredAura = Aura & { stack?: number };

export class AuraStore<K extends number> {
  private cache = new Collection<K, Collection<string, StoredAura>>(); // K -> { auraName -> aura }

  /**
   * Get all auras for a target.
   */
  public get(targetId: K): Collection<string, StoredAura> | undefined {
    return this.cache.get(targetId);
  }

  /**
   * Get a specific aura for a target by name.
   */
  public getAura(targetId: K, name: string): StoredAura | undefined {
    return this.cache.get(targetId)?.get(name);
  }

  /**
   * Check if a target has a specific aura by name.
   */
  public has(targetId: K, name: string): boolean {
    return Boolean(this.getAura(targetId, name));
  }

  /**
   * Add an aura for a target. If it already exists, increments the stack.
   */
  public add(targetId: K, aura: Aura): void {
    let targetAuras = this.cache.get(targetId);
    if (!targetAuras) {
      targetAuras = new Collection<string, StoredAura>();
      this.cache.set(targetId, targetAuras);
    }

    const key = aura.name;
    const existing = targetAuras.get(key);

    if (existing) {
      existing.stack = (existing.stack ?? 1) + 1;
      if (aura.duration !== undefined) existing.duration = aura.duration;
      if (aura.value !== undefined) existing.value = aura.value;
    } else {
      targetAuras.set(key, { ...aura, stack: 1 });
    }
  }

  /**
   * Update an existing aura's values (duration/value) without affecting stacks.
   * If it doesn't exist, it adds it as a new aura with stack 1.
   */
  public update(targetId: K, aura: Aura): void {
    let targetAuras = this.cache.get(targetId);
    if (!targetAuras) {
      targetAuras = new Collection<string, StoredAura>();
      this.cache.set(targetId, targetAuras);
    }

    const key = aura.name;
    const existing = targetAuras.get(key);

    if (existing) {
      if (aura.duration !== undefined) existing.duration = aura.duration;
      if (aura.value !== undefined) existing.value = aura.value;
    } else {
      targetAuras.set(key, { ...aura, stack: 1 });
    }
  }

  /**
   * Set (add or fully replace) an aura for a target.
   */
  public set(targetId: K, aura: StoredAura): void {
    let targetAuras = this.cache.get(targetId);
    if (!targetAuras) {
      targetAuras = new Collection<string, StoredAura>();
      this.cache.set(targetId, targetAuras);
    }

    const key = aura.name;
    targetAuras.set(key, { ...aura });
  }

  /**
   * Remove a specific aura from a target.
   */
  public remove(targetId: K, name: string): void {
    this.cache.get(targetId)?.delete(name);
  }

  /**
   * Clear all auras for a specific target.
   */
  public clearTarget(targetId: K): void {
    this.cache.delete(targetId);
  }

  /**
   * Clear all auras for all targets.
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get the underlying collection of all target auras.
   */
  public all(): Collection<K, Collection<string, StoredAura>> {
    return this.cache;
  }
}

export const auras = {
  monsters: new AuraStore<number>(),
  players: new AuraStore<number>(),
};

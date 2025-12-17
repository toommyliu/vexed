import type { QuestData } from "../models/Quest";

export class QuestCache {
  static #quests: Map<number, QuestData> = new Map();

  /**
   * Whether to use the JS cache for quest lookups.
   * Toggle this at runtime to compare performance.
   */
  public static useCached = false;

  /**
   * Stores quest data in the cache.
   */
  public static set(questId: number, data: QuestData): void {
    this.#quests.set(questId, data);
  }

  /**
   * Gets quest data from the cache.
   */
  public static get(questId: number): QuestData | undefined {
    return this.#quests.get(questId);
  }

  /**
   * Checks if a quest is in the cache.
   */
  public static has(questId: number): boolean {
    return this.#quests.has(questId);
  }

  /**
   * Removes a quest from the cache.
   */
  public static remove(questId: number): void {
    this.#quests.delete(questId);
  }

  /**
   * Gets all cached quest data.
   */
  public static getAll(): QuestData[] {
    return Array.from(this.#quests.values());
  }

  /**
   * Gets all cached quest IDs.
   */
  public static keys(): number[] {
    return Array.from(this.#quests.keys());
  }

  /**
   * Gets the number of cached quests.
   */
  public static get size(): number {
    return this.#quests.size;
  }

  /**
   * Clears all cached quests.
   */
  public static clear(): void {
    this.#quests.clear();
  }

  /**
   * Updates specific fields of a cached quest.
   */
  public static update(questId: number, updates: Partial<QuestData>): void {
    const existing = this.#quests.get(questId);
    if (existing) {
      this.#quests.set(questId, { ...existing, ...updates });
    }
  }
}

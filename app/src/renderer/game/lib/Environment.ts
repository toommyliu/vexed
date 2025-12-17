import { client } from "~/shared/tipc";
import type { EnvironmentUpdatePayload } from "~/shared/types";
import { normalizeId } from "../util/normalizeId";
import type { Bot } from "./Bot";
import type { QuestsJob } from "./jobs/quests";

export class Environment {
  private _questIds = new Set<number>();

  private _questItemIds = new Map<number, number>();

  private _itemNames = new Set<string>();

  private _boosts = new Set<string>();

  private _rejectElse = false;

  private _autoRegisterRequirements = false;

  private _autoRegisterRewards = false;

  private _isApplyingUpdate = false;

  public constructor(public readonly bot: Bot) {}

  /**
   * Gets the set of quest IDs.
   *
   * @returns The readonly set of quest IDs.
   */
  public get questIds(): ReadonlySet<number> {
    return this._questIds;
  }

  /**
   * Gets the map of quest IDs to selected item IDs.
   *
   * @returns The readonly map of quest item IDs.
   */
  public get questItemIds(): ReadonlyMap<number, number> {
    return this._questItemIds;
  }

  /**
   * Gets the set of item names.
   *
   * @returns The readonly set of item names.
   */
  public get itemNames(): ReadonlySet<string> {
    return this._itemNames;
  }

  /**
   * Gets the set of boosts.
   *
   * @returns The readonly set of boosts.
   */
  public get boosts(): ReadonlySet<string> {
    return this._boosts;
  }

  /**
   * Gets the reject else flag.
   *
   * @returns The reject else boolean value.
   */
  public get rejectElse(): boolean {
    return this._rejectElse;
  }

  /**
   * Sets the reject else flag.
   *
   * @param rejectElse - The reject else value to set.
   */
  public set rejectElse(rejectElse: boolean) {
    this._rejectElse = rejectElse;
    this.syncToMain();
  }

  /**
   * Gets the auto register requirements flag.
   *
   * @returns The auto register requirements boolean value.
   */
  public get autoRegisterRequirements(): boolean {
    return this._autoRegisterRequirements;
  }

  /**
   * Sets the auto register requirements flag.
   *
   * @param val - The auto register requirements value to set.
   */
  public set autoRegisterRequirements(val: boolean) {
    this._autoRegisterRequirements = val;
    this.syncToMain();
  }

  /**
   * Gets the auto register rewards flag.
   *
   * @returns The auto register rewards boolean value.
   */
  public get autoRegisterRewards(): boolean {
    return this._autoRegisterRewards;
  }

  /**
   * Sets the auto register rewards flag.
   *
   * @param val - The auto register rewards value to set.
   */
  public set autoRegisterRewards(val: boolean) {
    this._autoRegisterRewards = val;
    this.syncToMain();
  }

  /**
   * Updates the environment state with the given update payload.
   *
   * @param update - the update payload
   */
  public applyUpdate(update: EnvironmentUpdatePayload): void {
    this._isApplyingUpdate = true;

    try {
      this.setQuestIds(update.questIds);
      this.setItemNames(update.itemNames);

      if (update.questItemIds !== undefined) this.setQuestItemIds(update.questItemIds);
      if (update.rejectElse !== undefined) this._rejectElse = update.rejectElse;
      if (update.boosts !== undefined) this.setBoosts(update.boosts);
      if (update.autoRegisterRequirements !== undefined)
        this._autoRegisterRequirements = update.autoRegisterRequirements;
      if (update.autoRegisterRewards !== undefined)
        this._autoRegisterRewards = update.autoRegisterRewards;
    } finally {
      this._isApplyingUpdate = false;
    }
  }

  /**
   * Syncs the current environment state to the main process.
   */
  private syncToMain(): void {
    if (this._isApplyingUpdate) return;

    const payload: EnvironmentUpdatePayload = {
      questIds: Array.from(this._questIds),
      questItemIds: Object.fromEntries(this._questItemIds),
      itemNames: Array.from(this._itemNames),
      boosts: Array.from(this._boosts),
      rejectElse: this._rejectElse,
      autoRegisterRequirements: this._autoRegisterRequirements,
      autoRegisterRewards: this._autoRegisterRewards,
    };

    void client.environment.updateState(payload);
  }

  /**
   * Sets the quest IDs.
   *
   * @param questIds - the quest IDs to set
   */
  private setQuestIds(questIds: (number | string)[]): void {
    const normalized = new Set<number>();
    for (const questId of questIds) {
      const parsedQuestId = normalizeId(questId);
      if (parsedQuestId === -1) continue;

      normalized.add(parsedQuestId);
    }

    for (const questId of this._questIds) {
      if (!normalized.has(questId)) {
        // questId is being removed
        this.bot.scheduler
          .getJob<QuestsJob>("quests")
          ?.clearQuestRegistration(questId);
        // Also remove from questItemIds
        this._questItemIds.delete(questId);
      }
    }

    this._questIds.clear(); // clear any remaining IDs

    for (const questId of normalized) {
      this._questIds.add(questId);
    }
  }

  /**
   * Sets the quest item IDs mapping.
   *
   * @param questItemIds - The quest item IDs mapping to set.
   */
  private setQuestItemIds(questItemIds: Record<number, number>): void {
    this._questItemIds.clear();
    for (const [questIdStr, itemId] of Object.entries(questItemIds)) {
      const questId = Number(questIdStr);
      if (!Number.isNaN(questId) && this._questIds.has(questId)) {
        this._questItemIds.set(questId, itemId);
      }
    }
  }

  /**
   * Adds a quest ID to the environment.
   *
   * @param questId - The quest ID to add.
   */
  public addQuestId(questId: number | string): void {
    const parsedQuestId = normalizeId(questId);
    if (parsedQuestId === -1 || this._questIds.has(parsedQuestId)) return;

    this._questIds.add(parsedQuestId);
    this.syncToMain();
  }

  /**
   * Removes a quest ID from the environment.
   *
   * @param questId - The quest ID to remove.
   */
  public removeQuestId(questId: number | string): void {
    const parsedQuestId = normalizeId(questId);
    if (parsedQuestId === -1) return;

    this._questIds.delete(parsedQuestId);
    this._questItemIds.delete(parsedQuestId);
    this.syncToMain();
  }

  /**
   * Sets the item ID for a quest (for quests with multiple rewards).
   *
   * @param questId - The quest ID.
   * @param itemId - The item ID to select when completing the quest.
   */
  public setQuestItemId(questId: number, itemId: number): void {
    if (!this._questIds.has(questId)) return;

    this._questItemIds.set(questId, itemId);
    this.syncToMain();
  }

  /**
   * Gets the item ID for a quest.
   *
   * @param questId - The quest ID.
   * @returns The item ID, or undefined if not set.
   */
  public getQuestItemId(questId: number): number | undefined {
    return this._questItemIds.get(questId);
  }

  /**
   * Removes the item ID for a quest.
   *
   * @param questId - The quest ID.
   */
  public removeQuestItemId(questId: number): void {
    if (!this._questItemIds.has(questId)) return;

    this._questItemIds.delete(questId);
    this.syncToMain();
  }

  /**
   * Sets the item names.
   *
   * @param itemNames - The item names to set.
   */
  private setItemNames(itemNames: Iterable<string>): void {
    const sanitized = new Set<string>();
    for (const item of itemNames) {
      const trimmed = item.trim();
      if (trimmed) sanitized.add(trimmed);
    }

    this._itemNames.clear();
    for (const item of sanitized) {
      this._itemNames.add(item);
    }
  }

  /**
   * Adds an item name to the environment.
   *
   * @param itemName - The item name to add.
   */
  public addItemName(itemName: string): void {
    const trimmed = itemName.trim();
    if (!trimmed || this._itemNames.has(trimmed)) return;

    this._itemNames.add(trimmed);
    this.syncToMain();
  }

  /**
   * Removes an item name from the environment.
   *
   * @param itemName - The item name to remove.
   */
  public removeItemName(itemName: string): void {
    const trimmed = itemName.trim();
    if (!trimmed) return;

    this._itemNames.delete(trimmed);
    this.syncToMain();
  }

  /**
   * Checks if the environment has the specified item name.
   *
   * @param itemName - The item name to check.
   * @returns True if the item name exists, false otherwise.
   */
  public hasItemName(itemName: string): boolean {
    return this._itemNames.has(itemName);
  }

  /**
   * Sets the boosts.
   *
   * @param boosts - The boosts to set.
   */
  private setBoosts(boosts: Iterable<string>): void {
    const sanitized = new Set<string>();
    for (const boost of boosts) {
      const trimmed = boost.trim();
      if (trimmed) sanitized.add(trimmed);
    }

    this._boosts.clear();
    for (const boost of sanitized) {
      this._boosts.add(boost);
    }
  }

  /**
   * Adds a boost to the environment.
   *
   * @param boostName - The boost name to add.
   */
  public addBoost(boostName: string): void {
    const trimmed = boostName.trim();
    if (!trimmed || this._boosts.has(trimmed)) return;

    this._boosts.add(trimmed);
    this.syncToMain();
  }

  /**
   * Removes a boost from the environment.
   *
   * @param boostName - The boost name to remove.
   */
  public removeBoost(boostName: string): void {
    const trimmed = boostName.trim();
    if (!trimmed) return;

    this._boosts.delete(trimmed);
    this.syncToMain();
  }

  /**
   * Checks if the environment has the specified boost.
   *
   * @param boostName - The boost name to check.
   * @returns True if the boost exists, false otherwise.
   */
  public hasBoost(boostName: string): boolean {
    return this._boosts.has(boostName);
  }
}

import type { EnvironmentUpdatePayload } from "@shared/types";
import { normalizeId } from "../util/normalizeId";
import type { Bot } from "./Bot";

export class Environment {
  private _questIds = new Set<number>();

  private _itemNames = new Set<string>();

  private _boosts = new Set<string>();

  private _rejectElse = false;

  private _autoRegisterRequirements = false;

  private _autoRegisterRewards = false;

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
   * Gets the auto register rewards flag.
   *
   * @returns The auto register rewards boolean value.
   */
  public get autoRegisterRewards(): boolean {
    return this._autoRegisterRewards;
  }

  /**
   * Updates the environment state with the given update payload.
   *
   * @param update - the update payload
   */
  public applyUpdate(update: EnvironmentUpdatePayload): void {
    this.setQuestIds(update.questIds);
    this.setItemNames(update.itemNames);

    if (update.rejectElse !== undefined) this.rejectElse = update.rejectElse;
    if (update.boosts !== undefined) this.setBoosts(update.boosts);
    if (update.autoRegisterRequirements !== undefined)
      this._autoRegisterRequirements = update.autoRegisterRequirements;
    if (update.autoRegisterRewards !== undefined)
      this._autoRegisterRewards = update.autoRegisterRewards;
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

    this._questIds.clear();
    for (const questId of normalized) {
      this._questIds.add(questId);
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
   * @param rejectElse - Whether to reject else.
   */
  public addItemName(itemName: string, rejectElse = this._rejectElse): void {
    const trimmed = itemName.trim();
    if (!trimmed || this._itemNames.has(trimmed)) return;

    this._itemNames.add(trimmed);
    this._rejectElse = rejectElse;
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

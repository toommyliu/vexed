import { TypedEmitter } from "tiny-typed-emitter";
import { normalizeId } from "../util/normalizeId";
import type { Bot } from "./Bot";

type Events = {
  boostsChanged(): void;
  itemNamesChanged(): void;
  questIdsChanged(): void;
};

export class Environment extends TypedEmitter<Events> {
  private _questIds = new Set<number>();

  private _itemNames = new Set<string>();

  private _boosts = new Set<string>();

  private _rejectElse = false;

  public constructor(public bot: Bot) {
    super();
  }

  public get questIds() {
    return this._questIds;
  }

  /**
   * Adds a quest ID to the environment.
   *
   * @param questId - The quest ID to add.
   */
  public addQuestId(questId: number | string): void {
    const parsedQuestId = normalizeId(questId);
    if (parsedQuestId !== null && !this._questIds.has(parsedQuestId)) {
      this._questIds.add(parsedQuestId);
      this.emit("questIdsChanged");
    }
  }

  /**
   * Removes a quest ID from the environment.
   *
   * @param questId - The quest ID to remove.
   */
  public removeQuestId(questId: number | string): void {
    const parsedQuestId = normalizeId(questId);
    if (parsedQuestId !== null && this._questIds.delete(parsedQuestId)) {
      this.emit("questIdsChanged");
    }
  }

  /**
   * Checks if a quest ID is in the environment.
   *
   * @param questId - The quest ID to check.
   * @returns True if the quest ID is in the environment, false otherwise.
   */
  public hasQuestId(questId: number | string): boolean {
    const parsedQuestId = normalizeId(questId);
    return parsedQuestId !== null && this._questIds.has(parsedQuestId);
  }

  /**
   * Getter for the current item names to pickup.
   */
  public get itemNames() {
    return this._itemNames;
  }

  /**
   * Getter for the current boosts to watch/use.
   */
  public get boosts() {
    return this._boosts;
  }

  /**
   * Adds an item name to the environment.
   *
   * @param itemName - The item name to add.
   * @param rejectElse - Whether to reject other items.
   */
  public addItemName(itemName: string, rejectElse = false): void {
    if (!this._itemNames.has(itemName) || this._rejectElse !== rejectElse) {
      this._itemNames.add(itemName);
      this._rejectElse = rejectElse;
      this.emit("itemNamesChanged");
    }
  }

  /**
   * Removes an item name from the environment.
   *
   * @param itemName - The item name to remove.
   */
  public removeItemName(itemName: string): void {
    if (this._itemNames.delete(itemName)) {
      this.emit("itemNamesChanged");
    }
  }

  /**
   * Adds a boost item name to the environment.
   * Emits `boostsChanged` when the set is modified.
   */
  public addBoost(boostName: string): void {
    if (!this._boosts.has(boostName)) {
      this._boosts.add(boostName);
      this.emit("boostsChanged");
    }
  }

  /**
   * Removes a boost item name from the environment.
   */
  public removeBoost(boostName: string): void {
    if (this._boosts.delete(boostName)) {
      this.emit("boostsChanged");
    }
  }

  /**
   * Checks if a boost item name is in the environment.
   */
  public hasBoost(boostName: string): boolean {
    return this._boosts.has(boostName);
  }

  /**
   * Checks if an item name is in the environment.
   *
   * @param itemName - The item name to check.
   * @returns True if the item name is in the environment, false otherwise.
   */
  public hasItemName(itemName: string): boolean {
    return this._itemNames.has(itemName);
  }

  public get rejectElse(): boolean {
    return this._rejectElse;
  }
}

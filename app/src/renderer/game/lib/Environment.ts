import { TypedEmitter } from "tiny-typed-emitter";
import { normalizeId } from "../util/normalizeId";
import type { Bot } from "./Bot";
import { questJob } from "./jobs/quests";

type Events = {
  itemNamesChanged(): void;
  questIdsChanged(): void;
};

export class Environment extends TypedEmitter<Events> {
  private _questIds = new Set<number>();

  private _itemNames = new Set<string>();

  private _rejectElse = false;

  public constructor(public bot: Bot) {
    super();

    this.bot.scheduler.addJob({
      id: "quests",
      priority: 1,
      execute: questJob,
    });
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

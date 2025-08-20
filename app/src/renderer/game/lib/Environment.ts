import { normalizeId } from "../util/normalizeId";
import type { Bot } from "./Bot";
import { questTask } from "./tasks/quests";

export class Environment {
  private _questIds = new Set<number>();

  public constructor(public bot: Bot) {
    this.bot.scheduler.addTask({
      id: "quests",
      priority: 1,
      execute: questTask,
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
    if (parsedQuestId !== null) this._questIds.add(parsedQuestId);
  }

  /**
   * Removes a quest ID from the environment.
   *
   * @param questId - The quest ID to remove.
   */
  public removeQuestId(questId: number | string): void {
    const parsedQuestId = normalizeId(questId);
    if (parsedQuestId !== null) this._questIds.delete(parsedQuestId);
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
}

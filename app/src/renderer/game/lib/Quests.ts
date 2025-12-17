import type { Bot } from "./Bot";
import { GameAction } from "./World";
import { Quest, type QuestData } from "./models/Quest";

export class Quests {
  public constructor(public bot: Bot) { }

  /**
   * A list of quests loaded in the client.
   */
  public get tree(): Quest[] {
    return this.bot.flash.call(() =>
      swf.questsGetTree().map((data: QuestData) => new Quest(data)),
    );
  }

  /**
   * A list of accepted quests.
   */
  public get accepted(): Quest[] {
    return this.tree.filter((quest) => quest.inProgress);
  }

  /**
   * Resolves for a Quest instance.
   *
   * @param questId - The id of the quest.
   */
  public get(questId: number): Quest | null {
    return this.tree.find((quest) => quest.id === questId) ?? null;
  }

  /**
   * Loads a quest.
   *
   * @param questId - The quest id to load.
   */
  public async load(questId: number): Promise<void> {
    if (this.get(questId)) return;

    this.bot.flash.call(() => swf.questsLoad(questId));
    await this.bot.waitUntil(() => this.get(questId) !== null);
  }

  /**
   * Loads multiple quests at once.
   *
   * @param questIds - List of quest ids to load
   * @returns Promise<void>
   */
  public async loadMultiple(questIds: number[]): Promise<void> {
    if (questIds.length === 0) return;

    this.bot.flash.call(() => swf.questsGetMultiple(questIds.join(",")));
  }

  /**
   * Accepts a quest.
   *
   * @param questId - The quest id to accept.
   * @returns Promise<void>
   */
  public async accept(questId: number): Promise<void> {
    if (!this.get(questId)) await this.load(questId);

    // Ensure the quest is ready to be accepted
    if (this.get(questId)?.inProgress) {
      await this.bot.waitUntil(() => !this.get(questId)?.inProgress);
    }

    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.AcceptQuest),
    );

    this.bot.flash.call(() => swf.questsAccept(questId));
    await this.bot.waitUntil(() => Boolean(this.get(questId)?.inProgress));
  }

  /**
   * Accepts multiple quests concurrently.
   *
   * @param questIds - List of quest ids to accept.
   * @returns Promise<void>
   */
  public async acceptMultiple(questIds: number[]): Promise<void> {
    if (questIds.length === 0) return;

    await Promise.all(questIds.map((id) => this.accept(id)));
  }

  /**
   * Completes a quest.
   *
   * @param questId - The quest id to complete.
   * @param turnIns - The number of times to turn-in the quest.
   * @param itemId - The ID of the quest rewards to select.
   * @param special - Whether the quest is "special."
   */
  public async complete(
    questId: number,
    turnIns = 1,
    itemId = -1,
    special = false,
  ): Promise<void> {
    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.TryQuestComplete),
    );

    if (!this.get(questId)?.canComplete()) return;

    this.bot.flash.call(() => {
      swf.questsComplete(questId, turnIns, itemId, special);
    });
  }

  /**
   * Abandons a quest.
   *
   * @param questId - The quest id to abandon.
   */
  public async abandon(questId: number): Promise<void> {
    if (!this.get(questId)?.inProgress) return;

    this.bot.flash.call(() => swf.questsAbandon(questId));
    await this.bot.waitUntil(() => !this.get(questId)?.inProgress);
  }
}

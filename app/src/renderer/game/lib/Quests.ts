import { GameAction, Quest, type QuestInfo } from "@vexed/game";
import type { Bot } from "./Bot";

export class Quests {
  public constructor(public bot: Bot) {}

  /**
   * A list of quests loaded in the client.
   */
  public get tree(): Quest[] {
    return this.bot.flash.call(() =>
      swf.questsGetTree().map((data: QuestInfo) => new Quest(data)),
    );
  }

  /**
   * A list of accepted quests.
   */
  public get accepted(): Quest[] {
    const arr: Quest[] = [];
    for (const quest of this.tree) {
      if (this.isInProgress(quest.id)) arr.push(quest);
    }

    return arr;
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
   * Whether a quest is in progress.
   *
   * @param questId - The quest id to check.
   */
  public isInProgress(questId: number): boolean {
    return this.bot.flash.call(() => swf.questsIsInProgress(questId));
  }

  /**
   * Whether a quest can be completed.
   *
   * @param questId - The quest id to check.
   */
  public canComplete(questId: number): boolean {
    return this.bot.flash.call(() => swf.questsCanCompleteQuest(questId));
  }

  /**
   * Whether a quest is available.
   *
   * @param questId - The quest id to check.
   */
  public isAvailable(questId: number): boolean {
    return this.bot.flash.call(() => swf.questsIsAvailable(questId));
  }

  /**
   * Whether a quest has been completed before.
   *
   * @param questId - The quest id to check.
   */
  public isCompleted(questId: number): boolean {
    const quest = this.get(questId);
    if (!quest) {
      return false;
    }

    const slot = quest.data.iSlot;
    const value = quest.data.iValue;

    return (
      slot < 0 ||
      this.bot.flash.call<number>("world.getQuestValue", slot) >= value
    );
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
    if (this.isInProgress(questId)) {
      await this.bot.waitUntil(() => !this.isInProgress(questId));
    }

    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.AcceptQuest),
    );

    this.bot.flash.call(() => swf.questsAccept(questId));
    await this.bot.waitUntil(() => this.isInProgress(questId));
  }

  /**
   * Accepts multiple quests concurrently.
   *
   * @param questIds - List of quest ids to accept.
   * @returns Promise<void>
   */
  public async acceptMultiple(questIds: number[]): Promise<void> {
    if (questIds.length === 0) return;

    await Promise.all(questIds.map(async (id) => this.accept(id)));
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

    if (!this.canComplete(questId)) return;

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
    if (!this.isInProgress(questId)) return;

    this.bot.flash.call(() => swf.questsAbandon(questId));
    await this.bot.waitUntil(() => !this.isInProgress(questId));
  }
}

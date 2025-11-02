import { normalizeId } from "@utils/normalizeId";
import type { Bot } from "./Bot";
import { GameAction } from "./World";
import { Quest, type QuestData } from "./models/Quest";

export class Quests {
  public constructor(public bot: Bot) {}

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
  public get(questId: number | string): Quest | null {
    const id = normalizeId(questId);
    return this.tree.find((quest) => normalizeId(quest.id) === id) ?? null;
  }

  /**
   * Loads a quest.
   *
   * @param questId - The quest id to load.
   */
  public async load(questId: number | string): Promise<void> {
    const id = normalizeId(questId);
    if (this.get(id)) return;

    this.bot.flash.call(() => swf.questsLoad(id));
    await this.bot.waitUntil(() => this.get(id) !== null, null, 5);
  }

  /**
   * Loads multiple quests at once.
   *
   * @param questIds - List of quest ids to load
   * @returns Promise<void>
   */
  public async loadMultiple(questIds: (number | string)[]): Promise<void> {
    if (!Array.isArray(questIds) || !questIds.length) return;

    const ids = questIds.map(normalizeId);
    this.bot.flash.call(() => swf.questsGetMultiple(ids.join(",")));
    // await Promise.all(ids.map(async (id) => this.load(id)));
  }

  /**
   * Accepts a quest.
   *
   * @param questId - The quest id to accept.
   * @returns Promise<void>
   */
  public async accept(questId: number | string): Promise<void> {
    const id = normalizeId(questId);

    if (!this.get(id)) await this.load(id);

    // Ensure the quest is ready to be accepted
    if (this.get(id)?.inProgress)
      await this.bot.waitUntil(() => !this.get(id)?.inProgress, null, 5);

    await this.bot.waitUntil(
      () => this.bot.world.isActionAvailable(GameAction.AcceptQuest),
      null,
      5,
    );

    this.bot.flash.call(() => swf.questsAccept(id));
    await this.bot.waitUntil(() => Boolean(this.get(id)?.inProgress), null, 5);
  }

  /**
   * Accepts multiple quests concurrently.
   *
   * @param questIds - List of quest ids to accept.
   * @returns Promise<void>
   */
  public async acceptMultiple(questIds: (number | string)[]): Promise<void> {
    if (!Array.isArray(questIds) || !questIds.length) return;

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
    questId: number | string,
    turnIns = 1,
    itemId = -1,
    special = false,
  ) {
    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.TryQuestComplete),
    );

    const id = normalizeId(questId);

    if (!this.get(id)?.canComplete()) return;

    this.bot.flash.call(() => {
      swf.questsComplete(id, turnIns, itemId, special);
    });
  }
}

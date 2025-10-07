import { Collection } from "@vexed/collection";
import { normalizeId } from "@utils/normalizeId";
import type { Bot } from "./Bot";
import { GameAction } from "./World";
import { Quest, type QuestData } from "./models/Quest";
import type { AcceptQuestPacket } from "../packet-handlers/json/acceptQuest";
import type { GetQuestsPacket } from "../packet-handlers/json/getQuests";

export class Quests {
  #quests = new Collection<number, Quest>();

  public constructor(public readonly bot: Bot) {
    const fn_1 = this.#acceptQuest.bind(this);
    const fn_2 = this.#getQuests.bind(this);

    this.bot.on("acceptQuest", fn_1);
    this.bot.on("getQuests", fn_2);
  }

  /**
   * A list of quests loaded in the client.
   */
  public get tree() {
    return this.#quests.clone();
  }

  /**
   * A list of accepted quests.
   */
  public get accepted() {
    return this.#quests.filter((quest) => quest.inProgress);
  }

  /**
   * Resolves for a Quest instance.
   *
   * @param questId - The id of the quest.
   */
  public get(questId: number | string) {
    const id = normalizeId(questId);
    return this.#quests.find((quest) => normalizeId(quest.id) === id);
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
    await this.bot.waitUntil(() => Boolean(this.get(id));
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
    if (this.get(id)?.inProgress) {
      await this.bot.waitUntil(() => !this.get(id)?.inProgress);
    }

    await this.bot.waitUntil(() =>
      this.bot.world.isActionAvailable(GameAction.AcceptQuest),
    );

    this.bot.flash.call(() => swf.questsAccept(id));
    await this.bot.waitUntil(() => Boolean(this.get(id)?.inProgress));
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

  #acceptQuest(packet: AcceptQuestPacket) {
    if (packet.bSuccess !== 1 || packet.msg !== "success") {
      console.warn(`failed to accept quest ${packet.QuestID}: ${packet.msg}`);
      return;
    }

    if (!this.#quests.has(packet.QuestID)) {
      console.warn(`unknown quest accepted: ${packet.QuestID}`);
      return;
    }

    this.#quests.get(packet.QuestID)!.data.status = "p";
    console.log(`accepted quest: ${packet.QuestID}`);
  }

  #getQuests(packet: GetQuestsPacket) {
    for (const [questId, questData] of Object.entries(packet.quests)) {
      this.#quests.set(Number(questId), new Quest(questData));
      console.log(`get quest - ${questData.sName} - ${questData.QuestID}`);
    }
  }

  /**
   * Abandons a quest.
   *
   * @param questId - The quest id to abandon.
   */
  public async abandon(questId: number | string) {
    const id = normalizeId(questId);

    if (!this.get(id)?.inProgress) return;

    this.bot.flash.call(() => swf.questsAbandon(id));
    await this.bot.waitUntil(() => !this.get(id)?.inProgress);
  }
}

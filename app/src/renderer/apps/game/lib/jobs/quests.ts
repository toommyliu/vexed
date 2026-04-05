import { Mutex } from "async-mutex";
import { client } from "~/shared/tipc";
import type { Bot } from "../Bot";
import { Job } from "./Job";

export class QuestsJob extends Job {
  #mutex = new Mutex();

  #registeredQuestIds = new Set<number>();

  #skipQuestIds = new Set<number>();

  public constructor(private readonly bot: Bot) {
    super("quests", 2);
  }

  public async execute(): Promise<void> {
    const questIds = this.bot.environment.questIds;
    if (questIds.size === 0) return;

    await this.#mutex.runExclusive(async () => {
      for (const questId of questIds) {
        if (this.#skipQuestIds.has(questId)) continue;
       
        if (!this.bot.quests.get(questId)) {
          await this.bot.quests.load(questId, true);
        }

        const quest = this.bot.quests.get(questId);
        if (!quest) continue;

        const isAvailable = this.bot.quests.isAvailable(questId);
        if (!isAvailable) {
          this.#skipQuestIds.add(questId);
          continue;
        }

        if (this.isInProgress(questId) && this.canComplete(questId)) {
          const maxTurnIns = Number(
            this.bot.flash.call<string>("world.maximumQuestTurnIns", questId),
          );
          const itemId = this.bot.environment.getQuestItemId(questId) ?? -1;
          await this.bot.quests.complete(questId, maxTurnIns, itemId);
        }

        if (this.bot.quests.isOneTimeQuestDone(questId)) {
          this.#skipQuestIds.add(questId);
          continue;
        }

        if (!this.isInProgress(questId) && this.bot.quests.isAvailable(questId)){
          await this.bot.quests.accept(questId);
        }

        await this.bot.sleep(100);
      }
    });
  }

  /**
   * Clears the quest registration for a given quest ID.
   *
   * @param questId - The quest ID
   */
  public clearQuestRegistration(questId: number): void {
    this.#registeredQuestIds.delete(questId);
  }

  private isInProgress(questId: number): boolean {
    return this.bot.flash.call(() => swf.questsIsInProgress(questId));
  }

  private canComplete(questId: number): boolean {
    return this.bot.flash.call(() => swf.questsCanCompleteQuest(questId));
  }
}

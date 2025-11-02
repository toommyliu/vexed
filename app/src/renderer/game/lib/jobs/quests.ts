import { Mutex } from "async-mutex";
import { client } from "@shared/tipc";
import type { Bot } from "../Bot";
import { Job } from "./Job";

export class QuestsJob extends Job {
  #mutex = new Mutex();

  #registeredQuestIds = new Set<number>();

  public constructor(private readonly bot: Bot) {
    super("quests", 2);
  }

  public async execute(): Promise<void> {
    const questIds = this.bot.environment.questIds;
    if (questIds.size === 0) return;

    await this.#mutex.runExclusive(async () => {
      for (const questId of questIds) {
        if (!this.bot.quests.get(questId)) {
          await this.bot.quests.load(questId);
        }

        const quest = this.bot.quests.get(questId);
        if (quest && !this.#registeredQuestIds.has(questId)) {
          const toRegister = new Set<string>();

          if (this.bot.environment.autoRegisterRequirements) {
            for (const req of quest.requirements) toRegister.add(req.itemName);
          }

          if (this.bot.environment.autoRegisterRewards) {
            for (const reward of quest.rewards) toRegister.add(reward.itemName);
          }

          if (toRegister.size > 0) {
            for (const itemName of toRegister) {
              this.bot.environment.addItemName(itemName);
            }

            this.#registeredQuestIds.add(questId);

            await client.environment.updateState({
              questIds: Array.from(this.bot.environment.questIds),
              itemNames: Array.from(this.bot.environment.itemNames),
              boosts: Array.from(this.bot.environment.boosts),
              rejectElse: this.bot.environment.rejectElse,
              autoRegisterRequirements:
                this.bot.environment.autoRegisterRequirements,
              autoRegisterRewards: this.bot.environment.autoRegisterRewards,
            });
          }
        }

        if (this.isInProgress(questId) && this.canComplete(questId)) {
          const maxTurnIns = Number(
            this.bot.flash.call<string>("world.maximumQuestTurnIns", questId),
          );
          await this.bot.quests.complete(questId, maxTurnIns);
        }

        if (!this.isInProgress(questId)) {
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

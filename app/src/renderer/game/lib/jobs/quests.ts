import { client } from "@shared/tipc";
import type { Bot } from "../Bot";
import { Job } from "./Job";

export class QuestsJob extends Job {
  public constructor(private readonly bot: Bot) {
    super("quests", 2);
  }

  public async execute(): Promise<void> {
    const questIds = this.bot.environment.questIds;
    if (questIds.size === 0) return;

    for (const questId of questIds) {
      if (!this.bot.quests.get(questId)) {
        void this.bot.quests.load(questId);
      }

      if (this.bot.environment.autoRegisterDrops) {
        const quest = this.bot.quests.get(questId);
        if (quest) {
          const items = Object.values(quest.data.oItems).reduce<string[]>(
            (acc, item) => {
              if (item.bTemp === 1) return acc;
              acc.push(item.sName);
              return acc;
            },
            [],
          );

          for (const itemName of items) {
            this.bot.environment.addItemName(itemName);
            void client.environment.updateState({
              questIds: Array.from(this.bot.environment.questIds),
              itemNames: Array.from(this.bot.environment.itemNames),
              boosts: Array.from(this.bot.environment.boosts),
              rejectElse: this.bot.environment.rejectElse,
              autoRegisterDrops: this.bot.environment.autoRegisterDrops,
            });
          }
        }
      }

      if (
        this.bot.flash.call(() => swf.questsIsInProgress(questId)) &&
        this.bot.flash.call(() => swf.questsCanCompleteQuest(questId))
      ) {
        const maxTurnIns = this.bot.flash.call<string>(
          "world.maximumQuestTurnIns",
          questId,
        );
        const numMaxTurnIns = Number(maxTurnIns);
        await this.bot.quests.complete(questId, numMaxTurnIns);
      }

      if (!this.bot.flash.call(() => swf.questsIsInProgress(questId)))
        await this.bot.quests.accept(questId);

      await this.bot.sleep(100);
    }
  }
}

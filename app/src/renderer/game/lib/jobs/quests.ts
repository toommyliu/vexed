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

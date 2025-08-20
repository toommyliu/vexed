import { Bot } from "../Bot";
import { GameAction } from "../World";

const bot = Bot.getInstance();

export async function questTask() {
  for (const questId of bot.environment.questIds) {
    try {
      if (!bot.quests.get(questId)) void bot.quests.load(questId);

      if (!swf.questsIsInProgress(questId)) {
        await bot.waitUntil(
          () => bot.world.isActionAvailable(GameAction.AcceptQuest),
          null,
          5,
        );
        swf.questsAccept(questId);
      }

      if (swf.questsIsInProgress(questId)) {
        await bot.waitUntil(
          () => bot.world.isActionAvailable(GameAction.TryQuestComplete),
          null,
          5,
        );

        const maxTurnIns = bot.flash.call<string>(
          "world.maximumQuestTurnIns",
          questId,
        );

        void bot.quests.complete(questId, Number.parseInt(maxTurnIns, 10));
        void bot.quests.accept(questId);
      }
    } catch {}
  }
}

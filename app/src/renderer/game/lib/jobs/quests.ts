import { Logger } from "@vexed/logger";
import { Bot } from "../Bot";

let bot: Bot;
let index = 0;
let snapshot: number[] = [];
let isRestarting = false;
let isInitialized = false;

const logger = Logger.get("questJob", { precision: 3 });

function initializeJob() {
  if (isInitialized) {
    return;
  }

  isInitialized = true;

  bot = Bot.getInstance();
  snapshot = Array.from(bot.environment.questIds);

  console.log("quest job initialized", snapshot);

  bot.environment.on("questIdsChanged", () => {
    snapshot = Array.from(bot.environment.questIds);
    index = 0;
    isRestarting = true;
  });
}

export async function questJob() {
  initializeJob();

  if (snapshot.length === 0) return;

  // If restart requested, reset and return early to let scheduler re-invoke,
  // and start a new cycle from the beginning
  if (isRestarting) {
    isRestarting = false;
    return;
  }

  const questId = snapshot[index];
  if (typeof questId !== "number") return;

  if (index === 0) await bot.sleep(1_000);

  logger.info(`quest id this tick: ${questId} (${index})`);

  try {
    if (!bot.quests.get(questId)) {
      logger.info(`load quest id ${questId}`);
      void bot.quests.load(questId);
    }

    if (!swf.questsIsInProgress(questId)) {
      // await bot.waitUntil(
      //   () => bot.world.isActionAvailable(GameAction.AcceptQuest),
      //   null,
      //   5,
      // );
      logger.info(`accept quest id ${questId}`);
      swf.questsAccept(questId);
    }

    if (
      swf.questsIsInProgress(questId) &&
      swf.questsCanCompleteQuest(questId)
    ) {
      const maxTurnIns = bot.flash.call<string>(
        "world.maximumQuestTurnIns",
        questId,
      );
      const numMaxTurnIns = Number(maxTurnIns);

      logger.info(`complete quest id ${questId} with ${maxTurnIns}`);

      await bot.quests.complete(questId, numMaxTurnIns);
      await bot.quests.accept(questId);
    }
  } catch {}

  index = (index + 1) % snapshot.length;
  await bot.sleep(250);
}

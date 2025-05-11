import { interval } from "../../../common/interval";
import { Bot } from "../lib/Bot";

const bot = Bot.getInstance();
let stopFn: (() => void) | null = null;

export function startQuestTimer(quests: string[]) {
  stopQuestTimer();

  void bot.quests.loadMultiple(quests);

  void interval(async (_, stop) => {
    stopFn ??= stop;

    if (!bot.player.isReady()) return;

    for (const questId of quests) {
      try {
        if (!bot.player.isReady()) {
          stop();
          break;
        }

        const _questId = Number.parseInt(questId, 10);
        if (Number.isNaN(_questId)) continue;

        if (!swf.questsIsInProgress(_questId)) {
          swf.questsAccept(_questId);
        }

        if (swf.questsCanCompleteQuest(_questId)) {
          const maxTurnIns = bot.flash.call<number>(
            "world.maximumQuestTurnIns",
            _questId,
          );
          void bot.quests.complete(_questId, maxTurnIns);
          void bot.quests.accept(_questId);
        }
      } catch {}
    }
  }, 1_000);
}

export function stopQuestTimer() {
  if (stopFn) {
    stopFn();
    stopFn = null;
  }
}

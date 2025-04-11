import { interval } from '../../../common/interval';
import { Bot } from '../lib/Bot';

const bot = Bot.getInstance();
let on = false;

export function startQuestTimer(quests: string[]) {
  on = true;

  void interval(async (_, stop) => {
    if (!on) {
      stop();
      return;
    }

    if (!bot.player.isReady()) return;

    await bot.quests.loadMultiple(quests);

    // TODO: batch complete

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
          void bot.quests.complete(_questId);
          void bot.quests.accept(_questId);
        }
      } catch {}
    }
  }, 1_000);
}

export function stopQuestTimer() {
  on = false;
}

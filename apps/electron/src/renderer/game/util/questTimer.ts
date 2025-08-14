import { interval } from "async-interval";
import { Bot } from "../lib/Bot";
import { GameAction } from "../lib/World";

const bot = Bot.getInstance();
const activeQuestIds = new Set<string>();

let stopFn: (() => void) | null = null;

// Starts the quest timer.
export function startQuestTimer() {
  stopQuestTimer();

  void bot.quests.loadMultiple(Array.from(activeQuestIds));

  void interval(async (_, stop) => {
    stopFn ??= stop;

    if (!bot.player.isReady()) return;

    for (const questId of Array.from(activeQuestIds)) {
      try {
        if (!bot.player.isReady()) {
          stop();
          break;
        }

        const _questId = Number.parseInt(questId, 10);
        if (Number.isNaN(_questId)) continue;

        if (!bot.quests.tree.some((quest) => quest.id === _questId)) {
          void bot.quests.load(_questId);
        }

        if (!swf.questsIsInProgress(_questId)) {
          await bot.waitUntil(
            () => bot.world.isActionAvailable(GameAction.AcceptQuest),
            null,
            5,
          );
          swf.questsAccept(_questId);
        }

        if (swf.questsCanCompleteQuest(_questId)) {
          await bot.waitUntil(
            () => bot.world.isActionAvailable(GameAction.TryQuestComplete),
            null,
            5,
          );

          const maxTurnIns = bot.flash.call<string>(
            "world.maximumQuestTurnIns",
            _questId,
          );
          void bot.quests.complete(_questId, Number.parseInt(maxTurnIns, 10));
          void bot.quests.accept(_questId);
        }
      } catch {}
    }
  }, 1_000);
}

// Stops the quest timer.
export function stopQuestTimer() {
  if (stopFn) {
    stopFn();
    stopFn = null;
  }

  activeQuestIds.clear();
}

/**
 * Registers a quest to begin tracking.
 *
 * @param questId - The quest id to register.
 */
export function registerQuest(questId: string) {
  if (activeQuestIds.has(questId)) return;

  activeQuestIds.add(questId);
}

/**
 * Unregisters a quest.
 *
 * @param questId - The quest id to unregister.
 */
export function unregisterQuest(questId: string) {
  if (!activeQuestIds.has(questId)) return;

  activeQuestIds.delete(questId);
}

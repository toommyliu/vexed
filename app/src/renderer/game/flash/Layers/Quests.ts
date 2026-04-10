import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { Quests } from "../Services/Quests";
import type { QuestsShape } from "../Services/Quests";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  return {
    abandon: (questId: number) => bridge.call("quests.abandon", [questId]),
    accept: (questId: number) => bridge.call("quests.accept", [questId]),
    canComplete: (questId: number) =>
      bridge.call("quests.canComplete", [questId]),
    complete: (
      questId: number,
      turnIns?: number,
      itemId?: number,
      special?: boolean,
    ) => bridge.call("quests.complete", [questId, turnIns, itemId, special]),
    get: (questId: number) => bridge.call("quests.get", [questId]),
    getMultiple: (questIds: string) =>
      bridge.call("quests.getMultiple", [questIds]),
    getQuestValidationString: (questObj: Record<string, unknown>) =>
      bridge.call("quests.getQuestValidationString", [questObj]),
    getTree: () => bridge.call("quests.getTree"),
    hasRequiredItemsForQuest: (questObj: Record<string, unknown>) =>
      bridge.call("quests.hasRequiredItemsForQuest", [questObj]),
    isAvailable: (questId: number) => bridge.call("quests.isAvailable", [questId]),
    isInProgress: (questId: number) =>
      bridge.call("quests.isInProgress", [questId]),
    isOneTimeQuestDone: (questId: number) =>
      bridge.call("quests.isOneTimeQuestDone", [questId]),
    load: (questId: number) => bridge.call("quests.load", [questId]),
  } satisfies QuestsShape;
});

export const QuestsLive = Layer.effect(Quests, make);

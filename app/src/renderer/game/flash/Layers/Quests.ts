import type { QuestInfo } from "@vexed/game";
import { Effect, Layer, SynchronizedRef } from "effect";
import { waitFor, waitForRef } from "../../utils/waitFor";
import { asNumber, asRecord, asString } from "../PacketPayload";
import { Bridge } from "../Services/Bridge";
import { Packet } from "../Services/Packet";
import { Quests } from "../Services/Quests";
import type { QuestsShape } from "../Services/Quests";
import { World } from "../Services/World";

const asQuestMap = (value: unknown): Record<string, QuestInfo> | null => {
  const payload = asRecord(value);
  if (!payload) {
    return null;
  }

  const quests = asRecord(payload["quests"]);
  if (!quests) {
    return null;
  }

  return quests as Record<string, QuestInfo>;
};

const toQuestId = (value: unknown): number | undefined => {
  const parsed = asNumber(value);
  if (parsed === undefined) {
    return undefined;
  }

  const questId = Math.trunc(parsed);
  return questId > 0 ? questId : undefined;
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const packets = yield* Packet;
  const world = yield* World;

  const quests = yield* SynchronizedRef.make<Record<number, QuestInfo>>({});

  const runFork = Effect.runFork;

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnectionLost") {
      runFork(
        Effect.gen(function* () {
          yield* SynchronizedRef.set(quests, {});
        }),
      );
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  const updateQuests = (value: unknown) =>
    Effect.gen(function* () {
      const nextQuests = asQuestMap(value);
      if (!nextQuests) {
        return;
      }

      yield* SynchronizedRef.update(quests, (tree) => {
        for (const [rawQuestId, questInfo] of Object.entries(nextQuests)) {
          const questId = toQuestId(rawQuestId);
          if (questId === undefined) {
            continue;
          }

          tree[questId] = questInfo;
        }

        return tree;
      });
    });

  yield* packets.jsonScoped("getQuests", (packet) => updateQuests(packet.data));

  const waitForQuestLoad = (questId: number) =>
    waitForRef(quests, (tree) => tree[questId] !== undefined);

  const waitForQuestAccept = (questId: number) =>
    waitFor(isInProgress(questId));

  const abandon: QuestsShape["abandon"] = (questId) =>
    bridge.call("quests.abandon", [questId]);

  const accept: QuestsShape["accept"] = (questId, silent = false) =>
    Effect.gen(function* () {
      yield* world.map.waitForGameAction("acceptQuest");

      const tree = yield* SynchronizedRef.get(quests);
      if (!tree[questId]) {
        yield* load(questId, silent);
        yield* waitForQuestLoad(questId);
      }

      yield* bridge.call("quests.accept", [questId]);
      yield* waitForQuestAccept(questId);
    });

  const canComplete: QuestsShape["canComplete"] = (questId) =>
    bridge.call("quests.canComplete", [questId]);

  const complete: QuestsShape["complete"] = (
    questId,
    turnIns,
    itemId,
    special,
  ) => bridge.call("quests.complete", [questId, turnIns, itemId, special]);

  const load: QuestsShape["load"] = (questId, silent = false) =>
    Effect.gen(function* () {
      if (silent) {
        yield* bridge.callGameFunction("world.getQuests", [[questId]]);
        return;
      }

      yield* bridge.call("quests.load", [questId]);
    });

  const getMultiple: QuestsShape["getMultiple"] = (questIds) =>
    bridge.call("quests.getMultiple", [questIds]);

  const getTree: QuestsShape["getTree"] = () => SynchronizedRef.get(quests);

  const getAccepted: QuestsShape["getAccepted"] = () =>
    Effect.gen(function* () {
      const questIds = (yield* bridge.call("quests.getAccepted", [])) as number[];
      const tree = yield* SynchronizedRef.get(quests);
      return questIds
        .map((id) => tree[id])
        .filter((q): q is QuestInfo => q !== undefined);
    });

  const isAvailable: QuestsShape["isAvailable"] = (questId) =>
    bridge.call("quests.isAvailable", [questId]);

  const isInProgress: QuestsShape["isInProgress"] = (questId) =>
    bridge.call("quests.isInProgress", [questId]);

  return {
    abandon,
    accept,
    canComplete,
    complete,
    load,
    getMultiple,
    getTree,
    getAccepted,
    isAvailable,
    isInProgress,
  } satisfies QuestsShape;
});

export const QuestsLive = Layer.effect(Quests, make);

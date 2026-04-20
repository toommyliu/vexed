import { Collection } from "@vexed/collection";
import { Quest, type QuestInfo } from "@vexed/game";
import { Effect, Layer, SynchronizedRef } from "effect";
import { waitFor, waitForRef } from "../../utils/waitFor";
import { asNumber, asRecord } from "../PacketPayload";
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

const normalizeQuestIds = (questIds: readonly number[]): number[] => {
  const normalized: number[] = [];
  const seen = new Set<number>();

  for (const rawQuestId of questIds) {
    const questId = toQuestId(rawQuestId);
    if (questId === undefined || seen.has(questId)) {
      continue;
    }

    seen.add(questId);
    normalized.push(questId);
  }

  return normalized;
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const packets = yield* Packet;
  const world = yield* World;

  const quests = yield* SynchronizedRef.make<Collection<number, Quest>>(
    new Collection(),
  );

  const runFork = Effect.runFork;

  const dispose = yield* bridge.onConnection((status) => {
    if (status === "OnConnectionLost") {
      runFork(
        SynchronizedRef.update(quests, (tree) => {
          tree.clear();
          return tree;
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

          tree.ensure(questId, () => new Quest(questInfo)).data = questInfo;
        }

        return tree;
      });
    });

  yield* packets.jsonScoped("getQuests", (packet) => updateQuests(packet.data));

  const waitForQuestLoad = (questId: number) =>
    waitForRef(quests, (tree) => tree.has(questId));

  const waitForQuestAccept = (questId: number) =>
    waitFor(isInProgress(questId));

  const abandon: QuestsShape["abandon"] = (questId) =>
    bridge.call("quests.abandon", [questId]);

  const accept: QuestsShape["accept"] = (questId, silent = false) =>
    Effect.gen(function* () {
      yield* world.map.waitForGameAction("acceptQuest");

      const tree = yield* SynchronizedRef.get(quests);
      if (!tree.get(questId)) {
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
    turnIns?: number,
    itemId = -1,
    special = false,
  ) =>
    Effect.gen(function* () {
      const turnInsValue = (yield* bridge.callGameFunction(
        "world.maximumQuestTurnIns",
        [questId],
      )) as string;
      const turnInsNumber = turnIns ?? (Number(turnInsValue) ?? 1);
      yield* bridge.call("quests.complete", [
        questId,
        turnInsNumber,
        itemId,
        special,
      ]);
    });

  const load: QuestsShape["load"] = (questId, silent = false) =>
    silent
      ? bridge.call("quests.get", [questId])
      : bridge.call("quests.load", [questId]);

  const loadMany: QuestsShape["loadMany"] = (questIds, silent = false) => {
    const normalizedQuestIds = normalizeQuestIds(questIds);
    if (normalizedQuestIds.length === 0) {
      return Effect.void;
    }

    if (silent) {
      return bridge.call("quests.getMultiple", [normalizedQuestIds.join(",")]);
    }

    return Effect.asVoid(
      Effect.forEach(normalizedQuestIds, (questId) => load(questId, false)),
    );
  };

  const getTree: QuestsShape["getTree"] = () => SynchronizedRef.get(quests);

  const getAccepted: QuestsShape["getAccepted"] = () =>
    Effect.gen(function* () {
      const rawQuestIds = yield* bridge.call("quests.getAccepted");
      const questIds = Array.isArray(rawQuestIds)
        ? rawQuestIds
            .map(toQuestId)
            .filter((id): id is number => id !== undefined)
        : [];

      const tree = yield* SynchronizedRef.get(quests);
      return questIds
        .map((id) => tree.get(id))
        .filter((q): q is Quest => q !== undefined);
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
    loadMany,
    getTree,
    getAccepted,
    isAvailable,
    isInProgress,
  } satisfies QuestsShape;
});

export const QuestsLive = Layer.effect(Quests, make);

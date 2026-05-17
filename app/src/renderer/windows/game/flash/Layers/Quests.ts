import { Collection } from "@vexed/collection";
import { Quest, type QuestInfo } from "@vexed/game";
import { Effect, Layer, SynchronizedRef } from "effect";
import { waitFor, waitForRef } from "../../utils/waitFor";
import { asNumber, asRecord } from "../PacketPayload";
import { positiveInt, uniquePositiveInts } from "@vexed/shared/number";
import { Bridge } from "../Services/Bridge";
import { Packet } from "../Services/Packet";
import { Quests } from "../Services/Quests";
import type { QuestLoadedListener, QuestsShape } from "../Services/Quests";
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

  return positiveInt(parsed);
};

const normalizeQuestIds = (questIds: readonly number[]): number[] =>
  uniquePositiveInts(questIds);

const QUEST_LOAD_TIMEOUT = "5 seconds";
const QUEST_ACCEPT_TIMEOUT = "5 seconds";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const packets = yield* Packet;
  const world = yield* World;

  const quests = yield* SynchronizedRef.make<Collection<number, Quest>>(
    new Collection(),
  );
  const questLoadedListeners = new Set<QuestLoadedListener>();

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

      const loadedQuestIds: number[] = [];
      yield* SynchronizedRef.update(quests, (tree) => {
        for (const [rawQuestId, questInfo] of Object.entries(nextQuests)) {
          const questId = toQuestId(rawQuestId);
          if (questId === undefined) {
            continue;
          }

          tree.ensure(questId, () => new Quest(questInfo)).data = questInfo;
          loadedQuestIds.push(questId);
        }

        return tree;
      });

      if (loadedQuestIds.length === 0 || questLoadedListeners.size === 0) {
        return;
      }

      const listeners = Array.from(questLoadedListeners);
      yield* Effect.forEach(
        listeners,
        (listener, listenerIndex) =>
          listener(loadedQuestIds).pipe(
            Effect.catchCause((cause) =>
              Effect.logError({
                message: "quest loaded listener failed",
                questIds: loadedQuestIds,
                listenerIndex,
                cause,
              }),
            ),
          ),
        { discard: true },
      );
    });

  yield* packets.jsonScoped("getQuests", (packet) => updateQuests(packet.data));

  const waitForQuestLoad = (questId: number) =>
    waitForRef(quests, (tree) => tree.has(questId), {
      timeout: QUEST_LOAD_TIMEOUT,
    });

  const waitForQuestAccept = (questId: number) =>
    waitFor(isInProgress(questId), { timeout: QUEST_ACCEPT_TIMEOUT });

  const abandon: QuestsShape["abandon"] = (questId) =>
    bridge.call("quests.abandon", [questId]);

  const accept: QuestsShape["accept"] = (questId, silent = false) =>
    Effect.gen(function* () {
      const canAccept = yield* world.map.waitForGameAction("acceptQuest");
      if (!canAccept) {
        return;
      }

      const tree = yield* SynchronizedRef.get(quests);
      if (!tree.get(questId)) {
        yield* load(questId, silent);
        const updatedTree = yield* SynchronizedRef.get(quests);
        if (!updatedTree.get(questId)) {
          return;
        }
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
      const turnInsNumber = turnIns ?? (yield* getMaxTurnIns(questId));
      yield* bridge.call("quests.complete", [
        questId,
        turnInsNumber,
        itemId,
        special,
      ]);
    });

  const getMaxTurnIns: QuestsShape["getMaxTurnIns"] = (questId) =>
    Effect.map(
      bridge.call("quests.getMaxTurnIns", [questId]),
      (turnIns) => positiveInt(Number(turnIns)) ?? 1,
    );

  const load: QuestsShape["load"] = (questId, silent = false) =>
    Effect.gen(function* () {
      if (silent) {
        yield* bridge.call("quests.get", [questId]);
      } else {
        yield* bridge.call("quests.load", [questId]);
      }

      yield* waitForQuestLoad(questId).pipe(Effect.asVoid);
    });

  const loadMany: QuestsShape["loadMany"] = (questIds, silent = false) => {
    const normalizedQuestIds = normalizeQuestIds(questIds);
    if (normalizedQuestIds.length === 0) {
      return Effect.void;
    }

    if (silent) {
      return Effect.gen(function* () {
        yield* bridge.call("quests.getMultiple", [
          normalizedQuestIds.join(","),
        ]);
        yield* Effect.forEach(
          normalizedQuestIds,
          (questId) => waitForQuestLoad(questId).pipe(Effect.asVoid),
          { concurrency: "unbounded" },
        );
      });
    }

    return Effect.asVoid(
      Effect.forEach(normalizedQuestIds, (questId) => load(questId, false)),
    );
  };

  const getTree: QuestsShape["getTree"] = () => SynchronizedRef.get(quests);

  const onLoaded: QuestsShape["onLoaded"] = (listener) =>
    Effect.sync(() => {
      questLoadedListeners.add(listener);

      return () => {
        questLoadedListeners.delete(listener);
      };
    });

  const has: QuestsShape["has"] = (questId) =>
    SynchronizedRef.get(quests).pipe(Effect.map((tree) => tree.has(questId)));

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
    getMaxTurnIns,
    load,
    loadMany,
    getTree,
    onLoaded,
    has,
    getAccepted,
    isAvailable,
    isInProgress,
  } satisfies QuestsShape;
});

export const QuestsLive = Layer.effect(Quests, make);

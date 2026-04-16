import type { QuestInfo } from "@vexed/game";
import { Effect, Layer, SynchronizedRef } from "effect";
import { Bridge } from "../Services/Bridge";
import { Packet } from "../Services/Packet";
import { Quests } from "../Services/Quests";
import type { QuestsShape } from "../Services/Quests";
import { World } from "../Services/World";
import { waitForRef } from "../../utils/waitFor";

type GetQuestsPacket = {
  b?: {
    o?: {
      quests?: Record<string, QuestInfo>;
    };
  };
};

const getQuestsFromPacket = (
  packet: string,
): Record<string, QuestInfo> | null => {
  if (!packet.includes("getQuests")) {
    return null;
  }
  
  console.log('getQuests packet lol', packet)

  try {
    const parsed = JSON.parse(packet) as GetQuestsPacket;
    const quests = parsed.b?.o?.quests;

    if (!quests || typeof quests !== "object") {
      return null;
    }

    return quests;
  } catch {
    return null;
  }
};

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const packets = yield* Packet;
  const world = yield* World;

  const quests = yield* SynchronizedRef.make<Record<number, QuestInfo>>({});
  const acceptedQuests = yield* SynchronizedRef.make<Set<number>>(new Set());

  yield* packets.scoped(
    packets.packetFromServer((packet) =>
      Effect.gen(function* () {
        const nextQuests = getQuestsFromPacket(packet);
        if (!nextQuests) {
          return;
        }

        yield* SynchronizedRef.update(quests, (tree) => {
          for (const [rawQuestId, questInfo] of Object.entries(nextQuests)) {
            console.log("Adding quest:", rawQuestId, questInfo);
            const questId = Number(rawQuestId);
            if (Number.isNaN(questId)) {
              continue;
            }

            tree[questId] = questInfo;
          }

          return tree;
        });
      }),
    ),
  );

  yield* packets.scoped(
    packets.packetFromClient((packet) =>
      Effect.gen(function* () {
        if (packet.includes("acceptQuest")) {
          //%xt%zm%getQuests%3%11%407%408%409%445%446%
          const parts = packet.split("%").filter(Boolean);
          console.log("Accept quest packet:", parts);
          const questId = Number(parts[5]);
          yield* SynchronizedRef.update(acceptedQuests, (set) =>
            set.add(questId),
          );
        }
      }),
    ),
  );

  const waitForQuestLoad = (questId: number) =>
    waitForRef(quests, (tree) => !!tree[questId]);

  const waitForQuestAccept = (questId: number) =>
    waitForRef(acceptedQuests, (set) => set.has(questId));

  const abandon = (questId: number) =>
    Effect.gen(function* () {
      yield* bridge.call("quests.abandon", [questId]);
      yield* SynchronizedRef.update(acceptedQuests, (set) => {
        const next = new Set(set);
        next.delete(questId);
        return next;
      });
    });

  const accept: QuestsShape["accept"] = (
    questId: number,
    silent: boolean = false,
  ) =>
    Effect.gen(function* () {
      yield* world.map.waitForGameAction("acceptQuest");

      const tree = yield* SynchronizedRef.get(quests);
      if (tree[questId]) {
        yield* bridge.call("quests.accept", [questId]);
        return;
      }

      yield* load(questId, silent);
      yield* waitForQuestLoad(questId);
      yield* bridge.call("quests.accept", [questId]);
      yield* waitForQuestAccept(questId);
    });

  const canComplete = (questId: number) =>
    bridge.call("quests.canComplete", [questId]);

  const complete = (
    questId: number,
    turnIns?: number,
    itemId?: number,
    special?: boolean,
  ) => bridge.call("quests.complete", [questId, turnIns, itemId, special]);

  const load = (questId: number, silent = false) =>
    Effect.gen(function* () {
      // Load quest without showing the Quest List
      if (silent) {
        return yield* bridge.callGameFunction("world.getQuests", [[questId]]);
      }

      return yield* bridge.call("quests.load", [questId]);
    });

  const getMultiple = (questIds: string) =>
    bridge.call("quests.getMultiple", [questIds]);

  const getTree = () => SynchronizedRef.get(quests);

  const isAvailable = (questId: number) =>
    bridge.call("quests.isAvailable", [questId]);

  const isInProgress = (questId: number) =>
    bridge.call("quests.isInProgress", [questId]);

  return {
    abandon,
    accept,
    canComplete,
    complete,
    load,
    getMultiple,
    getTree,
    getAccepted: () => SynchronizedRef.get(acceptedQuests),
    isAvailable,
    isInProgress,
  } satisfies QuestsShape;
});

export const QuestsLive = Layer.effect(Quests, make);

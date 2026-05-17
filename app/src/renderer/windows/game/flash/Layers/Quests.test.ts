import { Effect, Fiber, Layer } from "effect";
import { expect, test } from "vitest";
import type { QuestInfo } from "@vexed/game";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import {
  Packet,
  type ExtensionPacketHandler,
  type PacketShape,
} from "../Services/Packet";
import { World, type WorldShape } from "../Services/World";
import { Quests } from "../Services/Quests";
import { QuestsLive } from "./Quests";

const questInfo = (questId: number): QuestInfo =>
  ({
    QuestID: String(questId),
    RequiredItems: [],
    Rewards: [],
    oItems: {},
    oRewards: {},
    reward: [],
    sName: `Quest ${questId}`,
  }) as unknown as QuestInfo;

const makeWorld = (): WorldShape =>
  ({
    map: {
      waitForGameAction: () => Effect.succeed(true),
    },
  }) as unknown as WorldShape;

test("silent loadMany waits until fetched quests are in the local tree", async () => {
  const jsonHandlers = new Map<string, Parameters<PacketShape["json"]>[1]>();
  const bridgeCalls: string[] = [];
  let loadManyCompleted = false;
  const loadedEvents: number[][] = [];

  const packet = {
    jsonScoped(cmd: string, handler: ExtensionPacketHandler) {
      jsonHandlers.set(cmd, handler);
      return Effect.void as never;
    },
  } as unknown as PacketShape;

  const bridge = {
    call(path) {
      bridgeCalls.push(path);
      return Effect.void as never;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => {});
    },
  } as BridgeShape;

  await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const quests = yield* Quests;
        yield* quests.onLoaded((questIds) =>
          Effect.sync(() => {
            loadedEvents.push([...questIds]);
          }),
        );

        const fiber = yield* Effect.forkDetach(
          quests.loadMany([609], true).pipe(
            Effect.tap(() =>
              Effect.sync(() => {
                loadManyCompleted = true;
              }),
            ),
          ),
          { startImmediately: true },
        );

        yield* Effect.sleep("20 millis");
        expect(loadManyCompleted).toBe(false);
        expect(bridgeCalls).toEqual(["quests.getMultiple"]);

        const handler = jsonHandlers.get("getQuests");
        expect(handler).toBeDefined();
        if (handler === undefined) {
          return;
        }

        yield* handler({
          type: "extension",
          raw: "",
          packetType: "json",
          cmd: "getQuests",
          data: {
            quests: {
              609: questInfo(609),
            },
          },
        });

        yield* Fiber.join(fiber);
        expect(loadManyCompleted).toBe(true);
        expect(loadedEvents).toEqual([[609]]);
        expect((yield* quests.getTree()).has(609)).toBe(true);
      }),
    ).pipe(
      Effect.provide(
        QuestsLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              Layer.succeed(Bridge)(bridge),
              Layer.succeed(Packet)(packet),
              Layer.succeed(World)(makeWorld()),
            ),
          ),
        ),
      ),
    ),
  );
});

import type { Avatar, Aura } from "@vexed/game";
import { Effect, Layer, Option } from "effect";
import { expect, test } from "vitest";
import { PacketDomain, type PacketDomainShape } from "../../flash/Services/PacketDomain";
import { Player, type PlayerShape } from "../../flash/Services/Player";
import { World, type WorldShape } from "../../flash/Services/World";
import { AutoZone, type AutoZoneShape } from "../Services/AutoZone";
import { AutoZoneLive } from "./AutoZone";

type WalkCall = {
  readonly x: number;
  readonly y: number;
};

type Harness = {
  readonly auraNames: Set<string>;
  readonly emitZone: (map: string, zone: string) => Effect.Effect<void>;
  readonly setWorldMap: (map: string) => void;
  readonly walks: WalkCall[];
};

const inRange = (
  value: number,
  [min, max]: readonly [number, number],
): boolean => value >= min && value <= max;

const withAutoZone = async <A>(
  body: (autoZone: AutoZoneShape, harness: Harness) => Effect.Effect<A, unknown>,
): Promise<A> => {
  const walks: WalkCall[] = [];
  const auraNames = new Set<string>();
  let currentMap = "ultradage";
  let zoneHandler:
    | Parameters<PacketDomainShape["on"]>[1]
    | undefined;

  const packetDomain = {
    started: true,
    on(event, handler) {
      if (event !== "zone") {
        throw new Error(`unexpected packet domain event: ${event}`);
      }

      zoneHandler = handler as Parameters<PacketDomainShape["on"]>[1];
      return Effect.succeed(() => {
        zoneHandler = undefined;
      });
    },
  } satisfies PacketDomainShape;

  const player = {
    walkTo(x: number, y: number) {
      walks.push({ x, y });
      return Effect.succeed(true);
    },
  } as unknown as PlayerShape;

  const world = {
    map: {
      getName: () => Effect.succeed(currentMap),
    },
    players: {
      withSelf: <A>(f: (self: Avatar) => A) =>
        Effect.succeed(
          Option.some(
            f({
              data: { entID: 1 },
            } as Avatar),
          ),
        ),
      getAura: (_entId: number, auraName: string) =>
        Effect.succeed(
          auraNames.has(auraName)
            ? Option.some({ name: auraName } as Aura)
            : Option.none(),
        ),
    },
    monsters: {},
  } as unknown as WorldShape;

  return await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const autoZone = yield* AutoZone;
        return yield* body(autoZone, {
          auraNames,
          emitZone(map, zone) {
            if (!zoneHandler) {
              throw new Error("zone handler was not registered");
            }

            return zoneHandler({
              map,
              zone,
              packet: {} as never,
            });
          },
          setWorldMap(map) {
            currentMap = map;
          },
          walks,
        });
      }),
    ).pipe(
      Effect.provide(
        AutoZoneLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              Layer.succeed(PacketDomain)(packetDomain),
              Layer.succeed(Player)(player),
              Layer.succeed(World)(world),
            ),
          ),
        ),
      ),
    ),
  );
};

test("default enabled and map state", async () => {
  const state = await withAutoZone((autoZone) =>
    Effect.all({
      enabled: autoZone.enabled,
      map: autoZone.map,
    }),
  );

  expect(state).toEqual({
    enabled: true,
    map: "ultradage",
  });
});

test("disabled AutoZone ignores zone packets", async () => {
  const walks = await withAutoZone((autoZone, harness) =>
    Effect.gen(function* () {
      yield* autoZone.setEnabled(false);
      yield* harness.emitZone("ultradage", "A");
      return harness.walks;
    }),
  );

  expect(walks).toEqual([]);
});

test("selected map mismatch ignores zone packets", async () => {
  const walks = await withAutoZone((autoZone, harness) =>
    Effect.gen(function* () {
      yield* autoZone.setMap("ledgermayne");
      yield* harness.emitZone("ultradage", "A");
      return harness.walks;
    }),
  );

  expect(walks).toEqual([]);
});

test("supported map zone walks within configured coordinate range", async () => {
  const walks = await withAutoZone((autoZone, harness) =>
    Effect.gen(function* () {
      yield* autoZone.setMap("ledgermayne");
      yield* harness.emitZone("ledgermayne", "A");
      return harness.walks;
    }),
  );

  expect(walks).toHaveLength(1);
  expect(inRange(walks[0]!.x, [147, 276])).toBe(true);
  expect(inRange(walks[0]!.y, [353, 357])).toBe(true);
});

test("unsupported zone does not walk", async () => {
  const walks = await withAutoZone((autoZone, harness) =>
    Effect.gen(function* () {
      yield* autoZone.setMap("ledgermayne");
      yield* harness.emitZone("ledgermayne", "missing");
      return harness.walks;
    }),
  );

  expect(walks).toEqual([]);
});

test("queeniona center behavior", async () => {
  const walks = await withAutoZone((autoZone, harness) =>
    Effect.gen(function* () {
      yield* autoZone.setMap("queeniona");
      harness.setWorldMap("queeniona");
      yield* harness.emitZone("queeniona", "");
      yield* Effect.sleep("550 millis");
      return harness.walks;
    }),
  );

  expect(walks).toEqual([{ x: 490, y: 320 }]);
});

test("queeniona aura side selection", async () => {
  const walks = await withAutoZone((autoZone, harness) =>
    Effect.gen(function* () {
      yield* autoZone.setMap("queeniona");
      harness.setWorldMap("queeniona");
      harness.auraNames.add("Positive Charge");
      yield* harness.emitZone("queeniona", "A");
      yield* Effect.sleep("550 millis");
      return harness.walks;
    }),
  );

  expect(walks).toHaveLength(1);
  expect(inRange(walks[0]!.x, [746, 869])).toBe(true);
  expect(inRange(walks[0]!.y, [369, 379])).toBe(true);
});

test("stale delayed queeniona sequence does not walk", async () => {
  const walks = await withAutoZone((autoZone, harness) =>
    Effect.gen(function* () {
      yield* autoZone.setMap("queeniona");
      harness.setWorldMap("queeniona");
      harness.auraNames.add("Positive Charge");

      yield* harness.emitZone("queeniona", "A");
      yield* harness.emitZone("queeniona", "B");
      yield* Effect.sleep("550 millis");
      return harness.walks;
    }),
  );

  expect(walks).toHaveLength(1);
  expect(inRange(walks[0]!.x, [111, 272])).toBe(true);
  expect(inRange(walks[0]!.y, [369, 379])).toBe(true);
});

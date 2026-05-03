import { equalsIgnoreCase } from "@vexed/shared/string";
import { Effect, Layer, Option, Random, Ref } from "effect";
import {
  AutoZone,
  type AutoZoneSupportedMap,
  type AutoZoneShape,
} from "../Services/AutoZone";
import { PacketDomain } from "../Services/PacketDomain";
import { Player } from "../Services/Player";
import { World } from "../Services/World";

type CoordinateRange = readonly [
  x: [min: number, max: number],
  y: [min: number, max: number],
];

type ZoneMap = Partial<Record<string, CoordinateRange>>;

const AUTO_ZONES: Partial<Record<AutoZoneSupportedMap, ZoneMap>> = {
  ledgermayne: {
    A: [
      [147, 276],
      [353, 357],
    ],
    B: [
      [727, 852],
      [353, 356],
    ],
    "": [
      [431, 547],
      [234, 239],
    ],
  },
  moreskulls: {
    A: [
      [696, 802],
      [445, 452],
    ],
    B: [
      [677, 766],
      [321, 324],
    ],
    "": [
      [778, 806],
      [358, 361],
    ],
  },
  ultradage: {
    A: [
      [49, 164],
      [406, 412],
    ],
    B: [
      [797, 900],
      [400, 402],
    ],
    "": [
      [481, 483],
      [296, 300],
    ],
  },
  darkcarnax: {
    A: [
      [731, 850],
      [431, 432],
    ],
    B: [
      [54, 155],
      [431, 432],
    ],
    "": [
      [480, 530],
      [419, 432],
    ],
  },
  astralshrine: {
    A: [
      [643, 708],
      [445, 447],
    ],
    B: [
      [199, 287],
      [181, 205],
    ],
    "": [
      [461, 465],
      [320, 325],
    ],
  },
  magnumopus: {
    A: [
      [682, 813],
      [367, 384],
    ],
    B: [
      [170, 285],
      [377, 384],
    ],
    "": [
      [466, 470],
      [344, 420],
    ],
  },
};

const QUEENIONA_MAP = "queeniona" satisfies AutoZoneSupportedMap;
const QUEENIONA_AURA_SETTLE_DELAY = "500 millis";
const QUEENIONA_LEFT: CoordinateRange = [
  [111, 272],
  [369, 379],
];
const QUEENIONA_RIGHT: CoordinateRange = [
  [746, 869],
  [369, 379],
];
const QUEENIONA_CENTER = [490, 320] as const;
const QUEENIONA_POSITIVE_CHARGES = [
  "Positive Charge",
  "Positive Charge?",
] as const;
const QUEENIONA_NEGATIVE_CHARGES = [
  "Negative Charge",
  "Negative Charge?",
] as const;

const randomInRange = ([min, max]: [number, number]) =>
  Random.nextIntBetween(min, max);

const getRandomPosition = ([[x0, x1], [y0, y1]]: CoordinateRange) =>
  Effect.all({
    x: randomInRange([x0, x1]),
    y: randomInRange([y0, y1]),
  });

const make = Effect.gen(function* () {
  const packetDomain = yield* PacketDomain;
  const player = yield* Player;
  const world = yield* World;

  const runFork = Effect.runForkWith(yield* Effect.services());
  const enabledRef = yield* Ref.make(true);
  const mapRef = yield* Ref.make<AutoZoneSupportedMap>("ultradage");
  const queenionaSequenceRef = yield* Ref.make(0);

  const walkTo = (x: number, y: number) =>
    player.walkTo(x, y).pipe(Effect.catch(() => Effect.void));

  const walkToRandomPosition = (range: CoordinateRange) =>
    Effect.gen(function* () {
      const { x, y } = yield* getRandomPosition(range);
      yield* walkTo(x, y);
    });

  const hasSelfAura = (
    entId: number,
    auraNames: readonly string[],
  ): Effect.Effect<boolean> =>
    Effect.gen(function* () {
      for (const auraName of auraNames) {
        const aura = yield* world.players.getAura(entId, auraName);
        if (Option.isSome(aura)) {
          return true;
        }
      }

      return false;
    });

  const isCurrentQueenionaSequence = (sequence: number) =>
    Effect.gen(function* () {
      const currentSequence = yield* Ref.get(queenionaSequenceRef);
      if (sequence !== currentSequence) {
        return false;
      }

      const enabled = yield* Ref.get(enabledRef);
      if (!enabled) {
        return false;
      }

      const selectedMap = yield* Ref.get(mapRef);
      if (selectedMap !== QUEENIONA_MAP) {
        return false;
      }

      const currentWorldMap = yield* world.map.getName();
      return equalsIgnoreCase(currentWorldMap, QUEENIONA_MAP);
    });

  const handleQueenionaZone = (zone: string, sequence: number) =>
    Effect.gen(function* () {
      yield* Effect.sleep(QUEENIONA_AURA_SETTLE_DELAY);

      const isCurrent = yield* isCurrentQueenionaSequence(sequence);
      if (!isCurrent) {
        return;
      }

      if (zone !== "A" && zone !== "B") {
        yield* walkTo(QUEENIONA_CENTER[0], QUEENIONA_CENTER[1]);
        return;
      }

      const entId = yield* world.players.withSelf((me) => me.data.entID);
      if (Option.isNone(entId)) {
        return;
      }

      const positiveCharge = yield* hasSelfAura(
        entId.value,
        QUEENIONA_POSITIVE_CHARGES,
      );
      const negativeCharge = positiveCharge
        ? false
        : yield* hasSelfAura(entId.value, QUEENIONA_NEGATIVE_CHARGES);

      const targetRange =
        zone === "A"
          ? positiveCharge
            ? QUEENIONA_RIGHT
            : negativeCharge
              ? QUEENIONA_LEFT
              : undefined
          : positiveCharge
            ? QUEENIONA_LEFT
            : negativeCharge
              ? QUEENIONA_RIGHT
              : undefined;

      if (targetRange) {
        yield* walkToRandomPosition(targetRange);
      }
    }).pipe(
      Effect.catchCause((cause) =>
        Effect.logError({
          message: "queeniona auto zone failed",
          cause,
        }),
      ),
    );

  const dispose = yield* packetDomain.on("zone", (event) =>
    Effect.gen(function* () {
      const enabled = yield* Ref.get(enabledRef);
      if (!enabled) return;

      const currentMap = yield* Ref.get(mapRef);
      if (!equalsIgnoreCase(event.map, currentMap)) return;

      if (equalsIgnoreCase(currentMap, QUEENIONA_MAP)) {
        const sequence = yield* Ref.updateAndGet(
          queenionaSequenceRef,
          (value) => value + 1,
        );
        runFork(handleQueenionaZone(event.zone, sequence));
        return;
      }

      if (!AUTO_ZONES[currentMap]) {
        yield* Effect.logWarning(
          `No config for map '${currentMap}' in auto zone`,
        );
        return;
      }

      const zoneRange = AUTO_ZONES[currentMap][event.zone];
      if (!zoneRange) {
        return;
      }

      yield* walkToRandomPosition(zoneRange);
    }),
  );

  yield* Effect.addFinalizer(() => Effect.sync(dispose));

  const enabled: AutoZoneShape["enabled"] = Ref.get(enabledRef);

  const map: AutoZoneShape["map"] = Ref.get(mapRef);

  const setMap: AutoZoneShape["setMap"] = (map: AutoZoneSupportedMap) =>
    Ref.set(mapRef, map);

  const setEnabled: AutoZoneShape["setEnabled"] = (enabled: boolean) =>
    Ref.set(enabledRef, enabled);

  return {
    enabled,
    map,
    setMap,
    setEnabled,
  } satisfies AutoZoneShape;
});

export const AutoZoneLive = Layer.effect(AutoZone, make);

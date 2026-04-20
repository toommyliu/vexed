import { Effect, Layer, Ref } from "effect";
import {
  AutoZone,
  type AutoZoneSupportedMap,
  type AutoZoneShape,
} from "../Services/AutoZone";
import { PacketDomain } from "../Services/PacketDomain";
import { Player } from "../Services/Player";

type CoordinateRange = readonly [
  x: [min: number, max: number],
  y: [min: number, max: number],
];

type ZoneMap = Partial<Record<string, CoordinateRange>>;

const AUTO_ZONES: Record<AutoZoneSupportedMap, ZoneMap> = {
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
  // TODO: this requires its own logic
  queeniona: {},
};

const randomInRange = ([min, max]: [number, number]) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomPosition = ([[x0, x1], [y0, y1]]: CoordinateRange) => ({
  x: randomInRange([x0, x1]),
  y: randomInRange([y0, y1]),
});

const make = Effect.gen(function* () {
  const packetDomain = yield* PacketDomain;
  const player = yield* Player;
  const enabledRef = yield* Ref.make(true);
  const mapRef = yield* Ref.make<AutoZoneSupportedMap>("ultradage");

  const dispose = yield* packetDomain.on("zone", (event) =>
    Effect.gen(function* () {
      const enabled = yield* Ref.get(enabledRef);
      if (!enabled) return;

      const currentMap = yield* Ref.get(mapRef);

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

      const { x, y } = getRandomPosition(zoneRange);
      yield* player.walkTo(x, y).pipe(Effect.catch(() => Effect.void));
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

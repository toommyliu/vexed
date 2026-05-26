import { Effect, Layer } from "effect";
import { expect, test } from "vitest";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import { Outfits } from "../Services/Outfits";
import { Wait, type WaitShape } from "../Services/Wait";
import { OutfitsLive } from "./Outfits";

type BridgeCall = {
  readonly path: string;
  readonly args: readonly unknown[] | undefined;
};

const makeWait = (
  forGameAction: WaitShape["forGameAction"] = () => Effect.succeed(true),
): WaitShape =>
  ({
    until: (condition) => condition,
    untilSome: (condition) => condition,
    isGameActionAvailable: () => Effect.succeed(true),
    forGameAction,
  }) as WaitShape;

const withOutfits = <A>(
  bridge: BridgeShape,
  wait: WaitShape,
  effect: Effect.Effect<A, unknown, Outfits>,
): Promise<A> =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(
        OutfitsLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              Layer.succeed(Bridge)(bridge),
              Layer.succeed(Wait)(wait),
            ),
          ),
        ),
      ),
    ),
  );

test("getAll normalizes raw outfit records", async () => {
  const bridge = {
    call(path) {
      if (path === "outfits.getAll") {
        return Effect.succeed([
          {
            name: "Farm",
            class: { ItemID: 1 },
          },
          {
            name: "",
          },
          null,
        ]);
      }

      throw new Error(`unexpected bridge call: ${String(path)}`);
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => {});
    },
  } as BridgeShape;

  const result = await withOutfits(
    bridge,
    makeWait(),
    Effect.gen(function* () {
      const outfits = yield* Outfits;
      return yield* outfits.getAll();
    }),
  );

  expect(result).toEqual([
    {
      name: "Farm",
      data: {
        class: { ItemID: 1 },
      },
    },
  ]);
});

test("equip waits for the native loadout action and forwards keepColors", async () => {
  const bridgeCalls: BridgeCall[] = [];
  const actions: string[] = [];

  const bridge = {
    call(path, args) {
      bridgeCalls.push({ path: String(path), args });
      return Effect.succeed(true) as never;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => {});
    },
  } as BridgeShape;

  const wait = makeWait((gameAction) =>
    Effect.sync(() => {
      actions.push(gameAction);
      return true;
    }),
  );

  const result = await withOutfits(
    bridge,
    wait,
    Effect.gen(function* () {
      const outfits = yield* Outfits;
      return yield* outfits.equip("Farm", { keepColors: true });
    }),
  );

  expect(result).toBe(true);
  expect(actions).toEqual(["equipLoadout"]);
  expect(bridgeCalls).toEqual([
    {
      path: "outfits.equip",
      args: ["Farm", true],
    },
  ]);
});

test("equip returns false when the native loadout action stays locked", async () => {
  const bridgeCalls: BridgeCall[] = [];

  const bridge = {
    call(path, args) {
      bridgeCalls.push({ path: String(path), args });
      return Effect.succeed(true) as never;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => {});
    },
  } as BridgeShape;

  const result = await withOutfits(
    bridge,
    makeWait(() => Effect.succeed(false)),
    Effect.gen(function* () {
      const outfits = yield* Outfits;
      return yield* outfits.equip("Farm");
    }),
  );

  expect(result).toBe(false);
  expect(bridgeCalls).toEqual([]);
});

test("wear waits for the native cosmetic loadout action", async () => {
  const bridgeCalls: BridgeCall[] = [];
  const actions: string[] = [];

  const bridge = {
    call(path, args) {
      bridgeCalls.push({ path: String(path), args });
      return Effect.succeed(true) as never;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => {});
    },
  } as BridgeShape;

  const wait = makeWait((gameAction) =>
    Effect.sync(() => {
      actions.push(gameAction);
      return true;
    }),
  );

  const result = await withOutfits(
    bridge,
    wait,
    Effect.gen(function* () {
      const outfits = yield* Outfits;
      return yield* outfits.wear("Cosmetic");
    }),
  );

  expect(result).toBe(true);
  expect(actions).toEqual(["wearLoadout"]);
  expect(bridgeCalls).toEqual([
    {
      path: "outfits.wear",
      args: ["Cosmetic", false],
    },
  ]);
});

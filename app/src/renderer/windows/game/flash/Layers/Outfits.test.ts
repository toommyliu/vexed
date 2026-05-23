import { Effect, Layer } from "effect";
import { expect, test } from "vitest";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import { Outfits } from "../Services/Outfits";
import { World, type WorldShape } from "../Services/World";
import { OutfitsLive } from "./Outfits";

type BridgeCall = {
  readonly path: string;
  readonly args: readonly unknown[] | undefined;
};

const makeWorld = (
  waitForGameAction: WorldShape["map"]["waitForGameAction"] = () =>
    Effect.succeed(true),
): WorldShape =>
  ({
    map: {
      waitForGameAction,
    },
  }) as unknown as WorldShape;

const withOutfits = <A>(
  bridge: BridgeShape,
  world: WorldShape,
  effect: Effect.Effect<A, unknown, Outfits>,
): Promise<A> =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(
        OutfitsLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              Layer.succeed(Bridge)(bridge),
              Layer.succeed(World)(world),
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
    makeWorld(),
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

  const world = makeWorld((gameAction) =>
    Effect.sync(() => {
      actions.push(gameAction);
      return true;
    }),
  );

  const result = await withOutfits(
    bridge,
    world,
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
    makeWorld(() => Effect.succeed(false)),
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

  const world = makeWorld((gameAction) =>
    Effect.sync(() => {
      actions.push(gameAction);
      return true;
    }),
  );

  const result = await withOutfits(
    bridge,
    world,
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

import { Effect } from "effect";
import { afterEach, expect, test } from "vitest";
import { SwfCallError } from "../Errors";
import {
  Bridge,
  BridgeFailurePolicy,
  type BridgeError,
} from "../Services/Bridge";
import { BridgeLive } from "./Bridge";

type TestGlobal = {
  window?: unknown;
};

const testGlobal = globalThis as TestGlobal;
const originalWindow = testGlobal.window;

const setSwf = (swf: Partial<Window["swf"]>) => {
  testGlobal.window = {
    swf: swf as Window["swf"],
  };
};

afterEach(() => {
  testGlobal.window = originalWindow;
});

const withBridge = <A>(effect: Effect.Effect<A, unknown, Bridge>) =>
  Effect.runPromise(effect.pipe(Effect.provide(BridgeLive)));

test("strict bridge policy fails swf call errors", async () => {
  setSwf({
    "inventory.contains": () => {
      throw new Error("flash exploded");
    },
  });

  const result = withBridge(
    Effect.gen(function* () {
      const bridge = yield* Bridge;
      return yield* bridge.call("inventory.contains", ["Potion"]);
    }),
  );

  await expect(result).rejects.toMatchObject({
    _tag: "SwfCallError",
    method: "inventory.contains",
    args: ["Potion"],
  });
});

test("tolerant bridge policy reports and returns generated fallback", async () => {
  const failures: BridgeError[] = [];
  setSwf({
    "inventory.contains": () => {
      throw new Error("flash exploded");
    },
  });

  const result = await withBridge(
    Effect.gen(function* () {
      const bridge = yield* Bridge;
      return yield* bridge.call("inventory.contains", ["Potion"]);
    }).pipe(
      Effect.provideService(BridgeFailurePolicy, {
        mode: "tolerant",
        onFailure: (error) =>
          Effect.sync(() => {
            failures.push(error);
          }),
      }),
    ),
  );

  expect(result).toBe(false);
  expect(failures).toHaveLength(1);
  expect(failures[0]).toBeInstanceOf(SwfCallError);
  expect(failures[0]).toMatchObject({
    method: "inventory.contains",
    args: ["Potion"],
  });
});

test("tolerant bridge policy uses metadata fallback for json string methods", async () => {
  setSwf({
    "flash.getGameObject": () => {
      throw new Error("missing object");
    },
  });

  const result = await withBridge(
    Effect.gen(function* () {
      const bridge = yield* Bridge;
      return yield* bridge.call("flash.getGameObject", ["world.myAvatar"]);
    }).pipe(
      Effect.provideService(BridgeFailurePolicy, {
        mode: "tolerant",
        onFailure: () => Effect.void,
      }),
    ),
  );

  expect(result).toBe("null");
});

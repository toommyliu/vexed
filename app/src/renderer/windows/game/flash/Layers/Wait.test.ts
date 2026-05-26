import { Effect, Layer, Option } from "effect";
import { expect, test } from "vitest";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import { Wait } from "../Services/Wait";
import { WaitLive } from "./Wait";

const withWait = <A>(
  bridge: BridgeShape,
  effect: Effect.Effect<A, unknown, Wait>,
): Promise<A> =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(
        WaitLive.pipe(Layer.provide(Layer.succeed(Bridge)(bridge))),
      ),
    ),
  );

const emptyBridge = {
  call(path) {
    throw new Error(`unexpected bridge call: ${String(path)}`);
  },
  callGameFunction() {
    return Effect.void;
  },
  onConnection() {
    return Effect.succeed(() => {});
  },
} as BridgeShape;

test("until succeeds after a predicate becomes true", async () => {
  let attempts = 0;

  const result = await withWait(
    emptyBridge,
    Effect.gen(function* () {
      const wait = yield* Wait;
      return yield* wait.until(
        Effect.sync(() => {
          attempts += 1;
          return attempts >= 3;
        }),
        { interval: "1 millis", timeout: "100 millis" },
      );
    }),
  );

  expect(result).toBe(true);
  expect(attempts).toBeGreaterThanOrEqual(3);
});

test("until returns false after timeout", async () => {
  const result = await withWait(
    emptyBridge,
    Effect.gen(function* () {
      const wait = yield* Wait;
      return yield* wait.until(Effect.succeed(false), {
        interval: "1 millis",
        timeout: "5 millis",
      });
    }),
  );

  expect(result).toBe(false);
});

test("untilSome returns the value that satisfied the predicate", async () => {
  let attempts = 0;

  const result = await withWait(
    emptyBridge,
    Effect.gen(function* () {
      const wait = yield* Wait;
      return yield* wait.untilSome(
        Effect.sync(() => {
          attempts += 1;
          return attempts >= 3 ? Option.some("ready") : Option.none<string>();
        }),
        { interval: "1 millis", timeout: "100 millis" },
      );
    }),
  );

  expect(Option.isSome(result)).toBe(true);
  expect(Option.isSome(result) ? result.value : undefined).toBe("ready");
  expect(attempts).toBeGreaterThanOrEqual(3);
});

test("untilSome returns none after timeout", async () => {
  const result = await withWait(
    emptyBridge,
    Effect.gen(function* () {
      const wait = yield* Wait;
      return yield* wait.untilSome(Effect.succeed(Option.none<string>()), {
        interval: "1 millis",
        timeout: "5 millis",
      });
    }),
  );

  expect(Option.isNone(result)).toBe(true);
});

test("forGameAction polls world action availability", async () => {
  const calls: string[] = [];
  let attempts = 0;
  const bridge = {
    call(path, args) {
      return Effect.sync(() => {
        calls.push(`${String(path)}:${String(args?.[0])}`);
        attempts += 1;
        return attempts >= 2;
      }) as never;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => {});
    },
  } as BridgeShape;

  const result = await withWait(
    bridge,
    Effect.gen(function* () {
      const wait = yield* Wait;
      return yield* wait.forGameAction("buyItem", {
        interval: "1 millis",
        timeout: "100 millis",
      });
    }),
  );

  expect(result).toBe(true);
  expect(calls).toEqual([
    "world.isActionAvailable:buyItem",
    "world.isActionAvailable:buyItem",
  ]);
});

test("forGameAction accepts empty options object", async () => {
  const bridge = {
    call(path, args) {
      expect(path).toBe("world.isActionAvailable");
      expect(args).toEqual(["buyItem"]);
      return Effect.succeed(true) as never;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => {});
    },
  } as BridgeShape;

  const result = await withWait(
    bridge,
    Effect.gen(function* () {
      const wait = yield* Wait;
      return yield* wait.forGameAction("buyItem", {});
    }),
  );

  expect(result).toBe(true);
});

test("forGameAction uses the legacy default timeout", async () => {
  const bridge = {
    call(path, args) {
      expect(path).toBe("world.isActionAvailable");
      expect(args).toEqual(["rest"]);
      return Effect.succeed(false) as never;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => {});
    },
  } as BridgeShape;

  const result = await withWait(
    bridge,
    Effect.gen(function* () {
      const wait = yield* Wait;
      return yield* wait.forGameAction("rest");
    }),
  );

  expect(result).toBe(false);
});

test("forGameAction accepts duration shorthand", async () => {
  const bridge = {
    call(path, args) {
      expect(path).toBe("world.isActionAvailable");
      expect(args).toEqual(["sellItem"]);
      return Effect.succeed(false) as never;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => {});
    },
  } as BridgeShape;

  const result = await withWait(
    bridge,
    Effect.gen(function* () {
      const wait = yield* Wait;
      return yield* wait.forGameAction("sellItem", "5 millis");
    }),
  );

  expect(result).toBe(false);
});

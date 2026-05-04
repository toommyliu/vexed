import { Cause, Effect, Exit } from "effect";
import { expect, test } from "vitest";
import { createScriptRuntimeApiProxy } from "./scriptRuntimeApi";

test("wraps nested service effects lazily", async () => {
  let wrappedEffects = 0;
  const api = createScriptRuntimeApiProxy(
    {
      world: {
        map: {
          getName: () => Effect.succeed("battleon"),
        },
      },
    },
    (effect) => {
      wrappedEffects += 1;
      return effect;
    },
    () => false,
  );

  const effect = api.world.map.getName();
  expect(wrappedEffects).toBe(0);
  await expect(Effect.runPromise(effect)).resolves.toBe("battleon");
  expect(wrappedEffects).toBe(1);
});

test("interrupts wrapped service effects when cancellation is observed at execution time", async () => {
  let cancelled = false;
  const api = createScriptRuntimeApiProxy(
    {
      player: {
        getLevel: () => Effect.succeed(42),
      },
    },
    (effect) => effect,
    () => cancelled,
  );

  const effect = api.player.getLevel();
  cancelled = true;

  const exit = await Effect.runPromiseExit(effect);

  expect(Exit.isFailure(exit)).toBe(true);
  if (Exit.isFailure(exit)) {
    expect(Cause.hasInterruptsOnly(exit.cause)).toBe(true);
  }
});

test("preserves non-effect values", () => {
  const api = createScriptRuntimeApiProxy(
    {
      local: {
        value: "ready",
      },
    },
    (effect) => effect,
    () => false,
  );

  expect(api.local.value).toBe("ready");
});

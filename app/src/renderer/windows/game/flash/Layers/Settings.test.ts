import { Effect, Layer } from "effect";
import { expect, test } from "vitest";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import { Settings, type SettingsShape } from "../Services/Settings";
import { SettingsLive } from "./Settings";

const withSettings = async <A>(
  body: (
    settings: SettingsShape,
    bridgeCalls: readonly string[],
  ) => Effect.Effect<A, unknown>,
): Promise<A> => {
  const bridgeCalls: string[] = [];
  const bridge = {
    call(path) {
      bridgeCalls.push(String(path));
      return Effect.void as never;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => undefined);
    },
  } satisfies BridgeShape;

  return await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const settings = yield* Settings;
        return yield* body(settings, bridgeCalls);
      }),
    ).pipe(
      Effect.provide(
        SettingsLive.pipe(Layer.provide(Layer.succeed(Bridge)(bridge))),
      ),
    ),
  );
};

test("anti-counter is disabled by default", async () => {
  const enabled = await withSettings((settings) =>
    settings.isAntiCounterEnabled(),
  );

  expect(enabled).toBe(false);
});

test("anti-counter state updates subscribers without bridge calls", async () => {
  const result = await withSettings((settings, bridgeCalls) =>
    Effect.gen(function* () {
      const states: boolean[] = [];
      const dispose = yield* settings.onState((state) => {
        states.push(state.antiCounterEnabled);
      });

      yield* settings.setAntiCounterEnabled(true);
      const enabled = yield* settings.isAntiCounterEnabled();
      yield* settings.setAntiCounterEnabled(false);
      const disabled = yield* settings.isAntiCounterEnabled();
      dispose();

      return { bridgeCalls: [...bridgeCalls], disabled, enabled, states };
    }),
  );

  expect(result).toEqual({
    bridgeCalls: [],
    disabled: false,
    enabled: true,
    states: [false, true, false],
  });
});

import { Effect, Layer } from "effect";
import { expect, test } from "vitest";
import { Jobs, type JobsShape, type PeriodicJobDefinition } from "../../jobs/Services/Jobs";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import {
  Settings,
  type SettingsShape,
  type SettingsState,
  type SettingsStateListener,
} from "../Services/Settings";
import { FlashJobPoliciesLive } from "./JobPolicies";

const defaultSettingsState = {
  collisionsEnabled: true,
  deathAdsVisible: true,
  effectsEnabled: true,
  enemyMagnetEnabled: false,
  frameRate: 24,
  infiniteRangeEnabled: false,
  lagKillerEnabled: false,
  otherPlayersVisible: true,
  provokeCellEnabled: false,
  skipCutscenesEnabled: false,
  walkSpeed: 8,
} satisfies SettingsState;

type Harness = {
  readonly definitions: Map<string, PeriodicJobDefinition>;
  readonly emitConnection: (status: ConnectionStatus) => void;
  readonly emitSettings: (state: SettingsState) => void;
  readonly settingsPatches: unknown[];
  readonly stops: string[];
};

const withJobPolicies = async <A>(
  initialState: SettingsState,
  body: (harness: Harness) => Effect.Effect<A, unknown>,
): Promise<A> => {
  const connectionHandlers = new Set<(status: ConnectionStatus) => void>();
  const definitions = new Map<string, PeriodicJobDefinition>();
  const settingsListeners = new Set<SettingsStateListener>();
  const settingsPatches: unknown[] = [];
  const stops: string[] = [];
  let currentState = initialState;

  const bridge = {
    call() {
      return Effect.void as never;
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection(handler) {
      connectionHandlers.add(handler);
      return Effect.succeed(() => {
        connectionHandlers.delete(handler);
      });
    },
  } satisfies BridgeShape;

  const jobs = {
    start() {
      return Effect.succeed(true);
    },
    startPeriodic() {
      return Effect.succeed(true);
    },
    startPeriodicJob(definition: PeriodicJobDefinition) {
      definitions.set(definition.key, definition);
      return Effect.succeed(true);
    },
    stop(key: string) {
      stops.push(key);
      definitions.delete(key);
      return Effect.succeed(true);
    },
    stopAll() {
      definitions.clear();
      return Effect.void;
    },
    isRunning(key: string) {
      return Effect.succeed(definitions.has(key));
    },
    getRunningKeys() {
      return Effect.succeed(Array.from(definitions.keys()).sort());
    },
  } satisfies JobsShape;

  const settings = {
    getState() {
      return Effect.succeed(currentState);
    },
    apply(patch: unknown) {
      settingsPatches.push(patch);
      return Effect.void;
    },
    onState(listener: SettingsStateListener) {
      settingsListeners.add(listener);
      listener(currentState);
      return Effect.succeed(() => {
        settingsListeners.delete(listener);
      });
    },
  } as unknown as SettingsShape;

  return await Effect.runPromise(
    Effect.scoped(
      body({
        definitions,
        emitConnection(status) {
          for (const handler of connectionHandlers) {
            handler(status);
          }
        },
        emitSettings(state) {
          currentState = state;
          for (const listener of settingsListeners) {
            listener(state);
          }
        },
        settingsPatches,
        stops,
      }),
    ).pipe(
      Effect.provide(
        FlashJobPoliciesLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              Layer.succeed(Bridge)(bridge),
              Layer.succeed(Jobs)(jobs),
              Layer.succeed(Settings)(settings),
            ),
          ),
        ),
      ),
    ),
  );
};

test("OnConnection applies current settings", async () => {
  const patches = await withJobPolicies(defaultSettingsState, (harness) =>
    Effect.gen(function* () {
      harness.emitConnection("OnConnection");
      yield* Effect.sleep("10 millis");
      return harness.settingsPatches;
    }),
  );

  expect(patches).toContainEqual(defaultSettingsState);
});

test("settings/apply periodic job is registered", async () => {
  const definition = await withJobPolicies(defaultSettingsState, (harness) =>
    Effect.gen(function* () {
      yield* Effect.yieldNow;
      return harness.definitions.get("settings/apply");
    }),
  );

  expect(definition).toMatchObject({
    key: "settings/apply",
    interval: "1 second",
    runOnStart: true,
    runWhen: "loggedIn",
  });
});

test("recurring settings action job starts when recurring settings are enabled", async () => {
  const recurringState = {
    ...defaultSettingsState,
    enemyMagnetEnabled: true,
  } satisfies SettingsState;

  const definition = await withJobPolicies(recurringState, (harness) =>
    Effect.gen(function* () {
      yield* Effect.sleep("10 millis");
      return harness.definitions.get("settings/actions");
    }),
  );

  expect(definition).toMatchObject({
    key: "settings/actions",
    interval: "500 millis",
    runOnStart: true,
    runWhen: "loggedIn",
    replace: false,
  });
});

test("recurring settings action job stops when recurring settings are disabled", async () => {
  const recurringState = {
    ...defaultSettingsState,
    infiniteRangeEnabled: true,
  } satisfies SettingsState;

  const stops = await withJobPolicies(recurringState, (harness) =>
    Effect.gen(function* () {
      yield* Effect.sleep("10 millis");
      harness.emitSettings(defaultSettingsState);
      yield* Effect.sleep("10 millis");
      return harness.stops;
    }),
  );

  expect(stops).toContain("settings/actions");
});

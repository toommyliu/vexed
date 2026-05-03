import { Effect, Layer } from "effect";
import type { Duration } from "effect";
import { Jobs } from "../../jobs/Services/Jobs";
import { Bridge } from "../Services/Bridge";
import { Settings } from "../Services/Settings";
import type { SettingsPatch, SettingsState } from "../Services/Settings";

const SETTINGS_ACTION_JOB_KEY = "settings/actions";
const SETTINGS_ACTION_INTERVAL: Duration.Input = "500 millis";
const SETTINGS_REAPPLY_JOB_KEY = "settings/apply";
const SETTINGS_REAPPLY_INTERVAL: Duration.Input = "1 second";

const hasRecurringSettingActions = (state: SettingsState): boolean =>
  state.enemyMagnetEnabled ||
  state.infiniteRangeEnabled ||
  state.provokeCellEnabled ||
  state.skipCutscenesEnabled;

const getRecurringSettingsPatch = (state: SettingsState): SettingsPatch => ({
  ...(state.enemyMagnetEnabled ? { enemyMagnetEnabled: true } : {}),
  ...(state.infiniteRangeEnabled ? { infiniteRangeEnabled: true } : {}),
  ...(state.provokeCellEnabled ? { provokeCellEnabled: true } : {}),
  ...(state.skipCutscenesEnabled ? { skipCutscenesEnabled: true } : {}),
});

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;
  const jobs = yield* Jobs;
  const settings = yield* Settings;
  const runFork = Effect.runForkWith(yield* Effect.services());

  const applyCurrentSettings = Effect.gen(function* () {
    const currentState = yield* settings.getState();
    yield* settings.apply(currentState);
  });

  const applyRecurringSettingActions = Effect.gen(function* () {
    const currentState = yield* settings.getState();
    if (!hasRecurringSettingActions(currentState)) {
      return;
    }

    yield* settings.apply(getRecurringSettingsPatch(currentState));
  });

  const disposeConnection = yield* bridge.onConnection((status) => {
    if (status === "OnConnection") {
      runFork(applyCurrentSettings);
    }
  });

  yield* Effect.addFinalizer(() => Effect.sync(disposeConnection));

  yield* jobs.startPeriodicJob({
    key: SETTINGS_REAPPLY_JOB_KEY,
    interval: SETTINGS_REAPPLY_INTERVAL,
    runOnStart: true,
    runWhen: "loggedIn",
    task: applyCurrentSettings,
  });

  const syncSettingsActionJob = (state: SettingsState) => {
    if (!hasRecurringSettingActions(state)) {
      return jobs.stop(SETTINGS_ACTION_JOB_KEY).pipe(Effect.asVoid);
    }

    return jobs.startPeriodicJob({
      key: SETTINGS_ACTION_JOB_KEY,
      interval: SETTINGS_ACTION_INTERVAL,
      runOnStart: true,
      runWhen: "loggedIn",
      replace: false,
      task: applyRecurringSettingActions,
    }).pipe(Effect.asVoid);
  };

  const disposeSettingsActionJob = yield* settings.onState((state) => {
    runFork(syncSettingsActionJob(state));
  });

  yield* Effect.addFinalizer(() => Effect.sync(disposeSettingsActionJob));
});

export const FlashJobPoliciesLive = Layer.effectDiscard(make);

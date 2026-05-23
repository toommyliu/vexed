import { Effect, Scope } from "effect";
import { SettingsIpcChannels } from "../../../shared/ipc";
import type {
  AppearancePatch,
  HotkeysPatch,
  PreferencesPatch,
} from "../../../shared/settings";
import { MainIpc } from "../MainIpc";
import { SettingsService } from "../../settings/SettingsService";

const requireRecord = (
  value: unknown,
  label: string,
): Record<string, unknown> => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`Invalid ${label}`);
  }

  return value as Record<string, unknown>;
};

export const registerSettingsIpcHandlers = (): Effect.Effect<
  void,
  never,
  MainIpc | SettingsService | Scope.Scope
> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;

    yield* ipc.handle(SettingsIpcChannels.get, () =>
      Effect.gen(function* () {
        const settings = yield* SettingsService;
        return yield* settings.get;
      }),
    );

    yield* ipc.handle(SettingsIpcChannels.updatePreferences, (_event, patch) =>
      Effect.gen(function* () {
        const settings = yield* SettingsService;
        return yield* settings.updatePreferences(
          requireRecord(patch, "preferences patch") as PreferencesPatch,
        );
      }),
    );

    yield* ipc.handle(SettingsIpcChannels.updateAppearance, (_event, patch) =>
      Effect.gen(function* () {
        const settings = yield* SettingsService;
        return yield* settings.updateAppearance(
          requireRecord(patch, "appearance patch") as AppearancePatch,
        );
      }),
    );

    yield* ipc.handle(SettingsIpcChannels.updateHotkeys, (_event, patch) =>
      Effect.gen(function* () {
        const settings = yield* SettingsService;
        return yield* settings.updateHotkeys(
          requireRecord(patch, "hotkeys patch") as HotkeysPatch,
        );
      }),
    );

    yield* ipc.handle(SettingsIpcChannels.resetAppearance, () =>
      Effect.gen(function* () {
        const settings = yield* SettingsService;
        return yield* settings.resetAppearance;
      }),
    );

    yield* ipc.handle(SettingsIpcChannels.resetHotkeys, () =>
      Effect.gen(function* () {
        const settings = yield* SettingsService;
        return yield* settings.resetHotkeys;
      }),
    );
  });

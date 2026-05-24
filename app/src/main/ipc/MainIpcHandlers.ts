import { Effect, Scope } from "effect";
import type { WindowEffectRunner } from "../window/WindowService";
import { registerAccountManagerIpcHandlers } from "./methods/accounts";
import { registerArmyIpcHandlers } from "./methods/army";
import { registerCombatProfilesIpcHandlers } from "./methods/combatProfiles";
import { registerEnvironmentIpcHandlers } from "./methods/environment";
import { registerFastTravelsIpcHandlers } from "./methods/fastTravels";
import { registerFollowerIpcHandlers } from "./methods/follower";
import { registerLoaderGrabberIpcHandlers } from "./methods/loaderGrabber";
import { registerObservabilityIpcHandlers } from "./methods/observability";
import { registerPacketsIpcHandlers } from "./methods/packets";
import { registerScriptingIpcHandlers } from "./methods/scripting";
import { registerSettingsIpcHandlers } from "./methods/settings";
import { registerUpdatesIpcHandlers } from "./methods/updates";
import { registerWindowIpcHandlers } from "./methods/window";
import { AccountManagerRepository } from "../persistence/accounts/AccountRepository";
import { Observability } from "../app/MainObservability";
import { CombatProfileRepository } from "../persistence/combatProfiles/CombatProfileRepository";
import { FastTravelRepository } from "../persistence/fastTravels/FastTravelRepository";
import { MainIpc } from "./MainIpc";
import { SettingsService } from "../settings/SettingsService";
import { UpdateChecker } from "../updates/Updates";
import { WorkspaceFiles } from "../workspace/WorkspaceFiles";
import { WindowService } from "../window/WindowService";

export const installMainIpcHandlers = (
  runWindowEffect: WindowEffectRunner,
): Effect.Effect<
  void,
  never,
  | AccountManagerRepository
  | CombatProfileRepository
  | FastTravelRepository
  | MainIpc
  | Observability
  | Scope.Scope
  | SettingsService
  | UpdateChecker
  | WindowService
  | WorkspaceFiles
> =>
  Effect.gen(function* () {
    yield* registerScriptingIpcHandlers();
    yield* registerArmyIpcHandlers();
    yield* registerSettingsIpcHandlers();
    yield* registerAccountManagerIpcHandlers(runWindowEffect);
    yield* registerCombatProfilesIpcHandlers();
    yield* registerObservabilityIpcHandlers();
    yield* registerUpdatesIpcHandlers();
    yield* registerWindowIpcHandlers();
    yield* registerEnvironmentIpcHandlers(runWindowEffect);
    yield* registerFastTravelsIpcHandlers(runWindowEffect);
    yield* registerFollowerIpcHandlers(runWindowEffect);
    yield* registerPacketsIpcHandlers(runWindowEffect);
    yield* registerLoaderGrabberIpcHandlers(runWindowEffect);
  });

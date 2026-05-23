import { Effect, Layer, ServiceMap } from "effect";
import type { ScriptExecutePayload } from "../../shared/ipc";
import {
  assertValidArmyConfigName,
  normalizeArmyConfig,
  type ArmyConfigPayload,
} from "../../shared/army";
import { MainEnvironment } from "../app/MainEnvironment";
import { Persistence } from "../persistence/Persistence";
import { readScriptPayload } from "./scripting";

export interface WorkspaceFilesShape {
  readonly scriptsDir: string;
  readonly flashPluginPath: string | null;
  readonly readScript: (
    path: string,
  ) => Effect.Effect<ScriptExecutePayload, Error>;
  readonly readArmyConfig: (
    configName: string,
  ) => Effect.Effect<ArmyConfigPayload, Error>;
}

export class WorkspaceFiles extends ServiceMap.Service<
  WorkspaceFiles,
  WorkspaceFilesShape
>()("main/WorkspaceFiles") {}

export const WorkspaceFilesLive = Layer.effect(WorkspaceFiles)(
  Effect.gen(function* () {
    const env = yield* MainEnvironment;
    const persistence = yield* Persistence;

    return {
      scriptsDir: env.scriptsDir,
      flashPluginPath: env.flashPluginPath,
      readScript: (path) =>
        Effect.tryPromise({
          try: () => readScriptPayload(env.scriptsDir, path),
          catch: (cause) =>
            cause instanceof Error ? cause : new Error(String(cause)),
        }),
      readArmyConfig: (configNameInput) =>
        Effect.gen(function* () {
          const configName = yield* Effect.try({
            try: () => assertValidArmyConfigName(configNameInput),
            catch: (cause) =>
              cause instanceof Error ? cause : new Error(String(cause)),
          });
          const path = env.armyConfigPath(configName);
          const raw = yield* persistence.readYaml(path).pipe(
            Effect.flatMap((result) => {
              if (result.status === "missing") {
                return Effect.fail(new Error(`Army config not found: ${path}`));
              }
              if (result.status === "malformed") {
                return Effect.fail(
                  new Error(`Army config could not be parsed: ${path}`),
                );
              }
              return Effect.succeed(result.value);
            }),
          );
          return normalizeArmyConfig(configName, raw);
        }),
    };
  }),
);

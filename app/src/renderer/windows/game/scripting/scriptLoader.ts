import { Effect } from "effect";
import { ScriptLoadError } from "./Errors";
import { scriptEffectStd } from "./ScriptEffectStd";
import {
  makeScriptRuntimeStd,
  type ScriptRuntimeStdBinding,
} from "./ScriptRuntimeStd";
import type { ScriptMain } from "./ScriptApi";

interface CommonJsModule {
  exports: unknown;
}

type ScriptRequire = (specifier: string) => unknown;

export interface LoadedScriptModule {
  readonly main: ScriptMain;
  readonly runtime: ScriptRuntimeStdBinding;
}

const isGeneratorFunction = (value: unknown): value is ScriptMain =>
  typeof value === "function" &&
  value.constructor?.name === "GeneratorFunction";

const sanitizeSourceUrl = (sourceName: string): string =>
  `__script__/${sourceName.replace(/[^a-zA-Z0-9._/-]/g, "_")}`;

const createScriptRequire =
  (sourceName: string, runtime: ScriptRuntimeStdBinding): ScriptRequire =>
  (specifier) => {
    if (specifier === "effect") {
      return scriptEffectStd;
    }

    if (specifier === "vexed") {
      return runtime.module;
    }

    throw new ScriptLoadError({
      sourceName,
      message: `Unsupported script import: ${specifier}`,
      cause: specifier,
    });
  };

export const loadScriptModule = (
  source: string,
  sourceName: string,
): Effect.Effect<LoadedScriptModule, ScriptLoadError> =>
  Effect.gen(function* () {
    const module: CommonJsModule = { exports: {} };
    const runtime = makeScriptRuntimeStd(sourceName);
    const scriptRequire = createScriptRequire(sourceName, runtime);

    yield* Effect.try({
      try: () => {
        const evaluate = new Function(
          "module",
          "exports",
          "require",
          `"use strict";\n${source}\n//# sourceURL=${sanitizeSourceUrl(
            sourceName,
          )}`,
        );
        evaluate(module, module.exports, scriptRequire);
      },
      catch: (cause) =>
        cause instanceof ScriptLoadError
          ? cause
          : new ScriptLoadError({
              sourceName,
              message: "Failed to evaluate script",
              cause,
            }),
    });

    if (!isGeneratorFunction(module.exports)) {
      return yield* new ScriptLoadError({
        sourceName,
        message:
          'Script must assign a generator function to module.exports, for example: const { features, script, api } = require("vexed"); module.exports = function* run() { script.log("ready") }',
        cause: module.exports,
      });
    }

    return {
      main: module.exports,
      runtime,
    };
  });

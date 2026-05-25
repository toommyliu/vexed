import { Effect } from "effect";
import { ScriptLoadError } from "./Errors";
import { scriptEffectStd } from "./ScriptEffectStd";
import type { ScriptMain } from "./ScriptApi";

interface CommonJsModule {
  exports: unknown;
}

type ScriptRequire = (specifier: string) => unknown;

const isGeneratorFunction = (value: unknown): value is ScriptMain =>
  typeof value === "function" &&
  value.constructor?.name === "GeneratorFunction";

const sanitizeSourceUrl = (sourceName: string): string =>
  `__script__/${sourceName.replace(/[^a-zA-Z0-9._/-]/g, "_")}`;

const createScriptRequire =
  (sourceName: string): ScriptRequire =>
  (specifier) => {
    if (specifier === "effect") {
      return scriptEffectStd;
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
): Effect.Effect<ScriptMain, ScriptLoadError> =>
  Effect.gen(function* () {
    const module: CommonJsModule = { exports: {} };
    const scriptRequire = createScriptRequire(sourceName);

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
          "Script must assign a generator function to module.exports, for example: module.exports = function* run({ api, script, features }) { ... }",
        cause: module.exports,
      });
    }

    return module.exports;
  });

import { Effect } from "effect";
import { ScriptCustomConditionError } from "../Errors";
import {
  type CustomConditionHandler,
  type ScriptCommandError,
  type ScriptExecutionContext,
} from "../Types";
import { createCustomScriptRuntimeApi } from "./customCommand";

const failCustomCondition = (
  sourceName: string,
  condition: string,
  cause: unknown,
): Effect.Effect<never, ScriptCustomConditionError> =>
  Effect.fail(
    new ScriptCustomConditionError({
      sourceName,
      condition,
      cause,
    }),
  );

export const makeCustomConditionEvaluator =
  (name: string, handler: CustomConditionHandler) =>
  (
    context: ScriptExecutionContext,
    args: ReadonlyArray<unknown>,
  ): Effect.Effect<boolean, ScriptCommandError> => {
    const sourceName = context.sourceName;
    const customContext = {
      args,
      sourceName,
      api: createCustomScriptRuntimeApi(context),
      log: (message: string) => {
        console.info(`[script:${sourceName}:${name}] ${message}`);
      },
    };

    return Effect.tryPromise({
      try: async () => await handler(customContext),
      catch: (cause) =>
        new ScriptCustomConditionError({
          sourceName,
          condition: name,
          cause,
        }),
    }).pipe(
      Effect.flatMap((result) =>
        typeof result === "boolean"
          ? Effect.succeed(result)
          : failCustomCondition(
              sourceName,
              name,
              "custom condition returned a non-boolean value",
            ),
      ),
    );
  };

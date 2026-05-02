import { Cause, Effect } from "effect";
import { ScriptCustomConditionError } from "../Errors";
import {
  type CustomConditionHandler,
  type ScriptCommandError,
  type ScriptDiagnosticInput,
  type ScriptExecutionContext,
} from "../Types";
import { ScriptEffect } from "../scriptEffect";
import { makeScriptCancellationError } from "../scriptAsyncScope";
import { makeScriptFeedback } from "../scriptFeedback";
import {
  createCustomScriptEffectRuntimeApi,
  createCustomScriptRuntimeApi,
} from "./customCommand";

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

const isGenerator = <A>(
  value: unknown,
): value is Generator<Effect.Yieldable<any, any, any, never>, A, never> =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { readonly next?: unknown }).next === "function" &&
  typeof (value as { readonly throw?: unknown }).throw === "function";

const isGeneratorFunction = (value: unknown): boolean =>
  typeof value === "function" &&
  value.constructor?.name === "GeneratorFunction";

export const makeCustomConditionEvaluator =
  (name: string, handler: CustomConditionHandler) =>
  (
    context: ScriptExecutionContext,
    args: ReadonlyArray<unknown>,
  ): Effect.Effect<boolean, ScriptCommandError> => {
    const sourceName = context.sourceName;
    const feedbackSource = { command: name };
    const customContext = {
      args,
      sourceName,
      api: createCustomScriptRuntimeApi(context),
      Effect: ScriptEffect,
      signal: context.signal,
      isCancelled: context.isCancelled,
      log: (message: string) => {
        console.info(`[script:${sourceName}:${name}] ${message}`);
      },
      feedback: makeScriptFeedback(context, feedbackSource),
      notify: (diagnostic: ScriptDiagnosticInput) => {
        void context.runApiEffect(
          context.notify({
            ...diagnostic,
            command: diagnostic.command ?? feedbackSource.command,
          }),
        );
      },
    };
    const effectContext = {
      ...customContext,
      api: createCustomScriptEffectRuntimeApi(context),
    };

    const runHandler: Effect.Effect<
      boolean,
      ScriptCustomConditionError,
      never
    > = isGeneratorFunction(handler)
      ? Effect.try({
          try: () =>
            handler(effectContext) as Generator<
              Effect.Yieldable<any, any, any, never>,
              boolean,
              never
            >,
          catch: (cause) =>
            new ScriptCustomConditionError({
              sourceName,
              condition: name,
              cause,
            }),
        }).pipe(
          Effect.flatMap((result) =>
            isGenerator<boolean>(result)
              ? Effect.gen(() => result).pipe(
                  Effect.catchCause((cause) =>
                    Cause.hasInterruptsOnly(cause)
                      ? Effect.failCause(cause)
                      : Effect.fail(
                          new ScriptCustomConditionError({
                            sourceName,
                            condition: name,
                            cause,
                          }),
                        ),
                  ),
                )
              : Effect.succeed(result as boolean),
          ),
        )
      : Effect.tryPromise({
          try: async (signal) => {
            if (signal.aborted || context.isCancelled()) {
              throw makeScriptCancellationError();
            }

            return await (handler(customContext) as boolean | Promise<boolean>);
          },
          catch: (cause) =>
            new ScriptCustomConditionError({
              sourceName,
              condition: name,
              cause,
            }),
        });

    return runHandler.pipe(
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

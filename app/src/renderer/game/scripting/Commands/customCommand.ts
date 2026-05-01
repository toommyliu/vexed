import { Cause, Effect } from "effect";
import {
  ScriptCustomCommandError,
  ScriptInvalidArgumentError,
} from "../Errors";
import {
  ScriptCommandResult,
  type CustomCommandHandler,
  type CustomCommandResult,
  type CustomCommandRuntimeApi,
  type CustomScriptEffectRuntimeApi,
  type CustomScriptRuntimeApi,
  type ScriptCommandHandler,
  type ScriptExecutionContext,
  type ScriptInstruction,
} from "../Types";
import { ScriptEffect } from "../scriptEffect";
import { makeScriptCancellationError } from "../scriptAsyncScope";
import {
  createScriptRuntimeApiProxy,
  type AnyEffect,
} from "../scriptRuntimeApi";

export const CUSTOM_COMMAND_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export const isValidCustomCommandName = (name: string): boolean =>
  CUSTOM_COMMAND_NAME_PATTERN.test(name);

export const normalizeCustomCommandName = (name: string): string => name.trim();

export const assertValidCustomCommandName = (
  command: string,
  name: string,
): string => {
  const normalized = normalizeCustomCommandName(name);
  if (!isValidCustomCommandName(normalized)) {
    throw new Error(
      `cmd.${command}: name must match ${CUSTOM_COMMAND_NAME_PATTERN.source}`,
    );
  }

  return normalized;
};

export const validateCustomCommandName = (
  context: ScriptExecutionContext,
  command: string,
  name: string,
) => {
  const normalized = normalizeCustomCommandName(name);
  if (!isValidCustomCommandName(normalized)) {
    return Effect.fail(
      new ScriptInvalidArgumentError({
        sourceName: context.sourceName,
        command,
        message: `name must match ${CUSTOM_COMMAND_NAME_PATTERN.source}`,
      }),
    );
  }

  return Effect.succeed(normalized);
};

export const protectBuiltinCommandName = (
  context: ScriptExecutionContext,
  command: string,
  name: string,
  builtinCommandNames: ReadonlySet<string>,
) =>
  builtinCommandNames.has(name)
    ? Effect.fail(
        new ScriptInvalidArgumentError({
          sourceName: context.sourceName,
          command,
          message: `built-in command cannot be modified: ${name}`,
        }),
      )
    : Effect.succeed(name);

// Only allow a subset of the packet API.

type RuntimePacketApiSource = Pick<
  ScriptExecutionContext["packet"],
  | "sendServer"
  | "sendClient"
  | "onExtensionResponse"
  | "packetFromServer"
  | "packetFromClient"
>;

type RuntimeApiSource = Omit<
  Pick<
    ScriptExecutionContext,
    | "auth"
    | "autoZone"
    | "bank"
    | "bridge"
    | "combat"
    | "drops"
    | "house"
    | "inventory"
    | "jobs"
    | "packet"
    | "player"
    | "quests"
    | "settings"
    | "shops"
    | "tempInventory"
    | "world"
  >,
  "packet"
> & { readonly packet: RuntimePacketApiSource };

const createRuntimeApiProxy = (
  source: unknown,
  runEffect: (effect: AnyEffect) => Promise<unknown>,
  isCancelled: () => boolean,
): unknown => {
  if (typeof source !== "object" || source === null) {
    return source;
  }

  const nestedProxies = new Map<PropertyKey, unknown>();

  return new Proxy(source as Record<PropertyKey, unknown>, {
    get(target, property, receiver) {
      if (property === "then") {
        return undefined;
      }

      const value = Reflect.get(target, property, receiver);
      if (typeof value === "function") {
        return (...args: readonly unknown[]) => {
          if (isCancelled()) {
            return Promise.reject(makeScriptCancellationError());
          }

          const result = value.apply(target, args);
          return Effect.isEffect(result)
            ? runEffect(result as unknown as AnyEffect)
            : result;
        };
      }

      if (Effect.isEffect(value)) {
        if (isCancelled()) {
          return Promise.reject(makeScriptCancellationError());
        }

        return runEffect(value as unknown as AnyEffect);
      }

      if (typeof value === "object" && value !== null) {
        const cached = nestedProxies.get(property);
        if (cached !== undefined) {
          return cached;
        }

        const proxy = createRuntimeApiProxy(value, runEffect, isCancelled);
        nestedProxies.set(property, proxy);
        return proxy;
      }

      return value;
    },
  });
};

export const createCustomScriptRuntimeApi = (
  context: ScriptExecutionContext,
): CustomScriptRuntimeApi => {
  const source: RuntimeApiSource = {
    auth: context.auth,
    autoZone: context.autoZone,
    bank: context.bank,
    bridge: context.bridge,
    combat: context.combat,
    drops: context.drops,
    house: context.house,
    inventory: context.inventory,
    jobs: context.jobs,
    packet: {
      sendServer: context.packet.sendServer,
      sendClient: context.packet.sendClient,
      onExtensionResponse: context.packet.onExtensionResponse,
      packetFromServer: context.packet.packetFromServer,
      packetFromClient: context.packet.packetFromClient,
    } satisfies RuntimePacketApiSource,
    player: context.player,
    quests: context.quests,
    settings: context.settings,
    shops: context.shops,
    tempInventory: context.tempInventory,
    world: context.world,
  };

  return createRuntimeApiProxy(
    source,
    (effect) => context.runApiEffect(effect as Effect.Effect<unknown, unknown>),
    context.isCancelled,
  ) as CustomScriptRuntimeApi;
};

export const createCustomScriptEffectRuntimeApi = (
  context: ScriptExecutionContext,
): CustomScriptEffectRuntimeApi => {
  const source: RuntimeApiSource = {
    auth: context.auth,
    autoZone: context.autoZone,
    bank: context.bank,
    bridge: context.bridge,
    combat: context.combat,
    drops: context.drops,
    house: context.house,
    inventory: context.inventory,
    jobs: context.jobs,
    packet: {
      sendServer: context.packet.sendServer,
      sendClient: context.packet.sendClient,
      onExtensionResponse: context.packet.onExtensionResponse,
      packetFromServer: context.packet.packetFromServer,
      packetFromClient: context.packet.packetFromClient,
    } satisfies RuntimePacketApiSource,
    player: context.player,
    quests: context.quests,
    settings: context.settings,
    shops: context.shops,
    tempInventory: context.tempInventory,
    world: context.world,
  };

  return createScriptRuntimeApiProxy(
    source,
    (effect) =>
      context.run(effect as Effect.Effect<unknown, unknown>) as AnyEffect,
    context.isCancelled,
  ) as CustomScriptEffectRuntimeApi;
};

export const createCustomCommandRuntimeApi = (
  context: ScriptExecutionContext,
): CustomCommandRuntimeApi => createCustomScriptRuntimeApi(context);

const customResult = {
  Continue: { _tag: "Continue" } as const,
  SkipNext: { _tag: "SkipNext" } as const,
  JumpToIndex: (index: number) => ({ _tag: "JumpToIndex", index }) as const,
  JumpToLabel: (label: string) => ({ _tag: "JumpToLabel", label }) as const,
  Stop: { _tag: "Stop" } as const,
};

const failCustomCommand = (
  sourceName: string,
  command: string,
  cause: unknown,
): Effect.Effect<never, ScriptCustomCommandError> =>
  Effect.fail(
    new ScriptCustomCommandError({
      sourceName,
      command,
      cause,
    }),
  );

const isCustomCommandResult = (value: unknown): value is CustomCommandResult =>
  typeof value === "object" &&
  value !== null &&
  "_tag" in value &&
  typeof (value as { readonly _tag: unknown })._tag === "string";

const describeCustomCommandResultType = (value: unknown): string => {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  return typeof value;
};

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

const toScriptCommandResult = (
  sourceName: string,
  command: string,
  instruction: ScriptInstruction,
  result: void | CustomCommandResult,
): Effect.Effect<ScriptCommandResult, ScriptCustomCommandError> => {
  if (result === undefined) {
    return Effect.succeed(ScriptCommandResult.Continue);
  }

  if (!isCustomCommandResult(result)) {
    return failCustomCommand(
      sourceName,
      command,
      `custom command returned ${describeCustomCommandResultType(
        result,
      )}; return nothing or one of the command control helpers. Use cmd.register_condition for boolean checks.`,
    );
  }

  switch (result._tag) {
    case "Continue":
      return Effect.succeed(ScriptCommandResult.Continue);
    case "SkipNext":
      return Effect.succeed(
        ScriptCommandResult.JumpToIndex(instruction.index + 2),
      );
    case "JumpToIndex":
      return Number.isFinite(result.index) && result.index >= 0
        ? Effect.succeed(
            ScriptCommandResult.JumpToIndex(Math.trunc(result.index)),
          )
        : failCustomCommand(
            sourceName,
            command,
            "jump index must be non-negative",
          );
    case "JumpToLabel":
      return result.label.trim() === ""
        ? failCustomCommand(
            sourceName,
            command,
            "label must be a non-empty string",
          )
        : Effect.succeed(ScriptCommandResult.JumpToLabel(result.label));
    case "Stop":
      return Effect.succeed(ScriptCommandResult.Stop);
  }
};

export const makeCustomCommandHandler =
  (name: string, handler: CustomCommandHandler): ScriptCommandHandler =>
  (context, instruction) => {
    const sourceName = context.sourceName;
    const customContext = {
      args: instruction.args,
      sourceName,
      instruction,
      api: createCustomScriptRuntimeApi(context),
      Effect: ScriptEffect,
      signal: context.signal,
      isCancelled: context.isCancelled,
      continue: () => customResult.Continue,
      skipNext: () => customResult.SkipNext,
      gotoLabel: (label: string) => customResult.JumpToLabel(label),
      jumpToIndex: (index: number) => customResult.JumpToIndex(index),
      stop: () => customResult.Stop,
      log: (message: string) => {
        console.info(`[script:${sourceName}:${name}] ${message}`);
      },
    };
    const effectContext = {
      ...customContext,
      api: createCustomScriptEffectRuntimeApi(context),
    };

    const runHandler: Effect.Effect<
      void | CustomCommandResult,
      ScriptCustomCommandError,
      never
    > = isGeneratorFunction(handler)
      ? Effect.try({
          try: () =>
            handler(effectContext) as Generator<
              Effect.Yieldable<any, any, any, never>,
              void | CustomCommandResult,
              never
            >,
          catch: (cause) =>
            new ScriptCustomCommandError({
              sourceName,
              command: name,
              cause,
            }),
        }).pipe(
          Effect.flatMap((result) =>
            isGenerator<void | CustomCommandResult>(result)
              ? Effect.gen(() => result).pipe(
                  Effect.catchCause((cause) =>
                    Cause.hasInterruptsOnly(cause)
                      ? Effect.failCause(cause)
                      : Effect.fail(
                          new ScriptCustomCommandError({
                            sourceName,
                            command: name,
                            cause,
                          }),
                        ),
                  ),
                )
              : Effect.succeed(result as void | CustomCommandResult),
          ),
        )
      : Effect.tryPromise({
          try: async (signal) => {
            if (signal.aborted || context.isCancelled()) {
              throw makeScriptCancellationError();
            }

            return await (handler(customContext) as
              | void
              | CustomCommandResult
              | Promise<void | CustomCommandResult>);
          },
          catch: (cause) =>
            new ScriptCustomCommandError({
              sourceName,
              command: name,
              cause,
            }),
        });

    return runHandler.pipe(
      Effect.flatMap((result) =>
        toScriptCommandResult(sourceName, name, instruction, result),
      ),
    );
  };

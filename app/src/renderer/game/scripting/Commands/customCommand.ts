import { Effect } from "effect";
import {
  ScriptCustomCommandError,
  ScriptInvalidArgumentError,
} from "../Errors";
import {
  ScriptCommandResult,
  type CustomCommandHandler,
  type CustomCommandResult,
  type CustomCommandRuntimeApi,
  type ScriptCommandHandler,
  type ScriptExecutionContext,
  type ScriptInstruction,
} from "../Types";

export const CUSTOM_COMMAND_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;
type AnyEffect = Effect.Effect<unknown, unknown, any>;

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
          const result = value.apply(target, args);
          return Effect.isEffect(result) ? runEffect(result) : result;
        };
      }

      if (Effect.isEffect(value)) {
        return runEffect(value);
      }

      if (typeof value === "object" && value !== null) {
        const cached = nestedProxies.get(property);
        if (cached !== undefined) {
          return cached;
        }

        const proxy = createRuntimeApiProxy(value, runEffect);
        nestedProxies.set(property, proxy);
        return proxy;
      }

      return value;
    },
  });
};

export const createCustomCommandRuntimeApi = (
  context: ScriptExecutionContext,
): CustomCommandRuntimeApi => {
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

  return createRuntimeApiProxy(source, (effect) =>
    Effect.runPromise(context.run(effect as Effect.Effect<unknown, unknown>)),
  ) as CustomCommandRuntimeApi;
};

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
      "custom command returned an invalid control result",
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
      api: createCustomCommandRuntimeApi(context),
      continue: () => customResult.Continue,
      skipNext: () => customResult.SkipNext,
      gotoLabel: (label: string) => customResult.JumpToLabel(label),
      jumpToIndex: (index: number) => customResult.JumpToIndex(index),
      stop: () => customResult.Stop,
      log: (message: string) => {
        console.info(`[script:${sourceName}:${name}] ${message}`);
      },
    };

    return Effect.tryPromise({
      try: async () => await handler(customContext),
      catch: (cause) =>
        new ScriptCustomCommandError({
          sourceName,
          command: name,
          cause,
        }),
    }).pipe(
      Effect.flatMap((result) =>
        toScriptCommandResult(sourceName, name, instruction, result),
      ),
    );
  };

import { Cause, Effect, Fiber, Layer, Option, Ref, Semaphore } from "effect";
import { type ScriptExecutePayload } from "../ipc";
import { Auth } from "../../flash/Services/Auth";
import { AutoZone } from "../../flash/Services/AutoZone";
import { AutoRelogin } from "../../features/Services/AutoRelogin";
import { Bank } from "../../flash/Services/Bank";
import { Bridge } from "../../flash/Services/Bridge";
import { Combat } from "../../flash/Services/Combat";
import { Drops } from "../../flash/Services/Drops";
import { House } from "../../flash/Services/House";
import { Inventory } from "../../flash/Services/Inventory";
import { Jobs } from "../../flash/Services/Jobs";
import { Packet } from "../../flash/Services/Packet";
import { PacketDomain } from "../../flash/Services/PacketDomain";
import { Player } from "../../flash/Services/Player";
import { Quests } from "../../flash/Services/Quests";
import { Settings } from "../../flash/Services/Settings";
import { Shops } from "../../flash/Services/Shops";
import { TempInventory } from "../../flash/Services/TempInventory";
import { World } from "../../flash/Services/World";
import {
  ScriptCustomConditionError,
  ScriptCompileError,
  ScriptDuplicateLabelError,
  ScriptInvalidArgumentError,
  ScriptInvalidControlFlowError,
  ScriptLabelNotFoundError,
  ScriptNotReadyError,
  ScriptUnknownCommandError,
} from "../Errors";
import { createScriptDsl, scriptCommandHandlers } from "../Commands";
import {
  createCustomCondition,
  type ScriptCommandApi,
  type ScriptCondition,
} from "../Commands/commandDsl";
import { ScriptRunner } from "../Services/ScriptRunner";
import type {
  RunningScriptCommand,
  ScriptRunnerShape,
} from "../Services/ScriptRunner";
import {
  ScriptCommandResult,
  type CustomCommandHandler,
  type CustomConditionHandler,
  type ScriptCommandError,
  type ScriptCommandHandler,
  type ScriptDiagnostic,
  type ScriptDiagnosticInput,
  type ScriptExecutionContext,
  type ScriptInstruction,
  type ScriptProgram,
} from "../Types";
import {
  createCustomScriptEffectRuntimeApi,
  createCustomScriptRuntimeApi,
  makeCustomCommandHandler,
  protectBuiltinCommandName,
} from "../Commands/customCommand";
import { makeCustomConditionEvaluator } from "../Commands/customCondition";
import { ScriptEffect } from "../scriptEffect";
import {
  type ScriptAsyncScope,
  makeScriptAsyncScope,
  makeScriptCancellationError,
} from "../scriptAsyncScope";
import {
  createScriptRuntimeApiProxy,
  type AnyEffect,
} from "../scriptRuntimeApi";
import { makeScriptFeedback } from "../scriptFeedback";

type ConditionalBlockFrame = {
  readonly ifIndex: number;
  readonly elseIndex?: number;
};

type ActiveScript = {
  readonly token: number;
  readonly fiber: Fiber.Fiber<void, unknown>;
  readonly scope: ScriptAsyncScope;
};

type LaunchFiber = Fiber.Fiber<unknown, unknown>;

const BUILTIN_SCRIPT_API_NAMES = new Set(
  Object.keys(createScriptDsl(() => {})),
);
const MAX_SCRIPT_DIAGNOSTICS = 50;

type CustomConditionEvaluator = (
  context: ScriptExecutionContext,
  args: ReadonlyArray<unknown>,
) => Effect.Effect<boolean, ScriptCommandError>;

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

const scriptNameFromPayload = (payload: ScriptExecutePayload): string => {
  if (payload.name && payload.name.trim() !== "") {
    return payload.name;
  }

  if (payload.path && payload.path.trim() !== "") {
    return payload.path;
  }

  return "inline-script";
};

const annotateControlFlow = (
  sourceName: string,
  instructions: ReadonlyArray<ScriptInstruction>,
): ReadonlyArray<ScriptInstruction> => {
  const annotated = [...instructions];
  const stack: Array<ConditionalBlockFrame> = [];

  const updateInstruction = (
    index: number,
    controlFlow: NonNullable<ScriptInstruction["controlFlow"]>,
  ) => {
    const instruction = annotated[index];
    if (!instruction) {
      return;
    }

    annotated[index] = {
      ...instruction,
      controlFlow: {
        ...instruction.controlFlow,
        ...controlFlow,
      },
    } satisfies ScriptInstruction;
  };

  for (const instruction of annotated) {
    switch (instruction.name) {
      case "if":
      case "if_all":
      case "if_any":
        stack.push({ ifIndex: instruction.index });
        break;
      case "else": {
        const frame = stack[stack.length - 1];
        if (!frame) {
          throw new ScriptInvalidControlFlowError({
            sourceName,
            instruction: instruction.name,
            instructionIndex: instruction.index,
            message: "cmd.else() must be paired with a previous cmd.if()",
          });
        }

        if (frame.elseIndex !== undefined) {
          throw new ScriptInvalidControlFlowError({
            sourceName,
            instruction: instruction.name,
            instructionIndex: instruction.index,
            message: "cmd.if() blocks can only contain one cmd.else()",
          });
        }

        stack[stack.length - 1] = {
          ...frame,
          elseIndex: instruction.index,
        };

        updateInstruction(frame.ifIndex, {
          falseJumpIndex: instruction.index + 1,
        });
        break;
      }
      case "end_if": {
        const frame = stack.pop();
        if (!frame) {
          throw new ScriptInvalidControlFlowError({
            sourceName,
            instruction: instruction.name,
            instructionIndex: instruction.index,
            message: "cmd.end_if() must be paired with a previous cmd.if()",
          });
        }

        const nextIndex = instruction.index + 1;
        if (frame.elseIndex === undefined) {
          updateInstruction(frame.ifIndex, {
            falseJumpIndex: nextIndex,
          });
        } else {
          updateInstruction(frame.elseIndex, {
            endJumpIndex: nextIndex,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  const dangling = stack.pop();
  if (dangling) {
    throw new ScriptInvalidControlFlowError({
      sourceName,
      instruction: "if",
      instructionIndex: dangling.ifIndex,
      message: "cmd.if() must be closed with cmd.end_if()",
    });
  }

  return annotated;
};

const collectCustomConditionNames = (
  value: unknown,
  names: Set<string>,
): void => {
  if (typeof value !== "object" || value === null) {
    return;
  }

  const condition = value as Partial<ScriptCondition>;
  switch (condition._tag) {
    case "Custom":
      if (typeof condition.name === "string" && condition.name.trim() !== "") {
        names.add(condition.name);
      }
      return;
    case "All":
    case "Any":
      if (Array.isArray(condition.conditions)) {
        for (const child of condition.conditions) {
          collectCustomConditionNames(child, names);
        }
      }
      return;
    case "Not":
      collectCustomConditionNames(condition.condition, names);
      return;
    default:
      return;
  }
};

const instructionCustomConditionNames = (
  instruction: ScriptInstruction,
): ReadonlySet<string> => {
  const names = new Set<string>();
  for (const arg of instruction.args) {
    collectCustomConditionNames(arg, names);
  }
  return names;
};

const compileProgram = (
  source: string,
  sourceName: string,
): Effect.Effect<
  ScriptProgram,
  ScriptCompileError | ScriptDuplicateLabelError | ScriptInvalidControlFlowError
> =>
  Effect.try({
    try: () => {
      const instructions: Array<ScriptInstruction> = [];
      const recordInstruction = (
        name: string,
        args: ReadonlyArray<unknown>,
      ) => {
        instructions.push({
          name,
          args: [...args],
          index: instructions.length,
        });
      };
      const staticCmd = createScriptDsl(recordInstruction);
      const declaredCustomConditions = new Set<string>();
      const cmdProxy = new Proxy(staticCmd as Record<string, unknown>, {
        get(target, property, receiver) {
          if (property === "then") {
            return undefined;
          }

          if (typeof property !== "string") {
            return Reflect.get(target, property, receiver);
          }

          const value = Reflect.get(target, property, receiver);
          if (value !== undefined) {
            if (
              property === "register_condition" &&
              typeof value === "function"
            ) {
              return (...args: ReadonlyArray<unknown>) => {
                const result = Reflect.apply(value, target, args);
                const name = args[0];
                if (typeof name === "string") {
                  declaredCustomConditions.add(name.trim());
                }
                return result;
              };
            }

            return value;
          }

          if (declaredCustomConditions.has(property)) {
            return (...args: ReadonlyArray<unknown>) =>
              createCustomCondition(property, args);
          }

          return (...args: ReadonlyArray<unknown>) => {
            recordInstruction(property, args);
          };
        },
      });

      const evaluate = new Function("cmd", source) as (
        cmd: ScriptCommandApi,
      ) => void;
      evaluate(cmdProxy);

      const annotatedInstructions = annotateControlFlow(
        sourceName,
        instructions,
      );

      const labels = new Map<string, number>();
      for (const instruction of annotatedInstructions) {
        if (instruction.name !== "label") {
          continue;
        }

        const label = instruction.args[0];
        if (typeof label !== "string") {
          continue;
        }

        if (labels.has(label)) {
          throw new ScriptDuplicateLabelError({ sourceName, label });
        }

        labels.set(label, instruction.index + 1);
      }

      return {
        sourceName,
        instructions: annotatedInstructions,
        labels,
      } satisfies ScriptProgram;
    },
    catch: (cause) => {
      if (
        cause instanceof ScriptDuplicateLabelError ||
        cause instanceof ScriptInvalidControlFlowError
      ) {
        return cause;
      }

      return new ScriptCompileError({
        sourceName,
        cause,
      });
    },
  });

const make = Effect.gen(function* () {
  const auth = yield* Auth;
  const autoRelogin = yield* AutoRelogin;
  const autoZone = yield* AutoZone;
  const bank = yield* Bank;
  const bridge = yield* Bridge;
  const combat = yield* Combat;
  const drops = yield* Drops;
  const house = yield* House;
  const inventory = yield* Inventory;
  const jobs = yield* Jobs;
  const packet = yield* Packet;
  const packetDomain = yield* PacketDomain;
  const player = yield* Player;
  const quests = yield* Quests;
  const settings = yield* Settings;
  const shops = yield* Shops;
  const tempInventory = yield* TempInventory;
  const world = yield* World;

  const services = yield* Effect.services();
  const runFork = Effect.runForkWith(services);
  const runPromise = Effect.runPromiseWith(services);

  const readyRef = yield* Ref.make(false);
  const activeFiberRef = yield* Ref.make<Option.Option<ActiveScript>>(
    Option.none(),
  );
  const pendingLaunchFiberRef = yield* Ref.make<Option.Option<LaunchFiber>>(
    Option.none(),
  );
  const nextScriptTokenRef = yield* Ref.make(0);
  const runSemaphore = yield* Semaphore.make(1);
  const commandsRef = yield* Ref.make(new Map(scriptCommandHandlers));
  const currentCommandRef = yield* Ref.make<RunningScriptCommand | null>(null);
  const commandDelayRef = yield* Ref.make(1000);
  const nextDiagnosticIdRef = yield* Ref.make(0);
  const diagnosticsRef = yield* Ref.make<ReadonlyArray<ScriptDiagnostic>>([]);

  const appendDiagnostic = (sourceName: string, input: ScriptDiagnosticInput) =>
    Effect.gen(function* () {
      const currentCommand = yield* Ref.get(currentCommandRef);
      const id = yield* Ref.updateAndGet(
        nextDiagnosticIdRef,
        (value) => value + 1,
      );
      const command = input.command ?? currentCommand?.name;
      const instructionIndex = input.instructionIndex ?? currentCommand?.index;
      const diagnostic: ScriptDiagnostic = {
        id,
        sourceName,
        severity: input.severity,
        message: input.message,
        ...(command !== undefined ? { command } : null),
        ...(instructionIndex !== undefined ? { instructionIndex } : null),
        ...(input.details !== undefined ? { details: input.details } : null),
        createdAt: Date.now(),
      };

      yield* Ref.update(diagnosticsRef, (current) =>
        [...current, diagnostic].slice(-MAX_SCRIPT_DIAGNOSTICS),
      );
    });

  const clearPendingLaunch = (fiber: LaunchFiber) =>
    Ref.update(pendingLaunchFiberRef, (current) =>
      Option.isSome(current) && current.value === fiber
        ? Option.none()
        : current,
    );

  const replacePendingLaunch = (fiber: LaunchFiber) =>
    Effect.gen(function* () {
      const previous = yield* Ref.getAndSet(
        pendingLaunchFiberRef,
        Option.some(fiber),
      );

      if (Option.isSome(previous) && previous.value !== fiber) {
        yield* Fiber.interrupt(previous.value).pipe(
          Effect.catchCause((cause) =>
            Cause.hasInterruptsOnly(cause)
              ? Effect.void
              : Effect.logError({
                  message: "failed to cancel pending script launch",
                  cause,
                }),
          ),
        );
      }
    });

  const clearActiveScript = (token: number) =>
    Effect.gen(function* () {
      const removed = yield* Ref.modify(activeFiberRef, (current) => {
        if (Option.isSome(current) && current.value.token === token) {
          return [true, Option.none<ActiveScript>()] as const;
        }

        return [false, current] as const;
      });

      if (removed) {
        yield* Ref.set(currentCommandRef, null);
      }
    });

  const interruptActiveScript = (reason: string) =>
    Effect.gen(function* () {
      const activeScript = yield* Ref.get(activeFiberRef);
      if (Option.isNone(activeScript)) {
        return yield* Effect.void;
      }

      yield* activeScript.value.scope.requestInterrupt(reason);
      yield* Fiber.interrupt(activeScript.value.fiber);
      yield* Effect.logInfo(`[scripting] interrupted script (${reason})`);
    });

  const connectionDisposer = yield* bridge.onConnection((status) => {
    runFork(
      Effect.gen(function* () {
        const ready = status === "OnConnection";
        yield* Ref.set(readyRef, ready);

        if (!ready) {
          yield* interruptActiveScript("connection lost");
        }
      }),
    );
  });

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      connectionDisposer();
    }),
  );

  const ensureReady = (sourceName: string) =>
    Effect.gen(function* () {
      const connected = yield* Ref.get(readyRef);
      const loggedIn = yield* auth
        .isLoggedIn()
        .pipe(Effect.catchCause(() => Effect.succeed(false)));

      if (!connected || !loggedIn) {
        return yield* new ScriptNotReadyError({
          sourceName,
          reason: !connected
            ? "player is disconnected"
            : "player is not logged in",
        });
      }

      return yield* Effect.void;
    });

  const executeProgram = (
    program: ScriptProgram,
    commands: ReadonlyMap<string, ScriptCommandHandler>,
    scriptScope: ScriptAsyncScope,
  ) =>
    Effect.gen(function* () {
      const runtimeCommands = new Map(commands);
      const runtimeConditions = new Map<string, CustomConditionEvaluator>();
      let context: ScriptExecutionContext;

      const wrapScriptEffect = <A, E>(
        effect: Effect.Effect<A, E>,
      ): Effect.Effect<A, E | ScriptNotReadyError> =>
        Effect.suspend(() => {
          if (scriptScope.isCancelled()) {
            return Effect.interrupt as Effect.Effect<
              A,
              E | ScriptNotReadyError
            >;
          }

          return ensureReady(program.sourceName).pipe(Effect.andThen(effect));
        });

      const api = createScriptRuntimeApiProxy(
        {
          auth,
          autoRelogin,
          autoZone,
          bank,
          bridge,
          combat,
          drops,
          house,
          inventory,
          jobs,
          packet,
          packetDomain,
          player,
          quests,
          settings,
          shops,
          tempInventory,
          world,
        },
        (effect) => wrapScriptEffect(effect) as AnyEffect,
        scriptScope.isCancelled,
      );

      const rejectRegisteredName = (
        command: string,
        name: string,
        registeredAs: "command" | "condition",
      ) =>
        Effect.fail(
          new ScriptInvalidArgumentError({
            sourceName: context.sourceName,
            command,
            message: `name is already registered as a custom ${registeredAs}: ${name}`,
          }),
        );

      const registerCustomCommand = (
        name: string,
        handler: CustomCommandHandler,
      ) =>
        Effect.gen(function* () {
          yield* protectBuiltinCommandName(
            context,
            "register_command",
            name,
            BUILTIN_SCRIPT_API_NAMES,
          );

          if (runtimeCommands.has(name)) {
            return yield* rejectRegisteredName(
              "register_command",
              name,
              "command",
            );
          }

          if (runtimeConditions.has(name)) {
            return yield* rejectRegisteredName(
              "register_command",
              name,
              "condition",
            );
          }

          runtimeCommands.set(name, makeCustomCommandHandler(name, handler));
        });

      const unregisterCustomCommand = (name: string) =>
        protectBuiltinCommandName(
          context,
          "unregister_command",
          name,
          BUILTIN_SCRIPT_API_NAMES,
        ).pipe(
          Effect.andThen(
            Effect.sync(() => {
              runtimeCommands.delete(name);
            }),
          ),
        );

      const registerCustomCondition = (
        name: string,
        handler: CustomConditionHandler,
      ) =>
        Effect.gen(function* () {
          yield* protectBuiltinCommandName(
            context,
            "register_condition",
            name,
            BUILTIN_SCRIPT_API_NAMES,
          );

          if (runtimeCommands.has(name)) {
            return yield* rejectRegisteredName(
              "register_condition",
              name,
              "command",
            );
          }

          if (runtimeConditions.has(name)) {
            return yield* rejectRegisteredName(
              "register_condition",
              name,
              "condition",
            );
          }

          runtimeConditions.set(
            name,
            makeCustomConditionEvaluator(name, handler),
          );
        });

      const unregisterCustomCondition = (name: string) =>
        protectBuiltinCommandName(
          context,
          "unregister_condition",
          name,
          BUILTIN_SCRIPT_API_NAMES,
        ).pipe(
          Effect.andThen(
            Effect.sync(() => {
              runtimeConditions.delete(name);
            }),
          ),
        );

      const evaluateCustomCondition = (
        name: string,
        args: ReadonlyArray<unknown>,
      ) =>
        Effect.gen(function* () {
          const evaluator = runtimeConditions.get(name);
          if (!evaluator) {
            return yield* new ScriptCustomConditionError({
              sourceName: context.sourceName,
              condition: name,
              cause: "custom condition is not registered",
            });
          }

          return yield* evaluator(context, args);
        });

      context = {
        sourceName: program.sourceName,
        auth: api.auth,
        autoRelogin: api.autoRelogin,
        autoZone: api.autoZone,
        bank: api.bank,
        bridge: api.bridge,
        combat: api.combat,
        drops: api.drops,
        house: api.house,
        inventory: api.inventory,
        jobs: api.jobs,
        packet: api.packet,
        packetDomain: api.packetDomain,
        player: api.player,
        quests: api.quests,
        settings: api.settings,
        shops: api.shops,
        tempInventory: api.tempInventory,
        world: api.world,
        signal: scriptScope.signal,
        isCancelled: scriptScope.isCancelled,
        feedback: makeScriptFeedback({
          sourceName: program.sourceName,
          notify: (diagnostic) =>
            appendDiagnostic(program.sourceName, diagnostic),
        }),
        run: <A, E>(effect: Effect.Effect<A, E>) => wrapScriptEffect(effect),
        runApiEffect: <A, E>(effect: Effect.Effect<A, E>) =>
          scriptScope.runPromise(wrapScriptEffect(effect)),
        notify: (diagnostic) =>
          appendDiagnostic(program.sourceName, diagnostic),
        setScriptCleanup: scriptScope.setCleanup,
        removeScriptCleanup: scriptScope.removeCleanup,
        setCommandDelay: (ms) =>
          Ref.set(commandDelayRef, Math.max(0, Math.trunc(ms))),
        registerPacketHandler: (type, name, handler) =>
          Effect.gen(function* () {
            const key = `${type}:${name.trim().toLowerCase()}`;
            const cleanupKey = `packet:${key}`;
            const feedbackSource = { command: key };
            const packetContext = {
              sourceName: program.sourceName,
              api: createCustomScriptRuntimeApi(context),
              Effect: ScriptEffect,
              signal: scriptScope.signal,
              isCancelled: scriptScope.isCancelled,
              log: (message: string) => {
                console.info(
                  `[script:${program.sourceName}:handler:${key}] ${message}`,
                );
              },
              feedback: makeScriptFeedback(context, feedbackSource),
              notify: (diagnostic: ScriptDiagnosticInput) => {
                runFork(
                  context.notify({
                    ...diagnostic,
                    command: diagnostic.command ?? feedbackSource.command,
                  }),
                );
              },
            };
            const packetEffectContext = {
              ...packetContext,
              api: createCustomScriptEffectRuntimeApi(context),
            };
            const wrappedHandler = (value: unknown) =>
              Effect.tryPromise({
                try: () =>
                  scriptScope.runPromise(
                    isGeneratorFunction(handler)
                      ? Effect.try({
                          try: () => handler(value, packetEffectContext),
                          catch: (cause) => cause,
                        }).pipe(
                          Effect.flatMap((result) =>
                            isGenerator<void>(result)
                              ? Effect.gen(() => result)
                              : Effect.void,
                          ),
                          Effect.asVoid,
                        )
                      : Effect.tryPromise({
                          try: async (signal) => {
                            if (signal.aborted || scriptScope.isCancelled()) {
                              throw makeScriptCancellationError();
                            }

                            await handler(value, packetContext);
                          },
                          catch: (cause) => cause,
                        }).pipe(Effect.asVoid),
                  ),
                catch: (cause) => cause,
              }).pipe(
                Effect.catchCause((cause) =>
                  Cause.hasInterruptsOnly(cause) || scriptScope.isCancelled()
                    ? Effect.void
                    : Effect.logError({
                        message: "packet handler failed",
                        sourceName: program.sourceName,
                        handler: key,
                        cause,
                      }),
                ),
                Effect.asVoid,
              );

            const disposer =
              type === "packetFromClient"
                ? yield* packet.packetFromClient(wrappedHandler)
                : type === "packetFromServer"
                  ? yield* packet.packetFromServer(wrappedHandler)
                  : yield* packet.onExtensionResponse(wrappedHandler);

            yield* scriptScope.setCleanup(cleanupKey, Effect.sync(disposer));
          }),
        unregisterPacketHandler: (type, name) =>
          scriptScope
            .removeCleanup(`packet:${type}:${name.trim().toLowerCase()}`)
            .pipe(Effect.asVoid),
        registerCustomCommand,
        unregisterCustomCommand,
        registerCustomCondition,
        unregisterCustomCondition,
        evaluateCustomCondition,
      };

      let instructionPointer = 0;
      while (instructionPointer < program.instructions.length) {
        const instruction = program.instructions[instructionPointer];
        if (!instruction) {
          break;
        }

        const handler = runtimeCommands.get(instruction.name);
        if (!handler) {
          return yield* new ScriptUnknownCommandError({
            sourceName: program.sourceName,
            command: instruction.name,
            instructionIndex: instruction.index,
          });
        }

        yield* ensureReady(program.sourceName);
        yield* Ref.set(currentCommandRef, {
          sourceName: program.sourceName,
          index: instruction.index,
          name: instruction.name,
        });

        const result = yield* handler(context, instruction);

        if (result._tag === "Stop") {
          yield* Ref.set(currentCommandRef, null);
          return yield* Effect.void;
        }

        const commandDelay = yield* Ref.get(commandDelayRef);
        if (commandDelay > 0) {
          yield* Effect.sleep(`${commandDelay} millis`);
        }

        if (result._tag === "JumpToIndex") {
          instructionPointer = result.index;
          continue;
        }

        if (result._tag === "JumpToLabel") {
          const destination = program.labels.get(result.label);
          if (destination === undefined) {
            return yield* new ScriptLabelNotFoundError({
              sourceName: program.sourceName,
              label: result.label,
            });
          }

          instructionPointer = destination;
          continue;
        }

        if (result._tag === ScriptCommandResult.Continue._tag) {
          instructionPointer += 1;
          continue;
        }
      }

      yield* Ref.set(currentCommandRef, null);
      return yield* Effect.void;
    }).pipe(Effect.ensuring(scriptScope.close("script finished")));

  const runScriptPayload = (payload: ScriptExecutePayload): Promise<void> =>
    runPromise(
      run(payload.source, {
        name: scriptNameFromPayload(payload),
      }),
    );

  const runScriptPayloadFromIpc = (payload: ScriptExecutePayload) => {
    void runScriptPayload(payload).catch((cause) => {
      console.error("Failed to run script", {
        sourceName: scriptNameFromPayload(payload),
        cause,
      });
    });
  };

  const stopFromIpc = () => {
    runFork(stop("ipc request"));
  };

  const executeListener = (payload: ScriptExecutePayload) => {
    runScriptPayloadFromIpc(payload);
  };

  const stopListener = () => {
    stopFromIpc();
  };

  const previousCmd = window.cmd;
  const removeExecuteListener = window.ipc.scripting.onExecute(executeListener);
  const removeStopListener = window.ipc.scripting.onStop(stopListener);

  window.cmd = {
    run: (source: string, name?: string) => {
      return runScriptPayload(
        name === undefined
          ? { source }
          : {
              source,
              name,
            },
      );
    },
    stop: () => {
      stopFromIpc();
    },
    open: async () => {
      return await window.ipc.scripting.openFile();
    },
    readFile: async (path: string) => {
      return await window.ipc.scripting.readFile(path);
    },
    runFile: async (path: string) => {
      const payload = await window.ipc.scripting.readFile(path);
      await runScriptPayload(payload);
    },
    listCommands: () => {
      return runPromise(listCommands());
    },
    isRunning: () => {
      return runPromise(isRunning());
    },
    currentCommand: () => {
      return runPromise(currentCommand());
    },
    diagnostics: () => {
      return runPromise(diagnostics());
    },
  };

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      removeExecuteListener();
      removeStopListener();

      if (previousCmd === undefined) {
        delete window.cmd;
      } else {
        window.cmd = previousCmd;
      }
    }),
  );

  const register: ScriptRunnerShape["register"] = (name, handler) =>
    Ref.update(commandsRef, (previous) => {
      if (BUILTIN_SCRIPT_API_NAMES.has(name)) {
        return previous;
      }

      const next = new Map(previous);
      next.set(name, handler);
      return next;
    });

  const unregister: ScriptRunnerShape["unregister"] = (name) =>
    Ref.update(commandsRef, (previous) => {
      if (BUILTIN_SCRIPT_API_NAMES.has(name) || !previous.has(name)) {
        return previous;
      }

      const next = new Map(previous);
      next.delete(name);
      return next;
    });

  const listCommands: ScriptRunnerShape["listCommands"] = () =>
    Ref.get(commandsRef).pipe(
      Effect.map((commands) =>
        [...commands.keys()].sort((a, b) => a.localeCompare(b)),
      ),
    );

  const stop: ScriptRunnerShape["stop"] = (reason = "manual stop") =>
    interruptActiveScript(reason);

  const run: ScriptRunnerShape["run"] = (source, options) =>
    Effect.withFiber((launchFiber) =>
      Effect.gen(function* () {
        yield* replacePendingLaunch(launchFiber);

        const sourceName = options?.name?.trim()
          ? options.name
          : "inline-script";
        const program = yield* compileProgram(source, sourceName);
        const commands = yield* Ref.get(commandsRef);
        const declaredCustomCommands = new Set<string>();
        const declaredCustomConditions = new Set<string>();

        for (const instruction of program.instructions) {
          for (const conditionName of instructionCustomConditionNames(
            instruction,
          )) {
            if (!declaredCustomConditions.has(conditionName)) {
              return yield* new ScriptCustomConditionError({
                sourceName: program.sourceName,
                condition: conditionName,
                cause: "custom condition must be registered before use",
              });
            }
          }

          if (commands.has(instruction.name)) {
            if (
              instruction.name === "register_command" &&
              typeof instruction.args[0] === "string"
            ) {
              declaredCustomCommands.add(instruction.args[0]);
            }

            if (
              instruction.name === "register_condition" &&
              typeof instruction.args[0] === "string"
            ) {
              declaredCustomConditions.add(instruction.args[0]);
            }

            continue;
          }

          if (!declaredCustomCommands.has(instruction.name)) {
            return yield* new ScriptUnknownCommandError({
              sourceName: program.sourceName,
              command: instruction.name,
              instructionIndex: instruction.index,
            });
          }
        }

        yield* runSemaphore.withPermits(1)(
          Effect.gen(function* () {
            yield* ensureReady(program.sourceName);
            yield* stop("replaced by a new script");
            yield* Ref.set(commandDelayRef, 1000);
            yield* Ref.set(diagnosticsRef, []);

            const token = yield* Ref.updateAndGet(
              nextScriptTokenRef,
              (value) => value + 1,
            );
            const scriptScope = makeScriptAsyncScope(runFork);
            const fiber = yield* Effect.forkDetach(
              executeProgram(program, commands, scriptScope).pipe(
                Effect.catchCause((cause) =>
                  Cause.hasInterruptsOnly(cause)
                    ? Effect.failCause(cause)
                    : Effect.logError({
                        message: "script execution failed",
                        sourceName: program.sourceName,
                        cause,
                      }),
                ),
                Effect.ensuring(clearActiveScript(token)),
              ),
            );

            yield* Ref.set(
              activeFiberRef,
              Option.some({ token, fiber, scope: scriptScope }),
            );
            yield* clearPendingLaunch(launchFiber);
            yield* Effect.logInfo(
              `[scripting] started script: ${program.sourceName}`,
            );
          }),
        );
      }).pipe(Effect.ensuring(clearPendingLaunch(launchFiber))),
    );

  const isRunning: ScriptRunnerShape["isRunning"] = () =>
    Ref.get(activeFiberRef).pipe(Effect.map(Option.isSome));

  const currentCommand: ScriptRunnerShape["currentCommand"] = () =>
    Ref.get(currentCommandRef);

  const diagnostics: ScriptRunnerShape["diagnostics"] = () =>
    Ref.get(diagnosticsRef);

  return {
    run,
    stop,
    isRunning,
    currentCommand,
    diagnostics,
    listCommands,
    register,
    unregister,
  } satisfies ScriptRunnerShape;
});

export const ScriptRunnerLive = Layer.effect(ScriptRunner, make);

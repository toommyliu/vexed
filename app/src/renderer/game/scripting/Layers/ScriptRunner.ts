import { Effect, Fiber, Layer, Option, Ref, Semaphore } from "effect";
import { type ScriptExecutePayload } from "../ipc";
import { Auth } from "../../flash/Services/Auth";
import { Bank } from "../../flash/Services/Bank";
import { Bridge } from "../../flash/Services/Bridge";
import { Combat } from "../../flash/Services/Combat";
import { Drops } from "../../flash/Services/Drops";
import { Inventory } from "../../flash/Services/Inventory";
import { Packet } from "../../flash/Services/Packet";
import { Player } from "../../flash/Services/Player";
import { Quests } from "../../flash/Services/Quests";
import { Settings } from "../../flash/Services/Settings";
import { Shops } from "../../flash/Services/Shops";
import { TempInventory } from "../../flash/Services/TempInventory";
import { World } from "../../flash/Services/World";
import {
  ScriptCompileError,
  ScriptDuplicateLabelError,
  ScriptInvalidControlFlowError,
  ScriptLabelNotFoundError,
  ScriptNotReadyError,
  ScriptUnknownCommandError,
} from "../Errors";
import { createScriptDsl, scriptCommandHandlers } from "../Commands";
import type { ScriptCommandApi } from "../Commands/commandDsl";
import { ScriptRunner } from "../Services/ScriptRunner";
import type {
  RunningScriptCommand,
  ScriptRunnerShape,
} from "../Services/ScriptRunner";
import {
  ScriptCommandResult,
  type ScriptCommandHandler,
  type ScriptExecutionContext,
  type ScriptInstruction,
  type ScriptProgram,
} from "../Types";

type ConditionalBlockFrame = {
  readonly ifIndex: number;
  readonly elseIndex?: number;
};

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
      const cmdProxy = createScriptDsl((name, args) => {
        instructions.push({
          name,
          args: [...args],
          index: instructions.length,
        });
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
  const bank = yield* Bank;
  const bridge = yield* Bridge;
  const combat = yield* Combat;
  const drops = yield* Drops;
  const inventory = yield* Inventory;
  const packet = yield* Packet;
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
  const activeFiberRef = yield* Ref.make<
    Option.Option<Fiber.Fiber<void, unknown>>
  >(Option.none());
  const runSemaphore = yield* Semaphore.make(1);
  const commandsRef = yield* Ref.make(new Map(scriptCommandHandlers));
  const currentCommandRef = yield* Ref.make<RunningScriptCommand | null>(null);

  const interruptActiveScript = (reason: string) =>
    Effect.gen(function* () {
      const activeFiber = yield* Ref.get(activeFiberRef);
      if (Option.isNone(activeFiber)) {
        return yield* Effect.void;
      }

      yield* Fiber.interrupt(activeFiber.value);
      yield* Ref.set(activeFiberRef, Option.none());
      yield* Ref.set(currentCommandRef, null);
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
  ) =>
    Effect.gen(function* () {
      const context: ScriptExecutionContext = {
        sourceName: program.sourceName,
        auth,
        bank,
        bridge,
        combat,
        drops,
        inventory,
        packet,
        player,
        quests,
        settings,
        shops,
        tempInventory,
        world,
        run: <A, E>(effect: Effect.Effect<A, E>) =>
          ensureReady(program.sourceName).pipe(Effect.andThen(effect)),
      };

      let instructionPointer = 0;
      while (instructionPointer < program.instructions.length) {
        const instruction = program.instructions[instructionPointer];
        if (!instruction) {
          break;
        }

        const handler = commands.get(instruction.name);
        if (!handler) {
          return yield* Effect.fail(
            new ScriptUnknownCommandError({
              sourceName: program.sourceName,
              command: instruction.name,
              instructionIndex: instruction.index,
            }),
          );
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
    });

  const runScriptPayload = (payload: ScriptExecutePayload) => {
    runFork(
      run(payload.source, {
        name: scriptNameFromPayload(payload),
      }).pipe(
        Effect.catchCause((cause) =>
          Effect.logError({
            message: "failed to run script",
            sourceName: scriptNameFromPayload(payload),
            cause,
          }),
        ),
      ),
    );
  };

  const stopFromIpc = () => {
    runFork(stop("ipc request"));
  };

  const executeListener = (payload: ScriptExecutePayload) => {
    runScriptPayload(payload);
  };

  const stopListener = () => {
    stopFromIpc();
  };

  const previousCmd = window.cmd;
  const removeExecuteListener = window.ipc.scripting.onExecute(executeListener);
  const removeStopListener = window.ipc.scripting.onStop(stopListener);

  window.cmd = {
    run: (source: string, name?: string) => {
      runScriptPayload(
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
      runScriptPayload(payload);
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
      const next = new Map(previous);
      next.set(name, handler);
      return next;
    });

  const unregister: ScriptRunnerShape["unregister"] = (name) =>
    Ref.update(commandsRef, (previous) => {
      if (!previous.has(name)) {
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
    Effect.gen(function* () {
      const sourceName = options?.name?.trim() ? options.name : "inline-script";
      const program = yield* compileProgram(source, sourceName);
      const commands = yield* Ref.get(commandsRef);

      for (const instruction of program.instructions) {
        if (!commands.has(instruction.name)) {
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

          const fiber = yield* Effect.forkDetach(
            executeProgram(program, commands).pipe(
              Effect.catchCause((cause) =>
                Effect.logError({
                  message: "script execution failed",
                  sourceName: program.sourceName,
                  cause,
                }),
              ),
              Effect.ensuring(
                Effect.all(
                  [
                    Ref.set(activeFiberRef, Option.none()),
                    Ref.set(currentCommandRef, null),
                  ],
                  { discard: true },
                ),
              ),
            ),
          );

          yield* Ref.set(activeFiberRef, Option.some(fiber));
          yield* Effect.logInfo(
            `[scripting] started script: ${program.sourceName}`,
          );
        }),
      );
    });

  const isRunning: ScriptRunnerShape["isRunning"] = () =>
    Ref.get(activeFiberRef).pipe(Effect.map(Option.isSome));

  const currentCommand: ScriptRunnerShape["currentCommand"] = () =>
    Ref.get(currentCommandRef);

  return {
    run,
    stop,
    isRunning,
    currentCommand,
    listCommands,
    register,
    unregister,
  } satisfies ScriptRunnerShape;
});

export const ScriptRunnerLive = Layer.effect(ScriptRunner, make);

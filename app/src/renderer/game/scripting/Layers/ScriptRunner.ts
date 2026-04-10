import { ipcRenderer } from "electron";
import { Effect, Fiber, Layer, Option, Ref } from "effect";
import {
  ScriptingIpcChannels,
  type ScriptExecutePayload,
} from "../ipc";
import { Auth } from "../../flash/Services/Auth";
import { Bridge } from "../../flash/Services/Bridge";
import { Combat } from "../../flash/Services/Combat";
import { Player } from "../../flash/Services/Player";
import { Settings } from "../../flash/Services/Settings";
import { World } from "../../flash/Services/World";
import {
  ScriptCompileError,
  ScriptDuplicateLabelError,
  ScriptLabelNotFoundError,
  ScriptNotReadyError,
  ScriptUnknownCommandError,
} from "../Errors";
import { coreScriptCommands } from "../Commands/Core";
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

type ScriptDsl = Record<string, (...args: ReadonlyArray<unknown>) => void>;

const scriptNameFromPayload = (payload: ScriptExecutePayload): string => {
  if (payload.name && payload.name.trim() !== "") {
    return payload.name;
  }

  if (payload.path && payload.path.trim() !== "") {
    return payload.path;
  }

  return "inline-script";
};

const compileProgram = (
  source: string,
  sourceName: string,
): Effect.Effect<ScriptProgram, ScriptCompileError | ScriptDuplicateLabelError> =>
  Effect.try({
    try: () => {
      const instructions: Array<ScriptInstruction> = [];
      const cmdProxy = new Proxy<ScriptDsl>({} as ScriptDsl, {
        get: (_, prop) => {
          if (typeof prop !== "string") {
            return undefined;
          }

          return (...args: ReadonlyArray<unknown>) => {
            instructions.push({
              name: prop,
              args: [...args],
              index: instructions.length,
            });
          };
        },
      });

      const evaluate = new Function("cmd", source) as (cmd: ScriptDsl) => void;
      evaluate(cmdProxy);

      const labels = new Map<string, number>();
      for (const instruction of instructions) {
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

        labels.set(label, instruction.index);
      }

      return {
        sourceName,
        instructions,
        labels,
      } satisfies ScriptProgram;
    },
    catch: (cause) => {
      if (cause instanceof ScriptDuplicateLabelError) {
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
  const bridge = yield* Bridge;
  const combat = yield* Combat;
  const player = yield* Player;
  const settings = yield* Settings;
  const world = yield* World;

  const runFork = Effect.runForkWith(yield* Effect.services());

  const readyRef = yield* Ref.make(false);
  const activeFiberRef = yield* Ref.make<Option.Option<Fiber.Fiber<void, unknown>>>(
    Option.none(),
  );
  const commandsRef = yield* Ref.make(new Map(coreScriptCommands));
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

      if (!connected && !loggedIn) {
        return yield* Effect.fail(
          new ScriptNotReadyError({
            sourceName,
            reason: "player is not logged in",
          }),
        );
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
        bridge,
        combat,
        player,
        settings,
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

        const result = yield* handler(context, instruction.args);

        if (result._tag === "Stop") {
          yield* Ref.set(currentCommandRef, null);
          return yield* Effect.void;
        }

        if (result._tag === "JumpToLabel") {
          const destination = program.labels.get(result.label);
          if (destination === undefined) {
            return yield* Effect.fail(
              new ScriptLabelNotFoundError({
                sourceName: program.sourceName,
                label: result.label,
              }),
            );
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

  const executeListener = (
    _event: Electron.IpcRendererEvent,
    payload: ScriptExecutePayload,
  ) => {
    runScriptPayload(payload);
  };

  const stopListener = () => {
    stopFromIpc();
  };

  const previousCmd = window.cmd;

  ipcRenderer.on(ScriptingIpcChannels.execute, executeListener);
  ipcRenderer.on(ScriptingIpcChannels.stop, stopListener);

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
      return (await ipcRenderer.invoke(
        ScriptingIpcChannels.openFile,
      )) as ScriptExecutePayload | null;
    },
    readFile: async (path: string) => {
      return (await ipcRenderer.invoke(
        ScriptingIpcChannels.readFile,
        path,
      )) as ScriptExecutePayload;
    },
    runFile: async (path: string) => {
      const payload = (await ipcRenderer.invoke(
        ScriptingIpcChannels.readFile,
        path,
      )) as ScriptExecutePayload;

      runScriptPayload(payload);
    },
    listCommands: async () => {
      return await Effect.runPromise(listCommands());
    },
    isRunning: async () => {
      return await Effect.runPromise(isRunning());
    },
    currentCommand: async () => {
      return await Effect.runPromise(currentCommand());
    },
  };

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      ipcRenderer.removeListener(ScriptingIpcChannels.execute, executeListener);
      ipcRenderer.removeListener(ScriptingIpcChannels.stop, stopListener);

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
          return yield* Effect.fail(
            new ScriptUnknownCommandError({
              sourceName: program.sourceName,
              command: instruction.name,
              instructionIndex: instruction.index,
            }),
          );
        }
      }

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
      yield* Effect.logInfo(`[scripting] started script: ${program.sourceName}`);
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

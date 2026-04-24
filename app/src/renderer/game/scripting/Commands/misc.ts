import { Effect } from "effect";
import { ScriptCommandResult, type ScriptCommandHandler } from "../Types";
import {
  commandHandlerEntries,
  createCommandHandler,
  recordScriptInstruction,
  requireInstructionNumber,
  requireInstructionString,
  requireScriptArgumentNumber,
  requireScriptArgumentString,
  withScriptCommandAliases,
  type ScriptInstructionRecorder,
} from "./commandDsl";

const delayCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const ms = yield* requireInstructionNumber(context, "delay", args, 0, "ms");
    yield* Effect.sleep(`${Math.max(0, Math.floor(ms))} millis`);
  }),
);

const logCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const message = yield* requireInstructionString(
      context,
      "log",
      args,
      0,
      "message",
    );
    yield* Effect.sync(() => {
      console.info(`[script:${context.sourceName}] ${message}`);
    });
  }),
);

const setFpsCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const fps = yield* requireInstructionNumber(
      context,
      "set_fps",
      args,
      0,
      "fps",
    );
    yield* context.run(
      context.settings.setFrameRate(Math.max(1, Math.floor(fps))),
    );
  }),
);

const stopCommand: ScriptCommandHandler = () =>
  Effect.succeed(ScriptCommandResult.Stop);

export const miscCommandHandlers: ReadonlyArray<
  readonly [string, ScriptCommandHandler]
> = [
  ["delay", delayCommand],
  ["log", logCommand],
  ["set_fps", setFpsCommand],
  [
    "enable_lagkiller",
    createCommandHandler((context) =>
      context.run(context.settings.setLagKillerEnabled(true)),
    ),
  ],
  [
    "disable_lagkiller",
    createCommandHandler((context) =>
      context.run(context.settings.setLagKillerEnabled(false)),
    ),
  ],
  [
    "enable_hideplayers",
    createCommandHandler((context) =>
      context.run(context.settings.setPlayersVisible(false)),
    ),
  ],
  [
    "disable_hideplayers",
    createCommandHandler((context) =>
      context.run(context.settings.setPlayersVisible(true)),
    ),
  ],
  [
    "enable_infiniterange",
    createCommandHandler((context) =>
      context.run(context.settings.setInfiniteRangeEnabled(true)),
    ),
  ],
  [
    "disable_infiniterange",
    createCommandHandler((context) =>
      context.run(context.settings.setInfiniteRangeEnabled(false)),
    ),
  ],
  ...commandHandlerEntries("stop", stopCommand, ["stop_bot"]),
];

export const createMiscScriptDsl = (emit: ScriptInstructionRecorder) =>
  withScriptCommandAliases(
    {
      /**
       * Waits for a number of milliseconds.
       *
       * @param ms Delay in milliseconds.
       */
      delay(ms: number) {
        recordScriptInstruction(
          emit,
          "delay",
          Math.max(
            0,
            Math.floor(requireScriptArgumentNumber("delay", "ms", ms)),
          ),
        );
      },

      /**
       * Writes a message to the console.
       *
       * @param message Message to print.
       */
      log(message: string) {
        recordScriptInstruction(
          emit,
          "log",
          requireScriptArgumentString("log", "message", message),
        );
      },

      /**
       * Sets the game frame rate.
       *
       * @param fps Target frame rate.
       */
      set_fps(fps: number) {
        recordScriptInstruction(
          emit,
          "set_fps",
          Math.max(
            1,
            Math.floor(requireScriptArgumentNumber("set_fps", "fps", fps)),
          ),
        );
      },

      /**
       * Enables lag killer.
       */
      enable_lagkiller() {
        recordScriptInstruction(emit, "enable_lagkiller");
      },

      /**
       * Disables lag killer.
       */
      disable_lagkiller() {
        recordScriptInstruction(emit, "disable_lagkiller");
      },

      /**
       * Hides other players.
       */
      enable_hideplayers() {
        recordScriptInstruction(emit, "enable_hideplayers");
      },

      /**
       * Shows other players again.
       */
      disable_hideplayers() {
        recordScriptInstruction(emit, "disable_hideplayers");
      },

      /**
       * Enables infinite range.
       */
      enable_infiniterange() {
        recordScriptInstruction(emit, "enable_infiniterange");
      },

      /**
       * Disables infinite range.
       */
      disable_infiniterange() {
        recordScriptInstruction(emit, "disable_infiniterange");
      },

      /**
       * Stops the active script.
       *
       * @alias stop_bot
       */
      stop() {
        recordScriptInstruction(emit, "stop");
      },
    },
    {
      stop_bot: "stop",
    },
  );

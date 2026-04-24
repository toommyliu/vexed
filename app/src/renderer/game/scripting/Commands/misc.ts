import { Effect } from "effect";
import { ScriptCommandResult, type ScriptCommandHandler } from "../Types";
import {
  createCommandHandler,
  defineScriptCommandDomain,
  requireInstructionNumber,
  requireInstructionString,
  requireScriptArgumentNumber,
  requireScriptArgumentString,
  type ScriptCommandAliasMap,
  type ScriptCommandDsl,
  type ScriptCommandDslWithAliases,
  withScriptCommandAliases,
  type ScriptInstructionRecorder,
} from "./commandDsl";

type MiscScriptCommandArguments = {
  delay: [ms: number];
  log: [message: string];
  set_fps: [fps: number];
  enable_lagkiller: [];
  disable_lagkiller: [];
  enable_hideplayers: [];
  disable_hideplayers: [];
  enable_infiniterange: [];
  disable_infiniterange: [];
  stop: [];
};

const miscCommandAliases = {
  stop_bot: "stop",
} as const satisfies ScriptCommandAliasMap<MiscScriptCommandArguments>;

type MiscScriptDsl = ScriptCommandDslWithAliases<
  MiscScriptCommandArguments,
  typeof miscCommandAliases
>;
const miscCommandDomain =
  defineScriptCommandDomain<MiscScriptCommandArguments>();

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

const miscCommandHandlerMap = miscCommandDomain.defineHandlers({
  delay: delayCommand,
  log: logCommand,
  set_fps: setFpsCommand,
  enable_lagkiller: createCommandHandler((context) =>
    context.run(context.settings.setLagKillerEnabled(true)),
  ),
  disable_lagkiller: createCommandHandler((context) =>
    context.run(context.settings.setLagKillerEnabled(false)),
  ),
  enable_hideplayers: createCommandHandler((context) =>
    context.run(context.settings.setPlayersVisible(false)),
  ),
  disable_hideplayers: createCommandHandler((context) =>
    context.run(context.settings.setPlayersVisible(true)),
  ),
  enable_infiniterange: createCommandHandler((context) =>
    context.run(context.settings.setInfiniteRangeEnabled(true)),
  ),
  disable_infiniterange: createCommandHandler((context) =>
    context.run(context.settings.setInfiniteRangeEnabled(false)),
  ),
  stop: stopCommand,
});

export const miscCommandHandlers = miscCommandDomain.handlerEntriesWithAliases(
  miscCommandHandlerMap,
  miscCommandAliases,
);

export const createMiscScriptDsl = (
  recordInstruction: ScriptInstructionRecorder,
): MiscScriptDsl => {
  const recordMiscInstruction =
    miscCommandDomain.createInstructionRecorder(recordInstruction);

  const commands: ScriptCommandDsl<MiscScriptCommandArguments> = {
    /**
     * Waits for a number of milliseconds.
     *
     * @param ms Delay in milliseconds.
     */
    delay(ms: number) {
      recordMiscInstruction(
        "delay",
        Math.max(0, Math.floor(requireScriptArgumentNumber("delay", "ms", ms))),
      );
    },

    /**
     * Writes a message to the console.
     *
     * @param message Message to print.
     */
    log(message: string) {
      recordMiscInstruction(
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
      recordMiscInstruction(
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
      recordMiscInstruction("enable_lagkiller");
    },

    /**
     * Disables lag killer.
     */
    disable_lagkiller() {
      recordMiscInstruction("disable_lagkiller");
    },

    /**
     * Hides other players.
     */
    enable_hideplayers() {
      recordMiscInstruction("enable_hideplayers");
    },

    /**
     * Shows other players again.
     */
    disable_hideplayers() {
      recordMiscInstruction("disable_hideplayers");
    },

    /**
     * Enables infinite range.
     */
    enable_infiniterange() {
      recordMiscInstruction("enable_infiniterange");
    },

    /**
     * Disables infinite range.
     */
    disable_infiniterange() {
      recordMiscInstruction("disable_infiniterange");
    },

    /**
     * Stops the active script.
     *
     * @alias stop_bot
     */
    stop() {
      recordMiscInstruction("stop");
    },
  };

  return withScriptCommandAliases(commands, miscCommandAliases);
};

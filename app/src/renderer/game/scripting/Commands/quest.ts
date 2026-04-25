import { Effect } from "effect";
import {
  createCommandHandler,
  defineScriptCommandDomain,
  readOptionalInstructionBoolean,
  readOptionalInstructionObject,
  readOptionalInstructionPositiveInteger,
  readOptionalScriptArgumentBoolean,
  readOptionalScriptArgumentObject,
  readOptionalScriptArgumentPositiveInteger,
  requireInstructionPositiveInteger,
  requireScriptArgumentPositiveInteger,
  type ScriptCommandDsl,
  type ScriptInstructionRecorder,
} from "./commandDsl";
import { ScriptInvalidArgumentError } from "../Errors";
import type { ScriptExecutionContext } from "../Types";

type QuestTurnInsArgument = number | "max";
type CompleteQuestOptions = {
  readonly itemId?: number;
  readonly turnIns?: QuestTurnInsArgument;
};

type QuestScriptCommandArguments = {
  accept_quest: [questId: number, silent?: boolean];
  abandon_quest: [questId: number];
  complete_quest: [questId: number, options?: CompleteQuestOptions];
};

type QuestScriptDsl = ScriptCommandDsl<QuestScriptCommandArguments>;
const questCommandDomain =
  defineScriptCommandDomain<QuestScriptCommandArguments>();

const acceptQuestCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const questId = yield* requireInstructionPositiveInteger(
      context,
      "accept_quest",
      args,
      0,
      "quest_id",
    );
    const silent = yield* readOptionalInstructionBoolean(
      context,
      "accept_quest",
      args,
      1,
      "silent",
    );

    yield* context.run(context.quests.accept(questId, silent));
  }),
);

const abandonQuestCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const questId = yield* requireInstructionPositiveInteger(
      context,
      "abandon_quest",
      args,
      0,
      "quest_id",
    );

    yield* context.run(context.quests.abandon(questId));
  }),
);

const invalidQuestArgument = (
  context: ScriptExecutionContext,
  message: string,
) =>
  Effect.fail(
    new ScriptInvalidArgumentError({
      sourceName: context.sourceName,
      command: "complete_quest",
      message,
    }),
  );

const readOptionalQuestTurnIns = (
  context: ScriptExecutionContext,
  questId: number,
  options: CompleteQuestOptions | undefined,
) => {
  const value = options?.turnIns;
  if (value === "max") {
    return context.run(context.quests.getMaxTurnIns(questId));
  }

  if (value === undefined) {
    return Effect.succeed(undefined);
  }

  if (typeof value !== "number") {
    return invalidQuestArgument(
      context,
      'turn_ins must be a positive integer or "max"',
    );
  }

  return readOptionalInstructionPositiveInteger(
    context,
    "complete_quest",
    [value],
    0,
    "turn_ins",
  );
};

const readOptionalScriptQuestTurnIns = (
  value: QuestTurnInsArgument | undefined,
): QuestTurnInsArgument | undefined => {
  if (value === "max") {
    return value;
  }

  if (typeof value === "string") {
    throw new Error(
      'cmd.complete_quest: turn_ins must be a positive integer or "max"',
    );
  }

  return readOptionalScriptArgumentPositiveInteger(
    "complete_quest",
    "turn_ins",
    value,
  );
};

const readCompleteQuestOptions = (
  context: ScriptExecutionContext,
  args: ReadonlyArray<unknown>,
) =>
  Effect.gen(function* () {
    const rawOptions = args[1];
    if (rawOptions !== undefined && typeof rawOptions !== "object") {
      return yield* invalidQuestArgument(
        context,
        "options must be an object; use { itemId: 123 } to select a reward item",
      );
    }

    const options = yield* readOptionalInstructionObject<CompleteQuestOptions>(
      context,
      "complete_quest",
      args,
      1,
      "options",
    );

    if (options?.itemId !== undefined) {
      yield* readOptionalInstructionPositiveInteger(
        context,
        "complete_quest",
        [options.itemId],
        0,
        "item_id",
      );
    }

    return options;
  });

const readOptionalScriptCompleteQuestOptions = (
  options: unknown,
): CompleteQuestOptions | undefined => {
  if (options !== undefined && typeof options !== "object") {
    throw new Error(
      "cmd.complete_quest: options must be an object; use { itemId: 123 } to select a reward item",
    );
  }

  const parsed = readOptionalScriptArgumentObject<CompleteQuestOptions>(
    "complete_quest",
    "options",
    options,
  );

  if (parsed === undefined) {
    return undefined;
  }

  const itemId = readOptionalScriptArgumentPositiveInteger(
    "complete_quest",
    "item_id",
    parsed.itemId,
  );
  const turnIns = readOptionalScriptQuestTurnIns(parsed.turnIns);

  return {
    ...(itemId !== undefined ? { itemId } : {}),
    ...(turnIns !== undefined ? { turnIns } : {}),
  };
};

const completeQuestCommand = createCommandHandler((context, args) =>
  Effect.gen(function* () {
    const questId = yield* requireInstructionPositiveInteger(
      context,
      "complete_quest",
      args,
      0,
      "quest_id",
    );
    const options = yield* readCompleteQuestOptions(context, args);
    const turnIns = yield* readOptionalQuestTurnIns(context, questId, options);
    const canComplete = yield* context.run(context.quests.canComplete(questId));

    if (!canComplete) {
      return;
    }

    yield* context.run(
      context.quests.complete(questId, turnIns, options?.itemId),
    );
  }),
);

const questCommandHandlerMap = questCommandDomain.defineHandlers({
  accept_quest: acceptQuestCommand,
  abandon_quest: abandonQuestCommand,
  complete_quest: completeQuestCommand,
});

export const questCommandHandlers = questCommandDomain.handlerEntries(
  questCommandHandlerMap,
);

export const createQuestScriptDsl = (
  recordInstruction: ScriptInstructionRecorder,
): QuestScriptDsl => {
  const recordQuestInstruction =
    questCommandDomain.createInstructionRecorder(recordInstruction);

  return {
    /**
     * Accepts a quest.
     *
     * @param questId Quest id.
     * @param silent Whether to load the quest silently before accepting.
     */
    accept_quest(questId: number, silent: boolean = false) {
      recordQuestInstruction(
        "accept_quest",
        requireScriptArgumentPositiveInteger(
          "accept_quest",
          "quest_id",
          questId,
        ),
        readOptionalScriptArgumentBoolean("accept_quest", "silent", silent) ??
          false,
      );
    },

    /**
     * Abandons a quest.
     *
     * @param questId Quest id.
     */
    abandon_quest(questId: number) {
      recordQuestInstruction(
        "abandon_quest",
        requireScriptArgumentPositiveInteger(
          "abandon_quest",
          "quest_id",
          questId,
        ),
      );
    },

    /**
     * Completes a quest.
     *
     * @param questId Quest id.
     * @param options Optional reward and turn-in settings.
     * @example cmd.complete_quest(11)
     * @example cmd.complete_quest(123, { itemId: 123 })
     * @example cmd.complete_quest(1234, { itemId: 123, turnIns: "max" })
     */
    complete_quest(questId: number, options?: CompleteQuestOptions) {
      recordQuestInstruction(
        "complete_quest",
        requireScriptArgumentPositiveInteger(
          "complete_quest",
          "quest_id",
          questId,
        ),
        readOptionalScriptCompleteQuestOptions(options),
      );
    },
  };
};

import { Effect } from "effect";
import {
  createCommandHandler,
  defineScriptCommandDomain,
  readOptionalInstructionBoolean,
  readOptionalInstructionPositiveInteger,
  readOptionalScriptArgumentBoolean,
  readOptionalScriptArgumentPositiveInteger,
  requireInstructionPositiveInteger,
  requireScriptArgumentPositiveInteger,
  type ScriptCommandDsl,
  type ScriptInstructionRecorder,
} from "./commandDsl";
import type { ScriptExecutionContext } from "../Types";

type QuestTurnInsArgument = number | "max";

type QuestScriptCommandArguments = {
  accept_quest: [questId: number, silent?: boolean];
  abandon_quest: [questId: number];
  complete_quest: [
    questId: number,
    itemId?: number,
    turnIns?: QuestTurnInsArgument,
  ];
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

const readOptionalQuestTurnIns = (
  context: ScriptExecutionContext,
  questId: number,
  args: ReadonlyArray<unknown>,
) => {
  const value = args[2];
  if (typeof value === "string" && value.toLowerCase() === "max") {
    return context.run(context.quests.getMaxTurnIns(questId));
  }

  return readOptionalInstructionPositiveInteger(
    context,
    "complete_quest",
    args,
    2,
    "turn_ins",
  );
};

const readOptionalScriptQuestTurnIns = (
  value: QuestTurnInsArgument | undefined,
): QuestTurnInsArgument | undefined => {
  if (value === "max") {
    return value;
  }

  return readOptionalScriptArgumentPositiveInteger(
    "complete_quest",
    "turn_ins",
    value,
  );
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
    const itemId = yield* readOptionalInstructionPositiveInteger(
      context,
      "complete_quest",
      args,
      1,
      "item_id",
    );
    const turnIns = yield* readOptionalQuestTurnIns(context, questId, args);
    const canComplete = yield* context.run(context.quests.canComplete(questId));

    if (!canComplete) {
      return;
    }

    yield* context.run(context.quests.complete(questId, turnIns, itemId));
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
     * Completes a quest if it is ready to turn in.
     *
     * @param questId Quest id.
     * @param itemId Optional reward item id.
     * @param turnIns Optional turn-in count, or "max" for maximum turn-ins.
     */
    complete_quest(
      questId: number,
      itemId?: number,
      turnIns?: QuestTurnInsArgument,
    ) {
      recordQuestInstruction(
        "complete_quest",
        requireScriptArgumentPositiveInteger(
          "complete_quest",
          "quest_id",
          questId,
        ),
        readOptionalScriptArgumentPositiveInteger(
          "complete_quest",
          "item_id",
          itemId,
        ),
        readOptionalScriptQuestTurnIns(turnIns),
      );
    },
  };
};

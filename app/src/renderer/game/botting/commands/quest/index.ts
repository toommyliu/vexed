import { ArgsError } from "~/botting/ArgsError";
import { CommandAcceptQuest } from "./CommandAcceptQuest";
import { CommandCompleteQuest } from "./CommandCompleteQuest";
import { CommandRegisterQuest } from "./CommandRegisterQuest";
import { CommandUnregisterQuest } from "./CommandUnregisterQuest";
import { CommandAbandonQuest } from "./CommandAbandonQuest";

export const questCommands = {
  /**
   * Accepts a quest.
   *
   * @param questId - The ID of the quest.
   */
  accept_quest(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandAcceptQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
  /**
   * Completes a quest.
   *
   * @param questId - The ID of the quest.
   */
  complete_quest(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandCompleteQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  /**
   * Abandons a quest.
   *
   * @param questId - The ID of the quest.
   */
  abandon_quest(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandAbandonQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  /**
   * Registers one or more quests, which automatically handles accepting and completing them.
   *
   * @param questIds - The ID or array of IDs of the quests.
   */
  register_quest(questIds: number | number[]) {
    const ids = Array.isArray(questIds) ? questIds : [questIds];
    if (ids.length === 0 || ids.some((id) => typeof id !== "number")) {
      throw new ArgsError("questIds must be number or number[]");
    }

    const cmd = new CommandRegisterQuest();
    cmd.questIds = ids;
    window.context.addCommand(cmd);
  },
  /**
   * Unregisters one or more quests.
   *
   * @param questIds - The ID or array of IDs of the quests.
   */
  unregister_quest(questIds: number | number[]) {
    const ids = Array.isArray(questIds) ? questIds : [questIds];
    if (ids.length === 0 || ids.some((id) => typeof id !== "number")) {
      throw new ArgsError("questIds must be number or number[]");
    }

    const cmd = new CommandUnregisterQuest();
    cmd.questIds = ids;
    window.context.addCommand(cmd);
  },
};


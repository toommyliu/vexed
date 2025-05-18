import { ArgsError } from "../../ArgsError";
import { CommandAcceptQuest } from "./CommandAcceptQuest";
import { CommandCompleteQuest } from "./CommandCompleteQuest";
import { CommandRegisterQuest } from "./CommandRegisterQuest";
import { CommandUnregisterQuest } from "./CommandUnregisterQuest";

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
   * Registers a quest, which automatically handles accepting and completing it.
   *
   * @param questId - The ID of the quest.
   */
  register_quest(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandRegisterQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
  /**
   * Unregisters a quest.
   *
   * @param questId - The ID of the quest.
   */
  unregister_quest(questId: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandUnregisterQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
};

import { ArgsError } from "../../ArgsError";
import { CommandAbandonQuest } from "./CommandAbandonQuest";
import { CommandAcceptQuest } from "./CommandAcceptQuest";
import { CommandCompleteQuest } from "./CommandCompleteQuest";
import {
  CommandRegisterQuest,
  type QuestRegistration,
} from "./CommandRegisterQuest";
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
   * @param itemId - Optional item reward ID to select.
   */
  complete_quest(questId: number, itemId?: number) {
    if (!questId || typeof questId !== "number") {
      throw new ArgsError("questId is required");
    }

    const cmd = new CommandCompleteQuest();
    cmd.questId = questId;
    if (itemId !== undefined) {
      cmd.itemId = itemId;
    }

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
   * @param questIds - Quest ID, array of quest IDs, or array containing IDs and [questId, itemId] tuples.
   * @param itemId - Optional item ID when passing a single quest ID.
   * @example
   * ```js
   * // Single quest
   * cmd.register_quest(1234);
   *
   * // Single quest with item ID
   * cmd.register_quest(1234, 5678);
   *
   * // Multiple quests
   * cmd.register_quest([1234, 5678, 9012]);
   *
   * // Multiple quests, some with item IDs
   * cmd.register_quest([1234, [5678, 9999], 9012]);
   * ```
   */
  register_quest(
    questIds: (number | [number, number])[] | number | [number, number],
    itemId?: number,
  ) {
    const quests: QuestRegistration[] = [];

    if (typeof questIds === "number") {
      // Single quest ID
      const registration: QuestRegistration = { questId: questIds };
      if (itemId !== undefined) {
        registration.itemId = itemId;
      }

      quests.push(registration);
    } else if (
      Array.isArray(questIds) &&
      questIds.length === 2 &&
      typeof questIds[0] === "number" &&
      typeof questIds[1] === "number" &&
      !Array.isArray(questIds[0])
    ) {
      // Check if this is a tuple [questId, itemId] vs array of two quest IDs
      // When itemId is provided as second arg, treat first arg as array of two quests
      if (itemId === undefined) {
        // Treat as tuple [questId, itemId]
        quests.push({ itemId: questIds[1], questId: questIds[0] });
      } else {
        // This has extra itemId - treat as array with two quests (itemId ignored)
        quests.push({ questId: questIds[0] });
        quests.push({ questId: questIds[1] });
      }
    } else if (Array.isArray(questIds)) {
      // Array of quest IDs and/or tuples
      for (const item of questIds) {
        if (typeof item === "number") {
          quests.push({ questId: item });
        } else if (
          Array.isArray(item) &&
          item.length === 2 &&
          typeof item[0] === "number" &&
          typeof item[1] === "number"
        ) {
          quests.push({ itemId: item[1], questId: item[0] });
        }
      }
    }

    if (quests.length === 0) {
      throw new ArgsError("questIds is required");
    }

    const cmd = new CommandRegisterQuest();
    cmd.quests = quests;
    window.context.addCommand(cmd);
  },
  /**
   * Unregisters one or more quests.
   *
   * @param questIds - The ID or array of IDs of the quests.
   */
  unregister_quest(questIds: number[] | number) {
    const ids = Array.isArray(questIds) ? questIds : [questIds];
    if (ids.length === 0 || ids.some((id) => typeof id !== "number")) {
      throw new ArgsError("questIds is required");
    }

    const cmd = new CommandUnregisterQuest();
    cmd.questIds = ids;
    window.context.addCommand(cmd);
  },
};

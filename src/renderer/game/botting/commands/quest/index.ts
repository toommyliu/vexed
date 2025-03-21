import { ArgsError } from '../../ArgsError';
import { CommandAcceptQuest } from './CommandAcceptQuest';
import { CommandAddQuest } from './CommandAddQuest';
import { CommandCompleteQuest } from './CommandCompleteQuest';
import { CommandRemoveQuest } from './CommandRemoveQuest';

export const questCommands = {
  accept_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandAcceptQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
  add_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandAddQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
  complete_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandCompleteQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  remove_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandRemoveQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
};

import { ArgsError } from '../../ArgsError';
import { CommandAcceptQuest } from './CommandAcceptQuest';
import { CommandCompleteQuest } from './CommandCompleteQuest';
import { CommandRegisterQuest } from './CommandRegisterQuest';
import { CommandUnregisterQuest } from './CommandUnregisterQuest';

export const questCommands = {
  accept_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandAcceptQuest();
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

  register_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandRegisterQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },

  unregister_quest(questId: number) {
    if (!questId || typeof questId !== 'number') {
      throw new ArgsError('questId is required');
    }

    const cmd = new CommandUnregisterQuest();
    cmd.questId = questId;
    window.context.addCommand(cmd);
  },
};

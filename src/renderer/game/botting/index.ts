import { ArgsError } from './ArgsError';
import { Command } from './command';
import { combatCommands } from './commands/combat';
import { conditionsCommands } from './commands/conditions';
import { itemCommands } from './commands/item';
import { mapCommands } from './commands/map';
import { miscCommands } from './commands/misc';
import { questCommands } from './commands/quest';
import { Context } from './context';

const context = new Context();

export const cmd = {
  ...combatCommands,
  ...conditionsCommands,
  ...itemCommands,
  ...mapCommands,
  ...miscCommands,
  ...questCommands,

  add_command(
    name: string,
    cmdFactory: (CommandClass: typeof Command) => Command,
  ) {
    // don't allow built-ins to be overwritten or custom commands to be duplicated
    if (name in this) {
      throw new ArgsError(`command ${name} already exists`);
    }

    const command = cmdFactory(Command);

    if (!(command instanceof Command)) {
      throw new ArgsError('cmdFactory must return an instance of Command');
    }

    // @ts-expect-error - dynamic property
    // eslint-disable-next-line func-names
    this[name] = function (...args: unknown[]) {
      const newCmd = Object.create(command);
      newCmd.args = args;
      window.context.addCommand(newCmd);
    };
  },
};

window.cmd = cmd;
window.context = context;

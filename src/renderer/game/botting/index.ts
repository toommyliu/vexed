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

const builtIns = {
  ...combatCommands,
  ...conditionsCommands,
  ...itemCommands,
  ...mapCommands,
  ...miscCommands,
  ...questCommands,
};

export const cmd = {
  ...builtIns,

  register_command(
    name: string,
    cmdFactory: (CommandClass: typeof Command) => Command,
  ) {
    const _name = name.toLowerCase();
    // don't allow built-ins to be overwritten
    if (_name in builtIns) {
      throw new ArgsError('built-in commands cannot be overwritten');
    }

    const command = cmdFactory(Command);

    if (!(command instanceof Command)) {
      throw new ArgsError('cmdFactory must return a valid Command');
    }

    // @ts-expect-error - dynamic property
    // eslint-disable-next-line func-names
    this[_name] = function (...args: unknown[]) {
      const newCmd = Object.create(command);
      newCmd.args = args;
      window.context.addCommand(newCmd);
    };
  },
};

window.cmd = cmd;
window.context = context;

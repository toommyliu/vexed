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
const customCommands = new Set<string>();

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
    if (!name || typeof name !== 'string') {
      throw new ArgsError('command name is required');
    }

    const _name = name.toLowerCase();
    // don't allow built-ins to be overwritten
    if (_name in builtIns) {
      throw new ArgsError('built-in commands cannot be overwritten');
    }

    customCommands.add(_name);

    const command = cmdFactory(Command);

    if (!(command instanceof Command)) {
      throw new ArgsError('cmdFactory must return a valid Command');
    }

    // eslint-disable-next-line func-names
    this[_name] = function (...args: unknown[]) {
      const newCmd = Object.create(command);
      newCmd.args = args;
      window.context.addCommand(newCmd);
    };
  },
  unregister_command(name: string) {
    if (!name || typeof name !== 'string') {
      throw new Error('command name is required');
    }

    const _name = name.toLowerCase();
    if (!customCommands.has(_name)) return;

    customCommands.delete(_name);
    if (_name in this && typeof this[_name] === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this[_name];
    }
  },
  register_handler(
    name: string,
    handler: (packet: Record<string, unknown>) => void,
  ) {
    if (!name || typeof name !== 'string') {
      throw new ArgsError('handler name is required');
    }

    if (!handler || typeof handler !== 'function') {
      throw new ArgsError('handler is required');
    }

    const _name = name.toLowerCase();
    context.registerHandler(_name, handler);
  },
  unregister_handler(name: string) {
    if (!name || typeof name !== 'string') {
      throw new ArgsError('handler name is required');
    }

    const _name = name.toLowerCase();
    context.unregisterHandler(_name);
  },
} as { [key: string]: (...args: unknown[]) => void };

window.cmd = cmd;
window.context = context;

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

  add_command(name: string, fn: () => Promise<void> | void) {
    // TODO: better way to expose fields

    // @ts-expect-error - dynamic property
    this[name] = (...args: unknown[]) => {
      const custom_cmd = new Command();
      custom_cmd.execute = fn.bind(custom_cmd);
      custom_cmd.toString = () => name;
      window.context.addCommand(custom_cmd);
    };

    // console.log(`Added command: ${name}`);
  },
};

window.cmd = cmd;
window.context = context;

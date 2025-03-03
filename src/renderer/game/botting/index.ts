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
};

window.cmd = cmd;
window.context = context;

import { combatCommands } from './commands/combat';
import { itemCommands } from './commands/item';
import { mapCommands } from './commands/map';
import { miscCommands } from './commands/misc';
import { questCommands } from './commands/quest';
import { Context } from './context';

const context = new Context();

export const cmd = {
	...combatCommands,
	...itemCommands,
	...mapCommands,
	...miscCommands,
	...questCommands,
};

window.cmd = cmd;
window.context = context;

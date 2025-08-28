import { Context } from "./Context";
import { armyCommands } from "./commands/army";
import { combatCommands } from "./commands/combat";
import { conditionsCommands } from "./commands/conditions";
import { itemCommands } from "./commands/item";
import { mapCommands } from "./commands/map";
import { miscCommands } from "./commands/misc";
import { questCommands } from "./commands/quest";

const context = Context.getInstance();

const builtIns = {
  ...armyCommands,
  ...combatCommands,
  ...conditionsCommands,
  ...itemCommands,
  ...mapCommands,
  ...miscCommands,
  ...questCommands,
};

export const cmd = {} as { [key: string]: (...args: unknown[]) => void };

for (const [key, value] of Object.entries(builtIns)) {
  Object.defineProperty(cmd, key, {
    enumerable: true,
    configurable: false,
    writable: false,
    value,
  });
}

window.cmd = cmd;
window.context = context;

import { createCommandContext } from "./command-context";
import { CommandExecutor } from "./command-executor";
import { armyCommands } from "./commands/army";
import { combatCommands } from "./commands/combat";
import { conditionsCommands } from "./commands/conditions";
import { itemCommands } from "./commands/item";
import { mapCommands } from "./commands/map";
import { miscCommands } from "./commands/misc";
import { questCommands } from "./commands/quest";

const context = CommandExecutor.getInstance();

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

// dbg.COMMAND(...args) to quickly execute a command, without needing executor to run
export const dbg = new Proxy({} as Record<string, (...args: unknown[]) => Promise<void>>, {
  get(_target, prop: string) {
    return async (...args: unknown[]) => {
      const [command] = context.captureCommands(() => {
        const fn = builtIns[prop as keyof typeof builtIns];
        if (fn) (fn as (...args: unknown[]) => void)(...args);
      });

      if (!command) {
        return;
      }

      const ctx = createCommandContext(new AbortController().signal);
      await command.execute(ctx);
    };
  },
});

// @ts-expect-error don't care
window.dbg = dbg;

window.cmd = cmd;
window.context = context;


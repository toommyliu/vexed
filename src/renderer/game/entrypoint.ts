import "./lib/Bot";
import "./flash-interop";
import "./tipc/tipc-follower";
import "./lib/util/enhancements";

import { CommandRegistry } from "./botting/command-registry";
import { cmd } from "./botting/index";

const commandRegistry = CommandRegistry.getInstance();

for (const command in cmd) {
  if (!Object.hasOwn(cmd, command)) continue;

  const cmdName = command.toLowerCase();
  const cmdFunction = cmd[command]!;
  commandRegistry.registerCommand(cmdName, cmdFunction);
}

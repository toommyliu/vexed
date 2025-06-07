import "./lib/Bot";
import "./flash-interop";
import "./tipc/tipc-follower";
import "./tipc/tipc-packet-logger";
import "./tipc/tipc-packet-spammer";

import { CommandRegistry } from "./botting/command-registry";
import { cmd } from "./botting/index";

const commandRegistry = CommandRegistry.getInstance();

for (const command in cmd) {
  if (!Object.hasOwn(cmd, command)) continue;

  const cmdName = command.toLowerCase();
  const cmdFunction = cmd[command]!;
  commandRegistry.registerCommand(cmdName, cmdFunction);
}

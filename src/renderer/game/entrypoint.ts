import "./lib/Bot";
import "./flash-interop";

import { CommandRegistry } from "./botting/command-registry";
import { cmd } from "./botting/index";

import "./lib/util/enhancements";

const commandRegistry = CommandRegistry.getInstance();

for (const command in cmd) {
  if (!Object.hasOwn(cmd, command)) continue;

  const cmdName = command.toLowerCase();
  const cmdFunction = cmd[command]!;
  commandRegistry.registerCommand(cmdName, cmdFunction);
}

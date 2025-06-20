import "./flash-interop";
import "./lib/Bot";

import { CommandRegistry } from "./botting/command-registry";
import { cmd } from "./botting/index";

const commandRegistry = CommandRegistry.getInstance();

for (const command in cmd) {
  if (!Object.hasOwn(cmd, command)) continue;

  const cmdName = command.toLowerCase();
  const cmdFunction = cmd[command]!;
  commandRegistry.registerCommand(cmdName, cmdFunction);
}

console.log(process.argv);

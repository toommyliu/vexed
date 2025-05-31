import "./lib/Bot";
// import "./ui";
// import "./flash-interop";

import { CommandRegistry } from "./botting/command-registry";
import { cmd } from "./botting/index";

import "./lib/util/enhancements";

const commandRegistry = CommandRegistry.getInstance();

for (const command in cmd) {
  // eslint-disable-next-line prefer-object-has-own
  if (!Object.prototype.hasOwnProperty.call(cmd, command)) {
    continue;
  }

  const cmdName = command.toLowerCase();
  const cmdFunction = cmd[command]!;

  commandRegistry.registerCommand(cmdName, cmdFunction);
}

import "source-map-support/register";

import "./ipc/ipc.fast-travels";
import "./ipc/ipc.follower";
import "./ipc/ipc.loader-grabber";
import "./ipc/ipc.logger";
import "./ipc/ipc.spammer";

import "./lib/Bot";
import "./ui";
import "./flash-interop";

import { CommandRegistry } from "./botting/command-registry";
import { cmd } from "./botting/index";

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

import "./lib/util/enhancements";
